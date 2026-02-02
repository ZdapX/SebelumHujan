import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import User from '@/models/User';
import { createToken } from '@/app/lib/auth';

export async function POST(request) {
  try {
    await connectDB();

    const { username, password, displayName } = await request.json();

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      username,
      password,
      displayName: displayName || username,
    });

    await user.save();

    // Create JWT token
    const token = createToken(user._id, user.username);

    // Return success response without setting cookie
    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
