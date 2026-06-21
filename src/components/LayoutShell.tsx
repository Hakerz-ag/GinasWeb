'use client';

import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatWidget from './ChatWidget';
import { useAuth } from '@/context/AuthContext';

export default function LayoutShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Hide chat widget for admin users
  const showChat = !user || user.role !== 'admin';

  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      {showChat && <ChatWidget />}
    </>
  );
}