import axios from 'axios';
import { getAuthToken } from './auth';

const API_URL = 'http://localhost:8080';

export const triggerAssetControl = async (username: string = 'Andreivan'): Promise<void> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  await axios.post(
    `${API_URL}/users/${username}/assets-control`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
};

export interface AssetControl {
  id: string;
  controlDate: string;
  currentTotalValue: number;
  username: string;
}

export interface CurrentTotal {
  current_total: number;
  variable_income_total: number;
  variable_income_percent: number;
}

export const fetchAssetControls = async (username: string): Promise<AssetControl[]> => {
  const API_URL = 'http://localhost:8080';

  const formatDate = (date: Date) => date.toISOString().split('T')[0].replace(/-/g, '/');

  const since = `${formatDate(new Date('2016-12-31T00:00:00'))} 00:00:00`;
  const till = `${formatDate(new Date())} 23:59:59`;

  try {
    const response = await axios.get<AssetControl[]>(
      `${API_URL}/users/${encodeURIComponent(username)}/assets-control`,
      {
        params: { since, till },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    const data = Array.isArray(response.data) ? response.data : [];
    return data.sort(
      (a, b) => new Date(a.controlDate).getTime() - new Date(b.controlDate).getTime()
    );
  } catch (error) {
    console.error('Erro ao buscar dados de controle de ativos:', error);
    return [];
  }
};

export const fetchCurrentTotal = async (username: string): Promise<CurrentTotal> => {
  const API_URL = 'http://localhost:8080';
  
  try {
    const response = await axios.get<CurrentTotal>(
      `${API_URL}/users/${encodeURIComponent(username)}/assets/current-total`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching current total:', error);
    throw error;
  }
};
