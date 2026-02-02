import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import User from '@/models/User';
import { getCurrentUser } from '@/app/lib/auth';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getCurrentUser();
    if (user) {
      // Update user online status
      await User.findByIdAndUpdate(user.userId, {
        online: false,
        lastSeen: new Date(),
      });
    }

    const response = NextResponse.json({ message: 'Logout successful' });
    response.cookies.delete('token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
