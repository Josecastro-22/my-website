import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const adminPhone = process.env.ADMIN_PHONE_NUMBER;

// Log configuration (without exposing sensitive data)
console.log('Detailed Twilio Configuration:', {
  hasAccountSid: !!accountSid,
  accountSidLength: accountSid?.length,
  hasAuthToken: !!authToken,
  authTokenLength: authToken?.length,
  twilioPhone,
  adminPhone,
  timestamp: new Date().toISOString()
});

const client = twilio(accountSid, authToken);

export async function sendBookingNotification(booking: any) {
  try {
    console.log('Starting SMS notification process...', {
      timestamp: new Date().toISOString(),
      bookingId: booking._id,
      customerName: booking.fullName
    });
    
    if (!accountSid || !authToken || !twilioPhone || !adminPhone) {
      const missingFields = {
        accountSid: !accountSid,
        authToken: !authToken,
        twilioPhone: !twilioPhone,
        adminPhone: !adminPhone
      };
      throw new Error(`Missing required Twilio configuration: ${JSON.stringify(missingFields)}`);
    }

    const message = `
New Booking Received!
Name: ${booking.fullName}
Service: ${booking.service}
${booking.service === 'airport' ? 
  `Flight Date: ${booking.flightDate}
Flight Time: ${booking.flightTime}
Flight #: ${booking.flightNumber}` : 
  `Event Date: ${booking.eventDate}
Event Time: ${booking.eventTime}`}
Phone: ${booking.phone}
Pickup: ${booking.pickupLocation.streetAddress}, ${booking.pickupLocation.city}`;

    console.log('Attempting to send SMS with:', {
      messageLength: message.length,
      toNumber: adminPhone,
      fromNumber: twilioPhone,
      timestamp: new Date().toISOString()
    });

    const result = await client.messages.create({
      body: message,
      to: adminPhone,
      from: twilioPhone
    });

    console.log('SMS notification sent successfully:', {
      messageSid: result.sid,
      status: result.status,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error: any) {
    console.error('Detailed SMS notification error:', {
      errorCode: error.code,
      errorStatus: error.status,
      errorMessage: error.message,
      errorDetails: error.details,
      timestamp: new Date().toISOString(),
      twilioError: error.toString()
    });
    throw error;
  }
} 