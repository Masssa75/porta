// Test server to see what headers cron-job.org sends
const http = require('http');

const server = http.createServer((req, res) => {
  console.log('\n=== Request received ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Headers received',
    headers: req.headers 
  }));
});

const PORT = 8888;
server.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Use ngrok or similar to expose this for testing');
});