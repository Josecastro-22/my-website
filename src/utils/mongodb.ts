import { MongoClient, ReadPreference } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 5,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 3000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 5000,
  retryWrites: true,
  retryReads: true,
  maxIdleTimeMS: 30000,
  heartbeatFrequencyMS: 5000,
  maxConnecting: 1,
  compressors: 'zlib',
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  directConnection: true,
  readPreference: ReadPreference.PRIMARY,
  writeConcern: { w: 'majority' },
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
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  console.log('Creating new MongoDB client in production mode');
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function connectToDatabase() {
  try {
    console.log('Attempting to connect to MongoDB...');
    const client = await clientPromise;
    console.log('MongoDB client connected successfully');
    
    // Test the connection with a ping
    try {
      await client.db().command({ ping: 1 });
      console.log('MongoDB ping successful');
    } catch (pingError) {
      console.error('MongoDB ping failed:', pingError);
      throw new Error('Database connection test failed');
    }

    return { client, db: client.db() };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // If the error is a connection error, try to reconnect
    if (error instanceof Error && error.message.includes('connect')) {
      console.log('Attempting to reconnect to MongoDB...');
      try {
        await client.close();
        const newClient = new MongoClient(uri, options);
        await newClient.connect();
        console.log('Successfully reconnected to MongoDB');
        return { client: newClient, db: newClient.db() };
      } catch (reconnectError) {
        console.error('Failed to reconnect to MongoDB:', reconnectError);
      }
    }
    throw error;
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise; 