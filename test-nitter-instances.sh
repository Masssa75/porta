#!/bin/bash

echo "Testing Nitter instances directly (without ScraperAPI)..."
echo ""

# Test each Nitter instance
INSTANCES=(
  "https://nitter.poast.org"
  "https://nitter.cz"
  "https://nitter.privacydev.net"
  "https://n.opnxng.com"
  "https://nitter.woodland.cafe"
)

for instance in "${INSTANCES[@]}"; do
  echo "Testing $instance..."
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 5 "$instance/search?q=kaspa&f=tweets")
  echo "Status: $STATUS"
  echo ""
done