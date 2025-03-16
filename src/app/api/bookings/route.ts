import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/mongodb';
import { sendBookingNotification } from '@/utils/twilio';

export async function POST(req: Request) {
  try {
    const bookingData = await req.json();
    console.log('Received booking data:', bookingData);

    const { db } = await connectToDatabase();
    
    const booking = {
      ...bookingData,
      bookingId: Date.now().toString(),
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    console.log('Attempting to save booking:', booking);
    const result = await db.collection('bookings').insertOne(booking);
    console.log('Booking saved successfully:', result);

    // Send SMS notification
    try {
      await sendBookingNotification(booking);
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
      // Continue with the response even if SMS fails
      return NextResponse.json({ 
        success: true, 
        message: 'Booking created successfully, but notification failed to send',
        data: booking,
        notificationError: error.message
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create booking' 
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    console.log('Attempting to fetch bookings...');
    const { db } = await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let bookings;
    if (status === 'completed') {
      bookings = await db.collection('completed-bookings').find({}).sort({ timestamp: -1 }).toArray();
    } else {
      bookings = await db.collection('bookings').find({}).sort({ timestamp: -1 }).toArray();
    }

    console.log(`Found ${bookings.length} ${status || 'active'} bookings`);
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch bookings' 
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { bookingId, action } = await request.json();

    if (action === 'complete') {
      // Find the booking
      const booking = await db.collection('bookings').findOne({ bookingId });
      
      if (!booking) {
        return NextResponse.json({ 
          success: false, 
          error: 'Booking not found' 
        }, { status: 404 });
      }

      // Add completion timestamp
      const completedBooking = {
        ...booking,
        completedAt: new Date().toISOString(),
        status: 'completed'
      };

      // Move to completed bookings
      await db.collection('completed-bookings').insertOne(completedBooking);
      
      // Delete from active bookings
      await db.collection('bookings').deleteOne({ bookingId });

      return NextResponse.json({ 
        success: true, 
        data: completedBooking 
      });
    } else if (action === 'delete') {
      const result = await db.collection('bookings').deleteOne({ bookingId });
      
      if (result.deletedCount === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Booking not found' 
        }, { status: 404 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Booking deleted successfully' 
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update booking' 
    }, { status: 500 });
  }
} 