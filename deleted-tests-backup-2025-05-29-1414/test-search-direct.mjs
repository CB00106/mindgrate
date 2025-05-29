// Test script to check search function directly
import fetch from 'node-fetch';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://khzbklcvmlkhrraibksx.supabase.co';

async function testSearchDirect() {
  console.log('🧪 Testing search function with minimal authentication...');
  
  try {
    // Test with a simple GET request first with timeout
    console.log('1. Testing basic connectivity with 10s timeout...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const testResponse = await fetch(`${SUPABASE_URL}/functions/v1/search-mindops?searchTerm=test`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer fake-token` // This should fail but shouldn't timeout
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`Response status: ${testResponse.status}`);
    
    if (testResponse.status === 504) {
      console.log('❌ Function is timing out - likely deployment issue');
    } else {
      console.log('✅ Function responds (even if with auth error)');
      const responseText = await testResponse.text();
      console.log('Response:', responseText);
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Request timed out after 10 seconds');
    } else {
      console.error('💥 Error:', error.message);
    }
  }
}

testSearchDirect();
