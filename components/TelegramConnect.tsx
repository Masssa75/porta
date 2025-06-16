'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const TELEGRAM_BOT_USERNAME = 'porta_alerts_bot'

export default function TelegramConnect() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionToken, setConnectionToken] = useState('')
  const [telegramData, setTelegramData] = useState<any>(null)

  useEffect(() => {
    // Check if already connected
    checkConnection()
    
    // Check URL params for connection confirmation
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('telegram_connected') === 'true') {
      const token = urlParams.get('token')
      if (token) {
        confirmConnection(token)
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const checkConnection = async () => {
    // Check localStorage for existing connection
    const savedConnection = localStorage.getItem('telegramConnection')
    if (savedConnection) {
      const data = JSON.parse(savedConnection)
      setIsConnected(true)
      setTelegramData(data)
      setConnectionToken(data.token)
      
      // Verify connection is still valid
      const { data: dbConnection } = await supabase
        .from('telegram_connections')
        .select('*')
        .eq('connection_token', data.token)
        .single()
        
      if (!dbConnection || !dbConnection.telegram_chat_id) {
        // Connection invalid, clear it
        disconnect()
      }
    }
  }

  const confirmConnection = async (token: string) => {
    // Check if connection was established
    const { data, error } = await supabase
      .from('telegram_connections')
      .select('*')
      .eq('connection_token', token)
      .single()
      
    if (data && data.telegram_chat_id) {
      // Connection successful
      const connectionData = {
        token,
        telegram_chat_id: data.telegram_chat_id,
        telegram_username: data.telegram_username,
        connected_at: data.connected_at
      }
      localStorage.setItem('telegramConnection', JSON.stringify(connectionData))
      setIsConnected(true)
      setTelegramData(connectionData)
      setConnectionToken(token)
      setIsConnecting(false)
    }
  }

  const connect = async () => {
    setIsConnecting(true)
    
    // Generate unique connection token
    const token = `porta_${Date.now()}_${Math.random().toString(36).substring(7)}`
    setConnectionToken(token)
    
    // Create connection record in database
    const { error } = await supabase
      .from('telegram_connections')
      .insert({
        connection_token: token
      })
      
    if (error) {
      console.error('Error creating connection:', error)
      setIsConnecting(false)
      return
    }
    
    // Open Telegram with deep link
    const deepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}`
    window.open(deepLink, '_blank')
    
    // Poll for connection confirmation (every 2 seconds for 2 minutes)
    const pollInterval = setInterval(async () => {
      await confirmConnection(token)
    }, 2000)
    
    // Stop polling after 2 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      if (!isConnected) {
        setIsConnecting(false)
      }
    }, 120000)
  }

  const disconnect = async () => {
    if (connectionToken) {
      // Remove connection from database
      await supabase
        .from('telegram_connections')
        .delete()
        .eq('connection_token', connectionToken)
    }
    
    localStorage.removeItem('telegramConnection')
    setIsConnected(false)
    setTelegramData(null)
    setConnectionToken('')
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Telegram Notifications</h3>
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.56c-.21 2.27-1.13 7.75-1.6 10.29-.2 1.08-.59 1.44-.97 1.47-.82.07-1.45-.54-2.24-.97-1.24-.78-1.95-1.27-3.16-2.03-1.4-.89-.49-1.38.3-2.18.21-.21 3.85-3.52 3.91-3.82.01-.04.02-.18-.07-.26s-.21-.05-.3-.03c-.13.03-2.19 1.39-6.18 4.08-.58.4-1.11.59-1.59.58-.52-.02-1.53-.3-2.28-.54-.92-.3-1.65-.46-1.59-.97.03-.27.4-.54 1.1-.84 4.31-1.88 7.19-3.12 8.64-3.72 4.11-1.7 4.97-2 5.53-2.01.12 0 .4.03.58.18.15.12.19.28.21.46.02.13 0 .3-.02.46z"/>
          </svg>
        </div>
      </div>
      
      {!isConnected ? (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Connect your Telegram account to receive instant notifications about important crypto news and updates.
          </p>
          
          <button
            onClick={connect}
            disabled={isConnecting}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isConnecting 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Waiting for connection...
              </>
            ) : (
              'Connect Telegram'
            )}
          </button>
          
          {isConnecting && (
            <p className="text-xs text-gray-500 text-center">
              Complete the connection in Telegram, then return here.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">Connected</p>
                {telegramData?.telegram_username && (
                  <p className="text-xs text-green-600">@{telegramData.telegram_username}</p>
                )}
              </div>
            </div>
            <button
              onClick={disconnect}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Disconnect
            </button>
          </div>
          
          <NotificationSettings connectionToken={connectionToken} />
        </div>
      )}
    </div>
  )
}

function NotificationSettings({ connectionToken }: { connectionToken: string }) {
  const [preferences, setPreferences] = useState({
    important_tweets: true,
    ai_analysis: true,
    daily_digest: false,
    threshold: 7
  })
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadPreferences()
  }, [connectionToken])

  const loadPreferences = async () => {
    const { data } = await supabase
      .from('telegram_connections')
      .select('notification_preferences')
      .eq('connection_token', connectionToken)
      .single()
      
    if (data?.notification_preferences) {
      setPreferences(data.notification_preferences)
    }
  }

  const updatePreference = async (key: string, value: any) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    
    // Update in database
    await supabase
      .from('telegram_connections')
      .update({ notification_preferences: newPreferences })
      .eq('connection_token', connectionToken)
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Notification Settings</h4>
      
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={preferences.important_tweets}
          onChange={(e) => updatePreference('important_tweets', e.target.checked)}
          className="rounded border-gray-300"
        />
        <span className="text-sm text-gray-600">Important tweets (score ≥ {preferences.threshold})</span>
      </label>
      
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={preferences.ai_analysis}
          onChange={(e) => updatePreference('ai_analysis', e.target.checked)}
          className="rounded border-gray-300"
        />
        <span className="text-sm text-gray-600">AI analysis summaries</span>
      </label>
      
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={preferences.daily_digest}
          onChange={(e) => updatePreference('daily_digest', e.target.checked)}
          className="rounded border-gray-300"
        />
        <span className="text-sm text-gray-600">Daily digest</span>
      </label>
      
      <div className="pt-2">
        <label className="block text-sm text-gray-600 mb-2">
          Importance threshold: {preferences.threshold}
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={preferences.threshold}
          onChange={(e) => updatePreference('threshold', parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 (Low)</span>
          <span>10 (Critical)</span>
        </div>
      </div>
    </div>
  )
}