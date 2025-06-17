'use client';

import { Sparkles, Wallet, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function PremiumSection() {
  const [connecting, setConnecting] = useState(false);
  
  const TOKEN_ADDRESS = '0x4d1088F67AF81aDc9f0EAeb1CB2fD2b7d89aa20D';
  const PAYMENT_WALLET = '0x64e7226Ccfac543f0093f1F532Fd231197818194';
  const REQUIRED_AMOUNT = '1000000'; // 1M tokens

  const connectWallet = async () => {
    setConnecting(true);
    
    // In real implementation, this would use wagmi/rainbowkit
    // For now, just simulate connection
    setTimeout(() => {
      setConnecting(false);
      alert('Wallet connection would happen here with wagmi/rainbowkit');
    }, 1500);
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Lifetime Premium</h3>
        <Sparkles className="w-5 h-5 text-yellow-600" />
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Get lifetime access to all current and future premium features!
      </p>

      {/* Features List */}
      <ul className="space-y-2 mb-4">
        {[
          'Telegram group monitoring',
          'News aggregation',
          'Price shock alerts',
          'Whale movement tracking',
          'All future features'
        ].map((feature) => (
          <li key={feature} className="flex items-center text-sm">
            <span className="text-green-500 mr-2">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      {/* Token Info */}
      <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Required amount</p>
        <p className="font-mono font-bold text-lg">1,000,000 tokens</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          on Base network
        </p>
      </div>

      {/* Connect Wallet Button */}
      <button
        onClick={connectWallet}
        disabled={connecting}
        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg py-3 font-medium hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
      >
        {connecting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="w-5 h-5" />
            <span>Connect Wallet</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Contract Address */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Token: {TOKEN_ADDRESS.slice(0, 6)}...{TOKEN_ADDRESS.slice(-4)}
        </p>
      </div>
    </div>
  );
}