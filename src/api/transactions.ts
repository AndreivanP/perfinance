import axios from 'axios';
import { getAuthToken } from './auth';
import { buildApiUrl } from '../config/api';
import type { Asset } from './assets';

export type TransactionType = 'TOP_UP' | 'WITHDRAW';

export interface AssetTransaction {
  id: string;
  assetId: string;
  username: string;
  amount: number;
  transactionDate: string;
  type: TransactionType;
  category: Asset['category'];
}

export const fetchTransactions = async (
  username: string,
  month: number,
  year: number
): Promise<AssetTransaction[]> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await axios.get(
    buildApiUrl(
      `/users/${encodeURIComponent(username)}/transactions?month=${month}&year=${year}`
    ),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};
