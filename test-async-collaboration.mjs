import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = 'https://khzbklcvmlkhrraibksx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoemJrbGN2bWxraHJyYWlia3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5NjM1NDEsImV4cCI6MjA0OTUzOTU0MX0.vbzYGV8HDXL9sXI9g7vl1SrXqBWj2z6T-Rqc0tLNW2c'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAsyncCollaboration() {
  console.log('🚀 === PRUEBA DE COLABORACIÓN ASÍNCRONA ===\n')
  
  try {
    // Paso 1: Autenticarse con un usuario
    console.log('👤 Paso 1: Autenticación...')
    
    // Intentar login con credenciales de prueba
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    })
    
    if (authError) {
      console.error('❌ Error de autenticación:', authError.message)
      return
    }
    
    if (!authData.user) {
      console.error('❌ No se pudo obtener el usuario')
      return
    }
    
    console.log(`✅ Autenticado como: ${authData.user.id}`)
    
    // Paso 2: Obtener token de autorización
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (!sessionData.session?.access_token) {
      console.error('❌ No se pudo obtener el token de acceso')
      return
    }
    
    const accessToken = sessionData.session.access_token
    console.log('✅ Token de acceso obtenido')
    
    // Paso 3: Buscar MindOps conectados para colaboración
    console.log('\n🔍 Paso 2: Buscando MindOps conectados...')
    
    const { data: connections, error: connectionsError } = await supabase
      .from('follow_requests')
      .select(`
        id,
        target_mindop_id,
        target_mindop:target_mindop_id (
          id,
          mindop_name,
          mindop_description
        )
      `)
      .eq('requester_mindop_id', authData.user.id)
      .eq('status', 'approved')
    
    if (connectionsError) {
      console.error('❌ Error obteniendo conexiones:', connectionsError.message)
      return
    }
    
    if (!connections || connections.length === 0) {
      console.log('📝 No hay conexiones aprobadas disponibles')
      
      // Crear una conexión de prueba si no existe
      console.log('🔧 Creando conexión de prueba...')
      
      // Buscar otro MindOp para conectarse
      const { data: otherMindops, error: mindopsError } = await supabase
        .from('mindops')
        .select('*')
        .neq('user_id', authData.user.id)
        .limit(1)
      
      if (mindopsError || !otherMindops || otherMindops.length === 0) {
        console.error('❌ No hay otros MindOps disponibles para prueba')
        return
      }
      
      const targetMindop = otherMindops[0]
      
      // Crear solicitud de conexión aprobada directamente
      const { data: newConnection, error: connectionError } = await supabase
        .from('follow_requests')
        .insert({
          requester_mindop_id: authData.user.id,
          target_mindop_id: targetMindop.id,
          status: 'approved',
          message: 'Conexión de prueba para colaboración asíncrona'
        })
        .select(`
          id,
          target_mindop_id,
          target_mindop:target_mindop_id (
            id,
            mindop_name,
            mindop_description
          )
        `)
        .single()
      
      if (connectionError) {
        console.error('❌ Error creando conexión de prueba:', connectionError.message)
        return
      }
      
      console.log(`✅ Conexión de prueba creada con MindOp: ${newConnection.target_mindop.mindop_name}`)
      connections.push(newConnection)
    }
    
    const targetMindop = connections[0].target_mindop
    console.log(`✅ Usando MindOp objetivo: ${targetMindop.mindop_name} (${targetMindop.id})`)
    
    // Paso 3: Enviar consulta de colaboración asíncrona
    console.log('\n📤 Paso 3: Enviando consulta de colaboración...')
    
    const collaborationQuery = "¿Cuáles son los principales insights en los datos de este MindOp? ¿Qué patrones interesantes puedes identificar?"
    
    const response = await fetch('https://khzbklcvmlkhrraibksx.supabase.co/functions/v1/mindop-service', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: collaborationQuery,
        target_mindop_id: targetMindop.id
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error en colaboración:', response.status, errorText)
      return
    }
    
    const collaborationResult = await response.json()
    console.log('📋 Resultado de colaboración:')
    console.log(JSON.stringify(collaborationResult, null, 2))
    
    if (collaborationResult.collaboration_task) {
      const taskId = collaborationResult.collaboration_task.id
      console.log(`\n⏳ Tarea de colaboración creada: ${taskId}`)
      console.log('🕐 Esperando procesamiento asíncrono...')
      
      // Paso 4: Ejecutar worker manualmente
      console.log('\n🤖 Paso 4: Ejecutando worker de colaboración...')
      
      const workerResponse = await fetch('https://khzbklcvmlkhrraibksx.supabase.co/functions/v1/collaboration-worker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      
      if (!workerResponse.ok) {
        const workerErrorText = await workerResponse.text()
        console.error('❌ Error ejecutando worker:', workerResponse.status, workerErrorText)
        return
      }
      
      const workerResult = await workerResponse.json()
      console.log('🤖 Resultado del worker:')
      console.log(JSON.stringify(workerResult, null, 2))
      
      // Paso 5: Verificar resultado de la tarea
      console.log('\n🔍 Paso 5: Verificando resultado de la tarea...')
      
      const { data: taskResult, error: taskError } = await supabase
        .from('mindop_collaboration_tasks')
        .select('*')
        .eq('id', taskId)
        .single()
      
      if (taskError) {
        console.error('❌ Error obteniendo resultado de tarea:', taskError.message)
        return
      }
      
      console.log('📊 Estado final de la tarea:')
      console.log(`   - Estado: ${taskResult.status}`)
      console.log(`   - Creada: ${taskResult.created_at}`)
      console.log(`   - Actualizada: ${taskResult.updated_at}`)
      
      if (taskResult.status === 'completed') {
        console.log('✅ ¡Tarea completada exitosamente!')
        console.log('\n📝 RESPUESTA DE COLABORACIÓN:')
        console.log('=' .repeat(60))
        console.log(taskResult.response)
        console.log('=' .repeat(60))
        
        if (taskResult.metadata?.chunks_found) {
          console.log(`\n📊 Chunks procesados: ${taskResult.metadata.chunks_found}`)
        }
      } else if (taskResult.status === 'failed') {
        console.log('❌ Tarea falló')
        console.log(`   - Error: ${taskResult.error_message}`)
      } else {
        console.log(`⏳ Tarea aún en estado: ${taskResult.status}`)
      }
    }
    
    console.log('\n🎉 === PRUEBA COMPLETADA ===')
    
  } catch (error) {
    console.error('💥 Error en la prueba:', error.message)
    console.error(error.stack)
  }
}

// Ejecutar la prueba
testAsyncCollaboration().catch(console.error)
