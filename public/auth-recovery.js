// Simple authentication test and recovery script
// Run this in the browser console if you encounter auth issues

console.log('🔧 MindOps Authentication Recovery Tool');
console.log('==========================================');

// Function to check current authentication state
function checkAuthState() {
    console.log('📋 Checking authentication state...');
    
    // Check localStorage
    const localStorageKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('auth') || key.includes('supabase') || key.includes('mindops'))) {
            localStorageKeys.push(key);
        }
    }
    
    // Check sessionStorage
    const sessionStorageKeys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('auth') || key.includes('supabase') || key.includes('mindops'))) {
            sessionStorageKeys.push(key);
        }
    }
    
    console.log('🔍 Found in localStorage:', localStorageKeys);
    console.log('🔍 Found in sessionStorage:', sessionStorageKeys);
    
    // Check if user is currently signed in
    if (window.supabase) {
        window.supabase.auth.getUser().then(({ data, error }) => {
            if (error) {
                console.error('❌ Auth error:', error);
            } else if (data.user) {
                console.log('✅ User is signed in:', data.user.email);
            } else {
                console.log('ℹ️ No user signed in');
            }
        });
    }
}

// Function to clear all authentication data
function clearAllAuthData() {
    console.log('🧹 Clearing all authentication data...');
    
    let clearedCount = 0;
    
    // Clear localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('auth') || key.includes('supabase') || key.includes('mindops'))) {
            keysToRemove.push(key);
        }
    }
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        clearedCount++;
        console.log(`🗑️ Removed from localStorage: ${key}`);
    });
    
    // Clear sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('auth') || key.includes('supabase') || key.includes('mindops'))) {
            sessionKeysToRemove.push(key);
        }
    }
    
    sessionKeysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        clearedCount++;
        console.log(`🗑️ Removed from sessionStorage: ${key}`);
    });
    
    console.log(`✅ Cleared ${clearedCount} items`);
    console.log('🔄 Reloading page in 2 seconds...');
    
    setTimeout(() => {
        location.reload();
    }, 2000);
}

// Function to test authentication recovery
function testAuthRecovery() {
    console.log('🧪 Testing authentication recovery...');
    
    if (window.supabase) {
        // Try to sign out first
        window.supabase.auth.signOut().then(() => {
            console.log('✅ Signed out successfully');
            
            // Clear storage
            clearAllAuthData();
        }).catch(error => {
            console.error('❌ Error signing out:', error);
            // Force clear anyway
            clearAllAuthData();
        });
    } else {
        console.log('⚠️ Supabase not available, clearing storage directly');
        clearAllAuthData();
    }
}

// Export functions to global scope for easy access
window.mindopsAuthRecovery = {
    checkAuthState,
    clearAllAuthData,
    testAuthRecovery
};

console.log('🎯 Available commands:');
console.log('  mindopsAuthRecovery.checkAuthState() - Check current auth state');
console.log('  mindopsAuthRecovery.clearAllAuthData() - Clear all auth data');
console.log('  mindopsAuthRecovery.testAuthRecovery() - Full recovery test');
console.log('');
console.log('📝 Quick fix for refresh token errors:');
console.log('  mindopsAuthRecovery.testAuthRecovery()');

// Auto-check on load
checkAuthState();
