#!/bin/bash

# Test ScraperAPI directly
echo "Testing ScraperAPI with Nitter..."

# Your API key
API_KEY="43f3f4aa590f2d310b5a70d8a28e94a2"

# Test URL
NITTER_URL="https://nitter.net/search?q=kaspa&f=tweets"
SCRAPER_URL="https://api.scraperapi.com/?api_key=$API_KEY&url=$(echo -n $NITTER_URL | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read()))")"

echo "Calling: $SCRAPER_URL"
echo ""

# Make the request
curl -s -o response.html -w "HTTP Status: %{http_code}\nTime: %{time_total}s\n" "$SCRAPER_URL"

echo ""
echo "Response saved to response.html"
echo "First 500 characters:"
head -c 500 response.html