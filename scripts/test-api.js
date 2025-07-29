// API Integration Test Script
const http = require('http');
require('dotenv').config();

const API_BASE = `http://localhost:${process.env.PORT || 8080}/api/v1`;

console.log('🧪 BookAI API Integration Test');
console.log('================================\n');

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testHealth() {
  console.log('1. Testing Health Endpoint...');
  try {
    const response = await makeRequest('GET', '/../health');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    return response.status === 200;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testModels() {
  console.log('\n2. Testing Models Endpoint...');
  try {
    const response = await makeRequest('GET', '/models');
    console.log(`   Status: ${response.status}`);
    console.log(`   Current Model: ${response.data.current?.name || 'Unknown'}`);
    console.log(`   Model ID: ${response.data.current?.id || 'Unknown'}`);
    return response.status === 200;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testModelConnection() {
  console.log('\n3. Testing Model Connection...');
  try {
    const modelId = process.env.AI_MODEL || 'gemini-2.0-flash-exp';
    const response = await makeRequest('POST', `/models/${modelId}/test`, {
      testPrompt: 'Respond with "API test successful"'
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.data.success) {
      console.log(`   ✅ Model responded: ${response.data.test.response}`);
      console.log(`   Response time: ${response.data.test.responseTime}`);
    } else {
      console.log(`   ❌ Test failed: ${response.data.error}`);
    }
    return response.status === 200 && response.data.success;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testChatCreation() {
  console.log('\n4. Testing Chat Creation...');
  try {
    const response = await makeRequest('POST', '/chat/new', {
      title: 'Test Chat',
      userId: 'test_user'
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.data.success) {
      console.log(`   ✅ Chat created with ID: ${response.data.chat.id}`);
      return { success: true, chatId: response.data.chat.id };
    } else {
      console.log(`   ❌ Failed: ${response.data.error}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false };
  }
}

async function testSendMessage(chatId) {
  console.log('\n5. Testing Message Sending...');
  try {
    const response = await makeRequest('POST', `/chat/${chatId}/message`, {
      message: 'Hello! Can you confirm this test message was received?',
      userId: 'test_user',
      stream: false
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.data.success) {
      console.log(`   ✅ User message sent`);
      console.log(`   ✅ Assistant responded: ${response.data.assistantMessage.content.substring(0, 100)}...`);
    } else {
      console.log(`   ❌ Failed: ${response.data.error}`);
    }
    return response.status === 200 && response.data.success;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testGenerateContent() {
  console.log('\n6. Testing Content Generation...');
  try {
    const response = await makeRequest('POST', '/chat/generate', {
      prompt: 'Write a haiku about API testing'
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.data.success) {
      console.log(`   ✅ Generated content: ${response.data.response.text}`);
    } else {
      console.log(`   ❌ Failed: ${response.data.error}`);
    }
    return response.status === 200 && response.data.success;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('Starting API tests...');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Model: ${process.env.AI_MODEL}`);
  console.log(`Environment: ${process.env.NODE_ENV}\n`);

  const results = {
    health: await testHealth(),
    models: await testModels(),
    modelConnection: await testModelConnection(),
    chatCreation: false,
    messageSending: false,
    contentGeneration: await testGenerateContent()
  };

  // Test chat functionality
  const chatResult = await testChatCreation();
  results.chatCreation = chatResult.success;
  
  if (chatResult.success && chatResult.chatId) {
    results.messageSending = await testSendMessage(chatResult.chatId);
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`Health Check: ${results.health ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Models API: ${results.models ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Model Connection: ${results.modelConnection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Chat Creation: ${results.chatCreation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Message Sending: ${results.messageSending ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Content Generation: ${results.contentGeneration ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(result => result);
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (!allPassed) {
    console.log('\n⚠️  Make sure:');
    console.log('   1. The server is running (npm start)');
    console.log('   2. Google Cloud credentials are configured');
    console.log('   3. Supabase is accessible');
    console.log('   4. All environment variables are set');
  }
}

// Check if server is running
console.log('Checking if server is running...');
const checkReq = http.get(API_BASE + '/../health', (res) => {
  console.log('✅ Server is running\n');
  runAllTests();
}).on('error', () => {
  console.log('❌ Server is not running!');
  console.log('Please start the server with: npm start');
  process.exit(1);
});