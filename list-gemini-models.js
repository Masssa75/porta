require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('Fetching available Gemini models...\n');
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', response.status);
      console.error('Details:', JSON.stringify(data, null, 2));
      return;
    }

    console.log('Available models that support generateContent:\n');
    
    data.models
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .forEach(model => {
        console.log(`📌 ${model.name}`);
        console.log(`   Display: ${model.displayName}`);
        console.log(`   Description: ${model.description}`);
        console.log('');
      });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();