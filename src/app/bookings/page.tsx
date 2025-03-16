'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  completedAt?: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [view, setView] = useState<'active' | 'completed'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [view]);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`/api/bookings?status=${view === 'completed' ? 'completed' : 'active'}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        if (view === 'completed') {
          setCompletedBookings(data);
        } else {
          setBookings(data);
        }
      } else {
        console.error('Invalid data format received:', data);
        if (view === 'completed') {
          setCompletedBookings([]);
        } else {
          setBookings([]);
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      if (view === 'completed') {
        setCompletedBookings([]);
      } else {
        setBookings([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId, action: 'complete' }),
      });

      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Error completing booking:', error);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId, action: 'delete' }),
      });

      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  const filterBookings = (bookings: Booking[]) => {
    if (!searchQuery) return bookings;

    const query = searchQuery.toLowerCase();
    return bookings.filter(booking => 
      booking.fullName.toLowerCase().includes(query) ||
      booking.email.toLowerCase().includes(query) ||
      booking.phone.toLowerCase().includes(query) ||
      booking.bookingId.toLowerCase().includes(query)
    );
  };

  const displayBookings = filterBookings(view === 'completed' ? completedBookings : bookings);

  return (
    <main className="min-h-screen bg-black py-20">
      <div className="container mx-auto px-4">
        {/* Back to Home Button */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-white hover:text-yellow-400 transition-colors"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-center mb-12 text-white">
          Booking <span className="text-yellow-400">Management</span>
        </h1>

        {/* View Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setView('active')}
              className={`px-4 py-2 rounded-md transition-colors ${
                view === 'active'
                  ? 'bg-yellow-400 text-black'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Active Bookings
            </button>
            <button
              onClick={() => setView('completed')}
              className={`px-4 py-2 rounded-md transition-colors ${
                view === 'completed'
                  ? 'bg-yellow-400 text-black'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Completed Bookings
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white/5 p-6 rounded-lg border border-white/10">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone, or booking ID..."
                className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 placeholder-white/40 focus:border-yellow-400 focus:outline-none"
              />
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-gray-400">
                Found {displayBookings.length} {view === 'completed' ? 'completed' : 'active'} bookings
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-white">Loading...</div>
        ) : displayBookings.length === 0 ? (
          <div className="text-center text-white">
            {searchQuery 
              ? 'No bookings found matching your search criteria.'
              : `No ${view === 'completed' ? 'completed' : 'active'} bookings found.`}
          </div>
        ) : (
          <div className="grid gap-6">
            {displayBookings.map((booking) => (
              <div key={booking.bookingId} className="bg-white/5 p-6 rounded-lg border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <div>
                        <p className="text-gray-400">Status</p>
                        <p className={`font-medium ${
                          booking.status === 'completed' ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </p>
                      </div>
                      {booking.completedAt && (
                        <div>
                          <p className="text-gray-400">Completed At</p>
                          <p className="font-medium">
                            {new Date(booking.completedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
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
                    <div className="md:col-span-2">
                      <h3 className="text-xl font-semibold text-white mb-4">Additional Details</h3>
                      <div className="space-y-3 text-gray-300">
                        <p className="font-medium">{booking.additionalDetails}</p>
                      </div>
                    </div>
                  )}

                  {view === 'active' && (
                    <div className="md:col-span-2 flex justify-end space-x-4">
                      <button
                        onClick={() => handleCompleteBooking(booking.bookingId)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Mark as Completed
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(booking.bookingId)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Delete Booking
                      </button>
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