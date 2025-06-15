import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Project = {
  id: string
  name: string
  symbol: string
  coingecko_id: string
  twitter_handle?: string
  wallet_addresses?: string[]
  alert_threshold: number
  created_at: string
  updated_at: string
}

export type TweetAnalysis = {
  id: string
  project_id: string
  tweet_id: string
  tweet_text: string
  author: string
  created_at: string
  importance_score: number
  category: string
  summary: string
  url: string
}

export type Notification = {
  id: string
  project_id: string
  tweet_analysis_id: string
  sent_at: string
  notification_type: string
  recipient: string
  status: string
}