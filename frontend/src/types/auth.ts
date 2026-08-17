export type UserRole = 'admin' | 'manager' | 'agent';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  email: string;
  full_name: string;
}
