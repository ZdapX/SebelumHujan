import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import User from '@/models/User';
import { createToken } from '@/app/lib/auth';

export async function POST(request) {
  try {
    await connectDB();

    const { username, password } = await request.json();

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Update user online status
    user.online = true;
    user.lastSeen = new Date();
    await user.save();

    // Create JWT token
    const token = createToken(user._id, user.username);

    // Set cookie with token
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        profileImage: user.profileImage,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
