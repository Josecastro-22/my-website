import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;

// Minimal required options
const options = {
  maxPoolSize: 1,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    console.log('Creating new MongoDB client in development mode');
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect()
      .then(client => {
        console.log('MongoDB connected successfully in development');
        return client;
      })
      .catch(error => {
        console.error('MongoDB connection failed in development:', error);
        throw error;
      });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production, it's best to not use a global variable.
  console.log('Creating new MongoDB client in production');
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .then(client => {
      console.log('MongoDB connected successfully in production');
      return client;
    })
    .catch(error => {
      console.error('MongoDB connection failed in production:', error);
      throw error;
    });
}

export async function connectToDatabase() {
  try {
    console.log('Attempting to connect to MongoDB...');
    const client = await clientPromise;
    console.log('Client connection successful');
    
    const db = client.db();
    console.log('Database connection successful');
    
    // Test the connection
    await db.command({ ping: 1 });
    console.log('Database ping successful');
    
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export default clientPromise; 