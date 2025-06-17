# Secure API Layer Design - App A (Backend)

## **API Architecture Overview**

### **Current System** → **Secure Backend APIs**
Transform `portax.netlify.app` into API-only backend that serves the mobile app

## **Core API Endpoints**

### **1. Authentication & User Management**
```
POST /api/auth/register
POST /api/auth/login  
POST /api/auth/telegram-verify
GET  /api/auth/profile
PUT  /api/auth/profile
```

### **2. Project Management**
```
GET    /api/projects              # List user's projects
POST   /api/projects              # Add new project
PUT    /api/projects/:id          # Update project settings
DELETE /api/projects/:id          # Remove project
GET    /api/projects/search?q=    # Search available coins
```

### **3. Alerts & Notifications**
```
GET  /api/alerts                 # Recent alerts for user
GET  /api/alerts/:project_id     # Alerts for specific project
POST /api/alerts/preferences     # Update notification settings
GET  /api/alerts/stats           # Alert statistics
```

### **4. Referral System**
```
GET  /api/referrals              # User's referral status
POST /api/referrals/create       # Create referral link
GET  /api/referrals/:code        # Validate referral code
POST /api/referrals/complete     # Complete referral process
```

### **5. Token & Premium Features**
```
POST /api/premium/verify-payment    # Verify token payment
GET  /api/premium/features          # Available premium features
POST /api/premium/unlock-feature    # Unlock specific feature
GET  /api/premium/wallet-balance    # Check user's token balance
```

## **API Security Model**

### **Authentication Methods**
1. **JWT Tokens** - Short-lived (15min) access tokens
2. **Refresh Tokens** - Long-lived (30 days) for token renewal
3. **API Keys** - For mobile app authentication with backend

### **Request Flow**
```
Mobile App → API Gateway → Authentication → Rate Limiting → Business Logic → Database
```

### **Rate Limiting Strategy**
- **Free Users**: 60 requests/hour
- **Free Forever**: 200 requests/hour  
- **Lifetime Premium**: 1000 requests/hour
- **Burst Protection**: Max 10 requests/minute

### **API Key Management**
```javascript
// Mobile app includes API key in headers
headers: {
  'Authorization': 'Bearer jwt_token_here',
  'X-API-Key': 'mobile_app_api_key',
  'Content-Type': 'application/json'
}
```

## **Database Schema Updates**

### **API Access Control**
```sql
-- Add API access tracking to users table
ALTER TABLE users ADD COLUMN api_requests_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN api_last_request_at TIMESTAMP;
ALTER TABLE users ADD COLUMN api_rate_limit_reset TIMESTAMP;

-- Create API logs table
CREATE TABLE api_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## **Edge Function Updates**

### **Convert Current Functions to API Endpoints**
1. **Nitter Search** → `/api/internal/fetch-tweets` (internal only)
2. **Telegram Notifications** → `/api/internal/send-notifications` (internal only)
3. **AI Analysis** → `/api/internal/analyze-tweets` (internal only)

### **New Public API Functions**
```javascript
// supabase/functions/api-gateway/index.ts
export default async function handler(req: Request) {
  const { method, url } = req;
  const route = new URL(url).pathname;
  
  // Authentication middleware
  const user = await authenticateRequest(req);
  if (!user) return new Response('Unauthorized', { status: 401 });
  
  // Rate limiting middleware
  const rateLimitOk = await checkRateLimit(user.id);
  if (!rateLimitOk) return new Response('Rate Limited', { status: 429 });
  
  // Route to appropriate handler
  switch (route) {
    case '/api/projects':
      return handleProjects(req, user);
    case '/api/alerts':
      return handleAlerts(req, user);
    // ... other routes
  }
}
```

## **Mobile App Integration**

### **API Client Setup**
```javascript
// Mobile app API client
class PortaAPI {
  constructor() {
    this.baseURL = 'https://portax.netlify.app';
    this.apiKey = 'mobile_app_key_here';
  }
  
  async getProjects(token) {
    return fetch(`${this.baseURL}/api/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': this.apiKey
      }
    });
  }
}
```

### **Deployment Strategy**
1. **Phase 1**: Add API endpoints to existing backend
2. **Phase 2**: Build mobile app consuming APIs
3. **Phase 3**: Remove public UI from backend
4. **Phase 4**: Lock down backend to API-only access

Ready to start implementing the API layer?