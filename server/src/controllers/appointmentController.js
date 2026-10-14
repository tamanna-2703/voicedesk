import Appointment from "../models/Appointment.js";

// GET /api/appointments
// Supports filtering by ?date=YYYY-MM-DD, ?status=scheduled, and ?search=patientNameOrPhone
export async function getAppointments(req, res) {
  try {
    const { date, status, search } = req.query;
    const filter = { clinicId: req.user.id };

    // Filter by specific date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      filter.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Search by patient name or phone
    if (search) {
      filter.$or = [
        { patientName: { $regex: search, $options: "i" } },
        { patientPhone: { $regex: search, $options: "i" } },
      ];
    }

    const appointments = await Appointment.find(filter)
      .sort({ startTime: 1 })
      .populate("callLogId", "duration status summary recordingUrl");

    return res.json({ count: appointments.length, appointments });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// GET /api/appointments/:id
export async function getAppointmentById(req, res) {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinicId: req.user.id,
    }).populate("callLogId", "duration status summary transcript recordingUrl");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    return res.json({ appointment });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// POST /api/appointments
export async function createAppointment(req, res) {
  try {
    const {
      patientName,
      patientPhone,
      patientEmail,
      serviceType,
      startTime,
      endTime,
      durationMinutes = 30,
      notes,
      bookedVia = "manual",
    } = req.body;

    if (!patientName || !patientPhone || !startTime) {
      return res.status(400).json({
        message: "patientName, patientPhone, and startTime are required.",
      });
    }

    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: "Invalid startTime format." });
    }

    // Compute endTime if not explicitly provided
    let end;
    if (endTime) {
      end = new Date(endTime);
    } else {
      end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    }

    if (end <= start) {
      return res.status(400).json({ message: "endTime must be after startTime." });
    }

    // Check for overlapping conflicting appointments for this clinic
    const conflict = await Appointment.findOne({
      clinicId: req.user.id,
      status: { $nin: ["cancelled", "no-show"] },
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } },
      ],
    });

    if (conflict) {
      return res.status(409).json({
        message: "Time slot conflict: an appointment already exists during this window.",
        conflictingAppointment: conflict,
      });
    }

    const appointment = await Appointment.create({
      clinicId: req.user.id,
      patientName,
      patientPhone,
      patientEmail,
      serviceType: serviceType || "General Consultation",
      startTime: start,
      endTime: end,
      notes,
      bookedVia,
    });

    return res.status(201).json({
      message: "Appointment scheduled successfully.",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// PATCH /api/appointments/:id
export async function updateAppointment(req, res) {
  try {
    const { status, startTime, endTime, notes, serviceType } = req.body;
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinicId: req.user.id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    // If rescheduling, check for slot conflicts
    if (startTime) {
      const newStart = new Date(startTime);
      const newEnd = endTime
        ? new Date(endTime)
        : new Date(newStart.getTime() + (appointment.endTime - appointment.startTime));

      const conflict = await Appointment.findOne({
        _id: { $ne: appointment._id },
        clinicId: req.user.id,
        status: { $nin: ["cancelled", "no-show"] },
        $or: [
          { startTime: { $lt: newEnd, $gte: newStart } },
          { endTime: { $gt: newStart, $lte: newEnd } },
          { startTime: { $lte: newStart }, endTime: { $gte: newEnd } },
        ],
      });

      if (conflict) {
        return res.status(409).json({
          message: "Reschedule conflict: another appointment occupies this time slot.",
        });
      }

      appointment.startTime = newStart;
      appointment.endTime = newEnd;
    }

    if (status) appointment.status = status;
    if (notes !== undefined) appointment.notes = notes;
    if (serviceType) appointment.serviceType = serviceType;

    await appointment.save();

    return res.json({
      message: "Appointment updated successfully.",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// DELETE /api/appointments/:id
export async function deleteAppointment(req, res) {
  try {
    const appointment = await Appointment.findOneAndDelete({
      _id: req.params.id,
      clinicId: req.user.id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    return res.json({ message: "Appointment deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}
