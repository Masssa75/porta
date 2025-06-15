# Security Best Practices for API Keys

## Why NOT to Hardcode API Keys

1. **Public Exposure**: Anyone can see your keys in public repos
2. **Git History**: Keys remain in version control forever
3. **Quota Theft**: Others can use your API limits
4. **No Rotation**: Hard to change keys if compromised

## Secure Ways to Handle API Keys

### For Supabase Edge Functions:
1. **Use Environment Variables**:
   - Add keys in Supabase Dashboard → Functions → Settings
   - Access with `Deno.env.get('API_KEY')`
   - Never commit actual keys to code

### For Local Development:
1. **Use .env.local**:
   - Store keys in `.env.local` (gitignored)
   - Copy `.env.example` as template
   - Never commit `.env.local`

### For Production:
1. **Platform Secrets**:
   - Netlify: Site Settings → Environment Variables
   - Vercel: Project Settings → Environment Variables
   - Supabase: Function Settings → Environment Variables

## If You've Exposed a Key:

1. **Immediately revoke/regenerate the key**
2. **Update it in all services**
3. **Check for unauthorized usage**
4. **Consider using git-filter-branch to remove from history**

## Additional Security Tips:

1. **Least Privilege**: Use read-only keys when possible
2. **IP Restrictions**: Limit keys to specific IPs if supported
3. **Rate Limiting**: Set quotas to prevent abuse
4. **Monitor Usage**: Check API logs regularly
5. **Rotate Regularly**: Change keys periodically

Remember: Treat API keys like passwords - never share or expose them!