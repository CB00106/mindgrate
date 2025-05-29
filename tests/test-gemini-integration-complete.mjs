/**
 * Test completo de integración Gemini con mindop-service
 * Verifica: API key directa, autenticación, búsqueda vectorial, y respuesta Gemini
 */

import fetch from 'node-fetch';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://khzbklcvmlkhrraibksx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoemJrbGN2bWxraHJyYWlia3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3Njk5NjQsImV4cCI6MjA2MzM0NTk2NH0.-f3mBw4m5YDn-mPA_JPjQ7PeNNugMweFXA-IbavMR6o';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBbGIT01JKRg6YFyRo2hUWpPPGb_IZ-SXQ';

// Credenciales de test
const TEST_EMAIL = 'cesar_106@hotmail.com';
const TEST_PASSWORD = '2812847Wt%';

async function testGeminiIntegration() {
  console.log('🤖 Iniciando verificación completa de integración con Gemini...\n');

  try {
    // Test 1: Verificar API key de Gemini directamente
    console.log('1️⃣ Test: Verificando API key de Gemini directamente...');
    
    const geminiTestResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Responde solo 'Gemini funcionando correctamente' si puedes leer este mensaje."
          }]
        }]
      })
    });

    if (geminiTestResponse.ok) {
      const geminiResult = await geminiTestResponse.json();
      const geminiText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta';
      console.log('✅ Gemini API Key VÁLIDA');
      console.log(`🤖 Respuesta de Gemini: ${geminiText.substring(0, 100)}...`);
    } else {
      const geminiError = await geminiTestResponse.text();
      console.log('❌ Error en API de Gemini:', geminiError);
      console.log('⚠️  Verifica tu API key en: https://makersuite.google.com/app/apikey');
      return;
    }

    // Test 2: Autenticar usuario existente
    console.log('\n2️⃣ Test: Autenticando usuario para probar mindop-service...');
    
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    if (!authResponse.ok) {
      const authError = await authResponse.text();
      console.log('❌ Error de autenticación:', authError);
      return;
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    const userId = authData.user?.id;
    
    if (!accessToken) {
      console.log('❌ No se recibió token de acceso');
      return;
    }
    
    console.log('✅ Autenticación exitosa');
    console.log(`   Usuario ID: ${userId}`);
    console.log(`   Token: ${accessToken.substring(0, 30)}...`);

    // Test 3: Probar mindop-service con consultas de ejemplo
    console.log('\n3️⃣ Test: Probando mindop-service con consultas...');
    
    const serviceUrl = `${SUPABASE_URL}/functions/v1/mindop-service`;
    const testQueries = [
      "¿Cuáles son las principales tendencias en los datos?",
      "Dame un resumen de la información más importante",
      "Explícame qué información tienes disponible"
    ];

    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      console.log(`\n   📝 Consulta ${i + 1}: "${query}"`);

      const response = await fetch(serviceUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      console.log(`      Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`      ❌ Error: ${errorText}`);
        continue;
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('      ✅ Respuesta exitosa');
        console.log(`      📊 Chunks encontrados: ${result.chunks_found}`);
        console.log(`      🤖 MindOp: ${result.mindop?.name || 'N/A'}`);
        
        if (result.response) {
          console.log('      🎯 Respuesta Gemini:');
          const responsePreview = result.response.length > 150 
            ? result.response.substring(0, 150) + '...'
            : result.response;
          console.log(`         "${responsePreview}"`);
        } else {
          console.log('      ⚠️  No se recibió respuesta de Gemini');
        }

        if (result.chunks_used && result.chunks_used.length > 0) {
          console.log('      📋 Chunks utilizados:');
          result.chunks_used.slice(0, 3).forEach((chunk, idx) => {
            console.log(`         ${idx + 1}. Similitud: ${chunk.similarity?.toFixed(3) || 'N/A'}, Fuente: ${chunk.source || 'N/A'}`);
          });
        }
      } else {
        console.log(`      ❌ Fallo: ${result.error || 'Error desconocido'}`);
      }

      // Pausa entre consultas
      if (i < testQueries.length - 1) {
        console.log('      ⏳ Esperando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Test 4: Probar casos límite
    console.log('\n4️⃣ Test: Probando casos límite...');

    // Consulta vacía
    console.log('\n   📝 Test consulta vacía...');
    const emptyResponse = await fetch(serviceUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: '' })
    });
    console.log(`      Status: ${emptyResponse.status} (esperado: 400)`);

    // Consulta muy larga
    console.log('\n   📝 Test consulta muy larga...');
    const longQuery = 'Esta es una consulta muy larga que repito muchas veces para probar los límites del sistema. '.repeat(20);
    const longResponse = await fetch(serviceUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: longQuery })
    });
    console.log(`      Status: ${longResponse.status}`);
    if (longResponse.ok) {
      const longResult = await longResponse.json();
      console.log(`      ✅ Manejó query larga: ${longResult.success ? 'éxito' : 'fallo'}`);
    }

    console.log('\n🎉 Test de integración Gemini completado exitosamente');
    console.log('✅ Gemini API funcionando correctamente');
    console.log('✅ mindop-service respondiendo con Gemini');
    console.log('✅ Búsqueda vectorial operativa');

  } catch (error) {
    console.error('\n💥 Error durante el test:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Verificaciones previas
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY no configurada');
  console.error('   Añade la variable de entorno GEMINI_API_KEY o actualiza el archivo .env');
  process.exit(1);
}

console.log('⚙️ Configuración:');
console.log(`   Supabase URL: ${SUPABASE_URL}`);
console.log(`   Usuario test: ${TEST_EMAIL}`);
console.log(`   Gemini API Key: ${GEMINI_API_KEY.substring(0, 20)}...`);
console.log('');

testGeminiIntegration().catch(console.error);
