import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

interface AuthDebugInfo {
  hasSession: boolean;
  userId: string | null;
  email: string | null;
  lastSignIn: string | null;
  userMindOpId: string | null;
  localStorageKeys: string[];
}

const AuthDebugger: React.FC = () => {
  const { user, session, loading, userMindOpId, signOut } = useAuth();
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const gatherDebugInfo = async () => {
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        // Get localStorage keys related to Supabase
        const supabaseKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('mindops'))) {
            supabaseKeys.push(key);
          }
        }

        setDebugInfo({
          hasSession: !!currentSession,
          userId: currentSession?.user?.id || null,
          email: currentSession?.user?.email || null,
          lastSignIn: currentSession?.user?.last_sign_in_at || null,
          userMindOpId,
          localStorageKeys: supabaseKeys
        });
      } catch (error) {
        logger.error('Error gathering debug info:', error);
      }
    };

    gatherDebugInfo();
  }, [user, session, userMindOpId]);

  const handleClearAllAuthData = async () => {
    setIsClearing(true);
    setMessage('');
    
    try {
      // Sign out from Supabase
      await signOut();
      
      // Clear all Supabase-related localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('mindops'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      setMessage('✅ Todos los datos de autenticación han sido limpiados');
      
      // Reload page after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      logger.error('Error clearing auth data:', error);
      setMessage('❌ Error al limpiar los datos de autenticación');
    } finally {
      setIsClearing(false);
    }
  };
  const handleTestConnection = async () => {
    try {
      const { error } = await supabase.auth.getUser();
      if (error) {
        setMessage(`❌ Error de conexión: ${error.message}`);
      } else {
        setMessage('✅ Conexión a Supabase exitosa');
      }
    } catch (error) {
      setMessage(`❌ Error inesperado: ${error}`);
    }
  };
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-black">Depurador de Autenticación</h3>
        <p className="text-gray-600">Cargando información de depuración...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-black">Depurador de Autenticación</h3>
      
      {/* Estado actual */}
      <div className="mb-6">
        <h4 className="font-semibold mb-2 text-black">Estado Actual:</h4>
        <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm border border-gray-100">
          <div>
            <span className="font-semibold text-black">Sesión activa:</span> 
            <span className={debugInfo?.hasSession ? 'text-green-600' : 'text-red-600'}>
              {debugInfo?.hasSession ? ' ✅ Sí' : ' ❌ No'}
            </span>
          </div>
          <div>
            <span className="font-semibold text-black">Usuario ID:</span> 
            <span className="ml-2 font-mono text-xs text-gray-600">{debugInfo?.userId || 'N/A'}</span>
          </div>
          <div>
            <span className="font-semibold text-black">Email:</span> 
            <span className="ml-2 text-gray-600">{debugInfo?.email || 'N/A'}</span>
          </div>
          <div>
            <span className="font-semibold text-black">MindOp ID:</span> 
            <span className="ml-2 font-mono text-xs text-gray-600">{debugInfo?.userMindOpId || 'N/A'}</span>
          </div>
          <div>
            <span className="font-semibold text-black">Último inicio de sesión:</span> 
            <span className="ml-2 text-gray-600">{debugInfo?.lastSignIn ? new Date(debugInfo.lastSignIn).toLocaleString() : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* LocalStorage Keys */}
      <div className="mb-6">
        <h4 className="font-semibold mb-2 text-black">Claves en LocalStorage:</h4>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          {debugInfo?.localStorageKeys.length ? (
            <ul className="text-sm space-y-1">
              {debugInfo.localStorageKeys.map((key, index) => (
                <li key={index} className="font-mono text-xs text-gray-600">{key}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No hay claves de Supabase en localStorage</p>
          )}
        </div>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
          <p className="text-sm text-gray-700">{message}</p>
        </div>
      )}

      {/* Acciones */}
      <div className="space-y-3">
        <button
          onClick={handleTestConnection}
          className="w-full px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 font-medium shadow-sm"
        >
          Probar Conexión
        </button>
        
        <button
          onClick={handleClearAllAuthData}
          disabled={isClearing}
          className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 disabled:opacity-50 font-medium shadow-sm"
        >
          {isClearing ? 'Limpiando...' : 'Limpiar Todos los Datos de Autenticación'}
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>Usa este depurador solo si experimentas problemas persistentes con la autenticación.</p>
      </div>
    </div>
  );
};

export default AuthDebugger;
