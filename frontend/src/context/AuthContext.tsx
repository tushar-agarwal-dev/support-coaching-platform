import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { User, UserRole } from '../types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, fullName: string, role: UserRole, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  guestLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (error) {
          console.error("Failed to load user profile:", error);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.access_token);
      setToken(response.access_token);
      
      const userData: User = {
        id: '', // Handled by API getMe, or bootstrap with values
        email: response.email,
        full_name: response.full_name,
        role: response.role,
        created_at: new Date().toISOString()
      };
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, fullName: string, role: UserRole, password: string) => {
    setLoading(true);
    try {
      await authService.register(email, fullName, role, password);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    const isGuest = localStorage.getItem('is_guest') === 'true';
    if (isGuest) {
      authService.guestCleanup().catch(error => {
        console.error("Failed to clean up guest data:", error);
      });
    }
    localStorage.removeItem('token');
    localStorage.removeItem('is_guest');
    setToken(null);
    setUser(null);
  };

  const guestLogin = async () => {
    setLoading(true);
    try {
      const response = await authService.guestLogin();
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('is_guest', 'true');
      setToken(response.access_token);
      
      const userData: User = {
        id: '',
        email: response.email,
        full_name: response.full_name,
        role: response.role,
        created_at: new Date().toISOString()
      };
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated, guestLogin }}>
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
