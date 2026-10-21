import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  university: string;
  course: string;
  branch: string;
  year: string;
  semester: string;
  preferredLanguage: string;
  avatarUrl?: string;
  authProvider?: string;
  onboardingCompleted?: boolean;
  createdAt: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  confirmPassword?: string;
  name: string;
  university?: string;
  course?: string;
  branch?: string;
  year?: string;
  semester?: string;
  preferredLanguage?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthNotification {
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface AuthContextType {
  currentUser: AuthUser | null;
  isLoading: boolean;
  authModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  authNotification: AuthNotification | null;
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: 'signin' | 'signup') => void;
  clearAuthNotification: () => void;
  bypassLoading: () => void;
  signup: (credentials: SignupCredentials) => Promise<{ success: boolean; requiresLogin?: boolean; email?: string; error?: string }>;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<AuthUser | null>;
  completeOnboarding: (details?: any) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [authNotification, setAuthNotification] = useState<AuthNotification | null>(null);

  const openAuthModal = useCallback((mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const clearAuthNotification = useCallback(() => {
    setAuthNotification(null);
  }, []);

  const bypassLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  /**
   * Verify session with backend using same-origin credentials (HTTP-only cookies)
   */
  const checkSession = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.user) {
          setCurrentUser(data.user);
          return data.user;
        }
      }
      setCurrentUser(null);
      return null;
    } catch (err) {
      setCurrentUser(null);
      return null;
    }
  }, []);

  // Restore session on initial application load and check for OAuth redirect callbacks
  useEffect(() => {
    let isMounted = true;

    // Detect Google OAuth URL callbacks or error redirections
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('auth')) {
        const authVal = params.get('auth');
        if (authVal === 'google_success') {
          setAuthNotification({
            type: 'success',
            message: 'Successfully signed in with your Google account!'
          });
        }
        params.delete('auth');
        const cleanQuery = params.toString() ? `?${params.toString()}` : '';
        const newUrl = `${window.location.pathname}${cleanQuery}${window.location.hash}`;
        window.history.replaceState({}, '', newUrl);
      } else if (params.has('authError')) {
        const errVal = params.get('authError');
        let errMsg = 'Google authentication encountered an issue.';
        if (errVal === 'GOOGLE_NOT_CONFIGURED') {
          errMsg = 'Google OAuth is not configured on this server. Please use email/password or configure GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET.';
        } else if (errVal === 'access_denied' || errVal === 'OAUTH_CANCELLED') {
          errMsg = 'Google sign-in was cancelled.';
        } else if (errVal === 'INVALID_OAUTH_STATE') {
          errMsg = 'Invalid sign-in request state. Please try again.';
        } else if (errVal === 'DATABASE_UNAVAILABLE') {
          errMsg = 'Database connection error during Google sign-in. Please try again.';
        } else if (errVal === 'TOKEN_EXCHANGE_FAILED' || errVal === 'USER_INFO_FAILED') {
          errMsg = 'Could not verify Google credentials. Please try again.';
        }
        setAuthNotification({ type: 'error', message: errMsg });
        setAuthModalOpen(true);
        params.delete('authError');
        const cleanQuery = params.toString() ? `?${params.toString()}` : '';
        const newUrl = `${window.location.pathname}${cleanQuery}${window.location.hash}`;
        window.history.replaceState({}, '', newUrl);
      }
    }

    (async () => {
      try {
        await checkSession();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [checkSession]);

  /**
   * Student Signup (Creates account with onboarding_completed = false and requires explicit login)
   */
  const signup = useCallback(async (credentials: SignupCredentials): Promise<{ success: boolean; requiresLogin?: boolean; email?: string; error?: string }> => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data?.error?.message || 'Failed to create student account.';
        return { success: false, error: message };
      }

      if (data?.success) {
        setAuthNotification({
          type: 'success',
          message: data.message || 'Account created successfully! Please sign in with your email and password to begin.'
        });
        setAuthModalMode('signin');
        return { 
          success: true, 
          requiresLogin: true, 
          email: credentials.email.toLowerCase().trim() 
        };
      }

      return { success: false, error: 'Unexpected response during signup.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during signup. Please try again.' };
    }
  }, []);

  /**
   * Complete Student Onboarding
   */
  const completeOnboarding = useCallback(async (details?: any): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    try {
      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(details || {})
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { success: false, error: data?.error?.message || 'Failed to complete onboarding.' };
      }

      if (data?.user) {
        setCurrentUser(data.user);
        return { success: true, user: data.user };
      }

      setCurrentUser(prev => prev ? { ...prev, onboardingCompleted: true, ...details } : null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error completing onboarding.' };
    }
  }, []);

  /**
   * Student Login
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data?.error?.message || 'Invalid email or password.';
        return { success: false, error: message };
      }

      if (data?.user) {
        setCurrentUser(data.user);
        closeAuthModal();
        return { success: true };
      }

      return { success: false, error: 'Unexpected response during login.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during login. Please try again.' };
    }
  }, [closeAuthModal]);

  /**
   * Student Logout
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
    } catch (err) {
      console.warn('Logout API call failed:', err);
    } finally {
      setCurrentUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        authModalOpen,
        authModalMode,
        authNotification,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        clearAuthNotification,
        bypassLoading,
        signup,
        login,
        logout,
        checkSession,
        completeOnboarding
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
