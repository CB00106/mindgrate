# Script para instalar Supabase CLI y actualizar variables de entorno

Write-Host "🔧 === INSTALANDO SUPABASE CLI Y ACTUALIZANDO ENTORNO ===" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "📋 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no encontrado. Instálalo desde: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Verificar npm
Write-Host "📋 Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Instalando Supabase CLI..." -ForegroundColor Yellow
try {
    npm install -g supabase
    Write-Host "✅ Supabase CLI instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Error instalando Supabase CLI: $_" -ForegroundColor Red
    Write-Host "💡 Intenta ejecutar PowerShell como administrador" -ForegroundColor Yellow
    exit 1
}

# Verificar instalación
Write-Host "📋 Verificando instalación..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error verificando Supabase CLI" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔑 Iniciando sesión en Supabase..." -ForegroundColor Yellow
Write-Host "💡 Se abrirá una ventana del navegador para autenticarte" -ForegroundColor Cyan

try {
    supabase login
    Write-Host "✅ Sesión iniciada en Supabase" -ForegroundColor Green
} catch {
    Write-Host "❌ Error iniciando sesión: $_" -ForegroundColor Red
    Write-Host "💡 Inicia sesión manualmente con: supabase login" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📁 Verificando que estamos en el directorio del proyecto..." -ForegroundColor Yellow

# Verificar que existe supabase/config.toml
if (-not (Test-Path "supabase\config.toml")) {
    Write-Host "❌ No se encontró supabase/config.toml" -ForegroundColor Red
    Write-Host "💡 Ejecuta: supabase init" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Proyecto Supabase encontrado" -ForegroundColor Green
}

# Leer variables del .env
Write-Host ""
Write-Host "📋 Leyendo variables del archivo .env..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No se encontró el archivo .env" -ForegroundColor Red
    exit 1
}

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

if (-not $openaiKey) {
    Write-Host "❌ Error: OPENAI_API_KEY no encontrada en .env" -ForegroundColor Red
    exit 1
}

if (-not $geminiKey) {
    Write-Host "❌ Error: GEMINI_API_KEY no encontrada en .env" -ForegroundColor Red
    exit 1
}

Write-Host "✅ OpenAI API Key: $($openaiKey.Substring(0, 20))..." -ForegroundColor Green
Write-Host "✅ Gemini API Key: $($geminiKey.Substring(0, 20))..." -ForegroundColor Green

Write-Host ""
Write-Host "🔧 Actualizando variables de entorno en Supabase..." -ForegroundColor Yellow

# Actualizar OpenAI API Key
Write-Host "📝 Configurando OPENAI_API_KEY..." -ForegroundColor Cyan
try {
    supabase secrets set OPENAI_API_KEY="$openaiKey"
    Write-Host "✅ OPENAI_API_KEY configurada" -ForegroundColor Green
} catch {
    Write-Host "❌ Error configurando OPENAI_API_KEY: $_" -ForegroundColor Red
}

# Actualizar Gemini API Key  
Write-Host "📝 Configurando GEMINI_API_KEY..." -ForegroundColor Cyan
try {
    supabase secrets set GEMINI_API_KEY="$geminiKey"
    Write-Host "✅ GEMINI_API_KEY configurada" -ForegroundColor Green
} catch {
    Write-Host "❌ Error configurando GEMINI_API_KEY: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Verificando variables configuradas..." -ForegroundColor Yellow
try {
    supabase secrets list
} catch {
    Write-Host "❌ Error listando variables" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Redesplegando funciones..." -ForegroundColor Yellow

# Redesplegar mindop-service
if (Test-Path "supabase\functions\mindop-service") {
    Write-Host "📝 Redesplegando mindop-service..." -ForegroundColor Cyan
    try {
        supabase functions deploy mindop-service
        Write-Host "✅ mindop-service redesplegada" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error redesplegando mindop-service: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Función mindop-service no encontrada" -ForegroundColor Yellow
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
} else {
    Write-Host "💡 collaboration-worker no existe (opcional)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎯 === PROCESO COMPLETADO ===" -ForegroundColor Cyan
Write-Host "✅ Supabase CLI instalado" -ForegroundColor Green
Write-Host "✅ Variables de entorno configuradas" -ForegroundColor Green
Write-Host "✅ Funciones redesplegadas" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Ahora puedes probar la funcionalidad de chat en tu aplicación" -ForegroundColor Yellow
Write-Host ""
