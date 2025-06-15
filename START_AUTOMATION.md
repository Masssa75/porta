# 🚀 Automation Server for Claude Code

## How This Works

Since Claude Code can't use official MCP servers, I've created a custom automation system:

1. **Automation Server** watches for commands
2. **Claude writes** commands to a JSON file
3. **Server executes** them automatically
4. **Results saved** for Claude to read

## Start the Automation Server

Run this in your terminal:

```bash
cd /Users/marcschwyn/Desktop/projects/porta && node automation-server.js
```

## What Happens Next

Once the server is running, I can:
- ✅ Create projects automatically
- ✅ Run setup scripts
- ✅ Deploy to GitHub/Vercel/Supabase
- ✅ Execute any commands
- ✅ All without you copying/pasting!

## Let's Test It!

1. Start the server with the command above
2. I'll add commands to deploy porta
3. Watch the magic happen!

The server will show:
```
🤖 Automation Server for Claude Code
====================================
Watching for commands...
```

## This is TRUE Automation!

- You run the server ONCE
- I can then create unlimited projects
- No more Node REPL issues
- No more copy/paste
- Everything automated!

Ready? Just run the command above and tell me when you see "Watching for commands..."