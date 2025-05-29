// Script para probar el polling de respuestas de colaboración
// Este script simula una respuesta de colaboración completada

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Obtener directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer variables de entorno
const envPath = join(__dirname, '.env');
let envContent = '';
try {
  envContent = readFileSync(envPath, 'utf8');
} catch (error) {
  console.log('No .env file found, using environment variables');
}

// Parse .env
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCollaborationResponsePolling() {
  console.log('🧪 === TESTING COLLABORATION RESPONSE POLLING ===\n');

  try {
    // 1. Buscar un MindOp de prueba
    console.log('📋 1. Buscando MindOps disponibles...');
    const { data: mindops, error: mindopsError } = await supabase
      .from('mindops')
      .select('id, mindop_name, user_id')
      .limit(2);

    if (mindopsError || !mindops || mindops.length < 2) {
      console.error('❌ Error obteniendo MindOps o no hay suficientes:', mindopsError?.message);
      return;
    }

    const requesterMindOp = mindops[0];
    const targetMindOp = mindops[1];

    console.log(`✅ Requester MindOp: ${requesterMindOp.mindop_name} (${requesterMindOp.id})`);
    console.log(`✅ Target MindOp: ${targetMindOp.mindop_name} (${targetMindOp.id})\n`);

    // 2. Crear una tarea de colaboración de prueba
    console.log('📝 2. Creando tarea de colaboración de prueba...');
    const testTask = {
      requester_mindop_id: requesterMindOp.id,
      target_mindop_id: targetMindOp.id,
      query: 'Esta es una consulta de prueba para el polling',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: createdTask, error: createError } = await supabase
      .from('mindop_collaboration_tasks')
      .insert(testTask)
      .select()
      .single();

    if (createError || !createdTask) {
      console.error('❌ Error creando tarea de prueba:', createError?.message);
      return;
    }

    console.log(`✅ Tarea creada: ${createdTask.id}\n`);

    // 3. Simular procesamiento - actualizar a 'target_processing_complete'
    console.log('⏳ 3. Esperando 3 segundos antes de simular respuesta...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📨 4. Simulando respuesta del MindOp target...');
    const mockResponse = `🤖 **Respuesta del MindOp ${targetMindOp.mindop_name}**

Hola! He recibido tu consulta: "${testTask.query}"

Esta es una respuesta simulada para probar el sistema de polling. En una implementación real, aquí aparecería la respuesta generada por la mindop-service del MindOp colaborador basada en sus datos.

**Datos de ejemplo que podría proporcionar:**
• Tendencias identificadas en mis documentos
• Patrones interesantes encontrados
• Análisis específico solicitado

¡Espero que esta información te sea útil para tu análisis!

_Respuesta generada el ${new Date().toLocaleString()}_`;

    const { error: updateError } = await supabase
      .from('mindop_collaboration_tasks')
      .update({
        status: 'target_processing_complete',
        response: mockResponse,
        updated_at: new Date().toISOString()
      })
      .eq('id', createdTask.id);

    if (updateError) {
      console.error('❌ Error actualizando tarea:', updateError.message);
      return;
    }

    console.log('✅ Tarea actualizada a "target_processing_complete"');
    console.log('📋 Respuesta simulada generada\n');

    // 4. Verificar que el polling puede encontrar la tarea
    console.log('🔍 5. Verificando que la tarea esté disponible para polling...');
    const { data: pendingTasks, error: queryError } = await supabase
      .from('mindop_collaboration_tasks')
      .select(`
        id,
        requester_mindop_id,
        target_mindop_id,
        query,
        status,
        response,
        created_at,
        updated_at,
        target_mindop:target_mindop_id (
          id,
          mindop_name,
          mindop_description
        )
      `)
      .eq('requester_mindop_id', requesterMindOp.id)
      .eq('status', 'target_processing_complete')
      .eq('id', createdTask.id);

    if (queryError || !pendingTasks || pendingTasks.length === 0) {
      console.error('❌ Error consultando tarea o no encontrada:', queryError?.message);
      return;
    }

    console.log('✅ Tarea encontrada por el query de polling:');
    console.log(`   - ID: ${pendingTasks[0].id}`);
    console.log(`   - Query: ${pendingTasks[0].query}`);
    console.log(`   - Status: ${pendingTasks[0].status}`);
    console.log(`   - Target: ${pendingTasks[0].target_mindop?.mindop_name}`);
    console.log(`   - Response length: ${pendingTasks[0].response?.length || 0} chars\n`);

    // 5. Mensaje final
    console.log('🎉 === PRUEBA COMPLETADA EXITOSAMENTE ===');
    console.log('\n📋 Instrucciones para probar en la UI:');
    console.log(`1. Ve a ChatPage.tsx`);
    console.log(`2. Asegúrate de que userMindOpId sea: ${requesterMindOp.id}`);
    console.log(`3. Agrega manualmente la tarea al estado pendiente:`);
    console.log(`   setPendingCollaborationTasks(new Set(['${createdTask.id}']))`);
    console.log(`4. El polling debería detectar y mostrar la respuesta automáticamente`);
    console.log(`\n⏱️  La tarea será limpiada automáticamente en 60 segundos...`);

    // 6. Cleanup después de 60 segundos
    setTimeout(async () => {
      console.log('\n🧹 Limpiando tarea de prueba...');
      const { error: deleteError } = await supabase
        .from('mindop_collaboration_tasks')
        .delete()
        .eq('id', createdTask.id);

      if (deleteError) {
        console.error('❌ Error limpiando tarea:', deleteError.message);
      } else {
        console.log('✅ Tarea de prueba limpiada');
      }
    }, 60000);

  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

// Ejecutar prueba
testCollaborationResponsePolling().catch(console.error);
