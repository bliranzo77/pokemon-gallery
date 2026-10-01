import mongoose from "mongoose";

// The connection string doesn't name a database, so it's chosen here.
export const DB_NAME = "pokedex";

// Never let the connection string reach the logs.
export const redact = (text) =>
  String(text).replace(/mongodb(\+srv)?:\/\/\S+/g, "[connection string hidden]");

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set. Copy server/.env.example to server/.env and fill it in.");
    return false;
  }
  try {
    await mongoose.connect(uri, { dbName: DB_NAME, serverSelectionTimeoutMS: 10000 });
    console.log(`MongoDB connected (database "${DB_NAME}")`);
    return true;
  } catch (err) {
    console.error("MongoDB connection failed:", redact(err.message));
    return false;
  }
}

export const isDbConnected = () => mongoose.connection.readyState === 1;
