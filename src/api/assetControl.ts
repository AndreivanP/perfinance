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
  const results: AssetControl[] = [];
  
  // Define the start date (2016-12-31)
  let currentStart = new Date('2016-12-31T00:00:00');
  const endDate = new Date(); // Current date
  
  while (currentStart < endDate) {
    // Calculate end of current 3-month period
    const periodEnd = new Date(currentStart);
    periodEnd.setMonth(periodEnd.getMonth() + 3);
    
    // Format dates for the API
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0].replace(/-/g, '/');
    };
    
    const since = `${formatDate(currentStart)} 00:00:00`;
    const till = `${formatDate(periodEnd > endDate ? endDate : periodEnd)} 23:59:59`;
    
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
      
      if (response.data && response.data.length > 0) {
        results.push(...response.data);
      }
    } catch (error) {
      console.error(`Error fetching data for period ${since} - ${till}:`, error);
      // Continue with next period even if one fails
    }
    
    // Move to next period
    currentStart = new Date(periodEnd);
    // Add one day to avoid overlapping with the previous period
    currentStart.setDate(currentStart.getDate() + 1);
  }
  
  // Sort results by date
  return results.sort((a, b) => 
    new Date(a.controlDate).getTime() - new Date(b.controlDate).getTime()
  );
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
