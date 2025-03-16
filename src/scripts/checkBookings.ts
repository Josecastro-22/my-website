import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://josecastro22:Jojusajo4@cluster0.rdhh4.mongodb.net/luxcarservice?retryWrites=true&w=majority';

async function checkBookings() {
  try {
    const client = await MongoClient.connect(uri);
    const db = client.db('luxcarservice');
    const bookingsCollection = db.collection('bookings');
    const completedBookingsCollection = db.collection('completed-bookings');

    const activeBookings = await bookingsCollection.find({}).toArray();
    const completedBookings = await completedBookingsCollection.find({}).toArray();

    console.log('Active Bookings:', activeBookings);
    console.log('Completed Bookings:', completedBookings);

    await client.close();
  } catch (error) {
    console.error('Error checking bookings:', error);
  }
}

checkBookings(); 