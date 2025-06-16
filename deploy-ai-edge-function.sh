#!/bin/bash

echo "🚀 Deploying Edge Function with AI Analysis..."

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Using npx..."
    SUPABASE_CMD="npx supabase"
else
    SUPABASE_CMD="supabase"
fi

# Deploy the Edge Function
echo "📦 Deploying nitter-search function..."
$SUPABASE_CMD functions deploy nitter-search --project-ref midojobnawatvxhmhmoh

if [ $? -eq 0 ]; then
    echo "✅ Edge Function deployed successfully!"
    echo ""
    echo "🧪 Test the AI analysis with:"
    echo "curl -X POST https://midojobnawatvxhmhmoh.supabase.co/functions/v1/nitter-search \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -H \"Authorization: Bearer \$NEXT_PUBLIC_SUPABASE_ANON_KEY\" \\"
    echo "  -d '{\"projectId\": \"11b4da6c-df34-480e-9c19-89e958c0db34\", \"projectName\": \"Kaspa\", \"symbol\": \"KAS\", \"twitterHandle\": \"KaspaCurrency\"}'"
else
    echo "❌ Deployment failed!"
    exit 1
fi