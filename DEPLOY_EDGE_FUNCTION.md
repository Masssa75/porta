# Deploy Nitter Search Edge Function

## Option 1: Deploy via Supabase Dashboard (Easiest)

1. **Go to your Edge Functions page**:
   https://app.supabase.com/project/midojobnawatvxhmhmoh/functions

2. **Click "New Function"**

3. **Configure the function**:
   - Name: `nitter-search`
   - Click "Create function"

4. **Replace the default code**:
   - Delete all the default code
   - Copy ALL the code from `supabase/functions/nitter-search/index.ts.edge`
   - Paste it into the editor
   - (Note: The file is named .edge to prevent Next.js build errors)

5. **Add the ScraperAPI key securely**:
   - Click on "Settings" tab
   - Under "Environment Variables", click "Add new"
   - Name: `SCRAPERAPI_KEY`
   - Value: `[your-scraperapi-key]`
   - Click "Save"
   - This keeps your API key secure and not exposed in code

6. **Deploy**:
   - Click "Deploy" button
   - Wait for deployment to complete

## Option 2: Deploy via CLI (If you prefer)

1. **Login to Supabase CLI**:
   ```bash
   npx supabase login
   ```
   This will open a browser for authentication.

2. **Deploy the function**:
   ```bash
   npx supabase functions deploy nitter-search --project-ref midojobnawatvxhmhmoh
   ```

3. **Set the ScraperAPI secret**:
   ```bash
   npx supabase secrets set SCRAPERAPI_KEY=43f3f4aa590f2d310b5a70d8a28e94a2 --project-ref midojobnawatvxhmhmoh
   ```

## Testing the Deployed Function

Once deployed, you can test it by:

1. Running the test script:
   ```bash
   node test-edge-function.js
   ```

2. Or manually via curl:
   ```bash
   curl -X POST https://midojobnawatvxhmhmoh.supabase.co/functions/v1/nitter-search \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -d '{
       "projectId": "test-id",
       "projectName": "Bitcoin",
       "symbol": "BTC",
       "twitterHandle": "bitcoin"
     }'
   ```

## What the Function Does

The `nitter-search` Edge Function:
- Searches for tweets about your crypto projects
- Uses multiple Nitter instances for reliability
- Extracts tweet data (text, author, engagement)
- Calculates importance scores
- Stores results in the database
- Returns the found tweets

## Next Steps

After deployment, we'll:
1. Add a "Check Tweets" button to each project in the UI
2. Display the tweets with their importance scores
3. Set up automated monitoring