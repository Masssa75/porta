'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type SearchResult = {
  id: string
  name: string
  symbol: string
  thumb: string
  large?: string
  market_cap_rank?: number
  current_price?: number
  price_change_24h?: number
  twitter_handle?: string
  homepage?: string
  description?: string
}

export default function ProjectSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      setResults(data.coins || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddProject = async (coin: SearchResult) => {
    setAdding(coin.id)
    setError(null)

    try {
      console.log('Adding project:', coin)
      
      const { data, error } = await supabase.from('projects').insert({
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        coingecko_id: coin.id,
        twitter_handle: coin.twitter_handle || null,
        alert_threshold: 7, // Default threshold
        wallet_addresses: []
      }).select()

      if (error) {
        console.error('Supabase insert error:', error)
        throw error
      }

      console.log('Project added successfully:', data)
      
      // Remove from results after successful add
      setResults(results.filter(r => r.id !== coin.id))
      
      // Show success feedback
      const addedItem = document.getElementById(`coin-${coin.id}`)
      if (addedItem) {
        addedItem.classList.add('opacity-50')
      }
    } catch (err) {
      console.error('Error adding project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to add project'
      setError(errorMessage)
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Search Projects</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for a cryptocurrency..."
            className="flex-1 px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-red-500 text-sm">{error}</p>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results</h3>
          {results.map((coin) => (
            <div
              key={coin.id}
              id={`coin-${coin.id}`}
              className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <img
                    src={coin.thumb}
                    alt={coin.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h4 className="font-semibold text-lg">
                      {coin.name} <span className="text-gray-400">({coin.symbol.toUpperCase()})</span>
                    </h4>
                    {coin.market_cap_rank && (
                      <p className="text-sm text-gray-400">Rank #{coin.market_cap_rank}</p>
                    )}
                    {coin.current_price !== undefined && (
                      <p className="text-sm">
                        ${coin.current_price.toLocaleString()}
                        {coin.price_change_24h !== undefined && (
                          <span className={coin.price_change_24h >= 0 ? 'text-green-500 ml-2' : 'text-red-500 ml-2'}>
                            {coin.price_change_24h >= 0 ? '+' : ''}{coin.price_change_24h.toFixed(2)}%
                          </span>
                        )}
                      </p>
                    )}
                    {coin.twitter_handle && (
                      <p className="text-sm text-gray-400 mt-1">
                        Twitter: @{coin.twitter_handle}
                      </p>
                    )}
                    {coin.description && (
                      <p className="text-sm text-gray-300 mt-2">{coin.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleAddProject(coin)}
                  disabled={adding === coin.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {adding === coin.id ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}