import { apiRequest } from './queryClient';
import type { User } from '@shared/schema';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  confirmPassword: string;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<{ user: User }> {
    const response = await apiRequest('POST', '/api/login', credentials);
    return response.json();
  },

  async register(credentials: Omit<RegisterCredentials, 'confirmPassword'>): Promise<{ user: User }> {
    const response = await apiRequest('POST', '/api/register', credentials);
    return response.json();
  },

  async createAnonymousSession(): Promise<{ user: User }> {
    const response = await apiRequest('POST', '/api/anonymous', {});
    return response.json();
  },

  async convertAnonymousAccount(userId: number, credentials: LoginCredentials): Promise<{ user: User }> {
    const response = await apiRequest('POST', '/api/convert-anonymous', {
      userId,
      ...credentials,
    });
    return response.json();
  },

  async updateProfile(userId: number, updates: { username?: string; avatar?: string }): Promise<{ user: User }> {
    const response = await apiRequest('PUT', `/api/user/${userId}`, updates);
    return response.json();
  },
};
