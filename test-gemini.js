require('dotenv').config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('Testing Gemini API...');
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Say 'Hello, API is working!' in JSON format with a field called 'message'"
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 100,
          }
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', response.status);
      console.error('Details:', JSON.stringify(data, null, 2));
      return;
    }

    console.log('✅ API Response:', response.status);
    console.log('Result:', data.candidates[0].content.parts[0].text);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGemini();