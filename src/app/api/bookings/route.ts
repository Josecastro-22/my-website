import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/mongodb';
import { sendBookingNotification } from '@/utils/twilio';

// Define the expected booking data structure
interface BookingData {
  fullName: string;
  email: string;
  phone: string;
  service: string;
  flightDate?: string;
  flightTime?: string;
  eventDate?: string;
  eventTime?: string;
  pickupTime: string;
  pickupLocation: {
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
  };
  dropoffLocation: {
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
  };
  transferType?: string;
  flightNumber?: string;
  passengers: number;
  serviceHours?: number;
  additionalDetails?: string;
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/bookings: Starting request');
    
    // Parse the request body
    const rawData = await request.json();
    console.log('POST /api/bookings: Received data:', rawData);

    // Validate required fields based on service type
    const requiredFields = ['fullName', 'email', 'phone', 'service', 'pickupTime', 'pickupLocation'];
    
    // Add service-specific required fields
    if (rawData.service === 'airport') {
      requiredFields.push('flightDate', 'flightTime', 'flightNumber', 'transferType');
    } else if (rawData.service === 'event') {
      requiredFields.push('eventDate', 'eventTime');
    }

    const missingFields = requiredFields.filter(field => {
      if (field === 'pickupLocation') {
        return !rawData.pickupLocation?.streetAddress;
      }
      const value = rawData[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Missing required fields: ${missingFields.join(', ')}`,
        receivedFields: Object.keys(rawData)
      }, { status: 400 });
    }

    // Create the booking object
    const booking = {
      ...rawData,
      timestamp: new Date(),
      status: 'active',
      bookingId: `BK${Date.now()}${Math.random().toString(36).substring(2, 7)}`.toUpperCase()
    };

    // Connect to MongoDB
    let connection;
    try {
      console.log('POST /api/bookings: Attempting to connect to MongoDB');
      connection = await connectToDatabase();
      console.log('POST /api/bookings: Successfully connected to MongoDB');
    } catch (error) {
      console.error('POST /api/bookings: MongoDB connection error:', error);
      return NextResponse.json({
        error: 'Database connection failed'
      }, { status: 503 });
    }

    // Save the booking
    try {
      const result = await connection.db.collection('bookings').insertOne(booking);
      console.log('POST /api/bookings: Booking saved successfully:', result);
    } catch (error) {
      console.error('POST /api/bookings: Error inserting booking:', error);
      return NextResponse.json({
        error: 'Failed to save booking'
      }, { status: 500 });
    }

    // Send notification
    try {
      await sendBookingNotification(booking);
      console.log('POST /api/bookings: Notification sent successfully');
    } catch (error) {
      console.error('POST /api/bookings: Failed to send notification:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
    
  } catch (error) {
    console.error('POST /api/bookings: Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    console.log('GET /api/bookings: Starting request');
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    console.log('GET /api/bookings: Fetching bookings with status:', status);

    let connection;
    try {
      console.log('GET /api/bookings: Attempting to connect to MongoDB');
      connection = await connectToDatabase();
      console.log('GET /api/bookings: Successfully connected to MongoDB');
      
      // Test the connection
      await connection.db.command({ ping: 1 });
      console.log('GET /api/bookings: Database ping successful');
    } catch (error) {
      console.error('GET /api/bookings: MongoDB connection error:', error);
      return NextResponse.json({
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 503 });
    }

    try {
      // Log the query we're about to execute
      console.log('GET /api/bookings: Executing query for status:', status);
      
      const bookings = await connection.db
        .collection('bookings')
        .find({ status })
        .sort({ timestamp: -1 })
        .toArray();
      
      console.log(`GET /api/bookings: Successfully fetched ${bookings.length} bookings`);
      
      // Log the first booking (if any) to verify structure
      if (bookings.length > 0) {
        console.log('GET /api/bookings: Sample booking structure:', {
          id: bookings[0]._id,
          bookingId: bookings[0].bookingId,
          status: bookings[0].status,
          fields: Object.keys(bookings[0])
        });
      }

      return NextResponse.json({ 
        success: true, 
        data: bookings,
        count: bookings.length
      });
    } catch (error) {
      console.error('GET /api/bookings: Error fetching bookings:', error);
      return NextResponse.json({
        error: 'Failed to fetch bookings',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('GET /api/bookings: Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { bookingId, status } = await request.json();
    
    console.log('Attempting to connect to MongoDB for PUT request...');
    let db;
    try {
      const connection = await connectToDatabase();
      db = connection.db;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed. Please try again later.'
      }, { status: 503 });
    }

    console.log('Updating booking status:', { bookingId, status });
    let result;
    try {
      result = await db.collection('bookings').updateOne(
        { bookingId },
        { $set: { status } }
      );
    } catch (error) {
      console.error('Error updating booking:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update booking. Please try again.'
      }, { status: 500 });
    }

    if (result.matchedCount === 0) {
      console.log('No booking found with ID:', bookingId);
      return NextResponse.json({ 
        success: false, 
        error: 'Booking not found' 
      }, { status: 404 });
    }

    console.log('Booking status updated successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Booking status updated successfully' 
    });
  } catch (error) {
    console.error('Error in PUT /api/bookings:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 