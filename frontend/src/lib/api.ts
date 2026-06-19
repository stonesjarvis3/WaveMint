import axios from 'axios';
import type { Launch, Stats } from './types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
});

export const getLaunches = async (filter?: string, search?: string): Promise<Launch[]> => {
  const { data } = await api.get('/launches', { params: { filter, search } });
  return data;
};

export const getLaunch = async (id: string): Promise<Launch> => {
  const { data } = await api.get(`/launches/${id}`);
  return data;
};

export const getTrending = async (): Promise<Launch[]> => {
  const { data } = await api.get('/launches/trending');
  return data;
};

export const getStats = async (): Promise<Stats> => {
  const { data } = await api.get('/stats');
  return data;
};

export const createLaunch = async (payload: {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  totalSupply: number;
  targetMarketCap: number;
  txHash: string;
}): Promise<{ id: string }> => {
  const { data } = await api.post('/launches', payload);
  return data;
};

export const getTrades = async (launchId: string) => {
  const { data } = await api.get(`/launches/${launchId}/trades`);
  return data;
};

export const getQuote = async (launchId: string, type: 'buy' | 'sell', amount: number) => {
  const { data } = await api.get(`/launches/${launchId}/quote`, { params: { type, amount } });
  return data as { output: number; price: number };
};
