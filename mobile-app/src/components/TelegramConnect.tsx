'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Check, LogOut } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { authAPI } from '@/lib/api';

interface TelegramConnectProps {
  isConnected: boolean;
  onConnect: (connected: boolean) => void;
}

export default function TelegramConnect({ isConnected, onConnect }: TelegramConnectProps) {
  const { user, login, logout } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [connectionToken, setConnectionToken] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    
    // Generate connection token
    const token = Math.random().toString(36).substring(2, 15);
    setConnectionToken(token);
    
    // Store token for polling
    sessionStorage.setItem('telegram_connection_token', token);
    
    // Open Telegram bot with deep link
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT || 'porta_alerts_bot';
    const telegramUrl = `https://t.me/${botUsername}?start=${token}`;
    
    window.open(telegramUrl, '_blank');
    
    // Start polling for connection
    pollForConnection(token);
  };

  const pollForConnection = async (token: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout
    
    const interval = setInterval(async () => {
      try {
        // Poll the database to check if the connection was made
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api-auth/check-connection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          },
          body: JSON.stringify({ token })
        });
        
        const data = await response.json();
        
        if (data.connected && data.user) {
          clearInterval(interval);
          
          // Login with the actual user data from Telegram
          await login(data.user.telegram_chat_id, data.user.telegram_username || 'User');
          
          setLoading(false);
          onConnect(true);
          sessionStorage.removeItem('telegram_connection_token');
        }
      } catch (error) {
        // Token not yet used, continue polling
        console.log('Polling for connection...', error);
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setLoading(false);
        alert('Connection timeout. Please try again.');
        sessionStorage.removeItem('telegram_connection_token');
      }
    }, 1000);
  };

  // Check for existing connection on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem('telegram_connection_token');
    if (savedToken && !isConnected) {
      pollForConnection(savedToken);
    }
  }, []);

  if (isConnected && user) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500 rounded-full p-2">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-green-900 dark:text-green-100">
                Telegram Connected
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                @{user.telegram_username || 'porta_alerts_bot'} • Tier: {user.tier}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm('Disconnect Telegram account?')) {
                logout();
                onConnect(false);
              }
            }}
            className="p-2 hover:bg-green-200 dark:hover:bg-green-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="w-full bg-secondary text-white rounded-lg py-3 px-4 font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>Waiting for connection...</span>
        </>
      ) : (
        <>
          <MessageCircle className="w-5 h-5" />
          <span>Connect @porta_alerts_bot</span>
        </>
      )}
    </button>
  );
}