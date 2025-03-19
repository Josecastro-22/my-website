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
  dropoffLocation?: {
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
    // Get the raw request body
    const bodyText = await request.text();
    console.log('Raw request body:', bodyText);

    // Try to parse the JSON
    let bookingData;
    try {
      bookingData = JSON.parse(bodyText);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json({
        error: 'Invalid JSON data',
        receivedBody: bodyText
      }, { status: 400 });
    }

    // Basic validation
    if (!bookingData.fullName || !bookingData.email || !bookingData.phone || !bookingData.service) {
      return NextResponse.json({
        error: 'Missing required fields',
        receivedFields: Object.keys(bookingData)
      }, { status: 400 });
    }

    // Add metadata
    const booking = {
      ...bookingData,
      timestamp: new Date(),
      status: 'active',
      bookingId: `BK${Date.now()}${Math.random().toString(36).substring(2, 7)}`.toUpperCase()
    };

    // Connect to database
    const { db } = await connectToDatabase();
    
    // Save booking
    const result = await db.collection('bookings').insertOne(booking);
    console.log('Booking saved:', result);

    // Try to send notification (but don't fail if it doesn't work)
    try {
      await sendBookingNotification(booking);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      bookingId: booking.bookingId
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json({
      error: 'Failed to create booking',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    // Connect to database
    const { db } = await connectToDatabase();
    
    // Get bookings
    const bookings = await db
      .collection('bookings')
      .find({ status })
      .sort({ timestamp: -1 })
      .toArray();

    // Transform the data to match the expected format
    const transformedBookings = bookings.map(booking => ({
      id: booking._id.toString(),
      bookingId: booking.bookingId,
      name: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      service: booking.service,
      date: booking.flightDate || booking.eventDate || '',
      time: booking.flightTime || booking.eventTime || '',
      pickupTime: booking.pickupTime || '',
      pickupLocation: booking.pickupLocation || {
        streetAddress: '',
        city: '',
        state: '',
        zipCode: ''
      },
      dropoffLocation: booking.dropoffLocation || {
        streetAddress: '',
        city: '',
        state: '',
        zipCode: ''
      },
      status: booking.status || 'active',
      timestamp: booking.timestamp ? new Date(booking.timestamp).toISOString() : new Date().toISOString(),
      transferType: booking.transferType || '',
      flightNumber: booking.flightNumber || '',
      passengers: booking.passengers || 1,
      serviceHours: booking.serviceHours || 0,
      additionalDetails: booking.additionalDetails || ''
    }));

    return NextResponse.json({
      success: true,
      data: transformedBookings,
      count: transformedBookings.length,
      status: 'success'
    });

  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bookings',
      details: error instanceof Error ? error.message : String(error),
      status: 'error'
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { bookingId, status } = await request.json();
    
    if (!bookingId || !status) {
      return NextResponse.json({
        error: 'Missing bookingId or status'
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    const result = await db.collection('bookings').updateOne(
      { bookingId },
      { $set: { status } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        error: 'Booking not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Booking status updated'
    });

  } catch (error) {
    console.error('Failed to update booking:', error);
    return NextResponse.json({
      error: 'Failed to update booking',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 