import "server-only";
import { MongoClient, type Db } from "mongodb";

/* A single MongoClient is reused across hot reloads in dev and across warm
   serverless invocations in production — creating one per request would
   exhaust the Atlas connection pool. */
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

function clientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env.local and add your MongoDB connection string.",
    );
  }

  if (!globalForMongo._mongoClientPromise) {
    globalForMongo._mongoClientPromise = new MongoClient(uri, {
      // Keep the pool small: serverless instances are many and short-lived.
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    }).connect();
  }

  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(process.env.MONGODB_DB || "theone");
}
