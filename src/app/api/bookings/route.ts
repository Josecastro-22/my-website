import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/mongodb';
import { sendBookingNotification } from '@/utils/twilio';

// Define the expected booking data structure
interface BookingData {
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/bookings: Starting request');
    
    // Log the raw request
    console.log('POST /api/bookings: Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Parse and validate the incoming data
    let rawData;
    try {
      rawData = await request.json();
      console.log('POST /api/bookings: Received raw data:', JSON.stringify(rawData, null, 2));
      console.log('POST /api/bookings: Data types:', {
        name: typeof rawData.name,
        email: typeof rawData.email,
        phone: typeof rawData.phone,
        service: typeof rawData.service,
        date: typeof rawData.date,
        time: typeof rawData.time
      });
    } catch (error) {
      console.error('POST /api/bookings: Failed to parse request body:', error);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Log all received fields
    console.log('POST /api/bookings: All received fields:', Object.keys(rawData));

    // Validate required fields
    const requiredFields: (keyof BookingData)[] = ['name', 'email', 'phone', 'service', 'date', 'time'];
    const missingFields = requiredFields.filter(field => {
      const value = rawData[field];
      const isEmpty = value === undefined || value === null || value === '';
      if (isEmpty) {
        console.log(`POST /api/bookings: Field ${field} is empty or missing. Value:`, value);
      }
      return isEmpty;
    });
    
    if (missingFields.length > 0) {
      console.error('POST /api/bookings: Missing required fields:', missingFields);
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          receivedData: rawData
        },
        { status: 400 }
      );
    }

    // Create the booking object with validated data
    const booking = {
      ...rawData,
      timestamp: new Date(),
      status: 'active',
      bookingId: `BK${Date.now()}${Math.random().toString(36).substring(2, 7)}`.toUpperCase()
    };

    console.log('POST /api/bookings: Validated booking data:', booking);

    // Connect to MongoDB
    let connection;
    try {
      console.log('POST /api/bookings: Attempting to connect to MongoDB');
      connection = await connectToDatabase();
      console.log('POST /api/bookings: Successfully connected to MongoDB');
    } catch (error) {
      console.error('POST /api/bookings: MongoDB connection error:', error);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    // Save the booking
    try {
      const result = await connection.db.collection('bookings').insertOne(booking);
      console.log('POST /api/bookings: Booking saved successfully:', result);
    } catch (error) {
      console.error('POST /api/bookings: Error inserting booking:', error);
      return NextResponse.json(
        { error: 'Failed to save booking' },
        { status: 500 }
      );
    }

    // Send notification (but don't fail if it doesn't work)
    try {
      await sendBookingNotification(booking);
      console.log('POST /api/bookings: Notification sent successfully');
    } catch (error) {
      console.error('POST /api/bookings: Failed to send notification:', error);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
    
  } catch (error) {
    console.error('POST /api/bookings: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
    } catch (error) {
      console.error('GET /api/bookings: MongoDB connection error:', error);
      return NextResponse.json(
        { error: 'Database connection failed', details: error instanceof Error ? error.message : String(error) },
        { status: 503 }
      );
    }

    try {
      const bookings = await connection.db
        .collection('bookings')
        .find({ status })
        .sort({ timestamp: -1 })
        .toArray();
      
      console.log(`GET /api/bookings: Successfully fetched ${bookings.length} bookings`);
      return NextResponse.json({ success: true, data: bookings });
    } catch (error) {
      console.error('GET /api/bookings: Error fetching bookings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('GET /api/bookings: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
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