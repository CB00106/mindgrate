// Test simple para colaboración asíncrona
console.log('🚀 Iniciando prueba de colaboración asíncrona...')

// Test directo del worker
async function testWorker() {
  try {
    console.log('🤖 Probando worker de colaboración...')
    
    const response = await fetch('https://khzbklcvmlkhrraibksx.supabase.co/functions/v1/collaboration-worker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })
    
    console.log('📊 Status:', response.status)
    const result = await response.json()
    console.log('📋 Resultado:', JSON.stringify(result, null, 2))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testWorker()
