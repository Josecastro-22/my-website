import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/mongodb';
import { sendBookingNotification } from '@/utils/twilio';

export async function POST(request: Request) {
  try {
    const booking = await request.json();
    console.log('Received booking data:', booking);
    
    // Add timestamp
    booking.timestamp = new Date();
    
    // Add status
    booking.status = 'active';
    
    // Generate a unique booking ID (timestamp + random string)
    booking.bookingId = `BK${Date.now()}${Math.random().toString(36).substring(2, 7)}`.toUpperCase();

    console.log('Attempting to connect to MongoDB...');
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

    console.log('Attempting to insert booking...');
    let result;
    try {
      result = await db.collection('bookings').insertOne(booking);
      console.log('Booking saved successfully:', result);
    } catch (error) {
      console.error('Error inserting booking:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save booking. Please try again.'
      }, { status: 500 });
    }

    // Send SMS notification
    try {
      console.log('Attempting to send SMS notification...');
      await sendBookingNotification(booking);
      console.log('SMS notification sent successfully');
    } catch (error: unknown) {
      console.error('Failed to send SMS notification:', error);
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
    console.error('Error in POST /api/bookings:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    console.log('Attempting to connect to MongoDB for GET request...');
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

    console.log('Fetching bookings with status:', status);
    let bookings;
    try {
      bookings = await db.collection('bookings')
        .find({ status })
        .sort({ timestamp: -1 })
        .toArray();
      console.log('Found bookings:', bookings.length);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch bookings. Please try again.'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: bookings 
    });
  } catch (error) {
    console.error('Error in GET /api/bookings:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
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