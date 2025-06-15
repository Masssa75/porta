# 🚀 Netlify GitHub Deployment (Recommended!)

## Yes! Netlify's GitHub integration is actually BETTER than Vercel's!

### Quick Deploy (2 minutes):

1. **Go to**: https://app.netlify.com/start
2. **Click**: "Import an existing project"
3. **Choose**: "Deploy with GitHub"
4. **Authorize** Netlify to access GitHub (if first time)
5. **Search** for: `porta`
6. **Select**: `Masssa75/porta`
7. **Netlify auto-detects** Next.js settings!
8. **Click**: "Deploy site"

### What Netlify Will Auto-Configure:
- ✅ Build command: `npm run build`
- ✅ Publish directory: `.next`
- ✅ Node version: Auto-detected
- ✅ Environment variables: You can add them in UI

### Why This Is Perfect:
- **Automatic deploys** on every push to GitHub
- **Preview deploys** for pull requests
- **No root directory confusion** (unlike Vercel)
- **Better build logs**
- **Free custom domains**

### After Deploy:
1. Add environment variables:
   - Go to Site settings → Environment variables
   - Add your Supabase keys from `.env.local`

2. Custom domain (optional):
   - Site settings → Domain management
   - Add `porta.com` or keep `porta.netlify.app`

## Direct Link:
https://app.netlify.com/start/repos

This is actually the BEST way to deploy! Netlify's GitHub integration is more straightforward than Vercel's.

---

## Bonus: One-Click Deploy Button

You could even add this to your README.md:

```markdown
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Masssa75/porta)
```

This gives anyone a one-click deploy button!