#!/bin/bash

echo "Testing ScraperAPI with contract address search (like KROMV12)..."

API_KEY="43f3f4aa590f2d310b5a70d8a28e94a2"

# Test with a known contract address (USDT on Ethereum)
CONTRACT="0xdac17f958d2ee523a2206206994597c13d831ec7"
NITTER_URL="https://nitter.net/search?q=${CONTRACT}&f=tweets"
SCRAPER_URL="https://api.scraperapi.com/?api_key=$API_KEY&url=$(echo -n $NITTER_URL | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read()))")"

echo "Searching for contract: $CONTRACT"
echo ""

curl -s -o contract-search.html -w "HTTP Status: %{http_code}\nTime: %{time_total}s\n" "$SCRAPER_URL"

echo ""
echo "Response saved to contract-search.html"
echo "Checking for tweets..."
grep -c "tweet-content" contract-search.html || echo "No tweets found"