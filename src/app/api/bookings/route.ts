import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/mongodb';
import { sendBookingNotification } from '@/utils/twilio';

export async function POST(request: Request) {
  try {
    const booking = await request.json();
    
    // Add timestamp
    booking.timestamp = new Date();
    
    // Add status
    booking.status = 'active';
    
    // Generate a unique booking ID (timestamp + random string)
    booking.bookingId = `BK${Date.now()}${Math.random().toString(36).substring(2, 7)}`.toUpperCase();

    const db = await connectToDatabase();
    console.log('Connected to MongoDB successfully');

    const result = await db.collection('bookings').insertOne(booking);
    console.log('Booking saved successfully:', result);

    // Send SMS notification
    try {
      await sendBookingNotification(booking);
    } catch (notificationError) {
      console.error('Failed to send SMS notification:', notificationError);
      // Continue with the response even if SMS fails
      return NextResponse.json({ 
        success: true, 
        message: 'Booking created successfully, but notification failed to send',
        data: booking,
        notificationError: notificationError instanceof Error ? notificationError.message : 'Unknown error'
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
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    const db = await connectToDatabase();
    const bookings = await db.collection('bookings')
      .find({ status })
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json({ 
      success: true, 
      data: bookings 
    });
  } catch (error) {
    console.error('Error in GET /api/bookings:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { bookingId, status } = await request.json();
    
    const db = await connectToDatabase();
    const result = await db.collection('bookings').updateOne(
      { bookingId },
      { $set: { status } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Booking not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Booking status updated successfully' 
    });
  } catch (error) {
    console.error('Error in PUT /api/bookings:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
} 