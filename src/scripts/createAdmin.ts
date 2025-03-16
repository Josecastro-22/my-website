import { MongoClient } from 'mongodb';
import { hash } from 'bcryptjs';

const uri = "mongodb+srv://josecastro22:NEWjojusajo4@cluster0.rdhh4.mongodb.net/";
const client = new MongoClient(uri);

async function createAdminUser() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('luxcarservice');
    const users = db.collection('users');

    // Check if user already exists
    const existingUser = await users.findOne({ username: 'Jcastro' });
    if (existingUser) {
      console.log('Admin user already exists');
      return;
    }

    // Hash the password
    const hashedPassword = await hash('Jojusajo4', 12);

    // Create admin user
    await users.insertOne({
      username: 'Jcastro',
      password: hashedPassword,
      email: 'josemcastro22@gmail.com',
      role: 'admin',
      createdAt: new Date()
    });

    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await client.close();
  }
}

createAdminUser(); 