/**
 * Script para crear datos de prueba en la tabla mindops
 */

// Usar fetch de Node.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function createTestData() {
  console.log('🔧 Creando datos de prueba para mindops...');
  
  const SUPABASE_URL = 'https://khzbklcvmlkhrraibksx.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoemJrbGN2bWxraHJyYWlia3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3Njk5NjQsImV4cCI6MjA2MzM0NTk2NH0.-f3mBw4m5YDn-mPA_JPjQ7PeNNugMweFXA-IbavMR6o';
  
  try {
    // 1. Autenticarse
    console.log('1. Autenticando usuario...');
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: 'cesar_106@hotmail.com',
        password: '2812847Wt%'
      })
    });

    if (!authResponse.ok) {
      throw new Error(`Error en autenticación: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    const userId = authData.user.id;
    
    console.log('✅ Usuario autenticado:', userId);

    // 2. Verificar mindops existentes
    console.log('2. Verificando mindops existentes...');
    const existingResponse = await fetch(`${SUPABASE_URL}/rest/v1/mindops?select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (existingResponse.ok) {
      const existing = await existingResponse.json();
      console.log(`📊 MindOps existentes: ${existing.length}`);
      existing.forEach(mindop => {
        console.log(`  - ${mindop.mindop_name}: ${mindop.mindop_description || 'Sin descripción'}`);
      });
      
      if (existing.length > 0) {
        console.log('✅ Ya hay datos de prueba. No es necesario crear más.');
        return;
      }
    }

    // 3. Crear mindops de prueba
    console.log('3. Creando mindops de prueba...');
    
    const testMindops = [
      {
        user_id: userId,
        mindop_name: 'Marketing Digital',
        mindop_description: 'Análisis de campañas de marketing digital y métricas de conversión'
      },
      {
        user_id: userId,
        mindop_name: 'Análisis de Ventas',
        mindop_description: 'Dashboard de ventas mensuales y tendencias del mercado'
      },
      {
        user_id: userId,
        mindop_name: 'Gestión de Inventario',
        mindop_description: 'Control de stock y predicción de demanda'
      },
      {
        user_id: userId,
        mindop_name: 'Recursos Humanos',
        mindop_description: 'Métricas de empleados y análisis de rendimiento'
      },
      {
        user_id: userId,
        mindop_name: 'Finanzas Corporativas',
        mindop_description: 'Estados financieros y análisis de rentabilidad'
      }
    ];

    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/mindops`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testMindops)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Error creando mindops: ${createResponse.status} - ${errorText}`);
    }

    const createdMindops = await createResponse.json();
    console.log(`✅ Creados ${createdMindops.length} MindOps de prueba`);
    
    // 4. Verificar que se pueden buscar
    console.log('4. Probando búsqueda...');
    const searchResponse = await fetch(`${SUPABASE_URL}/functions/v1/search-mindops?searchTerm=Marketing`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`✅ Búsqueda funciona: ${searchData.results?.length || 0} resultados`);
    } else {
      console.error(`❌ Error en búsqueda: ${searchResponse.status}`);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

createTestData();
