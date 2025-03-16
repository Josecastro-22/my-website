import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://josemcastro22:NEWjojusajo4@cluster0.x5abc.mongodb.net/luxcarservice?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    const client = await MongoClient.connect(uri);
    console.log('Successfully connected to MongoDB!');
    
    const db = client.db('luxcarservice');
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('Connection closed successfully');
  } catch (error) {
    console.error('Connection error:', error);
  }
}

testConnection(); 