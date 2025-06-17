'use client';

import { useState, useEffect } from 'react';
import { Search, X, TrendingUp, Users } from 'lucide-react';
import axios from 'axios';

interface CryptoSearchProps {
  onClose: () => void;
  onSelect: (project: any) => void;
}

export default function CryptoSearch({ onClose, onSelect }: CryptoSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [popular, setPopular] = useState<any[]>([]);

  // Load popular coins on mount
  useEffect(() => {
    loadPopularCoins();
  }, []);

  // Search as user types
  useEffect(() => {
    if (searchTerm.length > 1) {
      searchCoins();
    } else {
      setResults([]);
    }
  }, [searchTerm]);

  const loadPopularCoins = async () => {
    try {
      // Using CoinGecko API for popular coins
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 10,
            page: 1,
            sparkline: false
          }
        }
      );
      setPopular(response.data);
    } catch (error) {
      console.error('Failed to load popular coins:', error);
    }
  };

  const searchCoins = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/search?query=${searchTerm}`
      );
      setResults(response.data.coins.slice(0, 10));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (coin: any) => {
    onSelect({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      image: coin.thumb || coin.image,
      marketCap: coin.market_cap
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center p-4">
          <button onClick={onClose} className="mr-3">
            <X className="w-6 h-6" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search coins..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              autoFocus
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="overflow-y-auto pb-20">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
          </div>
        )}

        {/* Search Results */}
        {results.length > 0 && (
          <div className="px-4 py-2">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Search Results
            </h3>
            {results.map((coin) => (
              <button
                key={coin.id}
                onClick={() => handleSelect(coin)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={coin.thumb || coin.image}
                    alt={coin.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="text-left">
                    <p className="font-medium">{coin.name}</p>
                    <p className="text-sm text-gray-500 uppercase">{coin.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-secondary">+ Follow</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Popular Coins */}
        {searchTerm === '' && popular.length > 0 && (
          <div className="px-4 py-2">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              Trending Coins
            </h3>
            {popular.map((coin) => (
              <button
                key={coin.id}
                onClick={() => handleSelect(coin)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={coin.image}
                    alt={coin.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="text-left">
                    <p className="font-medium">{coin.name}</p>
                    <p className="text-sm text-gray-500 uppercase">{coin.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${coin.current_price.toLocaleString()}</p>
                  <p className={`text-xs ${coin.price_change_percentage_24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {coin.price_change_percentage_24h > 0 ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}