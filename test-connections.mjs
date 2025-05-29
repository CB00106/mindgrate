import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://khzbklcvmlkhrraibksx.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoemJrbGN2bWxraHJyYWlia3N4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzc2OTk2NCwiZXhwIjoyMDYzMzQ1OTY0fQ.7JrhhYkfe0JPeo-pEEE0J9GDyxNEObHJFyxzZH_4iQc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Verificando conexiones aprobadas...')

try {
  // Obtener conexiones aprobadas
  const { data: connections, error } = await supabase
    .from('follow_requests')
    .select(`
      id,
      status,
      requester_mindop:requester_mindop_id (
        id,
        mindop_name,
        user_id
      ),
      target_mindop:target_mindop_id (
        id,
        mindop_name,
        user_id
      )
    `)
    .eq('status', 'approved')

  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }

  console.log(`✅ Conexiones aprobadas encontradas: ${connections.length}`)
  
  connections.forEach((conn, index) => {
    console.log(`\n📋 Conexión ${index + 1}:`)
    console.log(`   ID: ${conn.id}`)
    console.log(`   Requester: ${conn.requester_mindop.mindop_name} (ID: ${conn.requester_mindop.id})`)
    console.log(`   Target: ${conn.target_mindop.mindop_name} (ID: ${conn.target_mindop.id})`)
    console.log(`   Status: ${conn.status}`)
  })

  // También verificar todos los MindOps existentes
  const { data: mindops, error: mindopsError } = await supabase
    .from('mindops')
    .select('id, mindop_name, user_id')

  if (!mindopsError && mindops) {
    console.log(`\n🎯 MindOps totales en el sistema: ${mindops.length}`)
    mindops.forEach((mindop, index) => {
      console.log(`   ${index + 1}. ${mindop.mindop_name} (ID: ${mindop.id}, User: ${mindop.user_id})`)
    })
  }

} catch (error) {
  console.error('❌ Error de conexión:', error)
  process.exit(1)
}
