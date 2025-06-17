# Crypto Portfolio Notification System - CLAUDE.md

## Project Overview
A cryptocurrency portfolio monitoring system that tracks important news and updates for selected crypto projects and sends Telegram notifications when significant events occur.

## Critical Development Rules
1. **Never create fallback systems without explicit request** - No automatic fallbacks, mockups, or demo content unless specifically requested
2. **Always create backup before major changes** - Complete backup required before database integration, authentication changes, API refactoring, etc.
3. **Do only what's asked; nothing more, nothing less**
4. **Never create files unless absolutely necessary** - Always prefer editing existing files
5. **Never proactively create documentation files unless requested**

## Working Preferences - FULLY AUTONOMOUS MODE

### 🚨 CORE AUTONOMOUS PRINCIPLES (ALWAYS FOLLOW)

#### ✅ Always Do Without Asking:
- Deploy to production (for prototyping/MVP phase)
- Fix bugs and errors  
- Update Edge Functions
- Run tests and diagnostics
- Create automation scripts
- Update documentation
- Try up to 10 different approaches to solve problems
- Deploy via automation server when available
- Test immediately with API calls
- Wait appropriate times (cron: 1-2min, API: immediate)
- Check logs and fix errors autonomously
- Repeat until working (up to 10 attempts)

#### ❌ Always Ask Before:
- Deleting data
- Major refactors
- Rolling back changes
- Billing/paid services setup
- Long-term architectural decisions

#### 📋 Always Provide:
- **Running commentary** while working
- **Intermediate failures** and what was tried
- **Final results** with clear success/failure status
- **Documentation updates** in CLAUDE.md

### 🔧 Key Automation Commands:
```bash
# Deploy Edge Function
node deploy-monitor-function.js

# Check cron logs  
node check-cronjob-logs.js

# Test project status
node check-project-tweets.js

# Execute via automation server
echo '[{"action": "execute", "params": {"command": "node script.js", "cwd": "/path"}}]' > automation-commands.json
```

### 📝 Example Workflow:
```
"Deploying Edge Function update..."
"Deployment successful. Testing endpoint..."  
"Test failed with 401 error. Checking headers..."
"Found issue: missing apikey header. Fixing and redeploying..."
"Redeployed. Waiting 2 minutes for cron execution..."
"Success! Monitoring is now working for all projects."
```

### 🎯 Remember:
The goal is to **work like a senior autonomous engineer** who knows when to act independently and when to escalate. When in doubt, lean toward action rather than asking.

## 🛠️ Available Tools & Capabilities

### 📁 File System Tools:
- **Read** - Read any file content (including images/screenshots)
- **Write** - Create new files
- **Edit/MultiEdit** - Modify existing files
- **Glob** - Search for files by pattern
- **Grep** - Search file contents with regex
- **LS** - List directory contents

### 🔧 Execution Tools:
- **Bash** - Run shell commands directly
- **Task** - Launch autonomous agents for complex searches
- **TodoRead/TodoWrite** - Track and manage tasks

### 🌐 Web Tools:
- **WebFetch** - Fetch and analyze web content
- **WebSearch** - Search the web for information

### 🤖 Automation Server (MCP-style):
- **Location**: Watches `automation-commands.json`
- **Usage**: `echo '[{"action": "execute", "params": {"command": "cmd", "cwd": "/path"}}]' > automation-commands.json`
- **Results**: Check `latest-result.json` after 2-5 seconds
- **Purpose**: Execute commands that need special permissions

### 📊 Supabase Capabilities:
#### ✅ CAN DO via Service Role Key:
- SELECT/INSERT/UPDATE/DELETE any data
- Test Edge Functions by calling them
- Check table structure and data
- Execute RPC functions if they exist

#### ❌ CANNOT DO (Need Manual/Dashboard):
- CREATE/ALTER/DROP tables (DDL operations)
- Deploy Edge Functions (need `supabase login`)
- View Edge Function logs
- Modify RLS policies

### 🚀 Deployment Commands:
```bash
# Deploy Edge Functions (after supabase login)
./supabase-cli/supabase functions deploy FUNCTION_NAME --project-ref midojobnawatvxhmhmoh --no-verify-jwt

# Common deployment scripts
node deploy-monitor-function.js
node deploy-telegram-webhook-no-auth.js
node deploy-mobile-edge-functions.js

# Check status
node check-cronjob-logs.js
node check-project-tweets.js
node verify-mobile-tables.js
```

### 🔑 Key Project Info:
- **Supabase Project ID**: midojobnawatvxhmhmoh
- **Main App**: https://portax.netlify.app
- **Mobile App**: https://portalerts.xyz
- **Telegram Bot**: @porta_alerts_bot
- **GitHub**: https://github.com/Masssa75/porta

## Technical Stack
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel (frontend), Supabase (backend)
- **APIs**:
  - ScraperAPI + Nitter for Twitter data
  - Google Gemini for AI analysis
  - Telegram Bot API for notifications
  - CoinGecko for project data
  - Blockchain explorers for wallet data (future)

## Key Components

### 1. Project Identification System
**Challenge**: Need unique identifiers for all crypto projects
- **Options**:
  - CoinGecko ID (e.g., "bitcoin", "casper-network", "bittensor")
  - CoinMarketCap ID/slug
  - Twitter handles (most reliable for Nitter searches)
  - Combination approach: Store multiple identifiers per project

### 2. Data Sources
**Primary Sources**:
- **Twitter/X**: Via Nitter + ScraperAPI (from KROMV12 implementation)
- **Telegram**: Public channels via Telegram API
- **Reddit**: Reddit API (if needed)
- **Discord**: Via webhooks or bots (if accessible)
- **Medium**: RSS feeds or web scraping
- **Official blogs**: RSS feeds when available

### 3. Search Strategy for Nitter
**Best practices identified**:
- Search by @handle (most reliable)
- Search by $TICKER symbol
- Search by project name
- Combine multiple search terms for comprehensive coverage

### 4. Notification Logic
- Importance scoring system (1-10)
- Categories: Partnership, Technical Update, Price Alert, Community News
- Threshold-based notifications
- Deduplication to avoid spam

## API Options

### For Project Data:
1. **CoinGecko API** (Free tier: 10-50 calls/min)
   - Comprehensive project info
   - Price data
   - Social links
   
2. **CoinMarketCap API** (Free tier: 333 calls/day)
   - Similar to CoinGecko
   - Good for cross-reference

3. **DeFiLlama API** (Free)
   - TVL data
   - Protocol information

### For Social Data:
1. **Nitter + ScraperAPI** (Already implemented in KROMV12)
2. **Telegram API** (Free, rate limits apply)
3. **Reddit API** (Free tier available)
4. **The Graph Protocol** (For blockchain data)

## Current Status (Session 6)
- ✅ Live deployment at https://portax.netlify.app
- ✅ Tweet fetching via Nitter/ScraperAPI working
- ✅ AI analysis with Gemini implemented
- ✅ Cost optimization with duplicate detection
- ✅ Database storage and retrieval working
- ✅ Architecture decision: Single system first, split later
- ✅ Cron job monitoring every minute
- ✅ Telegram bot integration complete!

## Next Steps (Updated Session 6)
1. ~~Set up Supabase database schema~~ ✅
2. ~~Implement project addition system with multiple identifiers~~ ✅
3. ~~Port Nitter search functionality from KROMV12~~ ✅
4. ~~Implement Gemini AI analysis~~ ✅
5. ~~Create cron job system for monitoring~~ ✅
6. ~~Set up Telegram bot and notification system~~ ✅
7. ~~Add importance scoring to AI analysis~~ ✅
8. ~~Implement notification thresholds and preferences~~ ✅
9. **Add more data sources (Reddit, Telegram channels)** ← Next Priority
10. **Create monitoring dashboard**
11. **Add user authentication system**
12. **Implement daily digest notifications**

## Open Questions
1. Should we support multiple notification channels (Telegram, Discord, Email)?
2. How to handle rate limits across multiple APIs?
3. Should we implement a web dashboard or CLI tool first?
4. What constitutes "important" news? (Need scoring criteria)

## Session History

### Session 1 - [2025-06-15]
- Initial project discussion
- Reviewed KROMV12 implementation for Nitter/ScraperAPI approach
- Created initial CLAUDE.md file
- Identified key technical decisions needed
- Focus on notification system as primary feature (not full portfolio tracking yet)
- Renamed project from "Portfolio" to "portx"
- Created project structure:
  - README.md with project overview
  - .gitignore for Node.js projects
  - package.json configured for Next.js
  - setup.sh for dependency installation
  - setup-github.md for repository creation
  - SETUP_GUIDE.md for quick start instructions
  - next.config.js for Next.js configuration
  - supabase/schema.sql with database design
  - supabase/functions/nitter-search/index.ts Edge Function

## Current Project State
- Project directory created at /Users/marcschwyn/Desktop/projects/portx
- Basic configuration files in place
- Database schema designed with 4 tables: projects, tweet_analyses, notifications, monitoring_logs
- Nitter search Edge Function template created (adapted from KROMV12)
- Ready for GitHub repository creation and dependency installation

### Session 2 - [2025-06-15] 
**Major Achievement: Full Autonomous Deployment!**

**Created porta project with complete automation:**
1. **Automation Server** - File-based command system for Claude Code
   - Watches `automation-commands.json` for commands
   - Executes them automatically
   - Saves results to `latest-result.json`

2. **Successfully Deployed to 3 Platforms:**
   - ✅ **Supabase**: Database created (ID: midojobnawatvxhmhmoh)
   - ✅ **GitHub**: Repository at https://github.com/Masssa75/porta
   - ✅ **Netlify**: Live deployment (after fixing Tailwind CSS v4→v3)

3. **Key Technical Decisions:**
   - Chose Netlify over Vercel (simpler API, better error messages)
   - Downgraded Tailwind CSS v4 to v3 (compatibility issue)
   - Created multiple deployment scripts with fallbacks

### Session 3 - [2025-06-15]
**Major Progress: Edge Function Working!**

**Completed:**
1. ✅ **Frontend Search & Add Projects** - CoinGecko integration working
2. ✅ **Database Setup** - Created tables with RLS policies
3. ✅ **Edge Function Deployed** - Nitter search via ScraperAPI
4. ✅ **Tweet Fetching Works** - Successfully pulling tweets for projects

**Key Discovery - Why KROMV12 Works:**
- KROMV12 searches for **contract addresses** (technical, low volume)
- We search for **project names/symbols** (popular, high volume)
- Nitter/ScraperAPI handles technical searches better (less rate limiting)
- Solution: Adapted KROMV12's exact Edge Function structure

**Technical Implementation:**
- Used KROMV12's Edge Function as base (same Supabase client setup)
- Removed complex error handling and interfaces
- Simple fetch without extra headers
- Search strategy: `from:handle`, `$SYMBOL`, project name

**Current Status:**
- ✅ Edge Function returns tweets (10 found for Kaspa)
- ❌ Database storage not working yet (0 stored) - needs debugging
- Added logging to diagnose insert failures

### Session 4 - [2025-06-16]
**Major Achievement: AI Analysis Working with Cost Optimization!**

**Completed:**
1. ✅ **Fixed Database Storage** - Issue was invalid project ID (needed real UUID)
2. ✅ **Deployed Gemini AI Analysis**:
   - Fixed GEMINI_API_KEY (had newline character issue)
   - Updated model from non-existent `gemini-pro` to `gemini-1.5-flash`
   - Batch analysis working (20 tweets = 1 API call)
3. ✅ **Added AI Tracking**:
   - `is_ai_analyzed` flag on each tweet
   - `analysis_metadata` with model info and stats
   - Frontend shows 🤖 for AI, ⚠️ for fallback
4. ✅ **Implemented Duplicate Checking Optimization**:
   - Check duplicates BEFORE AI analysis
   - Typically saves 50-90% on API costs
   - Real test: 10 tweets → 9 duplicates → Only analyzed 1 new tweet!

**Key Technical Improvements:**
- Database migrations for optimization (indexes, views)
- Duplicate check uses single batch query with `in` operator
- AI analyzes only new tweets, not duplicates
- Clear cost tracking in responses

**Current Performance:**
- First run: Analyzes all tweets
- Subsequent runs: Only analyzes new tweets (huge savings!)
- Example: 90% cost reduction when 9/10 tweets were duplicates

### Session 5 - [2025-06-16] - Architecture Decision & Autonomous Workflow
**Major Achievements: Fully Autonomous Deployment & Complete Twitter Monitoring!**

**Completed:**
1. ✅ **Architecture Decision** - Single system for speed, future split planned
2. ✅ **Autonomous Workflow Documentation** - Created AUTONOMOUS_WORKFLOW.md & quick reference
3. ✅ **Cron Job Working** - Fixed auth issues, headers, GET→POST
4. ✅ **Twitter Monitoring Operational** - All 5 projects fetching tweets successfully
5. ✅ **Demonstrated Full Autonomy** - 10+ fixes without asking, kept trying until working

**Architecture Decision:**
**Topic: Security Architecture - Single vs Dual System**

**Decision: Start with Single System, Plan for Split Architecture**

**Rationale:**
- **Speed First**: Build fast with single system to validate concept
- **Future-Ready**: Design with split architecture in mind
- **Migration Path**: Clear upgrade path when traction gained

**Current Approach (Single System):**
- Keep everything in one codebase for rapid iteration
- Frontend + backend logic together
- Direct database access from Next.js
- Edge Functions for heavy lifting (Nitter search, AI analysis)

**Future Architecture (When Needed):**
- **System A (Backend)**: Isolated service for:
  - API key management
  - Data collection & AI analysis
  - Rate limit handling
  - Notification dispatch
- **System B (Frontend)**: User-facing with:
  - Authentication
  - Project management UI
  - Read-only tweet viewing
  - Settings management

**Migration Triggers:**
- Multiple users exhausting API rate limits
- Need for better security isolation
- Requirement for multiple frontends (mobile, CLI)
- Cost optimization needs (better batching)

**Design Principles for Now:**
1. Keep API keys in Edge Functions only
2. Structure code to make split easier later
3. Use clear separation between UI and business logic
4. Document all external API dependencies

**Autonomous Workflow Demonstrated:**
1. ✅ **Cron Job Setup** - Created via API without manual intervention
2. ✅ **Error Detection** - Found 401 auth errors in cron logs
3. ✅ **Autonomous Fixing** - Updated headers, redeployed Edge Function
4. ✅ **Persistent Debugging** - Kept fixing until working (GET→POST, headers format)
5. ✅ **SQL Migration** - Identified missing columns, provided migration
6. ✅ **Full Verification** - Tested all projects, confirmed monitoring working

**Key Learning: ALWAYS:**
- Deploy automatically via automation server
- Test with API calls
- Wait for cron execution
- Check logs and fix errors
- Repeat until working
- Only report final success

**Final Status:**
- 🐦 43 tweets fetched across 5 projects
- 🤖 AI analysis with importance scoring working
- ⏰ Round-robin monitoring every minute
- ✅ Ready for Telegram integration next!

### Session 6 - [2025-06-16] - Complete Telegram Integration ✅
**Major Achievement: Full Telegram Bot Integration with Vid-Style UI!**

**Completed:**
1. ✅ **Studied vid project** - Analyzed their elegant Telegram integration approach
2. ✅ **Created Telegram bot** - @porta_alerts_bot via BotFather
3. ✅ **Built UI Components** - TelegramConnect with deep linking (no OAuth!)
4. ✅ **Database Schema** - telegram_connections table with preferences
5. ✅ **Edge Functions Deployed**:
   - send-telegram-notification - Sends alerts
   - telegram-webhook - Handles bot commands (with no-auth fix)
6. ✅ **Integrated with Monitoring** - Automatic notifications for important tweets
7. ✅ **Notification Features**:
   - Customizable importance threshold (1-10 slider)
   - Toggle for different notification types
   - Beautiful formatted messages with score indicators
   - Direct links to tweets
8. ✅ **Fixed webhook authentication** - Deployed with --no-verify-jwt flag
9. ✅ **Created Netlify monitoring tools** - Can check deployments autonomously

**Key Implementation Details:**
- **Connection Flow**: Deep link → Bot → Webhook → Database → Confirm
- **Bot Commands**: /start, /status, /settings, /help
- **Notification Format**: Shows top 3 tweets with AI summaries
- **Score Indicators**: 🔴 (9-10), 🟡 (7-8), 🟢 (below 7)
- **Critical Fix**: Telegram webhooks must run without JWT verification

**How It Works:**
1. Go to https://portax.netlify.app
2. Click "Connect Telegram" button
3. Start chat with @porta_alerts_bot
4. Return to app when prompted
5. Adjust notification threshold as desired
6. Receive alerts when important crypto news breaks!

**🎉 FULLY OPERATIONAL! Users can now:**
- Connect Telegram with one click
- Set custom importance thresholds
- Receive AI-analyzed crypto alerts
- Monitor multiple projects
- Get notifications only for truly important updates

**Current Deployment Status:**
- **Live URL**: https://portax.netlify.app
- **GitHub**: https://github.com/Masssa75/porta
- **Supabase Project ID**: midojobnawatvxhmhmoh
- **Supabase Dashboard**: https://app.supabase.com/project/midojobnawatvxhmhmoh
- **Telegram Bot**: @porta_alerts_bot

**API Keys Status:**
- ✅ SCRAPERAPI_KEY (configured and working)
- ✅ GEMINI_API_KEY (configured and working)
- ✅ CRONJOB_API_KEY (configured and working)
- ✅ TELEGRAM_BOT_TOKEN (configured and working)

## Supabase Management API Capabilities

### What Claude Code CAN do via Supabase APIs:

**Via Management API (with access token):**
- ✅ List Edge Functions and their status
- ✅ Check Edge Function secrets/environment variables (encrypted values shown)
- ✅ Get project information and settings
- ✅ Test Edge Functions by calling them

**Via Client Library (with service role key):**
- ✅ **SELECT queries** - Read any data from any table (bypasses RLS)
- ✅ **INSERT data** - Add new records to tables
- ✅ **UPDATE data** - Modify existing records
- ✅ **DELETE data** - Remove records
- ✅ **Execute stored procedures/functions** - If they exist in the database
- ✅ Check RLS policies
- ✅ Run data manipulation queries

### What Claude Code CANNOT do:

**Cannot do via any API:**
- ❌ Deploy/update Edge Functions
- ❌ Edit Edge Function code
- ❌ View Edge Function logs (logs endpoint not available in v1 API)
- ❌ Create/modify database schemas (DDL operations)
- ❌ CREATE, ALTER, or DROP tables/columns
- ❌ Create indexes
- ❌ Modify permissions (GRANT/REVOKE)
- ❌ Create functions/triggers
- ❌ Modify RLS policies
- ❌ Change project settings
- ❌ Manage authentication settings
- ❌ Access realtime logs or metrics

### Workarounds:
- For Edge Function deployment: Prepare code locally, user runs `supabase functions deploy`
- For logs: Add console.log statements in Edge Function code
- For schema changes: Create SQL files for user to run via Supabase dashboard
- For debugging: Test Edge Functions directly with curl/fetch

## Autonomous Deployment Procedures

### Edge Function Deployment (ALWAYS DO THIS)
```bash
# 1. Update Edge Function code
# 2. Deploy automatically via automation server:
echo '[{"action": "execute", "params": {"command": "node deploy-monitor-function.js", "cwd": "/Users/marcschwyn/Desktop/projects/porta"}}]' > automation-commands.json
# 3. Wait 5 seconds for deployment
# 4. Check latest-result.json for success
```

### SQL Migration Execution
Currently manual, but provide clear instructions:
```sql
-- Always provide full SQL with comments
-- User runs in Supabase SQL Editor
-- Future: Will be automated via Docker/psql
```

### Testing & Verification Workflow
1. **Deploy changes** without asking
2. **Test immediately** with curl/API calls
3. **Wait for cron execution** (1-2 minutes)
4. **Check logs**: `node check-cronjob-logs.js`
5. **If failed**: Debug, fix, redeploy automatically
6. **Repeat until working**

### Key Commands for Autonomous Work
- Deploy Edge Function: `node deploy-monitor-function.js`
- Check cron logs: `node check-cronjob-logs.js`
- Test endpoint: `curl -X POST [endpoint] -H [headers]`
- Check project status: `node check-project-tweets.js`

### IMPORTANT: Never Ask, Always Do
- Deploy first, report results after
- Fix errors autonomously
- Keep trying until it works
- Only report final success/failure

### Session 7 - [2025-06-16] - Mobile App & User System Implementation
**Major Achievement: Built and Deployed Full Mobile App at portalerts.xyz!**

**Project Structure Update:**
- Main backend app: `/Users/marcschwyn/Desktop/projects/porta` (monitoring system)
- Mobile app code: `/Users/marcschwyn/Desktop/projects/porta/mobile-app` (development)
- Mobile app repo: `/Users/marcschwyn/Desktop/projects/portalerts-mobile-temp` (GitHub deployment)

**Completed:**
1. ✅ **Created Mobile Web App**
   - Built complete Next.js mobile-optimized app
   - Deployed to separate GitHub repo: https://github.com/Masssa75/portalerts-mobile
   - Live at https://portalerts.xyz via Netlify
   - Full PWA capabilities with mobile-first design

2. ✅ **User Authentication System**
   - Created user database schema with referral tracking
   - API endpoints: `/api-auth` and `/api-projects`
   - Telegram-based authentication flow
   - User state management with Zustand

3. ✅ **Connected Frontend ↔ Backend**
   - Mobile app calls Supabase Edge Functions
   - Projects persist to database
   - User sessions maintained
   - Fixed SSR deployment issues autonomously

4. ✅ **Domain Setup**
   - Configured portalerts.xyz on GoDaddy
   - DNS records: A record → 75.2.60.5, CNAME www → portalerts-mobile.netlify.app
   - SSL certificate auto-provisioned

5. ✅ **Telegram Webhook Integration for Mobile**
   - Updated webhook to handle mobile app connections
   - Modified /start command to create/update users
   - Added connection_token flow for seamless auth
   - Deployed with --no-verify-jwt flag for both functions
   - Mobile app polling mechanism implemented

**Mobile App Features Ready:**
- 🔍 Crypto search with CoinGecko integration
- 📱 Telegram bot connection UI with real polling
- 👥 Referral system with share functionality
- 💎 Token wallet integration UI (Base network)
- 📊 Project management with persistence

**API Endpoints Deployed:**
- Auth: `https://midojobnawatvxhmhmoh.supabase.co/functions/v1/api-auth`
- Projects: `https://midojobnawatvxhmhmoh.supabase.co/functions/v1/api-projects`

**Environment Variables for Mobile App:**
```
NEXT_PUBLIC_API_URL=https://midojobnawatvxhmhmoh.supabase.co/functions/v1
NEXT_PUBLIC_API_KEY=mobile_app_key_here
NEXT_PUBLIC_TELEGRAM_BOT=porta_alerts_bot
```

**Key Learnings:**
- Always wait 2-3 minutes after deployment to check status
- Zustand persist middleware incompatible with Next.js SSR
- Fixed deployment autonomously without asking
- Edge Functions need --no-verify-jwt for public API access

**Next Priorities:**
1. ~~Complete Telegram bot webhook integration~~ ✅
2. ~~Test full user registration flow~~ ✅
3. **URGENT: Create users table in database** (SQL ready: create-users-table.sql)
4. Implement referral tracking backend
5. Add token wallet functionality
6. Launch premium features (Telegram groups, news aggregation)

### Session 8 - [2025-06-16] - Database Architecture & API Integration Complete!
**Major Achievement: Unified Architecture with Shared Database**

**Completed:**
1. ✅ **Resolved Architecture Conflict**
   - Main app keeps `projects` table for global monitoring
   - Mobile app uses `user_projects` to link users to projects
   - No table conflicts - both apps coexist peacefully

2. ✅ **Created Mobile App Tables**
   - `users` - Mobile app authentication
   - `user_projects` - User subscriptions to projects
   - `referrals` - Referral tracking system
   - `api_access_logs` - API usage tracking
   - `user_projects_detailed` - View joining all data

3. ✅ **Fixed api-projects Edge Function**
   - Updated to work with new architecture
   - Endpoints: `/available`, `/subscribed`, `/subscribe`, `/unsubscribe`
   - Successfully deployed with user's help
   - Mobile app can now subscribe to projects!

**Key Architecture Decision:**
- Shared database, separate tables
- Projects are global (monitored by main app)
- Users subscribe via `user_projects` (mobile app)
- Shared AI analysis results for cost efficiency

**Current Status:**
- 🌐 Mobile app live at https://portalerts.xyz
- 🤖 Telegram bot: @porta_alerts_bot
- 📊 8 crypto projects being monitored
- ✅ User registration working
- ✅ Project subscription ready
- ⏳ Notification delivery pending

## Version
- Current Version: 0.5.0
- Last Updated: 2025-06-16
- Status: Core infrastructure complete! Ready for notifications and referrals