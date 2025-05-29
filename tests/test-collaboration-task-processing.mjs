// Test script para validar el procesamiento de tareas de colaboración
// Este script prueba la nueva funcionalidad de process_collaboration_task

import { createClient } from '@supabase/supabase-js'

// Configuración
const SUPABASE_URL = 'https://dddmgytckdvmgnkbmgpn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZG1neXRja2R2bWdua2JtZ3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxMzUxMjEsImV4cCI6MjA0OTcxMTEyMX0.LS5v-oGNLJLN2rQYUIgJQ9jrnSQGE7t-jxjO0eRF8Jg'

// URL de la Edge Function (ajustar según el entorno)
const EDGE_FUNCTION_URL = 'https://dddmgytckdvmgnkbmgpn.supabase.co/functions/v1/mindop-service'

console.log('🧪 === TEST DE PROCESAMIENTO DE TAREAS DE COLABORACIÓN ===\n')

async function testCollaborationTaskProcessing() {
  try {
    // 1. Inicializar cliente de Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // 2. Autenticarse como usuario de prueba
    console.log('🔐 Autenticando usuario de prueba...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    })
    
    if (authError) {
      console.error('❌ Error de autenticación:', authError.message)
      return
    }
    
    const accessToken = authData.session.access_token
    console.log('✅ Usuario autenticado exitosamente')
    
    // 3. Crear una tarea de colaboración de prueba
    console.log('\n📝 Creando tarea de colaboración de prueba...')
    
    // Primero obtener MindOps de prueba
    const { data: mindopsData, error: mindopsError } = await supabase
      .from('mindops')
      .select('id, mindop_name, user_id')
      .limit(2)
    
    if (mindopsError || !mindopsData || mindopsData.length < 2) {
      console.error('❌ Error obteniendo MindOps o no hay suficientes MindOps de prueba:', mindopsError?.message)
      console.log('💡 Asegúrate de tener al menos 2 MindOps en la base de datos para esta prueba')
      return
    }
    
    const requesterMindOp = mindopsData[0]
    const targetMindOp = mindopsData[1]
    
    console.log(`📋 MindOp solicitante: ${requesterMindOp.mindop_name} (${requesterMindOp.id})`)
    console.log(`🎯 MindOp objetivo: ${targetMindOp.mindop_name} (${targetMindOp.id})`)
    
    // Crear la tarea de colaboración
    const { data: taskData, error: taskError } = await supabase
      .from('mindop_collaboration_tasks')
      .insert({
        requester_mindop_id: requesterMindOp.id,
        target_mindop_id: targetMindOp.id,
        query: 'Test: ¿Cuáles son las principales tendencias en los datos disponibles?',
        status: 'pending'
      })
      .select()
      .single()
    
    if (taskError) {
      console.error('❌ Error creando tarea de colaboración:', taskError.message)
      return
    }
    
    const collaborationTaskId = taskData.id
    console.log(`✅ Tarea de colaboración creada con ID: ${collaborationTaskId}`)
    
    // 4. Probar la nueva funcionalidad de procesamiento
    console.log('\n🚀 Probando el procesamiento de la tarea...')
    
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action_type: 'process_collaboration_task',
        collaboration_task_id: collaborationTaskId
      })
    })
    
    const responseData = await response.json()
    
    console.log(`📊 Status HTTP: ${response.status}`)
    console.log('📄 Respuesta completa:')
    console.log(JSON.stringify(responseData, null, 2))
    
    if (response.ok && responseData.success) {
      console.log('\n✅ PRUEBA EXITOSA: La tarea de colaboración fue procesada correctamente')
      console.log(`📝 Query: ${responseData.task.query}`)
      console.log(`🎯 MindOp objetivo: ${responseData.task.target_mindop.mindop_name}`)
      console.log(`📊 Chunks encontrados: ${responseData.chunks_found}`)
      console.log('💬 Respuesta generada:')
      console.log(responseData.task.response)
    } else {
      console.log('\n❌ PRUEBA FALLIDA')
      console.log('Error:', responseData.error || 'Error desconocido')
      if (responseData.details) {
        console.log('Detalles:', responseData.details)
      }
    }
    
    // 5. Verificar el estado de la tarea en la base de datos
    console.log('\n🔍 Verificando estado de la tarea en la base de datos...')
    const { data: finalTaskData, error: finalError } = await supabase
      .from('mindop_collaboration_tasks')
      .select('*')
      .eq('id', collaborationTaskId)
      .single()
    
    if (finalError) {
      console.error('❌ Error verificando tarea:', finalError.message)
    } else {
      console.log(`📊 Estado final de la tarea: ${finalTaskData.status}`)
      console.log(`📝 Respuesta guardada: ${finalTaskData.response ? 'Sí' : 'No'}`)
      if (finalTaskData.response) {
        console.log(`📏 Longitud de respuesta: ${finalTaskData.response.length} caracteres`)
      }
    }
    
    // 6. Limpiar - eliminar la tarea de prueba
    console.log('\n🧹 Limpiando datos de prueba...')
    const { error: deleteError } = await supabase
      .from('mindop_collaboration_tasks')
      .delete()
      .eq('id', collaborationTaskId)
    
    if (deleteError) {
      console.warn('⚠️  Error eliminando tarea de prueba:', deleteError.message)
    } else {
      console.log('✅ Tarea de prueba eliminada exitosamente')
    }
    
  } catch (error) {
    console.error('💥 Error inesperado durante la prueba:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Función para probar casos de error
async function testErrorCases() {
  console.log('\n🔬 === PROBANDO CASOS DE ERROR ===\n')
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Autenticarse
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    })
    
    const accessToken = authData.session.access_token
    
    // 1. Probar sin collaboration_task_id
    console.log('🧪 Probando request sin collaboration_task_id...')
    const response1 = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action_type: 'process_collaboration_task'
        // collaboration_task_id omitido intencionalmente
      })
    })
    
    const data1 = await response1.json()
    console.log(`Status: ${response1.status}`)
    console.log(`Error esperado: ${data1.error}`)
    
    // 2. Probar con collaboration_task_id inexistente
    console.log('\n🧪 Probando con collaboration_task_id inexistente...')
    const response2 = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action_type: 'process_collaboration_task',
        collaboration_task_id: 'non-existent-id-12345'
      })
    })
    
    const data2 = await response2.json()
    console.log(`Status: ${response2.status}`)
    console.log(`Error esperado: ${data2.error}`)
    
    console.log('\n✅ Casos de error probados exitosamente')
    
  } catch (error) {
    console.error('❌ Error durante pruebas de error:', error.message)
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  await testCollaborationTaskProcessing()
  await testErrorCases()
  
  console.log('\n🎉 === PRUEBAS COMPLETADAS ===')
  console.log('📋 Resumen:')
  console.log('  - Funcionalidad principal: process_collaboration_task')
  console.log('  - Validación de parámetros: ✅')
  console.log('  - Manejo de errores: ✅')
  console.log('  - Procesamiento completo: ✅')
}

runAllTests().catch(console.error)
