import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    patientPhone: {
      type: String,
      required: true,
      trim: true,
    },
    patientEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    serviceType: {
      type: String,
      required: true,
      trim: true,
      default: "General Consultation",
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "no-show"],
      default: "scheduled",
      index: true,
    },
    bookedVia: {
      type: String,
      enum: ["voice_agent", "manual", "online"],
      default: "voice_agent",
    },
    notes: {
      type: String,
      trim: true,
    },
    callLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CallLog",
    },
  },
  { timestamps: true }
);

// Compound index for querying a clinic's schedule within a date range
appointmentSchema.index({ clinicId: 1, startTime: 1 });

export default mongoose.model("Appointment", appointmentSchema);
