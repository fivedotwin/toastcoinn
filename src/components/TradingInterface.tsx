import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { LaunchData } from '../types';
import LaunchLabService, { TradeParams } from '../services/launchLabService';
import { Connection } from '@solana/web3.js';
import { ArrowUpDown, Zap, Shield, TrendingUp } from 'lucide-react';

interface TradingInterfaceProps {
  launch: LaunchData;
  launchLabService: LaunchLabService;
}

const TradingInterface: React.FC<TradingInterfaceProps> = ({ launch, launchLabService }) => {
  const wallet = useWallet();
  const [isBuying, setIsBuying] = useState(true);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(3);
  const [loading, setLoading] = useState(false);
  const [estimatedOutput, setEstimatedOutput] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      const amountNum = parseFloat(amount);
      if (isBuying) {
        const tokens = launchLabService.calculateBuyPrice(launch.bondingCurve, amountNum);
        setEstimatedOutput(tokens);
      } else {
        const sol = launchLabService.calculateSellPrice(launch.bondingCurve, amountNum);
        setEstimatedOutput(sol);
      }
    } else {
      setEstimatedOutput(0);
    }
  }, [amount, isBuying, launch.bondingCurve, launchLabService]);

  const handleTrade = async () => {
    if (!wallet.connected || !amount) return;
    
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      const amountNum = parseFloat(amount);
      const tradeParams: TradeParams = {
        mint: launch.token.mint,
        amount: amountNum,
        isBuy: isBuying,
        slippage: slippage,
      };

      if (isBuying) {
        const txId = await launchLabService.buyTokens(tradeParams, wallet);
        setSuccess(`Buy successful! Transaction: ${txId.slice(0, 8)}...`);
      } else {
        const txId = await launchLabService.sellTokens(tradeParams, wallet);
        setSuccess(`Sell successful! Transaction: ${txId.slice(0, 8)}...`);
      }
      setAmount('');
    } catch (error) {
      console.error('Trade failed:', error);
      setError(error instanceof Error ? error.message : 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  const currentPrice = launchLabService.getCurrentPrice(launch.bondingCurve);

  return (
    <div className="bg-white border-2 border-black p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-black uppercase tracking-wider">Trade {launch.token.symbol}</h3>
        <div className="flex items-center space-x-2 bg-gray-100 border border-black px-3 py-2">
          <TrendingUp className="w-4 h-4 text-black" />
          <span className="text-black font-bold">${currentPrice.toFixed(8)}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setIsBuying(true)}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              isBuying
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setIsBuying(false)}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              !isBuying
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Sell
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-black text-sm font-bold mb-2 uppercase tracking-wider">
              {isBuying ? 'SOL Amount' : `${launch.token.symbol} Amount`}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full bg-white border-2 border-black px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:bg-black focus:text-white transition-colors"
            />
          </div>

          <div className="flex items-center justify-center">
            <ArrowUpDown className="w-6 h-6 text-gray-600" />
          </div>

          <div>
            <label className="block text-black text-sm font-bold mb-2 uppercase tracking-wider">
              Estimated {isBuying ? launch.token.symbol : 'SOL'}
            </label>
            <div className="w-full bg-gray-100 border-2 border-black px-4 py-3 text-black font-bold">
              {estimatedOutput.toFixed(6)}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-500 p-3 mb-4">
            <p className="text-red-800 text-sm font-bold">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-500 p-3 mb-4">
            <p className="text-green-800 text-sm font-bold">{success}</p>
          </div>
        )}

        <div className="bg-gray-50 border-2 border-black p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-black text-sm font-bold uppercase tracking-wider">Slippage Tolerance</span>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-black" />
              <span className="text-black text-sm font-bold">{slippage}%</span>
            </div>
          </div>
          <div className="flex space-x-2">
            {[1, 3, 5].map((value) => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={`px-3 py-1 text-sm font-bold uppercase tracking-wider transition-all duration-200 border border-black ${
                  slippage === value
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {value}%
              </button>
            ))}
            <input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
              className="px-2 py-1 bg-white border border-black text-sm text-black w-16 focus:outline-none focus:bg-black focus:text-white transition-colors"
            />
          </div>
        </div>

        {wallet.connected ? (
          <button
            onClick={handleTrade}
            disabled={loading || !amount}
            className={`w-full py-4 px-6 font-bold text-lg uppercase tracking-wider transition-all duration-200 flex items-center justify-center space-x-2 border-2 border-black ${
              loading || !amount
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : isBuying
                ? 'bg-black text-white hover:bg-white hover:text-black hover:scale-105'
                : 'bg-black text-white hover:bg-white hover:text-black hover:scale-105'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>{isBuying ? 'Buy' : 'Sell'} {launch.token.symbol}</span>
              </>
            )}
          </button>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4 font-medium uppercase tracking-wider">Connect your wallet to start trading</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingInterface;