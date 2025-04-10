import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "";

const dbConnect = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGO_URI);
};

export default dbConnect;
