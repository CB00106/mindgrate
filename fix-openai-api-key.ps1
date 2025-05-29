# Script para verificar y corregir la clave de OpenAI API
# Ingeniero: Ejecuta este script para verificar el estado de las variables de entorno

Write-Host "🔧 === VERIFICACIÓN DE CLAVE OPENAI API ===" -ForegroundColor Cyan
Write-Host ""

# Verificar si Supabase CLI está instalado
Write-Host "📋 Verificando Supabase CLI..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI encontrado: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI no encontrado. Instálalo con: npm install -g supabase" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Verificando variables de entorno actuales..." -ForegroundColor Yellow

# Listar variables de entorno actuales
try {
    Write-Host "🔍 Variables de entorno configuradas:" -ForegroundColor Cyan
    supabase secrets list
} catch {
    Write-Host "❌ Error al listar variables de entorno" -ForegroundColor Red
    Write-Host "💡 Asegúrate de estar autenticado: supabase login" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 === INSTRUCCIONES PARA CORREGIR ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 🌐 Ve a: https://platform.openai.com/account/api-keys" -ForegroundColor White
Write-Host "2. 🔑 Crea una nueva clave API si no tienes una válida" -ForegroundColor White
Write-Host "3. 📋 Copia la clave completa (debe empezar con 'sk-proj-' o 'sk-')" -ForegroundColor White
Write-Host "4. 🔧 Ejecuta el siguiente comando con tu clave real:" -ForegroundColor White
Write-Host ""
Write-Host "   supabase secrets set OPENAI_API_KEY=tu_clave_aqui" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. 🚀 Redespliega la función:" -ForegroundColor White
Write-Host "   supabase functions deploy mindop-service" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Ejemplo de comando completo:" -ForegroundColor Cyan
Write-Host "supabase secrets set OPENAI_API_KEY=sk-proj-abcd1234efgh5678..." -ForegroundColor Green
Write-Host ""

# Verificar conexión a OpenAI (si hay clave configurada)
Write-Host "🧪 ¿Quieres probar la conexión a OpenAI? (y/n): " -ForegroundColor Yellow -NoNewline
$testConnection = Read-Host

if ($testConnection -eq "y" -or $testConnection -eq "Y") {
    Write-Host ""
    Write-Host "📝 Ingresa tu clave de OpenAI para probar (no se guardará): " -ForegroundColor Yellow -NoNewline
    $testKey = Read-Host -AsSecureString
    $plainTestKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($testKey))
    
    if ($plainTestKey) {
        Write-Host "🧪 Probando conexión a OpenAI..." -ForegroundColor Yellow
        
        # Crear script de prueba temporal
        $testScript = @"
const testKey = '$plainTestKey';

console.log('🧪 Probando clave de OpenAI...');

fetch('https://api.openai.com/v1/models', {
    headers: {
        'Authorization': 'Bearer ' + testKey,
        'Content-Type': 'application/json'
    }
})
.then(response => {
    if (response.ok) {
        console.log('✅ Clave de OpenAI es válida');
        return response.json();
    } else {
        console.log('❌ Clave de OpenAI inválida:', response.status);
        return response.text().then(text => Promise.reject(text));
    }
})
.then(data => {
    console.log('🎯 Modelos disponibles:', data.data?.length || 0);
})
.catch(error => {
    console.error('❌ Error:', error);
});
"@
        
        $testScript | Out-File -FilePath "temp-openai-test.js" -Encoding UTF8
        
        try {
            node "temp-openai-test.js"
        } catch {
            Write-Host "❌ Error ejecutando prueba. ¿Tienes Node.js instalado?" -ForegroundColor Red
        } finally {
            Remove-Item "temp-openai-test.js" -ErrorAction SilentlyContinue
        }
    }
}

Write-Host ""
Write-Host "🎯 === PRÓXIMOS PASOS ===" -ForegroundColor Cyan
Write-Host "1. ✅ Configura la clave de OpenAI válida" -ForegroundColor White
Write-Host "2. 🚀 Redespliega la función Edge" -ForegroundColor White
Write-Host "3. 🧪 Prueba la funcionalidad de chat" -ForegroundColor White
Write-Host ""
