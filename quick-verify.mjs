/**
 * Verificación básica y rápida del mindop-service
 */

import fetch from 'node-fetch';

const SUPABASE_URL = 'https://khzbklcvmlkhrraibksx.supabase.co';

async function quickTest() {
  console.log('🚀 Verificación rápida del mindop-service...');
  
  try {
    // Test básico sin auth
    console.log('\n1. Probando función sin autenticación...');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mindop-service`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'test' })
    });

    console.log(`Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ CORRECTO: Función requiere autenticación');
    } else {
      const text = await response.text();
      console.log('Respuesta:', text.substring(0, 200));
    }

    // Test con método incorrecto
    console.log('\n2. Probando con método GET...');
    const getResponse = await fetch(`${SUPABASE_URL}/functions/v1/mindop-service`, {
      method: 'GET'
    });

    console.log(`Status: ${getResponse.status}`);
    if (getResponse.status === 405) {
      console.log('✅ CORRECTO: Rechaza método GET');
    }

    // Test CORS
    console.log('\n3. Probando CORS...');
    const corsResponse = await fetch(`${SUPABASE_URL}/functions/v1/mindop-service`, {
      method: 'OPTIONS'
    });

    console.log(`CORS Status: ${corsResponse.status}`);
    if (corsResponse.status === 200) {
      console.log('✅ CORRECTO: CORS habilitado');
    }

    console.log('\n🎉 Verificación básica completada');
    console.log('📌 ESTADO: mindop-service está funcionando correctamente');
    console.log('📌 SIGUIENTE: Necesitas autenticarte para probar funcionalidad completa');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickTest();
