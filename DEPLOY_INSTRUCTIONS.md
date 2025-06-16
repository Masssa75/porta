# Deploy Edge Function with AI Analysis

## ⚠️ IMPORTANT: Database Update Required First!

Before deploying the Edge Function, you need to add the new columns:

1. **Go to Supabase SQL Editor:**
   https://app.supabase.com/project/midojobnawatvxhmhmoh/sql/new

2. **Run this migration:**
   Copy and paste from: `supabase/migrations/002_add_ai_analysis_flag.sql`

This adds:
- `is_ai_analyzed` - Boolean flag to track AI vs fallback scoring
- `analysis_metadata` - JSON field with details about the analysis

---

# Deploy Edge Function with AI Analysis

Since you've already added the GEMINI_API_KEY to Supabase, you just need to deploy the updated Edge Function.

## Deployment Steps:

1. **Go to Supabase Dashboard:**
   https://app.supabase.com/project/midojobnawatvxhmhmoh/functions/nitter-search/details

2. **Click "Edit Function"**

3. **Copy ALL the code from:**
   `supabase/functions/nitter-search/index.ts`

4. **Replace the existing code and click "Deploy"**

## What's New in This Version:

✨ **AI-Powered Analysis:**
- Analyzes tweets with Gemini AI
- Batch processing (1 API call for 20 tweets = 95% cost savings!)
- Importance scoring (0-10 scale)
- Automatic categorization

📊 **Importance Scoring:**
- 9-10: Major announcements (exchange listings, big partnerships)
- 7-8: Significant updates (new features, milestones)
- 5-6: Regular updates
- 0-4: Low importance/noise

🏷️ **Categories:**
- partnership
- technical
- listing
- community
- price
- general

🔁 **Duplicate Prevention:**
- Checks for existing tweets before inserting

## Test After Deployment:

```bash
curl -X POST https://midojobnawatvxhmhmoh.supabase.co/functions/v1/nitter-search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZG9qb2JuYXdhdHZ4aG1obW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODkwMTUsImV4cCI6MjA2NTU2NTAxNX0.IkMaej6nrxf6XoMyO51vNDw4kvhcNy0Q6yW_jdxZ578" \
  -d '{"projectId": "11b4da6c-df34-480e-9c19-89e958c0db34", "projectName": "Kaspa", "symbol": "KAS", "twitterHandle": "KaspaCurrency"}'
```

## Expected Response:
```json
{
  "success": true,
  "found": 10,
  "analyzed": 10,
  "stored": 8,
  "high_importance_count": 2,
  "is_ai_analyzed": true,
  "analysis_metadata": {
    "model": "gemini-pro",
    "analyzed_at": "2024-01-16T10:30:00Z",
    "tweet_count": 10,
    "api_calls": 1
  },
  "api_calls_used": 1,
  "cost_per_tweet": "0.1000",
  "tweets": [
    {
      "id": "...",
      "text": "Major partnership announcement...",
      "score": 9,
      "category": "partnership",
      "summary": "Strategic partnership with Fortune 500 company",
      "reasoning": "Major business development milestone",
      "is_ai_analyzed": true
    }
  ]
}
```

## How to Display in Frontend:

```typescript
// In your tweet display component
{tweet.is_ai_analyzed ? (
  <span className="text-green-500">🤖 AI Score: {tweet.score}/10</span>
) : (
  <span className="text-yellow-500">⚠️ Basic Score: {tweet.score}/10 (No AI)</span>
)}
```

## Fallback Scenarios:

1. **No API Key**: `is_ai_analyzed: false`, reason: "no_api_key"
2. **AI Error**: `is_ai_analyzed: false`, reason: "ai_error" 
3. **No Tweets**: `is_ai_analyzed: false`, reason: "no_tweets"

Each tweet will clearly show whether it was AI-analyzed or used fallback scoring!