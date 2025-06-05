// Manual test for MindOp navigation bug
// Open browser console to see the enhanced logging

console.log('🧪 MindOp Navigation Bug Test - Manual Version');
console.log('📋 Instructions:');
console.log('1. Open browser console (F12)');
console.log('2. Navigate to /login and login');
console.log('3. Navigate to /my-mindop');
console.log('4. Create or verify MindOp exists');
console.log('5. Navigate to /chat');
console.log('6. Navigate back to /my-mindop');
console.log('7. Check if MindOp data is displayed');
console.log('');
console.log('🔍 Watch for logs starting with:');
console.log('   - 🔍 [useMindOp] or [AuthContext]');
console.log('   - 💾 [MindopService]');
console.log('   - 📝 [MyMindOpPage]');
console.log('');
console.log('✅ Expected behavior:');
console.log('   - MindOp data should appear after navigation back');
console.log('   - If not, try the "Actualizar" button');
console.log('   - Logs should show detailed fetch/load process');

// Function to test localStorage and session storage
function checkStorageState() {
  console.log('🔍 Storage State Check:');
  console.log('localStorage keys:', Object.keys(localStorage));
  console.log('sessionStorage keys:', Object.keys(sessionStorage));
  
  // Check for Supabase auth data
  const authKey = Object.keys(localStorage).find(key => key.includes('supabase'));
  if (authKey) {
    console.log('🔐 Found Supabase auth key:', authKey);
    try {
      const authData = JSON.parse(localStorage.getItem(authKey));
      console.log('👤 User ID:', authData?.user?.id);
      console.log('🔑 Session exists:', !!authData?.session);
    } catch (e) {
      console.log('❌ Error parsing auth data:', e);
    }
  }
}

// Function to manually trigger MindOp refresh
function triggerMindOpRefresh() {
  console.log('🔄 Attempting to trigger MindOp refresh...');
  // This would need to be called from the React component context
  console.log('💡 Use the "Actualizar" button in the UI or check component logs');
}

// Make functions available globally for manual testing
window.checkStorageState = checkStorageState;
window.triggerMindOpRefresh = triggerMindOpRefresh;

console.log('🛠️ Helper functions available:');
console.log('   - checkStorageState()');
console.log('   - triggerMindOpRefresh()');
