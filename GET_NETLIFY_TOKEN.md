# How to Get Your Netlify Token for Automation

## Quick Steps:

### 1. **Go to Netlify Dashboard**
https://app.netlify.com

### 2. **Access User Settings**
- Click your **avatar** (top right)
- Select **"User settings"**

### 3. **Navigate to Applications**
- In the left sidebar, click **"Applications"**
- Or direct link: https://app.netlify.com/user/applications

### 4. **Create Personal Access Token**
- Scroll to **"Personal access tokens"**
- Click **"New access token"**

### 5. **Configure Token**
- **Description**: "Claude Automation" (or whatever you prefer)
- **Expiration**: Choose "No expiration" for convenience
- Click **"Generate token"**

### 6. **Copy Token**
- **IMPORTANT**: Copy immediately! You won't see it again
- Token format: Looks like a long random string

## Add to Your .env File:

```bash
# Add this line to /Users/marcschwyn/Desktop/projects/porta/.env
NETLIFY_TOKEN=nfp_v2g4caqv2EtM2XetjeLLQoGcF1TVHdny92af
```

## What This Token Enables:

With this token, I can:
- ✅ Create new sites automatically
- ✅ Deploy projects with one command
- ✅ Update environment variables
- ✅ Manage domains
- ✅ View deployment status
- ✅ Rollback deployments

## Security Note:
- This token has full access to your Netlify account
- Keep it secure like your other API keys
- Can be revoked anytime from the same page

## Alternative: Netlify CLI Login
If you prefer not to use tokens:
```bash
npm install -g netlify-cli
netlify login
```
This opens a browser for OAuth login - more secure but requires manual interaction.

---

Once you have the token, add it to your `.env` file and I can automate Netlify deployments just like we did with Supabase and GitHub!