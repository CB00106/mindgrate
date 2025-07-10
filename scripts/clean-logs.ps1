# Script para limpiar logs en todas las páginas
param(
    [string]$TargetDirectory = "src\pages"
)

# Patrones de reemplazo
$replacements = @(
    # Errores - mantener pero sin emojis
    @{ Pattern = 'console\.error\(''❌ ([^'']+)'', ([^)]+)\)'; Replace = 'logger.error(''$1'', $2)' },
    @{ Pattern = 'console\.error\(''💥 ([^'']+)'', ([^)]+)\)'; Replace = 'logger.error(''$1'', $2)' },
    @{ Pattern = 'console\.error\(''🔥 ([^'']+)'', ([^)]+)\)'; Replace = 'logger.error(''$1'', $2)' },
    
    # Warnings - mantener pero sin emojis  
    @{ Pattern = 'console\.warn\(''⚠️ ([^'']+)'', ([^)]+)\)'; Replace = 'logger.warn(''$1'', $2)' },
    @{ Pattern = 'console\.warn\(''🚨 ([^'']+)'', ([^)]+)\)'; Replace = 'logger.warn(''$1'', $2)' },
    
    # Logs de información - convertir a debug en desarrollo
    @{ Pattern = 'console\.log\(''✅ ([^'']+)'', ([^)]+)\)'; Replace = 'logger.debug(''Page'', ''$1'', $2)' },
    @{ Pattern = 'console\.log\(''🔄 ([^'']+)'', ([^)]+)\)'; Replace = 'logger.debug(''Page'', ''$1'', $2)' },
    @{ Pattern = 'console\.log\(''📊 ([^'']+)'', ([^)]+)\)'; Replace = 'logger.debug(''Page'', ''$1'', $2)' },
    @{ Pattern = 'console\.log\(''🆕 ([^'']+)'', ([^)]+)\)'; Replace = 'logger.debug(''Page'', ''$1'', $2)' },
    @{ Pattern = 'console\.log\(''ℹ️ ([^'']+)'', ([^)]+)\)'; Replace = 'logger.debug(''Page'', ''$1'', $2)' },
    
    # Logs simples sin parámetros adicionales
    @{ Pattern = 'console\.log\(''✅ ([^'']+)''\)'; Replace = 'logger.debug(''Page'', ''$1'')' },
    @{ Pattern = 'console\.log\(''🔄 ([^'']+)''\)'; Replace = 'logger.debug(''Page'', ''$1'')' },
    @{ Pattern = 'console\.log\(''📊 ([^'']+)''\)'; Replace = 'logger.debug(''Page'', ''$1'')' },
    @{ Pattern = 'console\.log\(''🆕 ([^'']+)''\)'; Replace = 'logger.debug(''Page'', ''$1'')' },
    @{ Pattern = 'console\.log\(''ℹ️ ([^'']+)''\)'; Replace = 'logger.debug(''Page'', ''$1'')' },
    
    # Errores simples sin parámetros adicionales
    @{ Pattern = 'console\.error\(''❌ ([^'']+)''\)'; Replace = 'logger.error(''$1'')' },
    @{ Pattern = 'console\.error\(''💥 ([^'']+)''\)'; Replace = 'logger.error(''$1'')' },
    @{ Pattern = 'console\.warn\(''⚠️ ([^'']+)''\)'; Replace = 'logger.warn(''$1'')' }
)

# Obtener todos los archivos .tsx en el directorio
$files = Get-ChildItem -Path $TargetDirectory -Filter "*.tsx" -Recurse

Write-Host "🧹 Limpiando logs en $($files.Count) archivos..." -ForegroundColor Cyan

foreach ($file in $files) {
    Write-Host "📄 Procesando: $($file.Name)" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $changesCount = 0
    
    # Verificar si ya tiene el import del logger
    if ($content -notmatch 'import.*logger.*from.*@/utils/logger') {
        # Buscar la línea de imports más apropiada para agregar el logger
        if ($content -match "(import.*from '@/.*';)") {
            $lastImport = $matches[1]
            $content = $content -replace [regex]::Escape($lastImport), "$lastImport`nimport { logger } from '@/utils/logger';"
            $changesCount++
            Write-Host "  ➕ Agregado import de logger" -ForegroundColor Green
        }
    }
    
    # Aplicar todos los reemplazos
    foreach ($replacement in $replacements) {
        $beforeCount = [regex]::Matches($content, $replacement.Pattern).Count
        $content = $content -replace $replacement.Pattern, $replacement.Replace
        $afterCount = [regex]::Matches($content, $replacement.Pattern).Count
        $replaced = $beforeCount - $afterCount
        
        if ($replaced -gt 0) {
            $changesCount += $replaced
            Write-Host "  🔄 Reemplazados $replaced logs: $($replacement.Pattern.Substring(0, [Math]::Min(50, $replacement.Pattern.Length)))..." -ForegroundColor Blue
        }
    }
    
    # Guardar solo si hubo cambios
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -Encoding UTF8
        Write-Host "  ✅ $changesCount cambios aplicados en $($file.Name)" -ForegroundColor Green
    } else {
        Write-Host "  ➖ Sin cambios en $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host "`n🎉 Limpieza completada!" -ForegroundColor Green
