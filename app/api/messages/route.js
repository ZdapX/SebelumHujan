import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Message from '@/models/Message';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const room = searchParams.get('room');
    const receiverId = searchParams.get('receiverId');
    const senderId = request.headers.get('x-user-id');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = parseInt(searchParams.get('skip')) || 0;

    let query = {};

    if (room) {
      query.room = room;
      query.isPrivate = false;
    } else if (receiverId) {
      query.$or = [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ];
      query.isPrivate = true;
    }

    const messages = await Message.find(query)
      .populate('sender', 'username displayName profileImage')
      .populate('receiver', 'username displayName profileImage')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Mark messages as read if they're private messages
    if (receiverId) {
      await Message.updateMany(
        {
          receiver: senderId,
          sender: receiverId,
          read: false,
        },
        { $set: { read: true } }
      );
    }

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    const { content, room, receiverId, imageUrl } = await request.json();

    if (!content && !imageUrl) {
      return NextResponse.json(
        { error: 'Message content or image is required' },
        { status: 400 }
      );
    }

    const messageData = {
      sender: userId,
      content: content || '',
      imageUrl: imageUrl || '',
      isPrivate: !!receiverId,
      createdAt: new Date(),
    };

    if (receiverId) {
      messageData.receiver = receiverId;
    } else {
      messageData.room = room || 'general';
    }

    const message = new Message(messageData);
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username displayName profileImage')
      .populate('receiver', 'username displayName profileImage');

    return NextResponse.json(
      { message: populatedMessage },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
