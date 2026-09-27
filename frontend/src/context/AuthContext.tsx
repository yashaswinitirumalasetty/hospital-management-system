import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string }> = {
  ADMIN: { email: 'admin@hospital.com', pass: 'admin123' },
  OWNER: { email: 'owner@hospital.com', pass: 'owner123' },
  RECEPTION: { email: 'reception@hospital.com', pass: 'reception123' },
  DOCTOR: { email: 'dr.kumar@hospital.com', pass: 'doctor123' },
  NURSE: { email: 'nurse.sunita@hospital.com', pass: 'nurse123' },
  PHARMACY: { email: 'pharmacy@hospital.com', pass: 'pharmacy123' },
  PATIENT: { email: 'ravi.kumar@gmail.com', pass: 'patient123' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hospital_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (!localStorage.getItem('hospital_token')) {
        setIsLoading(false);
        return;
      }
      const data = await apiClient<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch (err) {
      console.warn('Session expired or invalid, clearing token.');
      localStorage.removeItem('hospital_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiClient<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('hospital_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('hospital_token');
    setToken(null);
    setUser(null);
  };

  const switchRole = async (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
