# Script para verificar y configurar la clave API de OpenAI en Supabase Edge Functions
# Ejecutar desde la raíz del proyecto

Write-Host "🔧 === VERIFICACIÓN Y CONFIGURACIÓN DE OPENAI API KEY ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar variables de entorno actuales
Write-Host "1️⃣ Verificando variables de entorno actuales..." -ForegroundColor Yellow
try {
    $secrets = npx supabase secrets list 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Variables de entorno actuales:" -ForegroundColor Green
        Write-Host $secrets
    } else {
        Write-Host "❌ Error obteniendo variables de entorno:" -ForegroundColor Red
        Write-Host $secrets
    }
} catch {
    Write-Host "❌ Error ejecutando supabase secrets list: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "2️⃣ Para corregir el problema de OpenAI API Key:" -ForegroundColor Yellow
Write-Host ""
Write-Host "OPCIÓN A - Si tienes una clave válida:" -ForegroundColor Cyan
Write-Host "1. Ve a https://platform.openai.com/account/api-keys" -ForegroundColor White
Write-Host "2. Copia tu clave API válida (debe empezar con sk-)" -ForegroundColor White
Write-Host "3. Ejecuta: npx supabase secrets set OPENAI_API_KEY=tu_clave_aqui" -ForegroundColor White
Write-Host ""
Write-Host "OPCIÓN B - Usar clave temporal para testing:" -ForegroundColor Cyan
Write-Host "Si no tienes una clave de OpenAI, podemos modificar temporalmente" -ForegroundColor White
Write-Host "el edge function para usar solo embeddings mock y saltar OpenAI." -ForegroundColor White
Write-Host ""
Write-Host "OPCIÓN C - Verificar todas las variables necesarias:" -ForegroundColor Cyan
Write-Host "El edge function necesita estas variables:" -ForegroundColor White
Write-Host "- OPENAI_API_KEY (para embeddings)" -ForegroundColor White
Write-Host "- GEMINI_API_KEY (para respuestas de IA)" -ForegroundColor White
Write-Host "- SUPABASE_URL (automática)" -ForegroundColor White
Write-Host "- SUPABASE_SERVICE_ROLE_KEY (automática)" -ForegroundColor White
Write-Host ""

# 3. Verificar estado del proyecto
Write-Host "3️⃣ Verificando estado del proyecto Supabase..." -ForegroundColor Yellow
try {
    $status = npx supabase status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Estado del proyecto:" -ForegroundColor Green
        Write-Host $status
    } else {
        Write-Host "❌ Error obteniendo estado del proyecto:" -ForegroundColor Red
        Write-Host $status
    }
} catch {
    Write-Host "❌ Error ejecutando supabase status: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔄 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "1. Configura la clave OPENAI_API_KEY válida" -ForegroundColor White
Write-Host "2. Ejecuta: npx supabase functions deploy mindop-service" -ForegroundColor White
Write-Host "3. Prueba nuevamente en ChatPage" -ForegroundColor White
Write-Host ""
Write-Host "💡 ALTERNATIVA - Modo de desarrollo sin OpenAI:" -ForegroundColor Yellow
Write-Host "Si prefieres continuar sin OpenAI, puedo modificar el edge function" -ForegroundColor White
Write-Host "para usar embeddings simulados temporalmente." -ForegroundColor White
