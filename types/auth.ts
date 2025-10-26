// types/auth.ts
export interface AuthResponse {
  user: User;
  refresh: string;
  access: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  verification_status: string | null;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  uid: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

