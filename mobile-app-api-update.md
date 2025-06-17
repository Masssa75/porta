# Mobile App API Configuration Update

## ✅ API Endpoints Deployed:
- **Auth API**: `https://midojobnawatvxhmhmoh.supabase.co/functions/v1/api-auth`
- **Projects API**: `https://midojobnawatvxhmhmoh.supabase.co/functions/v1/api-projects`

## Update Mobile App Environment:

In your mobile app's `.env.local` or Netlify environment variables, update:

```env
NEXT_PUBLIC_API_URL=https://midojobnawatvxhmhmoh.supabase.co/functions/v1
NEXT_PUBLIC_API_KEY=mobile_app_key_here
NEXT_PUBLIC_TELEGRAM_BOT=porta_alerts_bot
```

## API Endpoints Available:

### Auth Endpoints:
- `POST /api-auth/register` - Register new user with Telegram
- `POST /api-auth/telegram-verify` - Verify Telegram connection
- `GET /api-auth/profile` - Get user profile

### Project Endpoints:
- `GET /api-projects` - List user's projects
- `POST /api-projects` - Add new project
- `PUT /api-projects/:id` - Update project settings
- `DELETE /api-projects/:id` - Remove project

## Security:
- All endpoints require `X-API-Key: mobile_app_key_here` header
- User endpoints require `Authorization: Bearer {userId}` header
- CORS enabled for all origins

## Next Steps:
1. Update mobile app's `src/lib/api.ts` with new base URL
2. Push changes to GitHub
3. Redeploy on Netlify
4. Test the full user flow

The backend is now ready to serve your mobile app! 🚀