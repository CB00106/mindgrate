// Script para limpiar logs en ChatPage.tsx
// Se ejecutará manualmente para convertir todos los console.log a logger

const replacements = [
  // Logs de colaboración
  { search: "console.log('🔄 Iniciando polling para respuestas de colaboración...')", replace: "logger.collaboration('Iniciando polling para respuestas de colaboración...')" },
  { search: "console.log('🔄 Cargando conexiones para MindOp:', userMindOpId)", replace: "logger.debug('ChatPage', 'Cargando conexiones para MindOp:', userMindOpId)" },
  { search: "console.log('📋 Conexiones obtenidas:', followingData)", replace: "logger.debug('ChatPage', 'Conexiones obtenidas:', followingData)" },
  { search: "console.log('✅ Conexiones cargadas:', connectedMindOps.length)", replace: "logger.debug('ChatPage', 'Conexiones cargadas:', connectedMindOps.length)" },
  { search: "console.error('❌ Error cargando conexiones:', error)", replace: "logger.error('Error cargando conexiones:', error)" },
  
  // Logs de targets
  { search: "console.error('Error obteniendo propio MindOp:', error)", replace: "logger.error('Error obteniendo propio MindOp:', error)" },
  { search: "console.error('Error inicializando targets:', error)", replace: "logger.error('Error inicializando targets:', error)" },
  
  // Logs de respuestas de colaboración
  { search: "console.log('🔄 Verificando respuestas de colaboración...', Array.from(pendingCollaborationTasks))", replace: "logger.collaboration('Verificando respuestas de colaboración...', Array.from(pendingCollaborationTasks))" },
  { search: "console.error('❌ Error verificando respuestas de colaboración:', error)", replace: "logger.error('Error verificando respuestas de colaboración:', error)" },
  { search: "console.log('📭 No hay respuestas nuevas')", replace: "logger.debug('ChatPage', 'No hay respuestas nuevas')" },
  { search: "console.log(`✅ Encontradas \\${completedTasks.length} respuestas nuevas`)", replace: "logger.collaboration(`Encontradas \\${completedTasks.length} respuestas nuevas`)" },
  { search: "console.error('❌ Error en checkForCollaborationResponses:', error)", replace: "logger.error('Error en checkForCollaborationResponses:', error)" },
  
  // Logs de procesamiento de respuestas
  { search: "console.warn('⚠️ Tarea sin respuesta o target_mindop:', task.id)", replace: "logger.warn('Tarea sin respuesta o target_mindop:', task.id)" },
  { search: "console.log(`📨 Procesando respuesta de \\${task.target_mindop.mindop_name}:`, task.response.substring(0, 100) + '...')", replace: "logger.collaboration(`Procesando respuesta de \\${task.target_mindop.mindop_name}:`, task.response.substring(0, 100) + '...')" },
  { search: "console.error('❌ Error actualizando estado de tarea a completed:', updateError)", replace: "logger.error('Error actualizando estado de tarea a completed:', updateError)" },
  { search: "console.log('✅ Tarea marcada como completada:', task.id)", replace: "logger.debug('ChatPage', 'Tarea marcada como completada:', task.id)" },
  { search: "console.error('❌ Error inesperado actualizando estado de tarea:', error)", replace: "logger.error('Error inesperado actualizando estado de tarea:', error)" },
  
  // Logs de requests
  { search: "console.log(`🔐 [\\${reqId}] Getting session...`)", replace: "logger.request(reqId, 'Getting session...')" },
  { search: "console.log(`🔐 [\\${reqId}] Sesión activa:`, !!session)", replace: "logger.request(reqId, 'Sesión activa:', !!session)" },
  { search: "console.log(`🔑 [\\${reqId}] Token disponible:`, !!session?.access_token)", replace: "logger.request(reqId, 'Token disponible:', !!session?.access_token)" },
  
  // Y muchos más...
];

console.log('Lista de reemplazos para ChatPage.tsx:', replacements.length, 'reemplazos');
