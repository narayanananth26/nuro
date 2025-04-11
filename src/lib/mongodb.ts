import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

if (!process.env.MONGO_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGO_URI;
const options = {};

// Native MongoDB Driver Connection
let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Native MongoDB connection function
export const connectToDatabase = async () => {
  const client = await clientPromise;
  const db = client.db();
  return db;
};

// Mongoose Connection
export const dbConnect = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(uri);
};

// Export clientPromise for NextAuth
export default clientPromise;
