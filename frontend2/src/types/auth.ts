export type UserRole = "identifier" | "admin";

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  society?: string;
  zone?: string;
  badgeNumber?: string;
  facilityZone?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  profile?: UserProfile;
  rewardPoints?: number;
  level?: number;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: AuthUser;
    token: string;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  authCode: string;
  profile?: UserProfile;
}
