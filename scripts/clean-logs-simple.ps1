# Script simplificado para limpiar logs
param(
    [string]$TargetDirectory = "src\pages"
)

Write-Host "Limpiando logs en archivos de $TargetDirectory..." -ForegroundColor Cyan

# Obtener todos los archivos .tsx
$files = Get-ChildItem -Path $TargetDirectory -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    Write-Host "Procesando: $($file.Name)" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $changesCount = 0
    
    # Verificar si ya tiene el import del logger
    if ($content -notmatch 'import.*logger.*from.*utils/logger') {
        # Buscar donde agregar el import
        if ($content -match "(import.*from '@/.*';)") {
            $lastImport = $matches[1]
            $content = $content -replace [regex]::Escape($lastImport), "$lastImport`nimport { logger } from '@/utils/logger';"
            $changesCount++
        }
    }
    
    # Reemplazos básicos - console.error
    $before = ($content | Select-String "console\.error" -AllMatches).Matches.Count
    $content = $content -replace "console\.error\('Error", "logger.error('Error"
    $content = $content -replace "console\.error\('❌", "logger.error('"
    $content = $content -replace "console\.error\('💥", "logger.error('"
    $after = ($content | Select-String "console\.error" -AllMatches).Matches.Count
    if ($before -ne $after) { $changesCount += ($before - $after) }
    
    # Reemplazos básicos - console.log
    $before = ($content | Select-String "console\.log" -AllMatches).Matches.Count  
    $content = $content -replace "console\.log\('✅", "logger.debug('Page', '"
    $content = $content -replace "console\.log\('🔄", "logger.debug('Page', '"
    $content = $content -replace "console\.log\('📊", "logger.debug('Page', '"
    $content = $content -replace "console\.log\('🆕", "logger.debug('Page', '"
    $content = $content -replace "console\.log\('ℹ️", "logger.debug('Page', '"
    $content = $content -replace "console\.log\('📋", "logger.debug('Page', '"
    $content = $content -replace "console\.log\('Login attempt:", "logger.debug('Auth', 'Login attempt:"
    $content = $content -replace "console\.log\('Register attempt:", "logger.debug('Auth', 'Register attempt:"
    $after = ($content | Select-String "console\.log" -AllMatches).Matches.Count
    if ($before -ne $after) { $changesCount += ($before - $after) }
    
    # Reemplazos básicos - console.warn
    $before = ($content | Select-String "console\.warn" -AllMatches).Matches.Count
    $content = $content -replace "console\.warn\('⚠️", "logger.warn('"
    $after = ($content | Select-String "console\.warn" -AllMatches).Matches.Count
    if ($before -ne $after) { $changesCount += ($before - $after) }
    
    # Guardar si hubo cambios
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -Encoding UTF8
        Write-Host "  ✅ $changesCount cambios aplicados" -ForegroundColor Green
    } else {
        Write-Host "  ➖ Sin cambios" -ForegroundColor Gray
    }
}

Write-Host "Limpieza completada!" -ForegroundColor Green
