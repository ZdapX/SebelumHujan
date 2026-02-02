'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function ChatRoom({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('general');
  const [rooms] = useState([
    { id: 'general', name: 'General', description: 'Main chat room for everyone' },
    { id: 'gaming', name: 'Gaming', description: 'Discuss games and gaming news' },
    { id: 'tech', name: 'Tech', description: 'Technology discussions' },
    { id: 'music', name: 'Music', description: 'Share and discuss music' },
    { id: 'movies', name: 'Movies', description: 'Movie reviews and discussions' },
  ]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?room=${selectedRoom}`);
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !uploadingImage) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          room: selectedRoom,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (uploadResponse.ok) {
        const messageResponse = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: '📷 Shared an image',
            room: selectedRoom,
            imageUrl: uploadData.url,
          }),
        });

        if (messageResponse.ok) {
          fetchMessages();
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Room List Sidebar */}
      <div className="hidden md:block w-64 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Chat Rooms</h2>
          <p className="text-sm text-gray-500">Join a room to start chatting</p>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-8rem)]">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                selectedRoom === room.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mr-3 ${
                  selectedRoom === room.id ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
                <div>
                  <div className="font-medium text-gray-900">{room.name}</div>
                  <div className="text-sm text-gray-500 truncate">{room.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Room Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {rooms.find(r => r.id === selectedRoom)?.name || 'Chat Room'}
              </h1>
              <p className="text-sm text-gray-500">
                {rooms.find(r => r.id === selectedRoom)?.description}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {messages.length} messages
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-500">Be the first to send a message in this room!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.sender._id === user?.id ? 'justify-end' : 'justify-start'} message-enter`}
                >
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-2 ${
                      message.sender._id === user?.id
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-2 ${
                        message.sender._id === user?.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {(message.sender.displayName || message.sender.username).charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-sm font-medium ${
                        message.sender._id === user?.id ? 'text-blue-100' : 'text-gray-700'
                      }`}>
                        {message.sender.displayName || message.sender.username}
                      </span>
                      <span className={`text-xs ml-2 ${
                        message.sender._id === user?.id ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                    
                    {message.imageUrl && (
                      <div className="mb-2">
                        <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden">
                          <img
                            src={message.imageUrl}
                            alt="Shared content"
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </div>
                    )}
                    
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="flex-shrink-0 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {uploadingImage ? (
                  <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Type your message in ${rooms.find(r => r.id === selectedRoom)?.name || 'room'}...`}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={uploadingImage}
              />
              
              <button
                type="submit"
                disabled={(!newMessage.trim() && !uploadingImage) || uploadingImage}
                className="flex-shrink-0 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
