# Quick Fix for "Failed to fetch projects" Error

The issue is that the database tables haven't been created yet. Here's how to fix it:

## Step 1: Create the Tables

1. Go to your Supabase SQL Editor:
   https://app.supabase.com/project/midojobnawatvxhmhmoh/sql/new

2. Copy ALL the content from the `create-tables.sql` file

3. Paste it in the SQL editor and click "Run"

## Step 2: Set Up Permissions (Choose ONE option)

### Option A: Disable RLS (Easiest for Development)
1. Go to Table Editor: https://app.supabase.com/project/midojobnawatvxhmhmoh/editor
2. Click on the "projects" table
3. Click the "RLS disabled" button to keep it off
4. Repeat for other tables if needed

### Option B: Enable RLS with Policies
1. After creating tables, run the content from `supabase-setup.sql` in the SQL editor

## That's it!

After completing these steps, refresh your app at https://portax.netlify.app and it should work!

## Verify It's Working

You should be able to:
- Search for cryptocurrencies (try "bitcoin" or "ethereum")
- Click "Add" to add them to your list
- See them appear in "Your Projects" on the right
- Remove projects with the "Remove" button