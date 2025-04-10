import mongoose from "mongoose";

const UrlMonitorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  url: {
    type: String,
    required: true,
  },
  interval: {
    type: Number, // in minutes
    required: true,
  },
  lastChecked: {
    type: Date,
    default: null,
  },
  status: {
    type: String, // "UP" or "DOWN"
    default: "UNKNOWN",
  },
  responseTime: {
    type: Number, // in milliseconds
    default: null,
  },
  logs: [
    {
      timestamp: Date,
      status: String, // "UP" or "DOWN"
      responseTime: Number, // ms
    },
  ],
}, {
  timestamps: true,
});

export default mongoose.models.UrlMonitor || mongoose.model("UrlMonitor", UrlMonitorSchema);
