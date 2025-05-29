# Script para actualizar los secrets de Supabase con las nuevas credenciales
# Actualiza los secrets para que coincidan con el archivo .env

Write-Host "🔑 === ACTUALIZANDO SECRETS DE SUPABASE ===" -ForegroundColor Cyan

# Leer valores del archivo .env
$envFile = Get-Content ".env"
$envVars = @{}

foreach ($line in $envFile) {
    if ($line -match "^([^#].*)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
    }
}

Write-Host "📋 Variables encontradas en .env:" -ForegroundColor Green
foreach ($key in $envVars.Keys) {
    if ($key -like "*KEY*" -or $key -like "*URL*") {
        $maskedValue = $envVars[$key].Substring(0, [Math]::Min(10, $envVars[$key].Length)) + "..."
        Write-Host "  $key = $maskedValue" -ForegroundColor White
    }
}

Write-Host "`n🔄 Actualizando secrets..." -ForegroundColor Yellow

# Actualizar secrets individuales
$secrets = @{
    "SUPABASE_URL" = $envVars["VITE_SUPABASE_URL"]
    "SUPABASE_ANON_KEY" = $envVars["VITE_SUPABASE_ANON_KEY"] 
    "SUPABASE_SERVICE_ROLE_KEY" = $envVars["SUPABASE_SERVICE_ROLE_KEY"]
    "OPENAI_API_KEY" = $envVars["OPENAI_API_KEY"]
    "GEMINI_API_KEY" = $envVars["GEMINI_API_KEY"]
}

foreach ($secretName in $secrets.Keys) {
    $secretValue = $secrets[$secretName]
    if ($secretValue) {
        Write-Host "🔑 Actualizando $secretName..." -ForegroundColor Cyan
        try {
            & npx supabase secrets set "$secretName=$secretValue"
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ $secretName actualizado correctamente" -ForegroundColor Green
            } else {
                Write-Host "  ❌ Error actualizando $secretName" -ForegroundColor Red
            }
        } catch {
            Write-Host "  ❌ Error ejecutando comando para $secretName : $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠️  Valor vacío para $secretName" -ForegroundColor Yellow
    }
}

Write-Host "`n📊 Verificando secrets actualizados..." -ForegroundColor Cyan
& npx supabase secrets list

Write-Host "`n✨ ACTUALIZACIÓN DE SECRETS COMPLETADA!" -ForegroundColor Green
