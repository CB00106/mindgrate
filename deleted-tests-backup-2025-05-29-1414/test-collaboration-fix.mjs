/**
 * COLLABORATION FIX VERIFICATION TEST
 * 
 * This test verifies that the collaboration errors have been resolved:
 * 1. "No tienes acceso a este MindOp. Debes estar conectado para colaborar" 
 * 2. "Error al crear la tarea de colaboración"
 * 
 * The fix included:
 * - Fixed collaboration validation logic to use correct MindOp IDs
 * - Removed async task creation in favor of real-time processing
 * - Fixed function syntax errors
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  console.log('Required environment variables:')
  console.log('- VITE_SUPABASE_URL')
  console.log('- VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

console.log('🔧 === COLLABORATION FIX VERIFICATION ===')
console.log(`📊 Supabase URL: ${supabaseUrl}`)
console.log(`🔑 Anon Key: ${supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Not set'}`)

const supabase = createClient(supabaseUrl, supabaseKey)

// Test credentials
const TEST_USER_EMAIL = 'mindgrate+collaboration@example.com'
const TEST_USER_PASSWORD = 'TestPass123!'
const TARGET_USER_EMAIL = 'mindgrate+target@example.com'
const TARGET_USER_PASSWORD = 'TestPass123!'

async function main() {
  try {
    console.log('\n🧪 === STEP 1: Verify Test Users Exist ===')
    
    // Test User 1 - Collaboration requester
    console.log('👤 Testing collaboration requester login...')
    const { data: user1Auth, error: user1Error } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    })
    
    if (user1Error || !user1Auth.user) {
      console.error('❌ Failed to login collaboration user:', user1Error?.message)
      return
    }
    
    console.log(`✅ Collaboration user authenticated: ${user1Auth.user.id}`)
    const user1Token = user1Auth.session.access_token
    
    // Test User 2 - Target MindOp owner
    console.log('🎯 Testing target user login...')
    const { data: user2Auth, error: user2Error } = await supabase.auth.signInWithPassword({
      email: TARGET_USER_EMAIL,
      password: TARGET_USER_PASSWORD
    })
    
    if (user2Error || !user2Auth.user) {
      console.error('❌ Failed to login target user:', user2Error?.message)
      return
    }
    
    console.log(`✅ Target user authenticated: ${user2Auth.user.id}`)
    
    console.log('\n🔍 === STEP 2: Get MindOp Information ===')
    
    // Get User 1's MindOp
    const { data: user1MindOp, error: user1MindOpError } = await supabase
      .from('mindops')
      .select('*')
      .eq('user_id', user1Auth.user.id)
      .single()
    
    if (user1MindOpError || !user1MindOp) {
      console.error('❌ User 1 MindOp not found:', user1MindOpError?.message)
      return
    }
    
    console.log(`📋 User 1 MindOp: ${user1MindOp.mindop_name} (ID: ${user1MindOp.id})`)
    
    // Get User 2's MindOp (target)
    const { data: user2MindOp, error: user2MindOpError } = await supabase
      .from('mindops')
      .select('*')
      .eq('user_id', user2Auth.user.id)
      .single()
    
    if (user2MindOpError || !user2MindOp) {
      console.error('❌ User 2 MindOp not found:', user2MindOpError?.message)
      return
    }
    
    console.log(`🎯 User 2 MindOp: ${user2MindOp.mindop_name} (ID: ${user2MindOp.id})`)
    
    console.log('\n🤝 === STEP 3: Verify Follow Connection ===')
    
    // Check if there's an approved connection
    const { data: connection, error: connectionError } = await supabase
      .from('follow_requests')
      .select('*')
      .eq('requester_mindop_id', user1MindOp.id)
      .eq('target_mindop_id', user2MindOp.id)
      .eq('status', 'approved')
      .single()
    
    if (connectionError || !connection) {
      console.log('⚠️  No approved connection found, creating one...')
      
      // Create follow request
      const { data: newRequest, error: requestError } = await supabase
        .from('follow_requests')
        .insert({
          requester_mindop_id: user1MindOp.id,
          target_mindop_id: user2MindOp.id,
          status: 'approved', // Direct approval for testing
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (requestError) {
        console.error('❌ Failed to create follow request:', requestError.message)
        return
      }
      
      console.log(`✅ Created approved connection: ${newRequest.id}`)
    } else {
      console.log(`✅ Found approved connection: ${connection.id}`)
    }
    
    console.log('\n🚀 === STEP 4: Test Collaboration Query ===')
    
    const testQuery = '¿Cuáles son los principales datos disponibles?'
    console.log(`📝 Test query: "${testQuery}"`)
    console.log(`🎯 Target MindOp ID: ${user2MindOp.id}`)
    
    // Test the collaboration request
    const response = await fetch(`${supabaseUrl}/functions/v1/mindop-service`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user1Token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        query: testQuery,
        target_mindop_id: user2MindOp.id // This should trigger collaboration mode
      })
    })
    
    console.log(`📊 Response status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Function call failed:')
      console.error(`   Status: ${response.status}`)
      console.error(`   Response: ${errorText}`)
      
      // Check for specific error messages
      if (errorText.includes('No tienes acceso a este MindOp')) {
        console.error('🚫 COLLABORATION ACCESS ERROR - This should be fixed!')
      }
      if (errorText.includes('Error al crear la tarea de colaboración')) {
        console.error('🚫 COLLABORATION TASK ERROR - This should be fixed!')
      }
      
      return
    }
    
    const result = await response.json()
    console.log('\n✅ === COLLABORATION SUCCESS ===')
    console.log(`🤝 Collaboration mode: ${result.collaboration}`)
    console.log(`📋 Target MindOp: ${result.mindop.name}`)
    console.log(`📊 Chunks found: ${result.chunks_found}`)
    console.log(`⏰ Timestamp: ${result.timestamp}`)
    console.log('\n📝 Response preview:')
    console.log(`   ${result.response.substring(0, 200)}...`)
    
    if (result.collaboration && result.success) {
      console.log('\n🎉 === COLLABORATION FIX VERIFIED ===')
      console.log('✅ Users can now collaborate without access errors')
      console.log('✅ Real-time processing works correctly')
      console.log('✅ No task creation errors')
    } else {
      console.log('⚠️  Collaboration mode not properly detected')
    }
    
    console.log('\n🧪 === STEP 5: Test Local Query (Control) ===')
    
    // Test normal local query to ensure it still works
    const localResponse = await fetch(`${supabaseUrl}/functions/v1/mindop-service`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user1Token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        query: testQuery
        // No target_mindop_id = local mode
      })
    })
    
    if (localResponse.ok) {
      const localResult = await localResponse.json()
      console.log(`✅ Local query works: collaboration=${localResult.collaboration}`)
    } else {
      console.log(`⚠️  Local query failed: ${localResponse.status}`)
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message)
    console.error(error.stack)
  }
}

main().catch(console.error)
