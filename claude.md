# Crypto Portfolio Notification System - CLAUDE.md

## Project Overview
A cryptocurrency portfolio monitoring system that tracks important news and updates for selected crypto projects and sends Telegram notifications when significant events occur.

## Critical Development Rules
1. **Never create fallback systems without explicit request** - No automatic fallbacks, mockups, or demo content unless specifically requested
2. **Always create backup before major changes** - Complete backup required before database integration, authentication changes, API refactoring, etc.
3. **Do only what's asked; nothing more, nothing less**
4. **Never create files unless absolutely necessary** - Always prefer editing existing files
5. **Never proactively create documentation files unless requested**

## Working Preferences
- Always explain before executing
- Step-by-step approach with testing at each stage
- Local testing first
- Autonomous testing preferred
- Full implementation with complete code (not just snippets)
- Never add mock data unless requested
- Ask for clarification when ambiguous

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

## Current Status
- Project initialized with basic structure
- Reviewing KROMV12 implementation for Nitter integration
- Planning architecture for notification system

## Next Steps
1. Set up Supabase database schema
2. Implement project addition system with multiple identifiers
3. Port Nitter search functionality from KROMV12
4. Create cron job system for monitoring
5. Implement Gemini AI analysis
6. Set up Telegram bot and notification system

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

### Session 5 TODO - Architecture Discussion
**Topic: Security Architecture - Single vs Dual System**
- Option 1: Current single system (user-facing + logic in one)
- Option 2: Split architecture:
  - System A: Core logic, data collection, AI analysis (isolated)
  - System B: User-facing with auth, calls System A via API
- Benefits of split: Security isolation, scalability, specialized concerns
- Considerations: Complexity, maintenance, API design

**Current Deployment Status:**
- **Live URL**: https://portax.netlify.app
- **GitHub**: https://github.com/Masssa75/porta
- **Supabase Project ID**: midojobnawatvxhmhmoh
- **Supabase Dashboard**: https://app.supabase.com/project/midojobnawatvxhmhmoh

**API Keys Still Needed:**
- SCRAPERAPI_KEY (for Nitter searches)
- GEMINI_API_KEY (for AI analysis)
- TELEGRAM_BOT_TOKEN (for notifications)

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

## Version
- Current Version: 0.2.0
- Last Updated: 2025-06-15
- Status: porta successfully deployed to production!