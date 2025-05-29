/**
 * Debug script para la función search-mindops
 */

import fetch from 'node-fetch';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://khzbklcvmlkhrraibksx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoemJrbGN2bWxraHJyYWlia3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3Njk5NjQsImV4cCI6MjA2MzM0NTk2NH0.-f3mBw4m5YDn-mPA_JPjQ7PeNNugMweFXA-IbavMR6o';

const TEST_EMAIL = 'cesar_106@hotmail.com';
const TEST_PASSWORD = '2812847Wt%';

async function debugSearchFunction() {
  console.log('🔍 === DEBUG DE FUNCIÓN SEARCH-MINDOPS ===\n');

  try {
    // 1. Autenticarse y obtener JWT token válido
    console.log('1. Autenticando usuario...');
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
      throw new Error(`Error en autenticación: ${authResponse.status} - ${await authResponse.text()}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    
    console.log('✅ Usuario autenticado correctamente');
    console.log(`User ID: ${authData.user.id}`);

    // 2. Verificar que hay datos en la tabla mindops
    console.log('\n2. Verificando datos en tabla mindops...');
    const mindopsResponse = await fetch(`${SUPABASE_URL}/rest/v1/mindops?select=id,mindop_name,mindop_description`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!mindopsResponse.ok) {
      throw new Error(`Error consultando mindops: ${mindopsResponse.status} - ${await mindopsResponse.text()}`);
    }

    const mindopsData = await mindopsResponse.json();
    console.log(`✅ Encontrados ${mindopsData.length} MindOps en la tabla`);
    
    if (mindopsData.length > 0) {
      console.log('Primeros MindOps encontrados:');
      mindopsData.slice(0, 3).forEach((mindop, index) => {
        console.log(`  ${index + 1}. ${mindop.mindop_name} - ${mindop.mindop_description || 'Sin descripción'}`);
      });
    }

    // 3. Probar la función search-mindops
    console.log('\n3. Probando función search-mindops...');
    
    // Usar el nombre de un MindOp existente
    const searchTerm = mindopsData.length > 0 ? mindopsData[0].mindop_name : 'test';
    console.log(`Buscando: "${searchTerm}"`);

    const searchResponse = await fetch(`${SUPABASE_URL}/functions/v1/search-mindops?searchTerm=${encodeURIComponent(searchTerm)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log(`Status de respuesta: ${searchResponse.status}`);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`❌ Error en función search: ${searchResponse.status} - ${errorText}`);
      return;
    }

    const searchData = await searchResponse.json();
    console.log('✅ Función search-mindops respondió correctamente');
    console.log('Resultado:', JSON.stringify(searchData, null, 2));

    // 4. Probar búsqueda parcial
    console.log('\n4. Probando búsqueda parcial...');
    if (mindopsData.length > 0) {
      const partialTerm = mindopsData[0].mindop_name.substring(0, 3);
      console.log(`Buscando término parcial: "${partialTerm}"`);

      const partialResponse = await fetch(`${SUPABASE_URL}/functions/v1/search-mindops?searchTerm=${encodeURIComponent(partialTerm)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (partialResponse.ok) {
        const partialData = await partialResponse.json();
        console.log(`✅ Búsqueda parcial encontró ${partialData.results?.length || 0} resultados`);
      } else {
        console.error(`❌ Error en búsqueda parcial: ${partialResponse.status}`);
      }
    }

  } catch (error) {
    console.error('💥 Error en debug:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugSearchFunction();
