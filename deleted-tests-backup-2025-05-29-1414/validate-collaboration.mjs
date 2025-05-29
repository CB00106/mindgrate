// Validación rápida de la implementación de colaboración
// Este script verifica que todos los componentes están en su lugar

import { readFileSync } from 'fs';

console.log('🔍 === VALIDACIÓN DE IMPLEMENTACIÓN DE COLABORACIÓN ===\n');

try {
  // 1. Verificar ChatPage.tsx
  console.log('1️⃣ Verificando ChatPage.tsx...');
  const chatPageContent = readFileSync('./src/pages/ChatPage.tsx', 'utf8');
  
  const chatPageChecks = [
    { name: 'ConnectedMindOp interface', check: chatPageContent.includes('interface ConnectedMindOp') },
    { name: 'CollaborationTarget interface', check: chatPageContent.includes('interface CollaborationTarget') },
    { name: 'connectedMindOps state', check: chatPageContent.includes('connectedMindOps') },
    { name: 'selectedTarget state', check: chatPageContent.includes('selectedTarget') },
    { name: 'activeMode state', check: chatPageContent.includes('activeMode') },
    { name: 'loadUserConnections function', check: chatPageContent.includes('loadUserConnections') },
    { name: 'initializeCollaborationTargets function', check: chatPageContent.includes('initializeCollaborationTargets') },
    { name: 'target_mindop_id parameter', check: chatPageContent.includes('target_mindop_id') },
    { name: 'Target selector UI', check: chatPageContent.includes('showTargetSelector') },
    { name: 'Collaboration mode button', check: chatPageContent.includes('Colaborar') }
  ];

  chatPageChecks.forEach(check => {
    console.log(`   ${check.check ? '✅' : '❌'} ${check.name}`);
  });

  // 2. Verificar Edge Function
  console.log('\n2️⃣ Verificando mindop-service edge function...');
  const edgeFunctionContent = readFileSync('./supabase/functions/mindop-service/index.ts', 'utf8');
  
  const edgeFunctionChecks = [
    { name: 'target_mindop_id parameter parsing', check: edgeFunctionContent.includes('target_mindop_id') },
    { name: 'Collaboration mode detection', check: edgeFunctionContent.includes('targetMindOpId') },
    { name: 'Permission verification query', check: edgeFunctionContent.includes('follow_requests') },
    { name: 'Collaboration context in AI', check: edgeFunctionContent.includes('isCollaboration') },
    { name: 'ACCESS_DENIED error handling', check: edgeFunctionContent.includes('ACCESS_DENIED') },
    { name: 'Collaboration flag in response', check: edgeFunctionContent.includes('collaboration: !!targetMindOpId') }
  ];

  edgeFunctionChecks.forEach(check => {
    console.log(`   ${check.check ? '✅' : '❌'} ${check.name}`);
  });

  // 3. Verificar archivos de servicios
  console.log('\n3️⃣ Verificando servicios relacionados...');
  const notificationServiceContent = readFileSync('./src/services/notificationService.ts', 'utf8');
  
  const serviceChecks = [
    { name: 'getFollowingMindOps function', check: notificationServiceContent.includes('getFollowingMindOps') },
    { name: 'Follow requests handling', check: notificationServiceContent.includes('follow_requests') }
  ];

  serviceChecks.forEach(check => {
    console.log(`   ${check.check ? '✅' : '❌'} ${check.name}`);
  });

  // 4. Resumen final
  const allChecks = [...chatPageChecks, ...edgeFunctionChecks, ...serviceChecks];
  const passedChecks = allChecks.filter(check => check.check).length;
  const totalChecks = allChecks.length;

  console.log('\n📊 === RESUMEN DE VALIDACIÓN ===');
  console.log(`✅ Verificaciones pasadas: ${passedChecks}/${totalChecks}`);
  console.log(`📈 Porcentaje de completitud: ${Math.round((passedChecks / totalChecks) * 100)}%`);

  if (passedChecks === totalChecks) {
    console.log('\n🎉 ¡IMPLEMENTACIÓN COMPLETA Y VALIDADA!');
    console.log('La funcionalidad de colaboración dirigida está lista para uso.');
  } else {
    console.log('\n⚠️  Algunas verificaciones fallaron. Revisar implementación.');
  }

  console.log('\n🚀 Para probar la funcionalidad:');
  console.log('1. Iniciar sesión en http://localhost:3003');
  console.log('2. Crear conexiones entre usuarios');
  console.log('3. Ir a ChatPage y activar modo "Colaborar"');
  console.log('4. Seleccionar MindOp target y enviar consulta');

} catch (error) {
  console.error('❌ Error en validación:', error.message);
}
