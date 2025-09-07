import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { X, Upload, Zap, AlertCircle } from 'lucide-react';
import LaunchLabService, { CreateTokenParams } from '../services/launchLabService';

interface CreateTokenModalProps {
  onClose: () => void;
  launchLabService: LaunchLabService;
}

const CreateTokenModal: React.FC<CreateTokenModalProps> = ({ onClose, launchLabService }) => {
  const wallet = useWallet();
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    totalSupply: '1000000000',
    logoFile: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, logoFile: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🎯 Form submitted, starting token creation...');
    
    if (!wallet.connected) return;
    
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    console.log('📊 Form data:', formData);
    console.log('💼 Wallet connected:', wallet.connected);
    console.log('🔑 Wallet public key:', wallet.publicKey?.toBase58());
    
    try {
      const createParams: CreateTokenParams = {
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        totalSupply: 1000000000, // Fixed to 1 billion
        decimals: 6, // Fixed to 6 as per Raydium LaunchLab docs
        logoFile: formData.logoFile || undefined,
      };

      console.log('🚀 Calling launchLabService.createToken...');
      const mintAddress = await launchLabService.createToken(createParams, wallet);
      console.log('✅ Token created successfully, mint address:', mintAddress);
      
      // Create bonding curve with initial SOL
      console.log('📈 Creating bonding curve...');
      await launchLabService.createBondingCurve(
        new PublicKey(mintAddress),
        1, // 1 SOL initial liquidity
        wallet
      );
      console.log('✅ Bonding curve created successfully!');

      setSuccess(`Token created successfully! Mint: ${mintAddress}`);
      
      // Close modal after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
      
    } catch (error) {
      console.error('Token creation failed:', error);
      console.error('❌ Detailed error information:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error
      });
      setError(error instanceof Error ? error.message : 'Token creation failed');
    } finally {
      console.log('🏁 Token creation process finished, setting loading to false');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white border-2 border-black rounded-none w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="border-b-2 border-black p-4 sm:p-6 flex items-center justify-between">
          <h2 className="text-xl sm:text-3xl font-bold text-black">CREATE TOKEN</h2>
          <button
            onClick={onClose}
            className="p-1 sm:p-2 hover:bg-black hover:text-white transition-colors border-2 border-black"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-black text-xs sm:text-sm font-bold mb-2 uppercase tracking-wider">
                Token Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="My Awesome Token"
                required
                className="w-full border-2 border-black px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:bg-black focus:text-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-black text-xs sm:text-sm font-bold mb-2 uppercase tracking-wider">
                Symbol *
              </label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="MAT"
                required
                className="w-full border-2 border-black px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:bg-black focus:text-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-black text-xs sm:text-sm font-bold mb-2 uppercase tracking-wider">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your token..."
              rows={4}
              className="w-full border-2 border-black px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-black placeholder-gray-500 focus:outline-none focus:bg-black focus:text-white transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-black text-xs sm:text-sm font-bold mb-2 uppercase tracking-wider">
              Token Logo
            </label>
            <div className="border-2 border-black border-dashed p-4 sm:p-8 text-center hover:bg-gray-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="logo-upload"
              />
              <label htmlFor="logo-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-black mx-auto mb-2 sm:mb-4" />
                <p className="text-sm sm:text-base text-black font-medium">
                  {formData.logoFile ? formData.logoFile.name : 'Click to upload logo'}
                </p>
                <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-2">PNG, JPG up to 2MB</p>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-500 p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-red-800 font-bold text-sm uppercase tracking-wider mb-1">Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-2 border-green-500 p-4">
              <div className="flex items-start space-x-3">
                <Zap className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-green-800 font-bold text-sm uppercase tracking-wider mb-1">Success</p>
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-100 border-2 border-black p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-black mt-0.5" />
              <div>
                <p className="text-black font-bold text-xs sm:text-sm uppercase tracking-wider mb-1">Important</p>
                <p className="text-black text-xs sm:text-sm">
                  Creating a token requires SOL for transaction fees. Make sure your wallet has sufficient balance.
                </p>
              </div>
            </div>
          </div>

          {wallet.connected ? (
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.symbol}
              className={`w-full py-3 sm:py-4 px-4 sm:px-6 font-bold text-sm sm:text-lg uppercase tracking-wider transition-all duration-200 flex items-center justify-center space-x-2 border-2 border-black ${
                loading || !formData.name || !formData.symbol
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-white hover:text-black'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                  <span>Creating Token...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Create Token</span>
                </>
              )}
            </button>
          ) : (
            <div className="text-center py-3 sm:py-4">
              <p className="text-sm sm:text-base text-black font-medium mb-4 uppercase tracking-wider">Connect wallet to create token</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateTokenModal;