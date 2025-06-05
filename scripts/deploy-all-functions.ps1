# Script para desplegar todas las Edge Functions con Gemini 2.5 Flash
# Actualizado para usar el nuevo modelo gemini-2.5-flash-preview-05-20

Write-Host "🚀 === DEPLOYING ALL EDGE FUNCTIONS ===" -ForegroundColor Green
Write-Host "🤖 Usando modelo: gemini-2.5-flash-preview-05-20" -ForegroundColor Cyan

# Cambiar al directorio del proyecto
$projectPath = "c:\Users\cesar\OneDrive\Documents\MVP\MVP-2\mindgrate"
Set-Location $projectPath

# Verificar que estamos en el directorio correcto
if (!(Test-Path "supabase\functions")) {
    Write-Host "❌ No se encontró el directorio supabase\functions" -ForegroundColor Red
    Write-Host "📍 Directorio actual: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Directorio correcto encontrado" -ForegroundColor Green
Write-Host "📍 Ubicación: $projectPath" -ForegroundColor Yellow

# Lista de funciones a desplegar
$functions = @(
    "mindop-service",
    "collaboration-worker", 
    "ingest-csv-data",
    "search-mindops",
    "vector-service",
    "collection-service",
    "vector-analytics"
)

# Verificar que las funciones existen
Write-Host "`n🔍 Verificando funciones existentes..." -ForegroundColor Yellow
$existingFunctions = @()

foreach ($func in $functions) {
    $funcPath = "supabase\functions\$func\index.ts"
    if (Test-Path $funcPath) {
        Write-Host "✅ $func" -ForegroundColor Green
        $existingFunctions += $func
    } else {
        Write-Host "⚠️  $func (no encontrada)" -ForegroundColor Yellow
    }
}

if ($existingFunctions.Count -eq 0) {
    Write-Host "❌ No se encontraron funciones para desplegar" -ForegroundColor Red
    exit 1
}

Write-Host "`n📊 Funciones encontradas: $($existingFunctions.Count)" -ForegroundColor Cyan

# Verificar variables de entorno
Write-Host "`n🔑 Verificando variables de entorno..." -ForegroundColor Yellow

$envIssues = @()

# Verificar archivo .env local
if (Test-Path ".env") {
    Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green
    $envContent = Get-Content ".env" -Raw
    
    $requiredVars = @("OPENAI_API_KEY", "GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
    
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "✅ $var configurada" -ForegroundColor Green
        } else {
            Write-Host "❌ $var no encontrada" -ForegroundColor Red
            $envIssues += $var
        }
    }
} else {
    Write-Host "⚠️  Archivo .env no encontrado (normal para deploy)" -ForegroundColor Yellow
}

# Mostrar comandos de deploy
Write-Host "`n🚀 === COMANDOS DE DEPLOY ===" -ForegroundColor Green
Write-Host "Ejecuta estos comandos uno por uno:`n" -ForegroundColor Yellow

# Proyecto Supabase (extraído del script anterior)
$projectRef = "khzbklcvmlkhrraibksx"

foreach ($func in $existingFunctions) {
    Write-Host "# Desplegar $func" -ForegroundColor Cyan
    Write-Host "npx supabase functions deploy $func --project-ref $projectRef" -ForegroundColor White
    Write-Host ""
}

# Comando para desplegar todas las funciones de una vez
Write-Host "`n🎯 O despliega todas de una vez:" -ForegroundColor Magenta
$allFunctions = $existingFunctions -join " "
Write-Host "npx supabase functions deploy $allFunctions --project-ref $projectRef" -ForegroundColor White

# Configuración de variables de entorno en Supabase
if ($envIssues.Count -gt 0) {
    Write-Host "`n⚠️  === CONFIGURAR VARIABLES DE ENTORNO ===" -ForegroundColor Yellow
    Write-Host "Asegúrate de configurar estas variables en Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "https://app.supabase.com/project/$projectRef/settings/functions" -ForegroundColor Cyan
    
    foreach ($var in $envIssues) {
        Write-Host "- $var" -ForegroundColor Red
    }
}

# Comandos de verificación
Write-Host "`n🧪 === VERIFICACIÓN POST-DEPLOY ===" -ForegroundColor Green
Write-Host "Verifica que las funciones funcionan:" -ForegroundColor Yellow

foreach ($func in $existingFunctions) {
    Write-Host "`n# Verificar $func" -ForegroundColor Cyan
    Write-Host "curl -X OPTIONS `"https://$projectRef.supabase.co/functions/v1/$func`"" -ForegroundColor White
}

# Comandos de test específicos
Write-Host "`n🎯 === TESTS ESPECÍFICOS ===" -ForegroundColor Green

# Test para mindop-service (principal función actualizada)
if ($existingFunctions -contains "mindop-service") {
    Write-Host "`n# Test mindop-service con nuevo modelo Gemini" -ForegroundColor Cyan
    Write-Host @"
curl -X POST "https://$projectRef.supabase.co/functions/v1/mindop-service" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "action": "query",
    "query": "Test con nuevo modelo Gemini 2.5 Flash"
  }'
"@ -ForegroundColor White
}

# Test para collaboration-worker
if ($existingFunctions -contains "collaboration-worker") {
    Write-Host "`n# Test collaboration-worker" -ForegroundColor Cyan
    Write-Host @"
curl -X POST "https://$projectRef.supabase.co/functions/v1/collaboration-worker" \
  -H "Content-Type: application/json" \
  -d '{}'
"@ -ForegroundColor White
}

Write-Host "`n✨ === RESUMEN ===" -ForegroundColor Green
Write-Host "📊 Funciones a desplegar: $($existingFunctions.Count)" -ForegroundColor Cyan
Write-Host "🤖 Modelo Gemini: gemini-2.5-flash-preview-05-20" -ForegroundColor Cyan
Write-Host "🔗 Proyecto: $projectRef" -ForegroundColor Cyan

if ($envIssues.Count -eq 0) {
    Write-Host "✅ Variables de entorno: OK" -ForegroundColor Green
} else {
    Write-Host "⚠️  Variables de entorno: $($envIssues.Count) por configurar" -ForegroundColor Yellow
}

Write-Host "`n🚀 ¡Listo para desplegar!" -ForegroundColor Green
Write-Host "💡 Tip: Copia y pega los comandos de arriba uno por uno" -ForegroundColor Yellow
