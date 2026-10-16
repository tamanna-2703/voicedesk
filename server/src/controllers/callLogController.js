import CallLog from "../models/CallLog.js";
import Appointment from "../models/Appointment.js";

// GET /api/calls
// Supports filters: ?status=completed, ?startDate=YYYY-MM-DD, ?endDate=YYYY-MM-DD, ?search=numberOrName, ?page=1, ?limit=20
export async function getCallLogs(req, res) {
  try {
    const { status, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const filter = { clinicId: req.user.id };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (search) {
      filter.$or = [
        { callerNumber: { $regex: search, $options: "i" } },
        { callerName: { $regex: search, $options: "i" } },
        { summary: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, calls] = await Promise.all([
      CallLog.countDocuments(filter),
      CallLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("appointmentId", "patientName patientPhone startTime status serviceType"),
    ]);

    return res.json({
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      calls,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// GET /api/calls/:id
export async function getCallLogById(req, res) {
  try {
    const call = await CallLog.findOne({
      _id: req.params.id,
      clinicId: req.user.id,
    }).populate("appointmentId", "patientName patientPhone patientEmail serviceType startTime endTime status notes");

    if (!call) {
      return res.status(404).json({ message: "Call log not found." });
    }

    return res.json({ call });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// POST /api/calls
// Manual or webhook-assisted creation of a call log
export async function createCallLog(req, res) {
  try {
    const {
      callerNumber,
      callerName,
      vapiCallId,
      duration = 0,
      status = "completed",
      summary,
      transcript,
      recordingUrl,
      endedReason,
      appointmentId,
    } = req.body;

    if (!callerNumber) {
      return res.status(400).json({ message: "callerNumber is required." });
    }

    // Verify appointmentId belongs to this clinic if supplied
    if (appointmentId) {
      const existingAppt = await Appointment.findOne({
        _id: appointmentId,
        clinicId: req.user.id,
      });

      if (!existingAppt) {
        return res.status(400).json({ message: "Invalid appointmentId for this clinic." });
      }
    }

    const callLog = await CallLog.create({
      clinicId: req.user.id,
      vapiCallId,
      callerNumber,
      callerName,
      duration,
      status,
      summary,
      transcript,
      recordingUrl,
      endedReason,
      appointmentId: appointmentId || undefined,
    });

    // If an appointment was linked, also link callLogId on the appointment
    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, { callLogId: callLog._id });
    }

    return res.status(201).json({
      message: "Call log recorded successfully.",
      call: callLog,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// PATCH /api/calls/:id
// Update notes, summary, status, or linked appointment
export async function updateCallLog(req, res) {
  try {
    const { callerName, status, summary, transcript, recordingUrl, appointmentId } = req.body;

    const call = await CallLog.findOne({
      _id: req.params.id,
      clinicId: req.user.id,
    });

    if (!call) {
      return res.status(404).json({ message: "Call log not found." });
    }

    if (appointmentId !== undefined) {
      if (appointmentId) {
        const existingAppt = await Appointment.findOne({
          _id: appointmentId,
          clinicId: req.user.id,
        });

        if (!existingAppt) {
          return res.status(400).json({ message: "Invalid appointmentId for this clinic." });
        }
        call.appointmentId = appointmentId;
        await Appointment.findByIdAndUpdate(appointmentId, { callLogId: call._id });
      } else {
        // Unlink previous appointment if any
        if (call.appointmentId) {
          await Appointment.findByIdAndUpdate(call.appointmentId, { $unset: { callLogId: 1 } });
        }
        call.appointmentId = undefined;
      }
    }

    if (callerName !== undefined) call.callerName = callerName;
    if (status !== undefined) call.status = status;
    if (summary !== undefined) call.summary = summary;
    if (transcript !== undefined) call.transcript = transcript;
    if (recordingUrl !== undefined) call.recordingUrl = recordingUrl;

    await call.save();

    return res.json({
      message: "Call log updated successfully.",
      call,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// DELETE /api/calls/:id
export async function deleteCallLog(req, res) {
  try {
    const call = await CallLog.findOneAndDelete({
      _id: req.params.id,
      clinicId: req.user.id,
    });

    if (!call) {
      return res.status(404).json({ message: "Call log not found." });
    }

    // Unlink from appointment if linked
    if (call.appointmentId) {
      await Appointment.findByIdAndUpdate(call.appointmentId, { $unset: { callLogId: 1 } });
    }

    return res.json({ message: "Call log deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}
