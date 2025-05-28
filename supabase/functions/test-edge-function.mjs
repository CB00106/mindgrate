#!/usr/bin/env node

/**
 * Test script for the mindop-service Edge Function
 * Usage: node test-edge-function.js [jwt-token]
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://khzbklcvmlkhrraibksx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoemJrbGN2bWxraHJyYWlia3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3Njk5NjQsImV4cCI6MjA2MzM0NTk2NH0.-f3mBw4m5YDn-mPA_JPjQ7PeNNugMweFXA-IbavMR6o'

// Use local development URL or production URL
const EDGE_FUNCTION_URL = process.env.NODE_ENV === 'production' 
  ? `${SUPABASE_URL}/functions/v1/mindop-service`
  : 'http://localhost:54321/functions/v1/mindop-service'

async function testEdgeFunction(jwtToken) {
  console.log('🧪 Testing MindOp Service Edge Function')
  console.log('📍 URL:', EDGE_FUNCTION_URL)
  console.log('🔑 Token:', jwtToken ? 'Provided' : 'Missing')
  console.log('---')

  if (!jwtToken) {
    console.error('❌ Error: JWT token is required')
    console.log('Usage: node test-edge-function.js [jwt-token]')
    process.exit(1)
  }

  try {
    // Test 1: Basic connectivity
    console.log('🔄 Test 1: Basic Edge Function call...')
    
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxRows: 5
      })
    })

    const responseText = await response.text()
    console.log('📊 Status:', response.status)
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()))
    
    try {
      const data = JSON.parse(responseText)
      console.log('✅ Response Data:')
      console.log(JSON.stringify(data, null, 2))

      if (data.success) {
        console.log('🎉 Success! MindOp Service is working correctly')
        
        // Display summary
        console.log('\n📈 Summary:')
        console.log(`   MindOp Name: ${data.mindop.name}`)
        console.log(`   Sheet ID: ${data.sheetData.sheetId}`)
        console.log(`   Rows: ${data.sheetData.totalRows}`)
        console.log(`   Columns: ${data.sheetData.totalColumns}`)
        console.log(`   Timestamp: ${data.timestamp}`)
      } else {
        console.log('⚠️  Function returned error:', data.error)
      }
    } catch (parseError) {
      console.log('📄 Raw Response:', responseText)
      console.error('❌ Failed to parse JSON response:', parseError.message)
    }

  } catch (error) {
    console.error('❌ Network Error:', error.message)
  }

  console.log('\n---')

  // Test 2: Using Supabase client
  console.log('🔄 Test 2: Using Supabase client...')
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      }
    })

    const { data, error } = await supabase.functions.invoke('mindop-service', {
      body: { maxRows: 3 }
    })

    if (error) {
      console.error('❌ Supabase client error:', error)
    } else {
      console.log('✅ Supabase client success:')
      console.log(JSON.stringify(data, null, 2))
    }

  } catch (error) {
    console.error('❌ Supabase client error:', error.message)
  }
}

// Get JWT token from command line arguments
const jwtToken = process.argv[2]
testEdgeFunction(jwtToken)
