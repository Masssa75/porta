# Autonomous Project Setup Protocol

## Overview
This document outlines the complete protocol for autonomously setting up new projects using Claude Code, based on our experience with the porta project.

## Prerequisites - One-Time Setup

### 1. API Keys Required
Store these in a master `.env` file that Claude can access:

```bash
# Core Infrastructure APIs
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxx    # From: https://app.supabase.com/account/tokens
GITHUB_TOKEN=ghp_xxxxxxxxxxxx              # From: https://github.com/settings/tokens/new
NETLIFY_TOKEN=nfp_xxxxxxxxxxxx             # From: https://app.netlify.com/user/applications#personal-access-tokens

# Optional Services
VERCEL_TOKEN=xxxxxxxxxxxx                  # From: https://vercel.com/account/tokens
SCRAPERAPI_KEY=xxxxxxxxxxxx                # From: https://www.scraperapi.com/dashboard
GEMINI_API_KEY=xxxxxxxxxxxx                # From: https://makersuite.google.com/app/apikey
TELEGRAM_BOT_TOKEN=xxxxxxxxxxxx            # From: @BotFather on Telegram

# Configuration
GITHUB_USERNAME=your-github-username
DEFAULT_REGION=us-east-1
```

### 2. Automation Server Setup
```bash
# Run the automation server
cd /path/to/automation/directory
node automation-server.js
```

## Protocol for New Projects

### Step 1: Project Initialization
Claude creates project structure with:
- Next.js + TypeScript + Tailwind CSS v3 (not v4!)
- Proper `.gitignore` and configuration files
- Environment variable templates

### Step 2: Automated Deployment Sequence

#### A. Supabase (Database)
1. Create project via Management API
2. Wait for project to be ready (polling)
3. Retrieve API keys
4. Create database schema
5. Save credentials to `.env.local`

**Success Indicators:**
- Project ID returned
- Status: ACTIVE_HEALTHY
- API keys retrieved

#### B. GitHub (Repository)
1. Initialize git locally
2. Create repository via API
3. Add all files and commit
4. Push to main branch
5. Set up GitHub Actions (optional)

**Success Indicators:**
- Repository created
- Code pushed successfully
- Accessible via HTTPS URL

#### C. Netlify (Deployment)
1. Build project locally first
2. Create site via GitHub integration (preferred)
3. Configure environment variables
4. Trigger deployment

**Success Indicators:**
- Site created
- Build succeeds
- Live URL accessible

### Step 3: Post-Deployment
- Save all URLs and credentials
- Test live deployment
- Set up monitoring (if applicable)

## Lessons Learned

### What Works Well
1. **Supabase API** - Reliable and straightforward
2. **GitHub API** - Solid, rarely fails
3. **Netlify via GitHub** - More reliable than direct API
4. **Automation Server** - File-based command queue works great

### Common Issues & Solutions

#### 1. Tailwind CSS Version
**Issue:** v4 breaks builds
**Solution:** Always use v3.x.x in package.json

#### 2. Vercel Root Directory
**Issue:** Rejects "./" as root
**Solution:** Use empty string or switch to Netlify

#### 3. Node REPL Confusion
**Issue:** User enters Node REPL instead of running scripts
**Solution:** Clear instructions to use `node scriptname.js`

#### 4. Build Failures
**Issue:** Missing dependencies or wrong versions
**Solution:** Test build locally before deployment

## Automation Server Commands

The automation server watches `automation-commands.json` for commands:

```json
[
  {
    "action": "create_project",
    "params": {
      "projectName": "my-new-app",
      "template": "porta"
    }
  }
]
```

Available actions:
- `create_project` - Full project setup
- `run_setup` - Run autonomous setup script
- `execute` - Run any shell command
- `git_operations` - Git commands
- `deploy` - Deploy to cloud

## Quick Start for New Projects

### 1. Manual Trigger
```bash
# Create new project based on porta template
echo '[{"action":"create_project","params":{"projectName":"my-app"}}]' > automation-commands.json
```

### 2. Via Claude
Claude writes to `automation-commands.json` and the server executes automatically.

## Success Metrics

A successful autonomous deployment includes:
- ✅ Supabase database created and configured
- ✅ GitHub repository created with code
- ✅ Live deployment URL (Netlify/Vercel)
- ✅ All environment variables configured
- ✅ Automatic CI/CD enabled

## Future Improvements

1. **Better Error Recovery** - Retry failed steps automatically
2. **Progress Webhooks** - Real-time status updates
3. **Template Library** - Multiple project templates
4. **Multi-Region Support** - Deploy to closest regions
5. **Cost Monitoring** - Track API usage

## Summary

With this protocol, Claude can autonomously:
1. Create a new project from scratch
2. Set up all cloud infrastructure
3. Deploy to production
4. Enable CI/CD

Total time: ~5 minutes
Human intervention: Zero (after initial setup)

This represents true automation - from idea to live URL without manual steps!