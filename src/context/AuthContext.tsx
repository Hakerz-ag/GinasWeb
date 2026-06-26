'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, UserOut } from '@/lib/api';

type UserRole = 'customer' | 'admin';

interface MFAPendingState {
  tempToken: string;
  userEmail: string;
}

interface AuthContextType {
  user: UserOut | null;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<UserOut | null>;
  logout: () => void;
  justLoggedOut: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  mfaPending: MFAPendingState | null;
  verifyMFA: (code: string) => Promise<UserOut | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  login: async () => null as unknown as UserOut,
  logout: () => {},
  justLoggedOut: false,
  isAuthenticated: false,
  loading: true,
  mfaPending: null,
  verifyMFA: async () => null as unknown as UserOut,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaPending, setMfaPending] = useState<MFAPendingState | null>(null);
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

  const login = async (email: string, password: string): Promise<UserOut | null> => {
    try {
      const response = await api.login(email, password);
      const { user: userData, token, refresh_token, mfa_required, mfa_temp_token } = response.data;

      // If MFA is required, store the temp token and show the MFA verification step
      if (mfa_required && mfa_temp_token) {
        setMfaPending({ tempToken: mfa_temp_token, userEmail: email });
        return null; // Don't set user yet — MFA must be verified first
      }

      // Store tokens and user in localStorage
      localStorage.setItem('authToken', token);
      if (refresh_token) localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('authUser', JSON.stringify(userData));

      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      return null;
    }
  };

  const verifyMFA = async (code: string): Promise<UserOut | null> => {
    if (!mfaPending) return null;
    try {
      const response = await api.mfaVerifyLogin(code, mfaPending.tempToken);
      const { user: userData, token } = response.data;

      // Store token and user in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(userData));

      setMfaPending(null);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('MFA verification failed:', error);
      return null;
    }
  };

  const logout = () => {
    // Try to revoke the refresh token on the server
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      api.logout(refreshToken).catch(() => {
        // Ignore errors — we're logging out anyway
      });
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authUser');
    // mark short-lived flag so pages know this was an intentional sign-out
    setJustLoggedOut(true);
    setUser(null);
    setMfaPending(null);
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
        mfaPending,
        verifyMFA,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;