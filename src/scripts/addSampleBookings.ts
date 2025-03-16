import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://josemcastro22:NEWjojusajo4@cluster0.x5abc.mongodb.net/luxcarservice?retryWrites=true&w=majority&appName=Cluster0';

const sampleBookings = [
  {
    bookingId: '1234567890',
    fullName: 'John Smith',
    email: 'john.smith@example.com',
    phone: '555-0123',
    service: 'airport',
    transferType: 'home-to-airport',
    pickupLocation: {
      streetAddress: '123 Main St',
      city: 'Miami',
      state: 'FL',
      zipCode: '33101'
    },
    dropoffLocation: {
      streetAddress: 'Miami International Airport',
      city: 'Miami',
      state: 'FL',
      zipCode: '33126'
    },
    flightNumber: 'AA123',
    flightDate: '2024-03-25',
    flightTime: '10:00 AM',
    pickupTime: '7:00 AM',
    passengers: 2,
    additionalDetails: 'Two large suitcases',
    timestamp: new Date().toISOString(),
    status: 'pending'
  },
  {
    bookingId: '0987654321',
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '555-4567',
    service: 'private',
    pickupLocation: {
      streetAddress: '456 Ocean Drive',
      city: 'Miami Beach',
      state: 'FL',
      zipCode: '33139'
    },
    dropoffLocation: {
      streetAddress: '789 Lincoln Road',
      city: 'Miami Beach',
      state: 'FL',
      zipCode: '33139'
    },
    eventDate: '2024-03-26',
    eventTime: '7:00 PM',
    serviceHours: 4,
    passengers: 4,
    additionalDetails: 'Anniversary dinner',
    timestamp: new Date().toISOString(),
    status: 'pending'
  }
];

async function addSampleBookings() {
  try {
    console.log('Connecting to MongoDB...');
    const client = await MongoClient.connect(uri);
    const db = client.db('luxcarservice');
    const bookingsCollection = db.collection('bookings');

    // Clear existing bookings
    await bookingsCollection.deleteMany({});
    console.log('Cleared existing bookings');

    // Insert sample bookings
    const result = await bookingsCollection.insertMany(sampleBookings);
    console.log(`Successfully added ${result.insertedCount} sample bookings`);

    await client.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error adding sample bookings:', error);
  }
}

addSampleBookings(); 