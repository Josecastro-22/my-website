import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { hash } from 'bcryptjs';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export async function POST(request: Request) {
  try {
    const { username, verificationCode, newPassword } = await request.json();

    if (!username || !verificationCode || !newPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
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

    // Check if verification code exists and is valid
    if (!user.resetCode || !user.resetCodeExpires) {
      return NextResponse.json(
        { error: 'No active reset code found' },
        { status: 400 }
      );
    }

    if (user.resetCode !== verificationCode) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    if (new Date() > user.resetCodeExpires) {
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update password and clear reset code
    await users.updateOne(
      { username },
      {
        $set: { password: hashedPassword },
        $unset: { resetCode: 1, resetCodeExpires: 1 },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
} 