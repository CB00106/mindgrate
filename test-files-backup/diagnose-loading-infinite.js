/**
 * Diagnóstico específico del problema de "cargando configuración" infinita
 * Analizará el hook useMindOp y el componente MyMindOpPage
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://khzbklcvmlkhrraibksx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoemJrbGN2bWxraHJyYWlia3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3Njk5NjQsImV4cCI6MjA2MzM0NTk2NH0.-f3mBw4m5YDn-mPA_JPjQ7PeNNugMweFXA-IbavMR6o';

// Configurar cliente con headers mejorados como en la app
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'X-Client-Info': 'mindgrate-app/1.0.0',
      'Prefer': 'return=representation'
    }
  }
});

async function simulateHookBehavior() {
  console.log('[DIAGNOSTICO] === DIAGNÓSTICO DEL PROBLEMA DE CARGANDO CONFIGURACIÓN ===\n');
  
  // 1. Simular estado inicial del hook
  let hookState = {
    loading: false,
    mindop: null,
    error: null,
    retryCount: 0,
    authLoading: true,
    user: null
  };
  
  console.log('[PASO 1] Estado inicial del hook:');
  console.log(JSON.stringify(hookState, null, 2));
  
  // 2. Simular obtención del usuario (normalmente desde useAuth)
  console.log('\n[PASO 2] Simulando obtención de usuario autenticado...');
  
  try {
    // Intentar obtener usuario real
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      console.log('[INFO] No hay usuario autenticado actualmente');
      
      // Obtener user_id de ejemplo de la base de datos
      const { data: mindops, error: mindopsError } = await supabase
        .from('mindops')
        .select('user_id')
        .limit(1);
        
      if (mindopsError || !mindops || mindops.length === 0) {
        console.log('[ERROR] No se pudo obtener user_id de ejemplo');
        return;
      }
      
      hookState.user = { id: mindops[0].user_id };
      console.log('[TEST] Usando user_id de ejemplo:', hookState.user.id);
    } else {
      hookState.user = authData.user;
      console.log('[OK] Usuario autenticado encontrado:', hookState.user.id);
    }
    
    // Cambiar estado auth
    hookState.authLoading = false;
    
  } catch (error) {
    console.error('[ERROR] Error obteniendo usuario:', error);
    return;
  }
  
  // 3. Simular useEffect que se ejecuta cuando user y authLoading cambian
  console.log('\n[PASO 3] Ejecutando useEffect equivalente...');
  console.log('Condición: !authLoading && user =', !hookState.authLoading && !!hookState.user);
  
  if (!hookState.authLoading && hookState.user) {
    console.log('[OK] Condición cumplida, iniciando fetchMindOp...');
    
    // ESTE ES EL PUNTO CRÍTICO - el estado loading se activa
    hookState.loading = true;
    console.log('[ESTADO] hookState.loading = true');
    
    // 4. Simular fetchMindOp
    console.log('\n[PASO 4] Ejecutando fetchMindOp simulado...');
    
    const fetchId = `fetch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    console.log(`[FETCH ${fetchId}] Iniciando fetch para user: ${hookState.user.id}`);
    
    try {
      const startTime = Date.now();
      
      // Ejecutar la consulta EXACTA que usa MindopService
      const { data: mindopData, error: mindopError } = await supabase
        .from('mindops')
        .select('id, user_id, created_at, mindop_name, mindop_description')
        .eq('user_id', hookState.user.id)
        .limit(1);
      
      const endTime = Date.now();
      console.log(`[TIMING ${fetchId}] Consulta completada en: ${endTime - startTime}ms`);
      
      if (mindopError) {
        console.error(`[ERROR ${fetchId}] Error en consulta:`, mindopError);
        
        // Verificar si es error HTTP 406
        const isHttp406 = mindopError.message?.includes('406') || mindopError.status === 406 || mindopError.code === '406';
        
        if (isHttp406) {
          console.log('[ALERTA] Error HTTP 406 detectado!');
          hookState.error = 'Error de comunicación (HTTP 406). Reintentando automáticamente...';
          
          // Aquí normalmente se haría retry, pero el loading NO se resetea inmediatamente
          if (hookState.retryCount < 3) {
            hookState.retryCount++;
            console.log(`[RETRY] Planificando retry ${hookState.retryCount}/3...`);
            // En el retry, loading permanece true hasta que termine
            console.log('[WARNING] PROBLEMA: loading permanece true durante retry');
          } else {
            hookState.loading = false;
            hookState.error = 'Error HTTP 406 persistente. Intenta recargar la página o contacta soporte.';
          }
        } else {
          // Error no-406, resetear loading
          hookState.loading = false;
          hookState.error = `Error al cargar la configuración del MindOp: ${mindopError.message}`;
        }
      } else {
        // Consulta exitosa
        console.log(`[OK ${fetchId}] Consulta exitosa`);
        console.log('[DATA] Datos recibidos:', mindopData);
        
        // PUNTO CRÍTICO: Aquí se debe resetear el loading
        hookState.loading = false;
        hookState.mindop = mindopData && mindopData.length > 0 ? mindopData[0] : null;
        hookState.error = null;
        hookState.retryCount = 0;
        
        console.log('[OK] Estado actualizado correctamente - loading = false');
      }
      
    } catch (error) {
      console.error(`[ERROR ${fetchId}] Excepción durante fetch:`, error);
      hookState.loading = false;
      hookState.error = error.message;
    }
  } else {
    console.log('[ERROR] Condición NO cumplida, fetchMindOp no se ejecuta');
  }
  
  // 5. Estado final del hook
  console.log('\n[PASO 5] Estado final del hook:');
  console.log(JSON.stringify(hookState, null, 2));
  
  // 6. Verificar condición de renderizado del componente
  console.log('\n[PASO 6] Verificando condición de renderizado en MyMindOpPage...');
  console.log(`Condición: if (mindopLoading) { // mindopLoading = ${hookState.loading}`);
  
  if (hookState.loading) {
    console.log('[ALERTA] PROBLEMA CONFIRMADO!');
    console.log('[ERROR] La página MOSTRARÍA: "Cargando configuración..." indefinidamente');
    console.log('\n[ANALISIS] POSIBLES CAUSAS:');
    console.log('  1. El estado loading no se resetea correctamente en algún caso');
    console.log('  2. Hay un error que no se está manejando bien');
    console.log('  3. El useEffect se ejecuta en bucle');
    console.log('  4. La consulta a Supabase está fallando silenciosamente');
    console.log('  5. Hay un race condition en los estados');
    
    // Análisis específico
    if (hookState.error && hookState.error.includes('406')) {
      console.log('\n[DETALLE] ANÁLISIS: Error HTTP 406 detectado');
      console.log('  - Durante el retry, loading permanece true');
      console.log('  - Si todos los retry fallan, loading debería volverse false');
      console.log('  - Si hay un retry en progreso, la UI se queda cargando');
    }
    
  } else {
    console.log('[OK] Estado correcto: La página NO mostraría carga indefinida');
    console.log('[OK] El componente renderizaría normalmente');
    
    if (hookState.mindop) {
      console.log('[INFO] MindOp cargado:', {
        name: hookState.mindop.mindop_name,
        description: hookState.mindop.mindop_description?.substring(0, 50) + '...'
      });
    } else {
      console.log('[INFO] No hay MindOp (usuario nuevo - comportamiento normal)');
    }
  }
  
  console.log('\n[FIN] Diagnóstico completado');
  return hookState;
}

// Función adicional para probar navegación
async function simulateNavigationScenario() {
  console.log('\n\n[NAVEGACION] === SIMULACIÓN DE ESCENARIO DE NAVEGACIÓN ===');
  console.log('Simulando: Usuario navega FUERA de MyMindOpPage y REGRESA');
  
  console.log('\n[VISITA 1] Usuario está en MyMindOpPage (primera vez)');
  let firstVisit = await simulateHookBehavior();
  
  console.log('\n[NAVEGACION] Usuario navega a otra página...');
  console.log('Hook se desmonta, estado se limpia');
  
  console.log('\n[VISITA 2] Usuario regresa a MyMindOpPage...');
  console.log('Hook se monta nuevamente, debería cargar otra vez');
  let secondVisit = await simulateHookBehavior();
  
  console.log('\n[COMPARACION] COMPARACIÓN:');
  console.log('Primera visita - loading:', firstVisit?.loading);
  console.log('Segunda visita - loading:', secondVisit?.loading);
  
  if (!firstVisit || !secondVisit) {
    console.log('[ERROR] No se pudo completar la simulación');
  } else if (firstVisit.loading !== secondVisit.loading) {
    console.log('[WARNING] INCONSISTENCIA detectada en navegación!');
  } else if (secondVisit.loading) {
    console.log('[ALERTA] PROBLEMA: Segunda visita también queda en loading infinito');
  } else {
    console.log('[OK] Navegación funciona correctamente');
  }
}

// Ejecutar diagnóstico
console.log('Iniciando diagnóstico completo...\n');

simulateHookBehavior()
  .then(() => {
    return simulateNavigationScenario();
  })
  .then(() => {
    console.log('\n[COMPLETO] DIAGNÓSTICO COMPLETO TERMINADO');
  })
  .catch(error => {
    console.error('[ERROR] Error durante diagnóstico:', error);
  });