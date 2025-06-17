# Cron-job.org Setup for Porta

## Quick Manual Setup

1. **Login** to https://cron-job.org
2. **Create cronjob** with these settings:

**Basic Settings:**
- Title: `Porta - Monitor Crypto Projects`
- URL: `https://midojobnawatvxhmhmoh.supabase.co/functions/v1/monitor-projects`
- Schedule: Select "Every minute"
- Request method: `POST`

**Advanced Settings:**
- Request headers:
  ```
  x-cron-key: porta-cron-secure-2025
  Content-Type: application/json
  ```

3. **Save** and **Enable** the job

## Automated Setup (Recommended)

1. Get your API key from: https://cron-job.org/en/members/settings/
2. Run: `node setup-cronjob.js`
3. Enter your API key when prompted
4. Done! ✅

## Testing Your Cron Job

After setup, you can test manually:

```bash
curl -X POST https://midojobnawatvxhmhmoh.supabase.co/functions/v1/monitor-projects \
  -H "x-cron-key: porta-cron-secure-2025" \
  -H "Content-Type: application/json"
```

## Monitor Performance

- Check execution history at: https://cron-job.org/en/members/jobs/
- Enable email notifications for failures
- Monitor response times

## How It Works

Every minute:
1. Cron-job.org calls your monitor function
2. Function picks the oldest monitored project
3. Fetches tweets for that project
4. Runs AI analysis
5. Checks importance threshold
6. Sends Telegram notification if important