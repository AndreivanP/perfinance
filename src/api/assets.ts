import axios from 'axios';
import { getAuthToken } from './auth';

const API_URL = 'http://localhost:8080';

export interface Asset {
  id: string;
  name: string;
  date: string;
  initial_value: number;
  company: string;
  interest_rate: number;
  is_active: boolean;
  username: string;
  current_value: number;
  is_variable_income: boolean;
  expiryDate: string | null;
}

export const fetchAssets = async (username: string = 'Andreivan'): Promise<Asset[]> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await axios.get(`${API_URL}/users/${username}/assets`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};

export const deleteAsset = async (id: string, username: string = 'Andreivan'): Promise<void> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  await axios.delete(`${API_URL}/users/${username}/assets/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};

export const createAsset = async (assetData: Partial<Asset>, username: string = 'Andreivan'): Promise<Asset> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await axios.post(`${API_URL}/users/${username}/assets`, assetData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};

export const updateAsset = async (id: string, assetData: Partial<Asset>, username: string = 'Andreivan'): Promise<Asset> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await axios.put(`${API_URL}/users/${username}/assets/${id}`, assetData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};
