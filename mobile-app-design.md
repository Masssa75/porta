# Mobile Web App (App B) - User Interface Design

## Core Mobile Interface Design

```
📱 Mobile Web App Flow:
┌─────────────────────────────┐
│    🚀 Crypto Alerts         │
│                             │
│  ┌─────────────────────────┐ │
│  │ 🔍 Search coins...      │ │  <- Search bar with autocomplete
│  └─────────────────────────┘ │
│                             │
│  Popular:                   │
│  🟡 Bitcoin      [Follow]   │
│  🔵 Ethereum     [Follow]   │
│  🟢 Solana       [Follow]   │
│                             │
│  Your Coins (3):            │
│  ✅ Bitcoin      🔔 On      │
│  ✅ Kaspa       🔔 On      │
│  ✅ Bittensor   🔔 On      │
│                             │
│  ┌─────────────────────────┐ │
│  │   Connect Telegram      │ │
│  │      @porta_alerts_bot  │ │
│  └─────────────────────────┘ │
│                             │
│  Status: 2/5 referrals ⭐   │
│  ┌─────────────────────────┐ │
│  │   Invite Friends        │ │
│  │   Get Free Forever!     │ │
│  └─────────────────────────┘ │
│                             │
│  💎 Lifetime Premium        │
│  Send 1M tokens for all     │
│  future features            │
└─────────────────────────────┘
```

## Search Functionality Features

### 1. **Crypto Search Bar**
- Real-time search as user types
- Search by:
  - Coin name: "Bitcoin", "Ethereum"
  - Symbol: "BTC", "ETH", "SOL"
  - Trending coins
- Autocomplete with coin logos
- "Add to watchlist" buttons

### 2. **Search Results Display**
```
🔍 "bit" search results:
┌─────────────────────────────┐
│ 🟡 Bitcoin (BTC)           │
│    Market Cap: $1.2T        │
│    [+ Follow] 👥 1.2M users │
├─────────────────────────────┤
│ 🟠 Bittensor (TAO)         │
│    Market Cap: $3.4B        │
│    [+ Follow] 👥 15K users  │
├─────────────────────────────┤
│ 🔴 BitTorrent (BTT)        │
│    Market Cap: $890M        │
│    [+ Follow] 👥 8K users   │
└─────────────────────────────┘
```

### 3. **User's Watchlist Management**
```
Your Coins (5/5 max):
┌─────────────────────────────┐
│ ✅ Bitcoin       🔔 High    │
│    Latest: Partnership news │
│    [Settings] [Remove]      │
├─────────────────────────────┤
│ ✅ Ethereum      🔔 Medium  │
│    Latest: No new alerts    │
│    [Settings] [Remove]      │
└─────────────────────────────┘
```

## Key Mobile Features

### **Instant Search**
- Uses CoinGecko API for real-time search
- Caches popular coins for fast results
- Shows user count for social proof

### **One-Tap Actions**
- Follow/Unfollow coins instantly
- Quick notification level changes
- Easy Telegram connection

### **Social Proof**
- Show how many users follow each coin
- Display recent alert examples
- Referral progress gamification

### **Progressive Web App (PWA)**
- Add to home screen capability
- Offline viewing of watchlist
- Push notifications (future)

Should I start building this mobile interface or would you like to adjust the design first?