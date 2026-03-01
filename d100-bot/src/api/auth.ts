import { apiRequest } from './client.ts';

interface AuthResponse {
  token: string;
  user: { id: string; username: string };
}

export async function register(
  username: string,
  password: string,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('POST', '/api/v1/auth/register', {
    username,
    password,
  });
}

export async function login(
  username: string,
  password: string,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('POST', '/api/v1/auth/login', {
    username,
    password,
  });
}
