'use client';

import { useEffect, useState } from 'react';

interface Booking {
  bookingId: string;
  fullName: string;
  email: string;
  phone: string;
  service: 'airport' | 'private';
  transferType?: 'home-to-airport' | 'airport-to-home';
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
  flightNumber?: string;
  flightDate?: string;
  flightTime?: string;
  pickupTime?: string;
  eventDate?: string;
  eventTime?: string;
  serviceHours?: number;
  passengers: number;
  additionalDetails: string;
  timestamp: string;
  status: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      console.log('Fetching bookings...');
      const response = await fetch('/api/bookings');
      const result = await response.json();
      
      if (result.success) {
        console.log('Successfully fetched bookings:', result.data);
        setBookings(result.data);
      } else {
        console.error('Failed to fetch bookings:', result.error);
        setError(`Failed to fetch bookings: ${result.error}`);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(`Failed to fetch bookings: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-16 text-white">
          Booking <span className="text-yellow-400">History</span>
        </h1>
        
        {bookings.length === 0 ? (
          <div className="text-center text-gray-400">
            No bookings found
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <div key={booking.bookingId} className="bg-white/5 p-6 rounded-lg border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Booking Details</h3>
                    <div className="space-y-3 text-gray-300">
                      <div>
                        <p className="text-gray-400">Booking ID</p>
                        <p className="font-medium">{booking.bookingId}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Status</p>
                        <p className="font-medium capitalize">{booking.status}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Submission Time</p>
                        <p className="font-medium">{new Date(booking.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Customer Information</h3>
                    <div className="space-y-3 text-gray-300">
                      <div>
                        <p className="text-gray-400">Name</p>
                        <p className="font-medium">{booking.fullName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Email</p>
                        <p className="font-medium">{booking.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Phone</p>
                        <p className="font-medium">{booking.phone}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Service Details</h3>
                    <div className="space-y-3 text-gray-300">
                      <div>
                        <p className="text-gray-400">Service Type</p>
                        <p className="font-medium">{booking.service === 'airport' ? 'Airport Transfer' : 'Private Event'}</p>
                      </div>
                      {booking.service === 'airport' && (
                        <>
                          <div>
                            <p className="text-gray-400">Transfer Type</p>
                            <p className="font-medium">{booking.transferType === 'home-to-airport' ? 'Home to Airport' : 'Airport to Home'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Flight Number</p>
                            <p className="font-medium">{booking.flightNumber}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Flight Date</p>
                            <p className="font-medium">{booking.flightDate}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Flight Time</p>
                            <p className="font-medium">{booking.flightTime}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Pickup Time</p>
                            <p className="font-medium">{booking.pickupTime}</p>
                          </div>
                        </>
                      )}
                      {booking.service === 'private' && (
                        <>
                          <div>
                            <p className="text-gray-400">Event Date</p>
                            <p className="font-medium">{booking.eventDate}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Event Time</p>
                            <p className="font-medium">{booking.eventTime}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Service Duration</p>
                            <p className="font-medium">{booking.serviceHours} hours</p>
                          </div>
                        </>
                      )}
                      <div>
                        <p className="text-gray-400">Number of Passengers</p>
                        <p className="font-medium">{booking.passengers}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Pickup Location</h3>
                    <div className="space-y-3 text-gray-300">
                      <div>
                        <p className="text-gray-400">Address</p>
                        <p className="font-medium">
                          {booking.pickupLocation?.streetAddress || 'Not specified'}<br />
                          {booking.pickupLocation?.city || ''}, {booking.pickupLocation?.state || ''} {booking.pickupLocation?.zipCode || ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {(booking.service === 'private' || (booking.service === 'airport' && booking.transferType === 'airport-to-home')) && (
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4">Drop-off Location</h3>
                      <div className="space-y-3 text-gray-300">
                        <div>
                          <p className="text-gray-400">Address</p>
                          <p className="font-medium">
                            {booking.dropoffLocation?.streetAddress || 'Not specified'}<br />
                            {booking.dropoffLocation?.city || ''}, {booking.dropoffLocation?.state || ''} {booking.dropoffLocation?.zipCode || ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {booking.additionalDetails && (
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4">Additional Details</h3>
                      <div className="space-y-3 text-gray-300">
                        <p className="font-medium">{booking.additionalDetails}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 