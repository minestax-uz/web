import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Define the API URL
const API_URL = 'http://localhost:3000';

// Define the user interface
interface User {
  id: string;
  username: string;
  role: 'admin' | 'moder' | 'user';
}

// Define the auth context interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if the user is authenticated on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          // Decode the token to get user information
          const decoded = jwtDecode<{ id: string; username: string; role: 'admin' | 'moder' | 'user' }>(accessToken);
          setUser({
            id: decoded.id,
            username: decoded.username,
            role: decoded.role,
          });
        } catch (error) {
          console.error('Invalid token:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Create the login function
  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password,
      });

      const { accessToken, refreshToken, role } = response.data.data;
      
      // Store tokens in local storage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Decode the token to get user information
      const decoded = jwtDecode<{ id: string; username: string; role: 'admin' | 'moder' | 'user' }>(accessToken);
      
      setUser({
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
      });
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  // Create the signup function (placeholder for now)
  const signup = async (username: string, password: string) => {
    // This would be implemented if the API supports user registration
    setError('Signup not implemented in this version');
  };

  // Create the logout function
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  // Return the auth context provider
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
