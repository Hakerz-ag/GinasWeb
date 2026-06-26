'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
} from 'lucide-react';
import NotificationBadge from './NotificationBadge';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const role = user?.role;
  const dashboardPath = isAuthenticated
    ? role === 'admin' ? '/admin' : '/customer'
    : '/';

  // Logo links to dashboard for authenticated users, homepage for guests

  // Customer: show Videos, Book Court, Schedule
  // Admin: show Dashboard, Calendar, Staff
  const navLinks = isAuthenticated
    ? role === 'admin'
      ? [
          { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/admin/calendar', label: 'Calendar', icon: Calendar },
        ]
      : [
          { href: '/customer', label: 'Home', icon: null },
          { href: '/about', label: 'About', icon: null },
          { href: '/videos', label: 'Videos', icon: null },
          { href: '/book', label: 'Book a Court', icon: null },
          { href: '/classes', label: 'Schedule a Class', icon: null },
          { href: '/staff', label: 'Our Staff', icon: null },
        ]
    : [
        { href: '/', label: 'Home', icon: null },
        { href: '/about', label: 'About', icon: null },
        { href: '/videos', label: 'Videos', icon: null },
        { href: '/book', label: 'Book a Court', icon: null },
        { href: '/classes', label: 'Schedule a Class', icon: null },
        { href: '/staff', label: 'Our Staff', icon: null },
      ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-green-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isAuthenticated ? dashboardPath : '/'} className="flex items-center group">
            <img
              src="/GTW Logo-2.jpg"
              alt="Gina's Tennis World"
              className="h-14 w-auto group-hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <NotificationBadge />
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-green-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0)}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user?.name}
                  </span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                        role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {role}
                      </span>
                    </div>
                    <Link
                      href={dashboardPath}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile & Settings
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="btn-primary text-sm py-2 px-4"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-green-50 text-gray-600"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-green-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-green-50 rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}