// Simple test script for the Vertex AI adapter
const http = require('http');

const testData = {
  model: 'gemini-2.0-flash-exp',
  messages: [
    { role: 'user', content: 'Hello! Can you confirm this adapter is working?' }
  ],
  stream: false
};

// Test the adapter
function testAdapter() {
  console.log('🧪 Testing Vertex AI Adapter');
  console.log('============================\n');

  const postData = JSON.stringify(testData);
  
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(body);
        console.log('\n✅ Response received:');
        console.log(JSON.stringify(response, null, 2));
        
        if (response.choices && response.choices[0] && response.choices[0].message) {
          console.log('\n🎉 Adapter is working! AI responded:', response.choices[0].message.content);
        }
      } catch (error) {
        console.log('\n❌ Error parsing response:', error.message);
        console.log('Raw response:', body);
      }
    });
  });

  req.on('error', (error) => {
    console.log('\n❌ Request failed:', error.message);
    console.log('\nMake sure to:');
    console.log('1. Start the adapter: cd vertex-adapter && npm install && npm start');
    console.log('2. Configure Google Cloud credentials');
    console.log('3. Set environment variables in .env');
  });

  req.write(postData);
  req.end();
}

// Test health endpoint first
function testHealth() {
  console.log('Testing health endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Health check passed');
        console.log('Now testing chat completion...\n');
        setTimeout(testAdapter, 1000);
      } else {
        console.log('❌ Health check failed:', body);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Health check failed:', error.message);
    console.log('\nIs the adapter running on port 8000?');
  });

  req.end();
}

testHealth();