import React from 'react';
import { LaunchData } from '../types';
import { X, ExternalLink, Copy, Users, Clock, TrendingUp } from 'lucide-react';
import TradingInterface from './TradingInterface';
import BondingCurveChart from './BondingCurveChart';
import LaunchLabService from '../services/launchLabService';

interface LaunchDetailProps {
  launch: LaunchData;
  onClose: () => void;
  launchLabService: LaunchLabService;
}

const LaunchDetail: React.FC<LaunchDetailProps> = ({ launch, onClose, launchLabService }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Add toast notification here
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b-2 border-black p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src={launch.token.logoURI || 'https://images.pexels.com/photos/8369750/pexels-photo-8369750.jpeg?auto=compress&cs=tinysrgb&w=80'} 
              alt={launch.token.symbol}
              className="w-16 h-16 object-cover border-2 border-black"
            />
            <div>
              <h2 className="text-3xl font-bold text-black uppercase tracking-wider">{launch.token.name}</h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-black font-bold uppercase tracking-wider">${launch.token.symbol}</span>
                <button
                  onClick={() => copyToClipboard(launch.token.mint.toBase58())}
                  className="flex items-center space-x-1 text-gray-600 hover:text-black transition-colors"
                >
                  <span className="text-sm font-mono font-bold">
                    {launch.token.mint.toBase58().slice(0, 8)}...{launch.token.mint.toBase58().slice(-8)}
                  </span>
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-3 bg-gray-100 hover:bg-black hover:text-white transition-colors border-2 border-black"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="space-y-6">
              <div className="bg-white border-2 border-black p-6">
                <h3 className="text-xl font-bold text-black mb-4 uppercase tracking-wider">Token Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm mb-1 uppercase tracking-wide font-medium">Market Cap</p>
                    <p className="text-2xl font-bold text-black">${formatNumber(launch.marketCap)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1 uppercase tracking-wide font-medium">24h Volume</p>
                    <p className="text-2xl font-bold text-black">${formatNumber(launch.volume24h)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1 uppercase tracking-wide font-medium">24h Change</p>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4 text-black" />
                      <span className="text-xl font-bold text-black">
                        {launch.priceChange24h >= 0 ? '+' : ''}{launch.priceChange24h.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1 uppercase tracking-wide font-medium">Total Supply</p>
                    <p className="text-xl font-bold text-black">
                      {formatNumber(launch.token.totalSupply.toNumber() / Math.pow(10, launch.token.decimals))}
                    </p>
                  </div>
                </div>
              </div>

              <TradingInterface launch={launch} raydiumService={raydiumService} />
              <TradingInterface launch={launch} launchLabService={launchLabService} />
            </div>

            <div className="space-y-6">
              <BondingCurveChart bondingCurve={launch.bondingCurve} />
              
              <div className="bg-white border-2 border-black p-6">
                <h3 className="text-xl font-bold text-black mb-4 uppercase tracking-wider">Launch Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium uppercase tracking-wide">Creator</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-black font-mono text-sm font-bold">
                        {launch.creator.toBase58().slice(0, 8)}...{launch.creator.toBase58().slice(-8)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(launch.creator.toBase58())}
                        className="text-gray-600 hover:text-black transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium uppercase tracking-wide">Created</span>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-black font-bold">{launch.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium uppercase tracking-wide">Decimals</span>
                    <span className="text-black font-bold">{launch.token.decimals}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium uppercase tracking-wide">Status</span>
                    <span className={`px-3 py-1 text-sm font-bold uppercase tracking-wider border-2 border-black ${
                      launch.bondingCurve.complete 
                        ? 'bg-black text-white' 
                        : 'bg-white text-black'
                    }`}>
                      {launch.bondingCurve.complete ? 'Graduated' : 'In Progress'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaunchDetail;