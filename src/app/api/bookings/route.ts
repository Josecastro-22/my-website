import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    console.log('Attempting to connect to MongoDB...');
    const client = await clientPromise;
    console.log('Successfully connected to MongoDB');
    
    const data = await request.json();
    console.log('Received booking data:', data);
    
    const db = client.db("luxury-car-service");
    console.log('Connected to database: luxury-car-service');
    
    const bookings = db.collection("bookings");
    console.log('Accessing bookings collection');
    
    // Add timestamp and booking ID
    const bookingData = {
      ...data,
      bookingId: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      status: 'pending' // Add status field
    };
    
    // Insert the booking into MongoDB
    const result = await bookings.insertOne(bookingData);
    console.log('Successfully inserted booking:', result);
    
    return NextResponse.json({ 
      success: true, 
      data: bookingData
    });
  } catch (error) {
    console.error('Detailed error in POST /api/bookings:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to process booking',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// Add GET endpoint to fetch bookings
export async function GET() {
  try {
    console.log('Attempting to connect to MongoDB...');
    const client = await clientPromise;
    console.log('Successfully connected to MongoDB');
    
    const db = client.db("luxury-car-service");
    console.log('Connected to database: luxury-car-service');
    
    const bookings = db.collection("bookings");
    console.log('Accessing bookings collection');
    
    // Fetch all bookings, sorted by timestamp (newest first)
    const result = await bookings.find({}).sort({ timestamp: -1 }).toArray();
    console.log(`Successfully fetched ${result.length} bookings`);
    
    return NextResponse.json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error('Detailed error in GET /api/bookings:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch bookings',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 