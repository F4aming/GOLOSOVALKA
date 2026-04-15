import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8010/api/v1',
});

type AuthResponse = {
  access_token: string;
  token_type: string;
};

export async function registerUser(email: string, password: string): Promise<string> {
  const response = await api.post<AuthResponse>('/auth/register', { email, password });
  return response.data.access_token;
}

export async function loginUser(email: string, password: string): Promise<string> {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  return response.data.access_token;
}
