# Script de cleanup simple para Mindgrate
Write-Host "🧹 === CLEANUP DEL PROYECTO MINDGRATE ===" -ForegroundColor Green

# Ir al directorio del proyecto
$projectPath = "c:\Users\cesar\OneDrive\Documents\MVP\MVP-2\mindgrate"
Set-Location $projectPath

# Verificar que estamos en el lugar correcto
if (!(Test-Path "package.json")) {
    Write-Host "❌ No se encontró package.json" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Directorio correcto: $projectPath" -ForegroundColor Green

# Crear backup
$backupDate = Get-Date -Format "yyyy-MM-dd-HHmm"
$backupDir = "cleanup-backup-$backupDate"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Write-Host "📦 Backup creado: $backupDir" -ForegroundColor Yellow

# Archivos de test a eliminar del root
$testFiles = @(
    "debug-auth-flow.js",
    "diagnose-loading-infinite.js", 
    "test-conversation-complete.mjs",
    "test-conversation-management.mjs",
    "test-csv-upload.mjs",
    "test-enhanced-logging.js",
    "test-enhanced-logging.mjs", 
    "test-frontend-behavior.js",
    "test-http406-browser.js",
    "test-http406-fix.ps1",
    "test-http406-fixed.ps1",
    "test-http406-specific.ps1",
    "test-loading-issue.js",
    "test-mindop-navigation-fix.ps1",
    "test-mindop-navigation.js",
    "test-mindop-simple.ps1",
    "test-navigation-fix-final.js",
    "test-quick-conversation.js",
    "test-solucion-final.js",
    "test-updated-at-fix.ps1",
    "verify-loading-fix-2.js",
    "verify-loading-fix.js",
    "verify-mindop-database.mjs",
    "solucion-loading-indefinido.tsx"
)

# Documentos a eliminar
$docsToDelete = @(
    "AUTH_FIX_SUMMARY.md",
    "CACHE_IMPLEMENTATION_SUMMARY.md",
    "CLEANUP_SUMMARY.md",
    "DEPLOY_READY_SUMMARY.md", 
    "FIX_LOADING_INFINITO_RESUELTO.md",
    "LOADING_INFINITO_FIX_FINAL.md",
    "RENDER_DEPLOY_NOW.md"
)

# Eliminar archivos de test
Write-Host "`n🗑️  Eliminando archivos de test..." -ForegroundColor Yellow
$deletedCount = 0
foreach ($file in $testFiles) {
    if (Test-Path $file) {
        Copy-Item $file "$backupDir\" -Force
        Remove-Item $file -Force
        Write-Host "✅ $file" -ForegroundColor Green
        $deletedCount++
    }
}

# Eliminar documentos
Write-Host "`n📄 Eliminando documentación..." -ForegroundColor Yellow
foreach ($doc in $docsToDelete) {
    if (Test-Path $doc) {
        Copy-Item $doc "$backupDir\" -Force
        Remove-Item $doc -Force
        Write-Host "✅ $doc" -ForegroundColor Green
        $deletedCount++
    }
}

# Eliminar directorios de test
$testDirs = @(
    "deleted-tests-backup-2025-05-29-1414",
    "test-files-backup", 
    "tests",
    "env-backup"
)

Write-Host "`n📁 Eliminando directorios de test..." -ForegroundColor Yellow
foreach ($dir in $testDirs) {
    if (Test-Path $dir) {
        Copy-Item $dir "$backupDir\" -Recurse -Force
        Remove-Item $dir -Recurse -Force
        Write-Host "✅ $dir/" -ForegroundColor Green
        $deletedCount++
    }
}

# Limpiar scripts, mantener solo los esenciales
$scriptsToKeep = @("deploy-all-functions.ps1", "setup-test-data.ps1", "cleanup-simple.ps1")

Write-Host "`n🔧 Limpiando scripts..." -ForegroundColor Yellow
if (Test-Path "scripts") {
    $allScripts = Get-ChildItem "scripts" -File
    foreach ($script in $allScripts) {
        if ($script.Name -notin $scriptsToKeep) {
            Copy-Item $script.FullName "$backupDir\" -Force
            Remove-Item $script.FullName -Force
            Write-Host "✅ scripts/$($script.Name)" -ForegroundColor Green
            $deletedCount++
        } else {
            Write-Host "📌 scripts/$($script.Name) (mantenido)" -ForegroundColor Cyan
        }
    }
}

Write-Host "`n✨ === CLEANUP COMPLETADO ===" -ForegroundColor Green
Write-Host "📊 Total de archivos/directorios eliminados: $deletedCount" -ForegroundColor Cyan
Write-Host "📦 Backup guardado en: $backupDir" -ForegroundColor Yellow

Write-Host "`n🎯 Estructura limpia del proyecto:" -ForegroundColor Cyan
Write-Host "📁 src/ - Código fuente React/TypeScript" -ForegroundColor White
Write-Host "📁 supabase/ - Edge Functions" -ForegroundColor White  
Write-Host "📁 public/ - Assets estáticos" -ForegroundColor White
Write-Host "📁 scripts/ - Scripts esenciales" -ForegroundColor White

Write-Host "`n🚀 Próximos pasos:" -ForegroundColor Magenta
Write-Host "1. Verificar: npm run dev" -ForegroundColor White
Write-Host "2. Commit: git add . && git commit -m `"cleanup: remove test files`"" -ForegroundColor White
Write-Host "3. Si todo OK: Remove-Item `$backupDir -Recurse -Force" -ForegroundColor White
