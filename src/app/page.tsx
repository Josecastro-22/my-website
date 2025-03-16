'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, FormEvent } from 'react';

interface BookingFormData {
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
}

export default function Home() {
  const [formData, setFormData] = useState<BookingFormData>({
    fullName: '',
    email: '',
    phone: '',
    service: 'airport',
    transferType: 'home-to-airport',
    pickupLocation: {
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
    },
    dropoffLocation: {
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
    },
    flightNumber: '',
    flightDate: '',
    flightTime: '',
    pickupTime: '',
    eventDate: '',
    eventTime: '',
    serviceHours: 2,
    passengers: 1,
    additionalDetails: '',
  });

  const [formStatus, setFormStatus] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    data?: any;
  }>({
    message: '',
    type: 'info',
  });

  const [timeError, setTimeError] = useState<string>('');

  const [formErrors, setFormErrors] = useState<{
    email?: string;
    phone?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    destinationStreetAddress?: string;
    destinationCity?: string;
    destinationState?: string;
    destinationZipCode?: string;
    returnStreetAddress?: string;
    returnCity?: string;
    returnState?: string;
    returnZipCode?: string;
    preferredPickupTime?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validatePickupTime = (preferredTime: string | undefined, flightTime: string | undefined) => {
    if (!preferredTime || !flightTime) return true;
    
    const flightDate = new Date(flightTime);
    const [hours, minutes] = preferredTime.split(':');
    const preferredDate = new Date(flightDate);
    preferredDate.setHours(parseInt(hours), parseInt(minutes), 0);

    const timeDiff = flightDate.getTime() - preferredDate.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 2) {
      setFormErrors(prev => ({ ...prev, preferredPickupTime: 'Pickup time must be at least 2 hours before flight time' }));
      return false;
    }
    if (hoursDiff > 4) {
      setFormErrors(prev => ({ ...prev, preferredPickupTime: 'Pickup time cannot be more than 4 hours before flight time' }));
      return false;
    }
    setFormErrors(prev => ({ ...prev, preferredPickupTime: undefined }));
    return true;
  };

  const handlePreferredTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    validatePickupTime(value, formData.flightTime);
  };

  const validateAddress = (street: string, city: string, state: string, zipCode: string) => {
    const errors: Record<string, string> = {};
    
    if (street.trim() === '') {
      errors.streetAddress = 'Please enter your street address';
    }
    
    if (city.trim() === '') {
      errors.city = 'Please enter your city';
    }
    
    if (state.trim().length !== 2) {
      errors.state = 'State must be a 2-letter code (e.g., FL)';
    }
    
    if (!/^\d{5}$/.test(zipCode)) {
      errors.zipCode = 'ZIP code must be 5 digits';
    }
    
    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested location objects
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof BookingFormData] as { streetAddress: string; city: string; state: string; zipCode: string }),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for the field being updated
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
    
    // Validate fields as they're updated
    if (name.includes('streetAddress') || name.includes('city') || name.includes('state') || name.includes('zipCode')) {
      const location = name.split('.')[0];
      const locationData = formData[location as keyof BookingFormData] as { streetAddress: string; city: string; state: string; zipCode: string };
      const errors = validateAddress(
        name.includes('streetAddress') ? value : locationData.streetAddress,
        name.includes('city') ? value : locationData.city,
        name.includes('state') ? value : locationData.state,
        name.includes('zipCode') ? value : locationData.zipCode
      );
      setFormErrors(prev => ({ ...prev, ...errors }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({ type: 'info', message: 'Submitting booking request...' });

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setFormStatus({ 
          type: 'success', 
          message: 'Booking request submitted successfully!',
          data: result.data // Include the booking data in the status
        });
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          service: 'airport',
          transferType: 'home-to-airport',
          pickupLocation: {
            streetAddress: '',
            city: '',
            state: '',
            zipCode: '',
          },
          dropoffLocation: {
            streetAddress: '',
            city: '',
            state: '',
            zipCode: '',
          },
          flightNumber: '',
          flightDate: '',
          flightTime: '',
          pickupTime: '',
          eventDate: '',
          eventTime: '',
          serviceHours: 2,
          passengers: 1,
          additionalDetails: '',
        });
      } else {
        setFormStatus({ type: 'error', message: result.error || 'Failed to submit booking request' });
      }
    } catch (error) {
      setFormStatus({ type: 'error', message: 'Failed to submit booking request' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add click handler for the Book Now button in the hero section
  const handleBookNowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset flight-related fields when service changes
      flightTime: '',
      suggestedPickupTime: '',
      preferredPickupTime: '',
    }));
  };

  const handleFlightTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const flightTime = e.target.value;
    const flightDate = new Date(flightTime);
    const suggestedTime = new Date(flightDate.getTime() - (2.5 * 60 * 60 * 1000)); // 2.5 hours before
    const suggestedTimeString = suggestedTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    setFormData(prev => ({
      ...prev,
      flightTime,
      suggestedPickupTime: suggestedTimeString,
    }));
  };

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative h-screen bg-black">
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-center mb-6">
            <span className="text-yellow-400">Premium</span> Luxury Car Service
          </h1>
          <p className="text-xl md:text-2xl text-center mb-8 max-w-2xl text-gray-200">
            Experience unparalleled comfort and sophistication with our exclusive fleet
          </p>
          <button
            onClick={handleBookNowClick}
            className="bg-yellow-400 text-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-yellow-500 transition-all transform hover:scale-105"
          >
            Book Now
          </button>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            Our <span className="text-yellow-400">Services</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: 'Airport Transfers',
                description: 'Luxurious and punctual airport transportation',
                icon: '✈️',
              },
              {
                title: 'Private Events',
                description: 'Impress your guests with premium transportation',
                icon: '💼',
              },
            ].map((service, index) => (
              <div
                key={index}
                className="bg-white/5 p-8 rounded-lg text-center hover:bg-white/10 transition-all border border-white/10"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-2xl font-semibold mb-4 text-white">{service.title}</h3>
                <p className="text-gray-400">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet Section */}
      <section id="fleet" className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            Our <span className="text-yellow-400">Fleet</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: 'Ford Expedition',
                description: 'Spacious and comfortable SUV perfect for groups',
                features: [
                  'Seats up to 7 passengers',
                  'Luxury leather interior',
                  'Climate control',
                  'Premium sound system',
                  'Wi-Fi hotspot',
                  'Privacy partition'
                ]
              },
              {
                name: 'Mercedes Sprinter Group',
                description: 'Spacious luxury van for larger groups and events',
                features: [
                  'Seats up to 14 passengers',
                  'Executive leather seating',
                  'Individual climate control',
                  'Premium entertainment system',
                  'Wi-Fi connectivity',
                  'Privacy curtains'
                ]
              }
            ].map((car, index) => (
              <div key={index} className="bg-white/5 rounded-lg overflow-hidden shadow-lg border border-white/10 hover:border-yellow-400/50 transition-all">
                <div className="p-6">
                  <h3 className="text-2xl font-semibold mb-2 text-white">{car.name}</h3>
                  <p className="text-gray-400 mb-4">{car.description}</p>
                  <ul className="space-y-2">
                    {car.features.map((feature, idx) => (
                      <li key={idx} className="text-gray-300 flex items-center">
                        <span className="text-yellow-400 mr-2">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking" className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            Make a <span className="text-yellow-400">Reservation</span>
          </h2>
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                      className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                        formErrors.email ? 'border-red-500' : 'border-white/10'
                      } text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 transition-all`}
                    />
                    {formErrors.email && (
                      <p className="text-red-400 text-sm mt-1">{formErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      required
                      className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                        formErrors.phone ? 'border-red-500' : 'border-white/10'
                      } text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 transition-all`}
                    />
                    {formErrors.phone && (
                      <p className="text-red-400 text-sm mt-1">{formErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Service Type</label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleServiceChange}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-white text-black border border-white/10 focus:outline-none focus:border-yellow-400 transition-all"
                    >
                      <option value="airport">Airport Transfer</option>
                      <option value="private">Private Event</option>
                    </select>
                  </div>
                </div>

                {/* Transfer Type for Airport Service */}
                {formData.service === 'airport' && (
                  <div className="mt-6">
                    <label className="block text-gray-300 mb-2">Transfer Type</label>
                    <select
                      name="transferType"
                      value={formData.transferType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-white text-black border border-white/10 focus:outline-none focus:border-yellow-400 transition-all"
                    >
                      <option value="home-to-airport">Home to Airport</option>
                      <option value="airport-to-home">Airport to Home</option>
                    </select>
                  </div>
                )}

                {/* Service Specific Fields for Private Events */}
                {formData.service === 'private' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-300 mb-2">Event Date</label>
                        <input
                          type="date"
                          name="eventDate"
                          value={formData.eventDate}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">Event Time</label>
                        <input
                          type="time"
                          name="eventTime"
                          value={formData.eventTime}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">Number of Hours</label>
                        <input
                          type="number"
                          name="serviceHours"
                          value={formData.serviceHours}
                          onChange={handleInputChange}
                          min="1"
                          required
                          className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Location Fields based on Service and Transfer Type */}
                {(formData.service === 'private' || (formData.service === 'airport' && formData.transferType === 'home-to-airport')) && (
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Pick-up Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-gray-300 mb-2">Street Address</label>
                        <input
                          type="text"
                          name="pickupLocation.streetAddress"
                          value={formData.pickupLocation.streetAddress}
                          onChange={handleInputChange}
                          placeholder="Enter street address"
                          required
                          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">City</label>
                        <input
                          type="text"
                          name="pickupLocation.city"
                          value={formData.pickupLocation.city}
                          onChange={handleInputChange}
                          placeholder="Enter city"
                          required
                          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">State</label>
                        <input
                          type="text"
                          name="pickupLocation.state"
                          value={formData.pickupLocation.state}
                          onChange={handleInputChange}
                          placeholder="Enter state (e.g., FL)"
                          maxLength={2}
                          required
                          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">ZIP Code</label>
                        <input
                          type="text"
                          name="pickupLocation.zipCode"
                          value={formData.pickupLocation.zipCode}
                          onChange={handleInputChange}
                          placeholder="Enter ZIP code"
                          required
                          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Service Specific Fields */}
                {formData.service === 'airport' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-300 mb-2">Flight Number</label>
                        <input
                          type="text"
                          name="flightNumber"
                          value={formData.flightNumber}
                          onChange={handleInputChange}
                          placeholder="Enter flight number"
                          required
                          className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">Flight Date</label>
                        <input
                          type="date"
                          name="flightDate"
                          value={formData.flightDate}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">Flight Time</label>
                        <input
                          type="time"
                          name="flightTime"
                          value={formData.flightTime}
                          onChange={handleFlightTimeChange}
                          required
                          className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">Preferred Pickup Time</label>
                        <input
                          type="time"
                          name="pickupTime"
                          value={formData.pickupTime}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Drop-off Location for Private Events and Airport to Home */}
                {(formData.service === 'private' || (formData.service === 'airport' && formData.transferType === 'airport-to-home')) && (
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Drop-off Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-gray-300 mb-2">Street Address</label>
                        <input
                          type="text"
                          name="dropoffLocation.streetAddress"
                          value={formData.dropoffLocation.streetAddress}
                          onChange={handleInputChange}
                          placeholder="Enter drop-off street address"
                          required
                          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">City</label>
                        <input
                          type="text"
                          name="dropoffLocation.city"
                          value={formData.dropoffLocation.city}
                          onChange={handleInputChange}
                          placeholder="Enter drop-off city"
                          required
                          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">State</label>
                        <input
                          type="text"
                          name="dropoffLocation.state"
                          value={formData.dropoffLocation.state}
                          onChange={handleInputChange}
                          placeholder="Enter drop-off state (e.g., FL)"
                          maxLength={2}
                          required
                          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">ZIP Code</label>
                        <input
                          type="text"
                          name="dropoffLocation.zipCode"
                          value={formData.dropoffLocation.zipCode}
                          onChange={handleInputChange}
                          placeholder="Enter drop-off ZIP code"
                          required
                          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Additional Details</label>
                <textarea
                  name="additionalDetails"
                  value={formData.additionalDetails}
                  onChange={handleInputChange}
                  placeholder="Enter any additional information (e.g., special requests, number of passengers, etc.)"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-yellow-400 text-black py-4 rounded-lg text-lg font-semibold hover:bg-yellow-500 transition-all transform hover:scale-105 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Request Booking'}
              </button>
            </form>

            {/* Form Status Display */}
            {formStatus.message && (
              <div className={`mt-6 p-4 rounded-lg ${
                formStatus.type === 'success' ? 'bg-green-500/20 text-green-200 border border-green-500/30' : 'bg-red-500/20 text-red-200 border border-red-500/30'
              }`}>
                <p className="font-semibold">{formStatus.message}</p>
                {formStatus.type === 'success' && formStatus.data && (
                  <div className="mt-4 bg-white/5 p-6 rounded-lg border border-white/10">
                    <h4 className="text-xl font-semibold mb-4 text-white">Booking Confirmation</h4>
                    <div className="space-y-3 text-gray-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400">Booking ID</p>
                          <p className="font-medium">{formStatus.data.bookingId}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Submission Time</p>
                          <p className="font-medium">{new Date(formStatus.data.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="border-t border-white/10 pt-4">
                        <h5 className="text-lg font-semibold text-white mb-3">Booking Details</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-400">Name</p>
                            <p className="font-medium">{formStatus.data.fullName}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Service</p>
                            <p className="font-medium">{formStatus.data.service === 'airport' ? 'Airport Transfer' : 'Private Event'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Email</p>
                            <p className="font-medium">{formStatus.data.email}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Phone</p>
                            <p className="font-medium">{formStatus.data.phone}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-gray-400">Pickup Location</p>
                            <p className="font-medium">
                              {formStatus.data.pickupLocation.streetAddress}<br />
                              {formStatus.data.pickupLocation.city}, {formStatus.data.pickupLocation.state} {formStatus.data.pickupLocation.zipCode}
                            </p>
                          </div>
                          {formStatus.data.service === 'airport' && (
                            <>
                              <div>
                                <p className="text-gray-400">Flight Number</p>
                                <p className="font-medium">{formStatus.data.flightNumber}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Flight Date</p>
                                <p className="font-medium">{formStatus.data.flightDate}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Flight Time</p>
                                <p className="font-medium">{formStatus.data.flightTime}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Pickup Time</p>
                                <p className="font-medium">{formStatus.data.pickupTime}</p>
                              </div>
                            </>
                          )}
                          {formStatus.data.service === 'private' && (
                            <div>
                              <p className="text-gray-400">Number of Passengers</p>
                              <p className="font-medium">{formStatus.data.passengers}</p>
                            </div>
                          )}
                          {formStatus.data.additionalDetails && (
                            <div className="md:col-span-2">
                              <p className="text-gray-400">Additional Details</p>
                              <p className="font-medium">{formStatus.data.additionalDetails}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-yellow-400">Luxury Car Service</h3>
              <p className="text-gray-400">
                Providing premium transportation solutions for discerning clients.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="#services" className="text-gray-400 hover:text-yellow-400 transition-colors">Services</Link></li>
                <li><Link href="#fleet" className="text-gray-400 hover:text-yellow-400 transition-colors">Our Fleet</Link></li>
                <li><Link href="#booking" className="text-gray-400 hover:text-yellow-400 transition-colors">Book Now</Link></li>
                <li><Link href="/login" className="text-gray-400 hover:text-yellow-400 transition-colors">View Bookings</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📞 (954) 865-6145</li>
                <li>📧 chiquicastro11@gmail.com</li>
                <li>📍 Coral Springs, Florida</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Luxury Car Service. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
