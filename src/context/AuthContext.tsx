'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, UserOut } from '@/lib/api';

type UserRole = 'customer' | 'admin';

interface AuthContextType {
  user: UserOut | null;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  justLoggedOut: boolean;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  login: async () => false,
  logout: () => {},
  justLoggedOut: false,
  isAuthenticated: false,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [justLoggedOut, setJustLoggedOut] = useState(false);

  // On mount, try to restore session from localStorage token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('authUser');
    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as UserOut;
        setUser(parsed);
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.login(email, password);
      const { user: userData, token } = response.data;

      // Store token and user in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(userData));

      setUser(userData);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // mark short-lived flag so pages know this was an intentional sign-out
    setJustLoggedOut(true);
    setUser(null);
    try {
      router.push('/');
    } catch (e) {
      // router may not be available in some test environments — ignore
    }
    // clear the flag after a short delay so other pages don't immediately redirect to /login
    setTimeout(() => setJustLoggedOut(false), 1200);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: (user?.role as UserRole) ?? null,
        login,
        logout,
        justLoggedOut,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;