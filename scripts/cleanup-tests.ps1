# Script para limpiar archivos de test no necesarios
# Mantiene solo los tests esenciales y funcionales

Write-Host "🧹 === CLEANUP DE ARCHIVOS DE TEST ===" -ForegroundColor Cyan

# Crear carpeta de archivos eliminados para backup
$backupFolder = "deleted-tests-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
if (!(Test-Path $backupFolder)) {
    New-Item -ItemType Directory -Path $backupFolder | Out-Null
    Write-Host "📁 Creada carpeta de backup: $backupFolder" -ForegroundColor Green
}

# ARCHIVOS A MANTENER (funcionales y útiles)
$keepFiles = @(
    "test-collaboration-task-processing.mjs",  # Nuevo test para colaboración
    "test-gemini-integration-complete.mjs",   # Test completo de Gemini
    "test-mindop-service-complete.js",        # Test completo del servicio
    "test-deployed-function.mjs",             # Test de función desplegada
    "verificacion-rapida.js",                 # Verificación rápida
    "quick-verify.mjs"                        # Verificación rápida
)

# ARCHIVOS A ELIMINAR (obsoletos, duplicados, o de debug temporal)
$deleteFiles = @(
    # Tests básicos obsoletos
    "test-simple-basic.mjs",
    "test-simple-direct.mjs", 
    "test-basic-function.js",
    "test-basic-mindop.js",
    "test-function-basic.mjs",
    "test-worker-simple.js",
    "test-node.js",
    
    # Tests de debug temporales
    "debug-500-error.mjs",
    "debug-search-function.mjs",
    "simple-debug.js",
    "simple-test.mjs",
    
    # Tests de configuración obsoletos
    "test-openai-key.js",
    "test-service-role.mjs",
    "test-service-role-direct.mjs",
    "test-error-500-debug.ps1",
    
    # Tests duplicados o específicos ya completados
    "test-search-direct.mjs",
    "test-metadata-compatibility.mjs",
    "test-ingest-csv.js",
    "test-gemini-integration.mjs", # Mantenemos solo el complete
    "test-mindop-detailed.mjs",
    "test-mindop-powershell.ps1",
    "test-mindop-service.mjs", # Mantenemos solo el complete
    
    # Tests de auth específicos (ya integrados)
    "test-with-auth-token.mjs",
    "test-with-real-auth.mjs",
    "test-with-valid-user.mjs",
    
    # Tests de colaboración antiguos (reemplazados)
    "test-collaboration.mjs",
    "test-collaboration-fix.mjs",
    "test-async-collaboration.mjs",
    "test-connections.mjs",
    "validate-collaboration.mjs",
    
    # Tests desplegados obsoletos
    "test-deployed-edge-function.mjs", # Mantenemos solo deployed-function
    
    # Verificaciones obsoletas
    "verificacion-estado.js", # Mantenemos solo rapida
    "verify-mindop-service.mjs"
)

Write-Host "`n📋 ARCHIVOS A MANTENER:" -ForegroundColor Green
foreach ($file in $keepFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $file (no encontrado)" -ForegroundColor Yellow
    }
}

Write-Host "`n🗑️  ARCHIVOS A ELIMINAR:" -ForegroundColor Red
$deletedCount = 0
foreach ($file in $deleteFiles) {
    if (Test-Path $file) {
        try {
            # Mover a backup antes de eliminar
            Move-Item $file $backupFolder -Force
            Write-Host "  ✅ Movido a backup: $file" -ForegroundColor Yellow
            $deletedCount++
        } catch {
            Write-Host "  ❌ Error moviendo $file : $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠️  $file (ya no existe)" -ForegroundColor DarkGray
    }
}

# Eliminar archivos adicionales por patrón
Write-Host "`n🔍 BUSCANDO ARCHIVOS ADICIONALES..." -ForegroundColor Cyan

# Archivos de test temporales que siguen patrones específicos
$patterns = @(
    "test-error-*.mjs",
    "test-*-debug.*",
    "*-temp.*",
    "temp-*.*"
)

foreach ($pattern in $patterns) {
    $files = Get-ChildItem -Path . -Name $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        if ($file -notin $keepFiles) {
            try {
                Move-Item $file $backupFolder -Force
                Write-Host "  ✅ Movido patrón $pattern : $file" -ForegroundColor Yellow
                $deletedCount++
            } catch {
                Write-Host "  ❌ Error moviendo $file : $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

Write-Host "`n📊 RESUMEN DEL CLEANUP:" -ForegroundColor Cyan
Write-Host "  📁 Archivos movidos a backup: $deletedCount" -ForegroundColor Yellow
Write-Host "  📁 Carpeta de backup: $backupFolder" -ForegroundColor Green
Write-Host "  ✅ Archivos esenciales mantenidos: $($keepFiles.Count)" -ForegroundColor Green

Write-Host "`n📋 ARCHIVOS DE TEST RESTANTES:" -ForegroundColor Cyan
$remainingTests = Get-ChildItem -Path . -Name "test-*.*", "debug-*.*", "verificacion*.*", "*verify*.*", "quick-*.*" | Sort-Object
foreach ($file in $remainingTests) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "  📄 $file ($size bytes)" -ForegroundColor White
    }
}

Write-Host "`n✨ CLEANUP COMPLETADO!" -ForegroundColor Green
Write-Host "💡 Si necesitas recuperar algún archivo, está en: $backupFolder" -ForegroundColor Blue
