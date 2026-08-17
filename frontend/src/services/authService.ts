import api from './api';
import { AuthResponse, User, UserRole } from '../types/auth';

export const authService = {
  async register(email: string, full_name: string, role: UserRole, password: string): Promise<User> {
    const response = await api.post<User>('/api/auth/register', {
      email,
      full_name,
      role,
      password,
    });
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    // Form-data request for OAuth2PasswordRequestForm
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const response = await api.post<AuthResponse>('/api/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>('/api/users/me');
    return response.data;
  },

  async guestLogin(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/guest-login');
    return response.data;
  },

  async guestCleanup(): Promise<void> {
    await api.post('/api/auth/guest-cleanup');
  },
};
