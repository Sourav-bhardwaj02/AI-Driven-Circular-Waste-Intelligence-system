const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'citizen' | 'collector';
  profile: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
  };
  rewardPoints: number;
  level: number;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: 'admin' | 'citizen' | 'collector';
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'citizen' | 'collector';
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
  };
}

// Login API
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Register API
export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async (token: string): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user data');
    }

    const result = await response.json();
    return result.data.user;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};
