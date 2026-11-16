import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin';
  onboardingCompleted?: boolean;
}

export interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAdminLoading: boolean;
  adminError: string | null;
  checkAdminSession: () => Promise<AdminUser | null>;
  loginAsAdmin: (password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;
  clearAdminError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  const checkAdminSession = useCallback(async (): Promise<AdminUser | null> => {
    try {
      const response = await fetch('/api/admin?action=me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.authenticated && data?.user && data.user.role === 'super_admin') {
          setAdminUser(data.user);
          return data.user;
        }
      }
      setAdminUser(null);
      return null;
    } catch {
      setAdminUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await checkAdminSession();
      } finally {
        if (isMounted) {
          setIsAdminLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [checkAdminSession]);

  const loginAsAdmin = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    setAdminError(null);
    try {
      const response = await fetch('/api/admin?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data?.error?.message || 'Invalid administrator password.';
        setAdminError(message);
        return { success: false, error: message };
      }

      if (data?.user) {
        setAdminUser(data.user);
        return { success: true };
      }

      return { success: false, error: 'Unexpected response from administration portal.' };
    } catch (err: any) {
      const msg = err?.message || 'Network error during administrator login.';
      setAdminError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const adminLogout = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/admin?action=logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
    } catch (err) {
      console.warn('Admin logout call failed:', err);
    } finally {
      setAdminUser(null);
    }
  }, []);

  const clearAdminError = useCallback(() => {
    setAdminError(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAdminLoading,
        adminError,
        checkAdminSession,
        loginAsAdmin,
        adminLogout,
        clearAdminError
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
