# Script para desplegar Edge Function usando npx
# No requiere instalación global de Supabase CLI

Write-Host "🚀 Desplegando Edge Function ingest-csv-data..." -ForegroundColor Green

# Cambiar al directorio del proyecto
Set-Location "c:\Users\cesar\OneDrive\Documents\MVP\Mindgrate-MVP"

# Verificar que existe la función
if (Test-Path "supabase\functions\ingest-csv-data\index.ts") {
    Write-Host "✅ Función encontrada: ingest-csv-data" -ForegroundColor Green
} else {
    Write-Host "❌ No se encontró la función ingest-csv-data" -ForegroundColor Red
    exit 1
}

# Verificar variables de entorno
if (Test-Path ".env") {
    Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "OPENAI_API_KEY") {
        Write-Host "✅ OPENAI_API_KEY configurada" -ForegroundColor Green
    } else {
        Write-Host "❌ OPENAI_API_KEY no encontrada en .env" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Archivo .env no encontrado" -ForegroundColor Red
}

Write-Host "`n📋 Para desplegar la función, ejecuta uno de estos comandos:" -ForegroundColor Yellow

Write-Host "`n1️⃣ Opción con npx (recomendado):" -ForegroundColor Cyan
Write-Host "npx supabase functions deploy ingest-csv-data --project-ref khzbklcvmlkhrraibksx" -ForegroundColor White

Write-Host "`n2️⃣ Opción manual en Dashboard:" -ForegroundColor Cyan
Write-Host "- Ve a https://app.supabase.com/project/khzbklcvmlkhrraibksx/functions" -ForegroundColor White
Write-Host "- Crea nueva función 'ingest-csv-data'" -ForegroundColor White
Write-Host "- Copia el código de: supabase\functions\ingest-csv-data\index.ts" -ForegroundColor White

Write-Host "`n3️⃣ Verificar que la función funciona:" -ForegroundColor Cyan
Write-Host "curl -X OPTIONS `"https://khzbklcvmlkhrraibksx.supabase.co/functions/v1/ingest-csv-data`"" -ForegroundColor White

Write-Host "`n🎯 Después del despliegue, usa el archivo test-data.csv para probar" -ForegroundColor Magenta
