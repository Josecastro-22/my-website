import { MongoClient } from 'mongodb';

// MongoDB connection configuration with optimized settings for Vercel deployment
if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;

// Keep only the essential options that are type-safe
const options = {
  maxPoolSize: 1,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true
};

// Global is used here to maintain a cached connection across hot reloads in development
let globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect().catch(error => {
      console.error('Failed to connect to MongoDB in development:', error);
      throw error;
    });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect().catch(error => {
    console.error('Failed to connect to MongoDB in production:', error);
    console.error('MongoDB URI format:', uri.replace(/:[^:@]+@/, ':****@'));
    throw error;
  });
}

export async function connectToDatabase() {
  try {
    console.log('Attempting to connect to MongoDB...');
    const client = await clientPromise;
    console.log('MongoDB client connected successfully');
    
    const db = client.db();
    
    // Test the connection with a ping
    try {
      console.log('Testing MongoDB connection with ping...');
      await db.command({ ping: 1 });
      console.log('MongoDB ping successful');
    } catch (pingError) {
      console.error('MongoDB ping failed:', pingError);
      throw new Error(`Database connection test failed: ${pingError instanceof Error ? pingError.message : String(pingError)}`);
    }

    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.error('Connection details:', {
      uri: uri.replace(/:[^:@]+@/, ':****@'),
      options
    });
    
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND')) {
        throw new Error('Could not resolve MongoDB host. Please check your connection string.');
      }
      if (error.message.includes('ETIMEDOUT')) {
        throw new Error('Connection to MongoDB timed out. Please check your network or firewall settings.');
      }
      if (error.message.includes('Authentication failed')) {
        throw new Error('MongoDB authentication failed. Please check your username and password.');
      }
      if (error.message.includes('not authorized')) {
        throw new Error('Not authorized to access the database. Please check user permissions.');
      }
    }
    
    throw error;
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise; 