import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vapiCallId: {
      type: String,
      trim: true,
      index: true,
    },
    callerNumber: {
      type: String,
      required: true,
      trim: true,
    },
    callerName: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
      default: 0, // duration in seconds
    },
    status: {
      type: String,
      enum: ["completed", "in-progress", "missed", "transferred", "failed"],
      default: "completed",
      index: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    transcript: {
      type: String,
      trim: true,
    },
    recordingUrl: {
      type: String,
      trim: true,
    },
    endedReason: {
      type: String,
      trim: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
  },
  { timestamps: true }
);

// Compound index for querying recent call logs for a specific clinic
callLogSchema.index({ clinicId: 1, createdAt: -1 });

export default mongoose.model("CallLog", callLogSchema);
