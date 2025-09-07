import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface TokenInfo {
  mint: PublicKey;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  totalSupply: BN;
}

export interface BondingCurveData {
  virtualTokenReserves: BN;
  virtualSolReserves: BN;
  realTokenReserves: BN;
  realSolReserves: BN;
  tokenTotalSupply: BN;
  complete: boolean;
}

export interface LaunchData {
  id: string;
  token: TokenInfo;
  bondingCurve: BondingCurveData;
  creator: PublicKey;
  createdAt: Date;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
}

export interface TradeData {
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: Date;
  user: string;
  txHash: string;
}

export interface ChartDataPoint {
  timestamp: number;
  price: number;
  volume: number;
  marketCap: number;
}