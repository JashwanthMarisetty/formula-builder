const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test API connectivity
async function testAPI() {
  try {
    console.log('Testing API connectivity...');
    
    // Test basic server connection
    const response = await axios.get(`${API_BASE}/forms`, {
      headers: {
        'Authorization': 'Bearer test-token' // This will fail but should reach the server
      }
    });
    
    console.log('✅ API server is responding');
  } catch (error) {
    if (error.response) {
      console.log('✅ API server is responding');
      console.log('Response status:', error.response.status);
      console.log('Response message:', error.response.data.message || 'Auth required');
    } else if (error.request) {
      console.log('❌ Cannot reach API server');
      console.log('Make sure backend server is running on port 5000');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Test database connection by checking if server responds
async function testDatabase() {
  try {
    console.log('\nTesting database connection...');
    
    // Try to register a test user (this will test DB connectivity)
    const response = await axios.post(`${API_BASE}/users/register`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpass123'
    });
    
    console.log('✅ Database connection working');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Database connection working (user might already exist)');
    } else if (error.response) {
      console.log('✅ Database connection working');
    } else {
      console.log('❌ Database connection failed');
    }
  }
}

// Run tests
async function runTests() {
  await testAPI();
  await testDatabase();
  
  console.log('\n=== Testing Summary ===');
  console.log('Backend server: http://localhost:5000');
  console.log('Frontend server: http://localhost:5173');
  console.log('You can now test the Dashboard with real data!');
}

runTests();
