# API Architecture Design - Porta Backend ↔ Mobile App

## Overview
Instead of direct database access, the mobile app communicates with the porta backend via API endpoints.

## Architecture Diagram
```
┌─────────────────────────┐     ┌─────────────────────────┐
│   Mobile App (Frontend) │     │   Porta App (Backend)   │
│    portalerts.xyz       │     │    portax.netlify.app   │
│                         │     │                         │
│  - User authentication  │     │  - Twitter monitoring   │
│  - Project selection    │ API │  - AI analysis         │
│  - Notification prefs   │ <-> │  - Data aggregation    │
│  - Referral system      │     │  - Notification engine │
│                         │     │                         │
└─────────────────────────┘     └─────────────────────────┘
         │                                 │
         └────────────┬────────────────────┘
                      │
                ┌─────▼─────┐
                │ Supabase  │
                │ Database  │
                └───────────┘
```

## API Endpoints

### From Mobile App → Backend

#### 1. Get Available Projects
```
GET /api/projects/available
Headers: 
  - Authorization: Bearer {user_token}

Response:
{
  "projects": [
    {
      "id": "uuid",
      "name": "Bitcoin",
      "symbol": "BTC",
      "coingecko_id": "bitcoin",
      "twitter_handle": "bitcoin",
      "current_stats": {
        "tweets_last_24h": 45,
        "avg_importance": 7.2,
        "top_tweet": "..."
      }
    }
  ]
}
```

#### 2. Subscribe to Project
```
POST /api/user/projects
Headers:
  - Authorization: Bearer {user_token}
Body:
{
  "project_id": "uuid",
  "notification_threshold": 8
}

Response:
{
  "success": true,
  "subscription": {
    "id": "uuid",
    "project_id": "uuid",
    "custom_threshold": 8
  }
}
```

#### 3. Get User's Subscriptions
```
GET /api/user/projects
Headers:
  - Authorization: Bearer {user_token}

Response:
{
  "subscriptions": [
    {
      "id": "uuid",
      "project": {
        "name": "Bitcoin",
        "symbol": "BTC",
        "latest_tweets": [...],
        "last_alert": "2025-06-16T10:00:00Z"
      },
      "custom_threshold": 8,
      "notifications_sent": 12
    }
  ]
}
```

#### 4. Get Recent Alerts
```
GET /api/user/alerts?limit=20
Headers:
  - Authorization: Bearer {user_token}

Response:
{
  "alerts": [
    {
      "id": "uuid",
      "project_name": "Bitcoin",
      "tweet_text": "...",
      "importance_score": 9,
      "ai_summary": "Major partnership announcement",
      "created_at": "2025-06-16T10:00:00Z"
    }
  ]
}
```

### From Backend → Mobile App (Webhooks)

#### 1. Send Notification
```
POST /webhook/notification
Headers:
  - X-Webhook-Secret: {shared_secret}
Body:
{
  "user_id": "uuid",
  "notification": {
    "type": "important_tweet",
    "project": "Bitcoin",
    "importance": 9,
    "message": "...",
    "tweet_url": "..."
  }
}
```

## Implementation Plan

### Phase 1: Basic API (Current)
- Mobile app directly accesses shared database
- Simple Edge Functions for auth and project management
- Telegram bot handles notifications

### Phase 2: Full API Separation
- Backend exposes REST API
- Mobile app only talks to API
- Backend handles all monitoring logic
- Mobile app becomes pure UI

### Phase 3: Advanced Features
- WebSocket for real-time updates
- GraphQL for efficient data fetching
- Multiple frontend support (iOS, Android)
- Premium API tiers with rate limits

## Security Considerations

### API Authentication
- Mobile app gets JWT token after Telegram auth
- Token includes user_id and tier
- Backend validates token on each request

### Rate Limiting
- Free tier: 100 requests/hour
- Premium tier: 1000 requests/hour
- Tracked in api_access_logs table

### Data Access
- Users can only see their own data
- Projects are read-only from mobile app
- All writes go through validated API endpoints

## Benefits of This Architecture

1. **Separation of Concerns**
   - Backend owns monitoring logic
   - Frontend owns UI/UX
   - Clear API contract between them

2. **Scalability**
   - Backend can optimize batch operations
   - Frontend can be lightweight
   - Easy to add new frontends

3. **Security**
   - API keys never exposed to frontend
   - Rate limiting prevents abuse
   - Clear audit trail

4. **Flexibility**
   - Can change backend implementation
   - Can support multiple frontend types
   - Easy to add new features

## Current Status
- ✅ Database schema supports this architecture
- ✅ Basic API endpoints created (api-auth, api-projects)
- 🔄 Need to implement full API in backend
- 🔄 Need to update mobile app to use API only