import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/mongodb';
import { sendBookingNotification } from '@/utils/twilio';

export async function POST(request: Request) {
  try {
    console.log('POST /api/bookings: Starting request');
    const booking = await request.json();
    console.log('POST /api/bookings: Received booking data:', booking);
    
    // Add timestamp
    booking.timestamp = new Date();
    
    // Add status
    booking.status = 'active';
    
    // Generate a unique booking ID (timestamp + random string)
    booking.bookingId = `BK${Date.now()}${Math.random().toString(36).substring(2, 7)}`.toUpperCase();

    let connection;
    try {
      console.log('POST /api/bookings: Attempting to connect to MongoDB');
      connection = await connectToDatabase();
      console.log('POST /api/bookings: Successfully connected to MongoDB');
    } catch (error) {
      console.error('POST /api/bookings: MongoDB connection error:', error);
      return NextResponse.json(
        { error: 'Database connection failed', details: error instanceof Error ? error.message : String(error) },
        { status: 503 }
      );
    }

    console.log('Attempting to insert booking...');
    let result;
    try {
      result = await connection.db.collection('bookings').insertOne(booking);
      console.log('POST /api/bookings: Booking saved successfully:', result);
    } catch (error) {
      console.error('POST /api/bookings: Error inserting booking:', error);
      return NextResponse.json(
        { error: 'Failed to save booking', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }

    // Send SMS notification
    try {
      console.log('POST /api/bookings: Attempting to send SMS notification...');
      await sendBookingNotification(booking);
      console.log('POST /api/bookings: SMS notification sent successfully');
    } catch (error: unknown) {
      console.error('POST /api/bookings: Failed to send SMS notification:', error);
      // Continue with the response even if SMS fails
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = String(error);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Booking created successfully, but notification failed to send',
        data: booking,
        notificationError: errorMessage
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('POST /api/bookings: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
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