import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, login as loginApi, register as registerApi, getCurrentUser } from '@/api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role: 'admin' | 'citizen' | 'collector') => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'citizen' | 'collector';
    profile?: any;
  }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Validate token on refresh
  useEffect(() => {
    const validateToken = async () => {
      const savedToken = localStorage.getItem('wastewise_token');
      const savedUser = localStorage.getItem('wastewise_user');

      if (savedToken && savedUser) {
        try {
          let parsedUser: User;

          try {
            parsedUser = JSON.parse(savedUser);
          } catch {
            throw new Error("Invalid stored user");
          }

          // ✅ Load from cache first
          setToken(savedToken);
          setUser(parsedUser);

          // ✅ Validate with backend
          const currentUser = await getCurrentUser(savedToken);

          if (currentUser?.id === parsedUser.id) {
            setUser(currentUser);
            localStorage.setItem('wastewise_user', JSON.stringify(currentUser));
          } else {
            throw new Error("User mismatch");
          }

        } catch (error) {
          console.error('Token validation failed:', error);

          setUser(null);
          setToken(null);
          localStorage.removeItem('wastewise_token');
          localStorage.removeItem('wastewise_user');
        }
      }

      setIsLoading(false);
    };

    validateToken();
  }, []);

  const login = async (email: string, password: string, role: 'admin' | 'citizen' | 'collector') => {
    try {
      setIsLoading(true);
      const response = await loginApi({ email, password, role });

      if (response.success) {
        setUser(response.data.user);
        setToken(response.data.token);
        localStorage.setItem('wastewise_token', response.data.token);
        localStorage.setItem('wastewise_user', JSON.stringify(response.data.user));
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'citizen' | 'collector';
    profile?: any;
  }) => {
    try {
      setIsLoading(true);
      const response = await registerApi(userData);

      if (response.success) {
        setUser(response.data.user);
        setToken(response.data.token);
        localStorage.setItem('wastewise_token', response.data.token);
        localStorage.setItem('wastewise_user', JSON.stringify(response.data.user));
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('wastewise_token');
    localStorage.removeItem('wastewise_user');
  };

  // ✅ Prevent flicker
  const isAuthenticated = !!user && !!token && !isLoading;

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};