// Script para probar rápidamente una clave de OpenAI API
// Uso: node test-openai-key.js TU_CLAVE_AQUI

const testKey = process.argv[2];

if (!testKey) {
    console.log('❌ Error: Proporciona una clave de API como argumento');
    console.log('📝 Uso: node test-openai-key.js sk-proj-tu_clave_aqui');
    process.exit(1);
}

console.log('🧪 Probando clave de OpenAI API...');
console.log('🔑 Clave:', testKey.substring(0, 20) + '...' + testKey.substring(testKey.length - 10));

fetch('https://api.openai.com/v1/models', {
    headers: {
        'Authorization': `Bearer ${testKey}`,
        'Content-Type': 'application/json'
    }
})
.then(response => {
    console.log('📡 Status:', response.status);
    
    if (response.ok) {
        console.log('✅ Clave de OpenAI API es VÁLIDA');
        return response.json();
    } else {
        console.log('❌ Clave de OpenAI API es INVÁLIDA');
        return response.text();
    }
})
.then(data => {
    if (typeof data === 'object' && data.data) {
        console.log('🎯 Modelos disponibles:', data.data.length);
        console.log('📋 Algunos modelos:', data.data.slice(0, 3).map(m => m.id).join(', '));
    } else {
        console.log('❌ Respuesta de error:', data);
    }
})
.catch(error => {
    console.error('💥 Error de conexión:', error.message);
});
