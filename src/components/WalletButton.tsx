import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet, Check } from 'lucide-react';

const WalletButton: React.FC = () => {
  const { connected, publicKey } = useWallet();

  return (
    <div className="relative group">
      <div className="wallet-button-wrapper">
        <WalletMultiButton 
          className="!bg-black !border-2 !border-black !px-3 sm:!px-4 !py-2 sm:!py-3 !text-white !font-bold !text-xs sm:!text-sm !uppercase !tracking-wider !transition-all !duration-300 hover:!bg-white hover:!text-black !rounded-none !min-w-[80px] sm:!min-w-[120px] !h-[40px] sm:!h-[48px] !flex !items-center !justify-center hover:!scale-105 hover:!shadow-lg !relative !overflow-hidden"
        />
      </div>
      {connected && (
        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-black border-2 border-white flex items-center justify-center animate-pulse">
          <Check className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
        </div>
      )}
      <style jsx>{`
        .wallet-button-wrapper .wallet-adapter-button {
          background-color: black !important;
          border: 2px solid black !important;
          color: white !important;
          font-weight: bold !important;
          font-size: 0.875rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          border-radius: 0 !important;
          min-width: 100px !important;
          height: 48px !important;
          padding: 0 16px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.3s !important;
          position: relative !important;
          overflow: hidden !important;
        }
        .wallet-button-wrapper .wallet-adapter-button::before {
          content: "" !important;
          position: absolute !important;
          top: 0 !important;
          left: -100% !important;
          width: 100% !important;
          height: 100% !important;
          background: white !important;
          transition: left 0.3s !important;
          z-index: 0 !important;
        }
        .wallet-button-wrapper .wallet-adapter-button:hover {
          background-color: white !important;
          color: black !important;
          transform: scale(1.05) !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        }
        .wallet-button-wrapper .wallet-adapter-button:hover::before {
          left: 0 !important;
        }
        .wallet-button-wrapper .wallet-adapter-button:disabled {
          background-color: #666 !important;
          border-color: #666 !important;
          color: #ccc !important;
        }
        .wallet-button-wrapper .wallet-adapter-dropdown {
          background-color: white !important;
          border: 2px solid black !important;
          border-radius: 0 !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1) !important;
        }
        .wallet-button-wrapper .wallet-adapter-dropdown-list {
          background-color: white !important;
          border: 2px solid black !important;
          border-radius: 0 !important;
        }
        .wallet-button-wrapper .wallet-adapter-dropdown-list-item {
          background-color: white !important;
          color: black !important;
          font-weight: bold !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          transition: all 0.2s !important;
        }
        .wallet-button-wrapper .wallet-adapter-dropdown-list-item:hover {
          background-color: black !important;
          color: white !important;
        }
        @media (min-width: 640px) {
          .wallet-button-wrapper .wallet-adapter-button {
            font-size: 0.875rem !important;
            letter-spacing: 0.15em !important;
            min-width: 120px !important;
            height: 48px !important;
            padding: 0 20px !important;
          }
          .wallet-button-wrapper .wallet-adapter-button:hover {
            transform: scale(1.1) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default WalletButton;