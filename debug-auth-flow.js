/**
 * Script para depurar el flujo de autenticación
 * Monitorea los logs del navegador durante la carga inicial
 */

console.log('🔍 Debug Auth Flow - Script iniciado');

// Función para monitorear localStorage
function monitorLocalStorage() {
  const authKey = 'mindops-auth';
  const authData = localStorage.getItem(authKey);
  
  console.log('📱 [DebugAuth] LocalStorage auth data:', {
    key: authKey,
    hasData: !!authData,
    dataLength: authData?.length || 0,
    dataPreview: authData ? authData.substring(0, 100) + '...' : null
  });
  
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      console.log('📱 [DebugAuth] Parsed auth data:', {
        hasUser: !!parsed.user,
        hasSession: !!parsed.session,
        userId: parsed.user?.id,
        sessionExpiry: parsed.session?.expires_at ? new Date(parsed.session.expires_at * 1000).toISOString() : null
      });
    } catch (e) {
      console.error('❌ [DebugAuth] Error parsing auth data:', e);
    }
  }
}

// Función para verificar el estado de Supabase
async function checkSupabaseClient() {
  try {
    console.log('🔗 [DebugAuth] Checking Supabase client...');
    
    // Verificar si supabase está disponible globalmente
    if (window.supabase) {
      console.log('✅ [DebugAuth] Supabase client found in window');
      
      const { data: { session }, error } = await window.supabase.auth.getSession();
      console.log('🔍 [DebugAuth] Direct session check:', {
        hasSession: !!session,
        error: error?.message,
        userId: session?.user?.id
      });
    } else {
      console.log('❌ [DebugAuth] Supabase client not found in window');
    }
  } catch (error) {
    console.error('❌ [DebugAuth] Error checking Supabase:', error);
  }
}

// Monitorear DOM para detectar cuando aparece el mensaje de "verificando autenticación"
function monitorAuthVerification() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          const element = node as Element;
          if (element.textContent?.includes('Verificando autenticación')) {
            console.log('👀 [DebugAuth] "Verificando autenticación" detected at:', new Date().toISOString());
            console.log('👀 [DebugAuth] Element:', element);
            
            // Verificar estado actual
            monitorLocalStorage();
            checkSupabaseClient();
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('👂 [DebugAuth] DOM observer started');
}

// Función principal
function initDebugAuth() {
  console.log('🚀 [DebugAuth] Initializing auth flow debugging...');
  
  // Verificar estado inicial
  monitorLocalStorage();
  
  // Configurar monitoreo
  monitorAuthVerification();
  
  // Verificar cada 5 segundos si hay carga infinita
  let checkCount = 0;
  const interval = setInterval(() => {
    checkCount++;
    console.log(`⏰ [DebugAuth] Periodic check #${checkCount}`);
    
    const loadingElement = document.querySelector('[class*="animate-spin"]');
    if (loadingElement) {
      console.log('⚠️ [DebugAuth] Loading spinner still present after', checkCount * 5, 'seconds');
      monitorLocalStorage();
    }
    
    // Parar después de 1 minuto
    if (checkCount >= 12) {
      clearInterval(interval);
      console.log('🛑 [DebugAuth] Periodic monitoring stopped');
    }
  }, 5000);
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDebugAuth);
} else {
  initDebugAuth();
}
