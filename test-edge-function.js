
// Test the Edge Function locally
const testEdgeFunction = async () => {
  const response = await fetch('https://midojobnawatvxhmhmoh.supabase.co/functions/v1/nitter-search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZG9qb2JuYXdhdHZ4aG1obW9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk4OTAxNSwiZXhwIjoyMDY1NTY1MDE1fQ.eKZ0ghhKN1E3pkP5DdV0tvDzrzMhMn6M9RNbsrHE1H4'
    },
    body: JSON.stringify({
      projectId: 'test-project-id',
      projectName: 'Bitcoin',
      symbol: 'BTC',
      twitterHandle: 'bitcoin',
      timeRange: 'day'
    })
  });
  
  const data = await response.json();
  console.log('Edge Function Response:', data);
};

testEdgeFunction().catch(console.error);
