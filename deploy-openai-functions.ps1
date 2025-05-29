# Script para desplegar todas las Edge Functions que utilizan OpenAI API
# Ejecuta este script después de actualizar OPENAI_API_KEY

Write-Host "🚀 Desplegando Edge Functions que utilizan OpenAI..." -ForegroundColor Green

# Cambiar al directorio del proyecto
Set-Location "c:\Users\cesar\OneDrive\Documents\MVP\Mindgrate-MVP"

# Verificar que existe el archivo .env con la nueva API key
if (Test-Path ".env") {
    Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "OPENAI_API_KEY=sk-proj-") {
        Write-Host "✅ Nueva OPENAI_API_KEY detectada" -ForegroundColor Green
    } else {
        Write-Host "❌ OPENAI_API_KEY no encontrada o formato incorrecto" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Archivo .env no encontrado" -ForegroundColor Red
    exit 1
}

# Lista de funciones que utilizan OpenAI
$functionsToDeployString = @(
    "mindop-service",
    "ingest-csv-data", 
    "collaboration-worker",
    "vector-service"
)

Write-Host "`n📋 Funciones identificadas que utilizan OpenAI:" -ForegroundColor Yellow
foreach ($func in $functionsToDeployString) {
    if (Test-Path "supabase\functions\$func\index.ts") {
        Write-Host "✅ $func" -ForegroundColor Green
    } else {
        Write-Host "❌ $func (no encontrada)" -ForegroundColor Red
    }
}

Write-Host "`n🔧 Desplegando funciones..." -ForegroundColor Cyan

# Proyecto ref de Supabase
$projectRef = "khzbklcvmlkhrraibksx"

try {
    foreach ($func in $functionsToDeployString) {
        if (Test-Path "supabase\functions\$func\index.ts") {
            Write-Host "`n📦 Desplegando $func..." -ForegroundColor Yellow
            
            # Intentar despliegue con npx
            $deployCommand = "npx supabase functions deploy $func --project-ref $projectRef"
            Write-Host "Ejecutando: $deployCommand" -ForegroundColor Gray
            
            Invoke-Expression $deployCommand
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $func desplegada exitosamente" -ForegroundColor Green
            } else {
                Write-Host "❌ Error desplegando $func" -ForegroundColor Red
            }
            
            # Pausa entre despliegues
            Start-Sleep -Seconds 2
        }
    }
    
    Write-Host "`n🎉 Proceso de despliegue completado!" -ForegroundColor Green
    Write-Host "`n🧪 Para verificar que las funciones funcionan:" -ForegroundColor Yellow
    Write-Host "curl -X OPTIONS `"https://$projectRef.supabase.co/functions/v1/mindop-service`"" -ForegroundColor White
    Write-Host "curl -X OPTIONS `"https://$projectRef.supabase.co/functions/v1/ingest-csv-data`"" -ForegroundColor White
    Write-Host "curl -X OPTIONS `"https://$projectRef.supabase.co/functions/v1/collaboration-worker`"" -ForegroundColor White
    Write-Host "curl -X OPTIONS `"https://$projectRef.supabase.co/functions/v1/vector-service`"" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Error durante el despliegue: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 Soluciones alternativas:" -ForegroundColor Yellow
    Write-Host "1. Verifica que tienes acceso a Supabase CLI" -ForegroundColor White
    Write-Host "2. Ejecuta 'npx supabase login' si es necesario" -ForegroundColor White
    Write-Host "3. Despliega manualmente desde Supabase Dashboard" -ForegroundColor White
}

Write-Host "`n📝 URLs de las funciones desplegadas:" -ForegroundColor Magenta
foreach ($func in $functionsToDeployString) {
    Write-Host "- https://$projectRef.supabase.co/functions/v1/$func" -ForegroundColor White
}
