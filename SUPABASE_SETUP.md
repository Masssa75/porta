# Supabase Database Setup Instructions

The "Failed to fetch projects" error is likely because the database tables need Row Level Security (RLS) policies.

## Quick Fix

1. Go to your Supabase Dashboard: https://app.supabase.com/project/midojobnawatvxhmhmoh

2. Click on "SQL Editor" in the left sidebar

3. Copy and paste the contents of `supabase-setup.sql` file and click "Run"

4. This will enable Row Level Security and create policies that allow read/write access

## Alternative: Disable RLS (Less Secure)

If you prefer to disable RLS for development:

1. Go to the "Table Editor" in Supabase
2. Click on the "projects" table
3. Click on "RLS disabled" button to keep it disabled
4. Repeat for other tables if needed

## Check Browser Console

After applying the SQL changes, refresh your app and check the browser console (F12) for more detailed error messages. The updated code will log:
- Supabase connection errors
- Data being fetched/inserted
- Specific error details

## Common Issues

1. **CORS Error**: Make sure your site URL is added to Supabase:
   - Go to Settings → API in Supabase
   - Add https://portax.netlify.app to allowed origins

2. **Authentication Error**: The current setup uses anonymous access. Make sure:
   - Anonymous sign-ins are enabled in Supabase Auth settings
   - Your anon key in .env.local is correct

3. **Table doesn't exist**: Make sure the tables were created when you set up the project