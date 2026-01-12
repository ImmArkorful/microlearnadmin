import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

interface AdminUser {
  id: number;
  email: string;
  role: 'admin';
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider = ({ children }: AdminAuthProviderProps) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data
    const storedToken = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('adminUser');

    if (storedToken && storedAdmin) {
      try {
        const adminData = JSON.parse(storedAdmin);
        // Verify token is still valid by checking role
        verifyAdminToken(storedToken, adminData);
      } catch (error) {
        console.error('Error parsing stored admin data:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyAdminToken = async (tokenToVerify: string, adminData: AdminUser) => {
    try {
      // Make a test request to verify token and admin role
      await axios.get(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${tokenToVerify}`,
        },
      });

      // If successful, user is admin
      setToken(tokenToVerify);
      setAdmin(adminData);
      setIsLoading(false);
    } catch (error) {
      // Token invalid or user not admin
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setToken(null);
      setAdmin(null);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token: authToken, user } = response.data;

      // Verify user has admin role
      if (user.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Store auth data
      localStorage.setItem('adminToken', authToken);
      localStorage.setItem('adminUser', JSON.stringify(user));

      setToken(authToken);
      setAdmin(user);
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        login,
        logout,
        isLoading,
        isAuthenticated: !!token && !!admin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};
