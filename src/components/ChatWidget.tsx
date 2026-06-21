'use client';

import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export default function ChatWidget() {
  const [showChat, setShowChat] = useState(false);
  const [chatName, setChatName] = useState('');
  const [chatEmail, setChatEmail] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatSent, setChatSent] = useState(false);
  const [chatSending, setChatSending] = useState(false);

  const isValidEmail = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
  };

  const handleSend = async () => {
    if (!chatName.trim() || !chatEmail.trim() || !chatMessage.trim()) return;
    if (!isValidEmail(chatEmail)) return;
    setChatSending(true);
    try {
      await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: chatName, email: chatEmail, message: chatMessage }),
      });
      setChatSent(true);
      setChatName('');
      setChatEmail('');
      setChatMessage('');
    } catch (err) {
      console.error('Failed to send chat message:', err);
    } finally {
      setChatSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {showChat && (
        <div className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-green-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-gradient-to-r from-green-800 to-green-900 p-4 flex items-center">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-white font-bold text-sm">Chat with Gina</p>
                <p className="text-green-300 text-xs">We typically reply within minutes</p>
              </div>
            </div>
          </div>
          {chatSent ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-bold text-green-900">Message Sent!</p>
              <p className="text-gray-500 text-sm mt-1">Gina will get back to you soon.</p>
              <button onClick={() => { setShowChat(false); setChatSent(false); }} className="mt-4 text-sm text-green-600 font-medium hover:text-green-700">Close</button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-gray-600 text-xs">To prevent spam, please provide your name and email before messaging.</p>
              <input type="text" placeholder="Your Name" value={chatName} onChange={e => setChatName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-green-500 focus:outline-none" />
              <input type="email" placeholder="Your Email" value={chatEmail} onChange={e => setChatEmail(e.target.value)} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${chatEmail && !isValidEmail(chatEmail) ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-green-500'}`} />
              {chatEmail && !isValidEmail(chatEmail) && (
                <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
              )}
              <textarea placeholder="Your message..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-green-500 focus:outline-none resize-none" />
              <button
                onClick={handleSend}
                disabled={!chatName.trim() || !chatEmail.trim() || !chatMessage.trim() || !isValidEmail(chatEmail) || chatSending}
                className={`w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors ${(!chatName.trim() || !chatEmail.trim() || !chatMessage.trim() || !isValidEmail(chatEmail) || chatSending) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {chatSending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          )}
        </div>
      )}
      <button
        onClick={() => setShowChat(!showChat)}
        className="w-14 h-14 bg-green-800 hover:bg-green-900 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
      >
        {showChat ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}