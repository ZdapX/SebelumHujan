'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import ChatRoom from '../components/ChatRoom';
import PrivateChat from '../components/PrivateChat';
import Profile from '../components/Profile';

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState('room');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Try to get user info from session
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} user={user} />
      
      {activeTab === 'room' && <ChatRoom user={user} />}
      {activeTab === 'private' && <PrivateChat user={user} />}
      {activeTab === 'profile' && <Profile user={user} onUpdate={handleUserUpdate} />}
    </div>
  );
}
