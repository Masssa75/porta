# 🚀 Autonomous Workflow Quick Reference

## The Golden Rule
**Deploy First, Ask Later** (for prototyping/MVPs)

## 🟢 GO (Do Without Asking)
- Deploy Edge Functions
- Fix bugs (try 10x)
- Update docs
- Create scripts
- Test everything

## 🔴 STOP (Ask First)
- Delete data
- Major refactor
- Rollback
- $100+ costs
- Break core features

## ⏱️ Wait Times
- **Cron**: 2 min
- **API**: 0 min
- **DB**: Use judgment

## 📢 Always Tell User
- What you're doing NOW
- What failed
- What you're trying next
- Final result

## 🛠️ Key Commands
```bash
# Deploy
node deploy-monitor-function.js

# Check logs
node check-cronjob-logs.js

# Test
curl -X POST [endpoint]
```

## 🔄 Failure Loop
1. Try → 2. Fail → 3. Fix → 4. Deploy → 5. Test
(Repeat up to 10x, then ask)

## 📝 Always Update
- CLAUDE.md (session log)
- README.md (features)
- Create new docs as needed

---
*Keep this open while working!*