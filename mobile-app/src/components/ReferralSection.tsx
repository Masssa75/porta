'use client';

import { Users, Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ReferralSectionProps {
  referralCount: number;
  referralGoal: number;
  referralCode?: string;
}

export default function ReferralSection({ referralCount, referralGoal, referralCode = 'PORTA2024' }: ReferralSectionProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://portalerts.xyz?ref=${referralCode}`;
  
  const progress = (referralCount / referralGoal) * 100;

  const shareOnTelegram = () => {
    const message = encodeURIComponent(
      `🚀 Get instant crypto alerts with PortAlerts!\n\n` +
      `✅ Track your favorite coins\n` +
      `🔔 AI-powered importance scoring\n` +
      `💎 Free forever with 5 referrals\n\n` +
      `Join now: ${referralLink}`
    );
    window.open(`https://t.me/share/url?url=${referralLink}&text=${message}`, '_blank');
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Invite Friends</h3>
        <Users className="w-5 h-5 text-purple-600" />
      </div>
      
      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className="font-medium">{referralCount}/{referralGoal}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {referralGoal - referralCount} more referrals for free forever access!
        </p>
      </div>

      {/* Share Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={shareOnTelegram}
          className="flex items-center justify-center space-x-2 bg-blue-500 text-white rounded-lg py-2.5 hover:bg-blue-600 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-medium">Share</span>
        </button>
        <button
          onClick={copyLink}
          className="flex items-center justify-center space-x-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg py-2.5 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="text-sm font-medium">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Referral Code */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-600 dark:text-gray-400">Your referral code</p>
        <p className="font-mono font-bold text-purple-600 dark:text-purple-400">{referralCode}</p>
      </div>
    </div>
  );
}