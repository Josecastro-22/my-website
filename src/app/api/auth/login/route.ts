import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const ADMIN_PASSWORD = 'Jojusajo4';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    // Check if password matches
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid password' 
      }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { isAdmin: true },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    // Create the response
    const response = NextResponse.json({ 
      success: true, 
      message: 'Login successful' 
    });

    // Set cookie in the response
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
} 