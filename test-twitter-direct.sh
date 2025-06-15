#!/bin/bash

# Test ScraperAPI with direct Twitter
echo "Testing ScraperAPI with direct Twitter/X..."

API_KEY="43f3f4aa590f2d310b5a70d8a28e94a2"

# Try direct Twitter URL
TWITTER_URL="https://twitter.com/search?q=kaspa&src=typed_query&f=live"
SCRAPER_URL="https://api.scraperapi.com/?api_key=$API_KEY&url=$(echo -n $TWITTER_URL | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read()))")&render=true"

echo "Calling: $SCRAPER_URL"
echo ""

# Make the request
curl -s -o twitter-response.html -w "HTTP Status: %{http_code}\nTime: %{time_total}s\n" "$SCRAPER_URL"

echo ""
echo "Response saved to twitter-response.html"
echo "File size: $(wc -c < twitter-response.html) bytes"