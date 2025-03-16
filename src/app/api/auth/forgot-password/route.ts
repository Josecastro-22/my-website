import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('luxcarservice');
    const users = db.collection('users');

    const user = await users.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code with expiration
    await users.updateOne(
      { username },
      {
        $set: {
          resetCode: verificationCode,
          resetCodeExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        },
      }
    );

    // Send verification code email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email, // Use the email stored in the user document
      subject: 'Password Reset Verification Code',
      html: `
        <h1>Password Reset Request</h1>
        <p>Your verification code is: <strong>${verificationCode}</strong></p>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
} 