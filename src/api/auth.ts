import axios from 'axios';
import { buildApiUrl } from '../config/api';

export interface AuthResponse {
  token: string;
}

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(buildApiUrl('/authenticate'), {
    username,
    password,
  });
  return response.data;
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const logout = (): void => {
  setAuthToken(null);
};
