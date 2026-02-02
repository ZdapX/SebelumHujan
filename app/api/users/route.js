import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const excludeId = searchParams.get('excludeId');

    let query = {};
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const users = await User.find(query, 'username displayName profileImage online lastSeen')
      .sort({ online: -1, username: 1 });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    const { displayName, profileImage } = await request.json();

    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('username displayName profileImage online lastSeen');

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
