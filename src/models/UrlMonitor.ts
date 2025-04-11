import mongoose from "mongoose";

const LogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["UP", "DOWN", "UNKNOWN"],
  },
  responseTime: {
    type: Number,
    required: true,
  }
});

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
    type: Number,
    required: true,
    default: 5
  },
  lastChecked: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ["UP", "DOWN", "UNKNOWN"],
    default: "UNKNOWN"
  },
  responseTime: {
    type: Number,
    default: null
  },
  logs: [LogSchema]
}, {
  timestamps: true,
});

export default mongoose.models.UrlMonitor || mongoose.model("UrlMonitor", UrlMonitorSchema);
