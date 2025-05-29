import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = 'https://khzbklcvmlkhrraibksx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoemJrbGN2bWxraHJyYWlia3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5NjM1NDEsImV4cCI6MjA0OTUzOTU0MX0.vbzYGV8HDXL9sXI9g7vl1SrXqBWj2z6T-Rqc0tLNW2c'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testMetadataCompatibility() {
  console.log('🧪 === PRUEBA DE COMPATIBILIDAD METADATA ===\n')
  
  try {
    // Paso 1: Autenticarse
    console.log('👤 Paso 1: Autenticación...')
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    })
    
    if (authError) {
      console.error('❌ Error de autenticación:', authError.message)
      return
    }
    
    console.log(`✅ Autenticado como: ${authData.user.id}`)
    
    // Paso 2: Crear una tarea de colaboración con metadata
    console.log('\n📝 Paso 2: Creando tarea de colaboración con metadata...')
    
    const testMetadata = {
      test_purpose: 'compatibility_check',
      created_by: 'metadata_test_script',
      timestamp: new Date().toISOString(),
      features: ['metadata_support', 'jsonb_null_compatible'],
      version: '1.0'
    }
    
    const { data: taskData, error: insertError } = await supabase
      .from('mindop_collaboration_tasks')
      .insert({
        requester_mindop_id: authData.user.id,
        target_mindop_id: authData.user.id, // Mismo usuario para prueba
        query: 'Test de compatibilidad con metadata JSONB NULL',
        status: 'pending',
        priority: 'normal',
        metadata: testMetadata
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Error insertando tarea:', insertError.message)
      return
    }
    
    console.log('✅ Tarea creada exitosamente con metadata:')
    console.log(`   - ID: ${taskData.id}`)
    console.log(`   - Status: ${taskData.status}`)
    console.log(`   - Metadata incluido: ${JSON.stringify(testMetadata, null, 2)}`)
    
    // Paso 3: Probar actualización de metadata
    console.log('\n🔄 Paso 3: Probando actualización de metadata...')
    
    const updatedMetadata = {
      ...testMetadata,
      updated_at: new Date().toISOString(),
      processing_status: 'test_update',
      additional_info: 'Metadata update test successful'
    }
    
    const { data: updateData, error: updateError } = await supabase
      .from('mindop_collaboration_tasks')
      .update({
        metadata: updatedMetadata,
        status: 'processing'
      })
      .eq('id', taskData.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Error actualizando metadata:', updateError.message)
      return
    }
    
    console.log('✅ Metadata actualizada exitosamente:')
    console.log(`   - Status: ${updateData.status}`)
    console.log(`   - Metadata actualizada: ${JSON.stringify(updatedMetadata, null, 2)}`)
    
    // Paso 4: Probar inserción sin metadata (NULL)
    console.log('\n📄 Paso 4: Probando inserción sin metadata (NULL)...')
    
    const { data: nullTaskData, error: nullInsertError } = await supabase
      .from('mindop_collaboration_tasks')
      .insert({
        requester_mindop_id: authData.user.id,
        target_mindop_id: authData.user.id,
        query: 'Test sin metadata - campo NULL',
        status: 'pending',
        priority: 'low'
        // metadata: omitido intencionalmente
      })
      .select()
      .single()
    
    if (nullInsertError) {
      console.error('❌ Error insertando tarea sin metadata:', nullInsertError.message)
      return
    }
    
    console.log('✅ Tarea sin metadata creada exitosamente:')
    console.log(`   - ID: ${nullTaskData.id}`)
    console.log(`   - Status: ${nullTaskData.status}`)
    console.log(`   - Metadata: ${nullTaskData.metadata || 'NULL'}`)
    
    // Paso 5: Limpiar tareas de prueba
    console.log('\n🧹 Paso 5: Limpiando tareas de prueba...')
    
    const { error: deleteError } = await supabase
      .from('mindop_collaboration_tasks')
      .delete()
      .in('id', [taskData.id, nullTaskData.id])
    
    if (deleteError) {
      console.error('❌ Error eliminando tareas de prueba:', deleteError.message)
    } else {
      console.log('✅ Tareas de prueba eliminadas')
    }
    
    // Resumen final
    console.log('\n🎉 === RESUMEN DE COMPATIBILIDAD ===')
    console.log('✅ Inserción con metadata JSONB: EXITOSA')
    console.log('✅ Actualización de metadata: EXITOSA')
    console.log('✅ Inserción sin metadata (NULL): EXITOSA')
    console.log('✅ La columna metadata es totalmente compatible')
    console.log('\n📋 Conclusión: La implementación actual está 100% preparada para la nueva columna metadata JSONB NULL')
    
  } catch (error) {
    console.error('💥 Error inesperado:', error.message)
  }
}

// Ejecutar la prueba
testMetadataCompatibility()
