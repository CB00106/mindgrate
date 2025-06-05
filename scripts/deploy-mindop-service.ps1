# Script para desplegar la función mindop-service actualizada
# Con el nuevo modelo gemini-2.5-flash-preview-05-20

Write-Host "🚀 Desplegando Edge Function mindop-service con Gemini 2.5..." -ForegroundColor Green

# Cambiar al directorio del proyecto
Set-Location "c:\Users\cesar\OneDrive\Documents\MVP\MVP-2\mindgrate"

# Verificar que existe la función
if (Test-Path "supabase\functions\mindop-service\index.ts") {
    Write-Host "✅ Función encontrada: mindop-service" -ForegroundColor Green
} else {
    Write-Host "❌ No se encontró la función mindop-service" -ForegroundColor Red
    exit 1
}

# Verificar que el modelo está actualizado
$functionContent = Get-Content "supabase\functions\mindop-service\index.ts" -Raw
if ($functionContent -match "gemini-2.5-flash-preview-05-20") {
    Write-Host "✅ Modelo Gemini 2.5 Flash Preview configurado correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Modelo no actualizado" -ForegroundColor Red
    exit 1
}

# Verificar variables de entorno necesarias
Write-Host "`n🔑 Verificando variables de entorno requeridas:" -ForegroundColor Yellow
$requiredVars = @("OPENAI_API_KEY", "GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")

foreach ($var in $requiredVars) {
    Write-Host "- $var" -NoNewline
    # Note: En producción estas variables se configuran en el dashboard de Supabase
    Write-Host " (configurar en Supabase Dashboard)" -ForegroundColor Cyan
}

Write-Host "`n📋 Para desplegar la función actualizada:" -ForegroundColor Yellow

Write-Host "`n1️⃣ Opción con npx (recomendado):" -ForegroundColor Cyan
Write-Host "npx supabase functions deploy mindop-service --project-ref khzbklcvmlkhrraibksx" -ForegroundColor White

Write-Host "`n2️⃣ Deploy de ambas funciones actualizadas:" -ForegroundColor Cyan
Write-Host "npx supabase functions deploy mindop-service --project-ref khzbklcvmlkhrraibksx" -ForegroundColor White
Write-Host "npx supabase functions deploy collaboration-worker --project-ref khzbklcvmlkhrraibksx" -ForegroundColor White

Write-Host "`n3️⃣ Verificar que las funciones funcionan:" -ForegroundColor Cyan
Write-Host "curl -X OPTIONS `"https://khzbklcvmlkhrraibksx.supabase.co/functions/v1/mindop-service`"" -ForegroundColor White
Write-Host "curl -X OPTIONS `"https://khzbklcvmlkhrraibksx.supabase.co/functions/v1/collaboration-worker`"" -ForegroundColor White

Write-Host "`n🎯 Variables de entorno a configurar en Supabase Dashboard:" -ForegroundColor Magenta
Write-Host "- OPENAI_API_KEY: Para embeddings" -ForegroundColor White
Write-Host "- GEMINI_API_KEY: Para el nuevo modelo 2.5 Flash Preview" -ForegroundColor White
Write-Host "- SUPABASE_URL: URL de tu proyecto" -ForegroundColor White
Write-Host "- SUPABASE_SERVICE_ROLE_KEY: Clave del service role" -ForegroundColor White

Write-Host "`n✨ Nueva funcionalidad con Gemini 2.5:" -ForegroundColor Green
Write-Host "- Mejor comprensión del contexto" -ForegroundColor White
Write-Host "- Respuestas más precisas y coherentes" -ForegroundColor White
Write-Host "- Mejor manejo de colaboraciones entre MindOps" -ForegroundColor White

Write-Host "`n🚀 ¡Listo para deploy!" -ForegroundColor Green
