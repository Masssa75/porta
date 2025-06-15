'use client'

import { useState } from 'react'

export default function TestEdge() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testEdgeFunction = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('https://midojobnawatvxhmhmoh.supabase.co/functions/v1/nitter-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          projectId: 'test-project',
          projectName: 'Bitcoin',
          symbol: 'BTC',
          twitterHandle: 'bitcoin',
          timeRange: 'day'
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`)
      }

      setResult(data)
    } catch (err) {
      console.error('Test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Edge Function Test</h1>
        
        <button
          onClick={testEdgeFunction}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Edge Function'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-900 text-red-200 rounded-lg">
            <p className="font-bold">Error:</p>
            <pre className="mt-2 text-sm">{error}</pre>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-900 text-green-200 rounded-lg">
            <p className="font-bold">Success!</p>
            <pre className="mt-2 text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-900 rounded-lg">
          <h2 className="font-bold mb-2">Debug Info:</h2>
          <p>Edge Function URL: https://midojobnawatvxhmhmoh.supabase.co/functions/v1/nitter-search</p>
          <p>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}</p>
        </div>
      </div>
    </div>
  )
}