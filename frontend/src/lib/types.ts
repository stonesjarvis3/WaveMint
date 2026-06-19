export interface Launch {
  id: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  creator: string;
  totalSupply: number;
  tokensSold: number;
  targetMarketCap: number;
  raisedXlm: number;
  currentPrice: number;
  marketCap: number;
  holders: number;
  change24h: number;
  migrated: boolean;
  createdAt: string;
  contractId: string;
}

export interface Trade {
  id: string;
  launchId: string;
  trader: string;
  type: 'buy' | 'sell';
  xlmAmount: number;
  tokenAmount: number;
  price: number;
  timestamp: string;
}

export interface Stats {
  totalLaunches: number;
  totalVolume: number;
  totalMigrated: number;
  totalHolders: number;
}

export interface BondingCurveState {
  tokensSold: number;
  totalSupply: number;
  currentPrice: number;
  raisedXlm: number;
  targetMarketCap: number;
}
