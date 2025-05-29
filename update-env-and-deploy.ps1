# Script para actualizar variables de entorno en Supabase y redesplegar funciones
# Ejecutar después de corregir las claves API

Write-Host "🔧 === ACTUALIZANDO VARIABLES DE ENTORNO Y REDESPLEGANDO ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el archivo .env
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No se encontró el archivo .env" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Leyendo variables del archivo .env..." -ForegroundColor Yellow

# Leer variables del .env
$envContent = Get-Content ".env"
$openaiKey = ""
$geminiKey = ""

foreach ($line in $envContent) {
    if ($line -match "^OPENAI_API_KEY=(.+)$") {
        $openaiKey = $matches[1]
    }
    if ($line -match "^GEMINI_API_KEY=(.+)$") {
        $geminiKey = $matches[1]
    }
}

# Verificar que las claves están presentes
if (-not $openaiKey) {
    Write-Host "❌ Error: OPENAI_API_KEY no encontrada en .env" -ForegroundColor Red
    exit 1
}

if (-not $geminiKey) {
    Write-Host "❌ Error: GEMINI_API_KEY no encontrada en .env" -ForegroundColor Red
    exit 1
}

Write-Host "✅ OpenAI API Key encontrada: $($openaiKey.Substring(0, 20))..." -ForegroundColor Green
Write-Host "✅ Gemini API Key encontrada: $($geminiKey.Substring(0, 20))..." -ForegroundColor Green
Write-Host ""

# Verificar Supabase CLI
Write-Host "📋 Verificando Supabase CLI..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Actualizando variables de entorno en Supabase..." -ForegroundColor Yellow

# Actualizar OpenAI API Key
Write-Host "📝 Actualizando OPENAI_API_KEY..." -ForegroundColor Cyan
try {
    supabase secrets set OPENAI_API_KEY="$openaiKey"
    Write-Host "✅ OPENAI_API_KEY actualizada" -ForegroundColor Green
} catch {
    Write-Host "❌ Error actualizando OPENAI_API_KEY: $_" -ForegroundColor Red
    exit 1
}

# Actualizar Gemini API Key
Write-Host "📝 Actualizando GEMINI_API_KEY..." -ForegroundColor Cyan
try {
    supabase secrets set GEMINI_API_KEY="$geminiKey"
    Write-Host "✅ GEMINI_API_KEY actualizada" -ForegroundColor Green
} catch {
    Write-Host "❌ Error actualizando GEMINI_API_KEY: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Redesplegando funciones Edge..." -ForegroundColor Yellow

# Redesplegar mindop-service
Write-Host "📝 Redesplegando mindop-service..." -ForegroundColor Cyan
try {
    supabase functions deploy mindop-service
    Write-Host "✅ mindop-service redesplegada" -ForegroundColor Green
} catch {
    Write-Host "❌ Error redesplegando mindop-service: $_" -ForegroundColor Red
}

# Redesplegar collaboration-worker si existe
if (Test-Path "supabase\functions\collaboration-worker") {
    Write-Host "📝 Redesplegando collaboration-worker..." -ForegroundColor Cyan
    try {
        supabase functions deploy collaboration-worker
        Write-Host "✅ collaboration-worker redesplegada" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error redesplegando collaboration-worker: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🧪 === PROBANDO FUNCIÓN ACTUALIZADA ===" -ForegroundColor Cyan

# Crear script de prueba
$testScript = @'
// Test script para verificar que la función funciona correctamente
const SUPABASE_URL = 'https://khzbklcvmlkhrraibksx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoemJrbGN2bWxraHJyYWlia3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3Njk5NjQsImV4cCI6MjA2MzM0NTk2NH0.-f3mBw4m5YDn-mPA_JPjQ7PeNNugMweFXA-IbavMR6o';

console.log('🧪 Probando función mindop-service actualizada...');

fetch(`${SUPABASE_URL}/functions/v1/mindop-service`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        query: 'Test de función actualizada'
    })
})
.then(response => {
    console.log('📡 Status:', response.status);
    return response.json();
})
.then(data => {
    if (data.success) {
        console.log('✅ Función funcionando correctamente');
        console.log('🎯 Respuesta:', data.response ? 'Generada' : 'No generada');
    } else if (data.error) {
        console.log('❌ Error en función:', data.error);
        if (data.details) {
            console.log('📋 Detalles:', data.details);
        }
    }
})
.catch(error => {
    console.error('💥 Error de conexión:', error.message);
});
'@

$testScript | Out-File -FilePath "test-updated-function.js" -Encoding UTF8

Write-Host "📝 Ejecutando prueba..." -ForegroundColor Cyan
try {
    node "test-updated-function.js"
} catch {
    Write-Host "❌ Error ejecutando prueba. ¿Tienes Node.js instalado?" -ForegroundColor Red
} finally {
    Start-Sleep -Seconds 2
    Remove-Item "test-updated-function.js" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "🎯 === RESUMEN ===" -ForegroundColor Cyan
Write-Host "✅ Variables de entorno actualizadas en Supabase" -ForegroundColor Green
Write-Host "✅ Funciones Edge redesplegadas" -ForegroundColor Green
Write-Host "🧪 Prueba ejecutada - revisa los resultados arriba" -ForegroundColor White
Write-Host ""
Write-Host "💡 Si aún hay errores, verifica:" -ForegroundColor Yellow
Write-Host "   - Que las claves API son válidas" -ForegroundColor White
Write-Host "   - Que tienes permisos en OpenAI/Gemini" -ForegroundColor White
Write-Host "   - Que la base de datos está configurada correctamente" -ForegroundColor White
Write-Host ""
