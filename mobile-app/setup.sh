#!/bin/bash

echo "🚀 Setting up PortAlerts Mobile App..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file
echo "🔧 Creating environment file..."
cat > .env.local << EOL
NEXT_PUBLIC_API_URL=https://portax.netlify.app
NEXT_PUBLIC_API_KEY=mobile_app_key_here
NEXT_PUBLIC_TELEGRAM_BOT=porta_alerts_bot
EOL

echo "✅ Setup complete!"
echo ""
echo "To run the development server:"
echo "  npm run dev"
echo ""
echo "To build for production:"
echo "  npm run build"
echo ""
echo "Mobile app will run on http://localhost:3000"