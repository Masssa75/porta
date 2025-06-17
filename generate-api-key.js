const crypto = require('crypto');

// Generate a secure API key
const apiKey = 'pk_' + crypto.randomBytes(32).toString('hex');

console.log('🔑 New Mobile API Key:');
console.log(apiKey);
console.log('\nTo update in Supabase Edge Functions:');
console.log(`npx supabase secrets set MOBILE_API_KEY="${apiKey}"`);
console.log('\nThen use in Netlify environment:');
console.log(`NEXT_PUBLIC_API_KEY=${apiKey}`);