import axios from "axios";
import { AuthUser, LoginPayload, RegisterPayload, AuthResponse } from "../types/auth";

const AUTH_URL = import.meta.env.VITE_AUTH_API_URL || "http://localhost:5000/api/auth";

const TOKEN_KEY = "wastewise_identifier_token";
const USER_KEY = "wastewise_identifier_user";

export const authService = {
  async login(payload: LoginPayload): Promise<{ user: AuthUser; token: string }> {
    const res = await axios.post<AuthResponse>(`${AUTH_URL}/login`, payload);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Authentication failed");
    }

    const { user, token } = res.data.data;

    // Strict role check: Must be identifier or admin
    if (user.role !== "identifier" && user.role !== "admin") {
      throw new Error("Access Denied: Only certified Waste Identifiers and Admins can access this studio.");
    }

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { user, token };
  },

  async register(payload: RegisterPayload): Promise<{ user: AuthUser; token: string }> {
    const res = await axios.post<AuthResponse>(`${AUTH_URL}/register`, payload);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Registration failed");
    }

    const { user, token } = res.data.data;

    if (user.role !== "identifier" && user.role !== "admin") {
      throw new Error("Invalid role assigned during registration.");
    }

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { user, token };
  },

  async verifySession(): Promise<AuthUser | null> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    try {
      const res = await axios.get<AuthResponse>(`${AUTH_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.data?.user) {
        const user = res.data.data.user;
        if (user.role === "identifier" || user.role === "admin") {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          return user;
        }
      }
      this.logout();
      return null;
    } catch {
      // If server unreachable but local user exists, keep cached user
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    }
  },

  getStoredUser(): AuthUser | null {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};
