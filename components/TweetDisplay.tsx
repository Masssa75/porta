'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Tweet = {
  id: string
  tweet_id: string
  tweet_text: string
  author: string
  created_at: string
  importance_score: number
  category: string
  url: string
}

type TweetDisplayProps = {
  projectId: string
  projectName: string
  symbol: string
  twitterHandle?: string
}

export default function TweetDisplay({ projectId, projectName, symbol, twitterHandle }: TweetDisplayProps) {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTweets, setShowTweets] = useState(false)

  const fetchTweets = async () => {
    setLoading(true)
    setError(null)

    try {
      // First, try to get existing tweets from database
      const { data: existingTweets, error: dbError } = await supabase
        .from('tweet_analyses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (dbError) {
        console.error('Database error:', dbError)
      } else if (existingTweets && existingTweets.length > 0) {
        setTweets(existingTweets)
        setShowTweets(true)
        setLoading(false)
        return
      }

      // If no existing tweets, call Edge Function
      console.log('Calling Edge Function for:', projectName)
      console.log('Edge Function URL:', `${supabase.supabaseUrl}/functions/v1/nitter-search`)
      
      try {
        const { data, error: fnError } = await supabase.functions.invoke('nitter-search', {
          body: {
            projectId,
            projectName,
            symbol,
            twitterHandle,
            timeRange: 'day'
          }
        })

        console.log('Edge Function response:', { data, error: fnError })

        if (fnError) {
          console.error('Edge Function error details:', fnError)
          throw fnError
        }
      } catch (invokeError) {
        console.error('Failed to invoke Edge Function:', invokeError)
        throw new Error(`Edge Function error: ${invokeError.message || 'Unknown error'}`)
      }

      if (data?.tweets && data.tweets.length > 0) {
        // Fetch the newly stored tweets from database
        const { data: newTweets } = await supabase
          .from('tweet_analyses')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(20)

        setTweets(newTweets || [])
        setShowTweets(true)
      } else {
        setError('No tweets found for this project')
      }
    } catch (err) {
      console.error('Error fetching tweets:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tweets')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500'
    if (score >= 6) return 'text-yellow-500'
    return 'text-gray-400'
  }

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      partnership: 'bg-purple-900 text-purple-300',
      technical: 'bg-blue-900 text-blue-300',
      listing: 'bg-green-900 text-green-300',
      price: 'bg-yellow-900 text-yellow-300',
      community: 'bg-pink-900 text-pink-300',
      general: 'bg-gray-900 text-gray-300'
    }
    
    return colors[category] || colors.general
  }

  return (
    <div className="mt-4">
      {!showTweets ? (
        <button
          onClick={fetchTweets}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Searching tweets...' : 'Check Latest Tweets'}
        </button>
      ) : (
        <button
          onClick={() => setShowTweets(false)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Hide Tweets
        </button>
      )}

      {error && (
        <p className="mt-2 text-red-500 text-sm">{error}</p>
      )}

      {showTweets && tweets.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="font-semibold text-sm text-gray-400">
            Recent Tweets ({tweets.length})
          </h4>
          {tweets.map((tweet) => (
            <div
              key={tweet.id}
              className="border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-300">{tweet.author}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(tweet.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${getScoreColor(tweet.importance_score)}`}>
                    {tweet.importance_score}/10
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${getCategoryBadge(tweet.category)}`}>
                    {tweet.category}
                  </span>
                </div>
              </div>
              <p className="text-sm text-white mb-2">{tweet.tweet_text}</p>
              {tweet.url && (
                <a
                  href={tweet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  View on Twitter →
                </a>
              )}
            </div>
          ))}
          <button
            onClick={fetchTweets}
            disabled={loading}
            className="w-full px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Refreshing...' : 'Refresh Tweets'}
          </button>
        </div>
      )}
    </div>
  )
}