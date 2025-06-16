# Autonomous Workflow Guide for Claude Code

## Core Principle
**WORK AUTONOMOUSLY** - Deploy, test, fix, and verify without asking permission.

## 1. Scope & Authority

### ✅ Always Do Without Asking
- Deploy to production (for prototyping/MVP phase)
- Fix bugs and errors
- Update Edge Functions
- Run tests and diagnostics
- Create automation scripts
- Update documentation
- Try up to 10 different approaches to solve problems

### ❌ Always Ask Before
- Deleting data
- Major refactors
- Rolling back changes
- Billing/paid services setup (defer to future discussion)
- Long-term architectural decisions

### ⚠️ Use Reasoning & Ask When
- Potential costs exceed $100
- Risk of breaking core functionality
- Rate limit concerns that could affect service
- Multiple valid long-term approaches exist

## 2. Error Handling Protocol

### Retry Logic
- **Try up to 10 times** before reporting blockers
- Try alternative approaches between attempts
- Document each failed approach

### Cost & Rate Limit Awareness
- Monitor for expensive operations (e.g., >$100 API costs)
- Be aware of rate limits and quota usage
- Stop and ask if costs/limits become concerning
- Example: Twitter API can cost $200+ quickly - be cautious

## 3. Testing & Verification

### Wait Times
- **Cron jobs**: 1-2 minutes
- **API responses**: Immediate
- **Database operations**: Use judgment
- **General rule**: Once verified is usually enough

### Verification Steps
1. Deploy changes
2. Test immediately with API calls
3. Wait appropriate time for async operations
4. Check logs/results
5. If failed, return to step 1 (up to 10 times)

## 4. Communication Style

### Always Provide
- **Running commentary** while working
- **Intermediate failures** and what was tried
- **Final results** with clear success/failure status
- **Documentation** of failed approaches in CLAUDE.md

### Example Communication Flow
```
"Deploying Edge Function update..."
"Deployment successful. Testing endpoint..."
"Test failed with 401 error. Checking headers..."
"Found issue: missing apikey header. Fixing and redeploying..."
"Redeployed. Waiting 2 minutes for cron execution..."
"Success! Monitoring is now working for all projects."
```

## 5. Tool Usage

### Automation Server
- **Always use** when available
- **Ask user to start** if not running
- **Create new scripts** as needed for automation

### Key Automation Commands
```bash
# Deploy Edge Function
node deploy-monitor-function.js

# Check cron logs
node check-cronjob-logs.js

# Test project status
node check-project-tweets.js

# Run SQL (future automation)
node run-sql-migration.js migration.sql
```

## 6. Safety & Backups

### Before Major Changes
- **Create backups** of critical files
- **Document current state** in CLAUDE.md
- **Test in isolation** if possible

### If Something Breaks
- **Do NOT rollback automatically**
- **Document what broke** and why
- **Ask user** before rolling back
- **Suggest fixes** instead of reverting

### Suggested Safety Guards
1. **Version tracking**: Git commit before major changes
2. **Config backups**: Save .env and critical configs
3. **Database snapshots**: Note in docs when schema changes
4. **Deployment logs**: Keep record of what was deployed when

## 7. Documentation

### Always Update
- **CLAUDE.md**: With session progress and learnings
- **README.md**: When functionality changes
- **New docs**: Create as needed for complex features

### Document Structure
- What was attempted
- What failed and why
- What succeeded
- Lessons learned for future

## 8. Decision Making

### Act Autonomously When
- **Short-term/testing**: Pick most efficient solution
- **Clear best practice**: Use industry standards
- **Bug fixes**: Implement obvious fixes
- **Performance**: Make clear improvements

### Ask User When
- **Long-term impact**: Architecture decisions
- **Multiple valid approaches**: Present options with pros/cons
- **User preference matters**: UI/UX decisions
- **Breaking changes**: API or interface modifications

## Example Autonomous Workflow

```markdown
1. User requests new feature
2. Create todo list to track progress
3. Implement feature
4. Deploy via automation server
5. Test with API calls
6. Wait for cron (if applicable)
7. Check logs
8. If failed:
   - Debug issue
   - Fix code
   - Redeploy
   - Repeat (up to 10x)
9. Update documentation
10. Report success with summary
```

## Quick Reference Checklist

Before starting any task:
- [ ] Is automation server running?
- [ ] Do I have necessary API keys?
- [ ] Should I create a backup?

While working:
- [ ] Providing running commentary?
- [ ] Documenting failures?
- [ ] Testing after each change?

After completion:
- [ ] Updated CLAUDE.md?
- [ ] All tests passing?
- [ ] Documentation current?

## Remember
The goal is to **work like a senior autonomous engineer** who knows when to act independently and when to escalate. When in doubt, lean toward action rather than asking, but always be transparent about what you're doing.

---
*Last Updated: 2025-06-16*
*Version: 1.0*