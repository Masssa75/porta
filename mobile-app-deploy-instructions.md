# Mobile App Deployment Instructions

✅ **Files are ready in: `/Users/marcschwyn/Desktop/projects/portalerts-mobile-temp`**

## Manual GitHub Steps:

1. **Create new GitHub repo:**
   - Go to: https://github.com/new
   - Name: `portalerts-mobile`
   - Description: "Mobile app for PortAlerts crypto notifications"
   - Public repository
   - Click "Create repository"

2. **Push the code:**
   ```bash
   cd /Users/marcschwyn/Desktop/projects/portalerts-mobile-temp
   git remote add origin https://github.com/Masssa75/portalerts-mobile.git
   git push -u origin main
   ```

## Netlify Setup:

1. **Import GitHub repo:**
   - Go to Netlify dashboard
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub → Select `portalerts-mobile`

2. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Click "Deploy site"

3. **Custom domain:**
   - Go to "Domain settings"
   - Add custom domain: `portalerts.xyz`
   - Follow DNS instructions

4. **Environment variables:**
   - Go to "Site settings" → "Environment variables"
   - Add:
     ```
     NEXT_PUBLIC_API_URL=https://portax.netlify.app
     NEXT_PUBLIC_API_KEY=mobile_app_key_here
     NEXT_PUBLIC_TELEGRAM_BOT=porta_alerts_bot
     ```

5. **Redeploy to apply env vars**

## What's included:
- ✅ Mobile-optimized Next.js app
- ✅ Crypto search with CoinGecko
- ✅ Telegram bot integration
- ✅ Referral system
- ✅ Token wallet connection
- ✅ PWA manifest for mobile
- ✅ Netlify configuration

The app is ready to deploy! 🚀