'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'DATA_ENTRY_OPERATOR' | 'VIEWER';
  designation?: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPerm: (permission: 'canManageUsers' | 'canEditStudents' | 'canTransferStudents' | 'canImportGR' | 'canVerifyOCR' | 'canExportData' | 'canViewAuditLogs') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
          if (pathname !== '/login') {
            router.push('/login');
          }
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        router.push('/');
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
    } catch {
      setUser(null);
      router.push('/login');
    }
  };

  const hasPerm = (permission: 'canManageUsers' | 'canEditStudents' | 'canTransferStudents' | 'canImportGR' | 'canVerifyOCR' | 'canExportData' | 'canViewAuditLogs') => {
    if (!user) return false;
    const role = user.role;
    if (role === 'SUPER_ADMIN') return true;
    if (role === 'SCHOOL_ADMIN') {
      return permission !== 'canManageUsers';
    }
    if (role === 'DATA_ENTRY_OPERATOR') {
      return ['canEditStudents', 'canImportGR', 'canVerifyOCR'].includes(permission);
    }
    if (role === 'VIEWER') {
      return false;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPerm }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
