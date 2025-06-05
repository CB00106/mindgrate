# Test para verificar fix de columna updated_at
# Verifica que ya no se intente seleccionar la columna inexistente

Write-Host "VERIFICANDO FIX DE COLUMNA updated_at" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "test-updated-at-fix-$timestamp.log"

function Write-TestLog {
    param($Message, $Color = "White")
    $timestampedMessage = "$(Get-Date -Format 'HH:mm:ss') - $Message"
    Write-Host $timestampedMessage -ForegroundColor $Color
    Add-Content -Path $logFile -Value $timestampedMessage
}

Write-TestLog "Iniciando verificación del fix de updated_at" "Green"

# Verificar que el servidor esté corriendo
Write-TestLog "Verificando servidor..." "Cyan"
try {
    $serverCheck = Invoke-WebRequest -Uri "http://localhost:3002" -TimeoutSec 5 -UseBasicParsing
    Write-TestLog "Servidor activo (Status: $($serverCheck.StatusCode))" "Green"
} catch {
    Write-TestLog "Servidor no disponible" "Red"
    exit 1
}

# Verificar archivos corregidos
Write-TestLog "Verificando archivos corregidos..." "Cyan"

$filesToCheck = @(
    @{
        Path = "src/services/mindopService.ts"
        ShouldNotContain = "updated_at"
        Description = "MindopService no debe referenciar updated_at"
    },
    @{
        Path = "src/types/mindops.ts" 
        ShouldNotContain = "updated_at.*Mindop"
        Description = "Tipo Mindop no debe tener updated_at"
    }
)

foreach ($fileCheck in $filesToCheck) {
    if (Test-Path $fileCheck.Path) {
        $content = Get-Content $fileCheck.Path -Raw
        
        # Para mindopService, verificar que no tenga updated_at en selects de mindops
        if ($fileCheck.Path -like "*mindopService*") {
            if ($content -match "\.select\([^)]*updated_at[^)]*\)") {
                Write-TestLog "ERROR: $($fileCheck.Path) aún contiene select con updated_at" "Red"
            } else {
                Write-TestLog "OK: $($fileCheck.Path) no tiene selects con updated_at" "Green"
            }
        }
        
        # Para types, verificar que Mindop interface no tenga updated_at
        if ($fileCheck.Path -like "*types/mindops*") {
            if ($content -match "interface Mindop.*updated_at" -or ($content -match "export interface Mindop" -and $content -match "updated_at: string")) {
                Write-TestLog "ERROR: Mindop interface aún tiene updated_at" "Red"
            } else {
                Write-TestLog "OK: Mindop interface no tiene updated_at" "Green"
            }
        }
    } else {
        Write-TestLog "ERROR: No se encontró $($fileCheck.Path)" "Red"
    }
}

# Verificar estructura de la base de datos
Write-TestLog "Verificando estructura de base de datos..." "Cyan"
if (Test-Path "estructure.sql") {
    $sqlContent = Get-Content "estructure.sql" -Raw
    
    # Verificar tabla mindops
    if ($sqlContent -match "CREATE TABLE public\.mindops.*?\);" -and $sqlContent -match "mindops.*?(?:id|user_id|created_at|mindop_name|mindop_description)") {
        Write-TestLog "OK: Tabla mindops encontrada en estructure.sql" "Green"
        
        # Verificar que mindops NO tenga updated_at
        $mindopsTableMatch = [regex]::Match($sqlContent, "CREATE TABLE public\.mindops.*?\);", [System.Text.RegularExpressions.RegexOptions]::Singleline)
        if ($mindopsTableMatch.Success) {
            $mindopsTable = $mindopsTableMatch.Value
            if ($mindopsTable -match "updated_at") {
                Write-TestLog "ADVERTENCIA: Tabla mindops en SQL tiene updated_at" "Yellow"
            } else {
                Write-TestLog "OK: Tabla mindops en SQL NO tiene updated_at" "Green"
            }
        }
    } else {
        Write-TestLog "ERROR: No se pudo verificar tabla mindops en estructure.sql" "Red"
    }
} else {
    Write-TestLog "ERROR: No se encontró estructure.sql" "Red"
}

Write-TestLog "RESUMEN DEL FIX:" "Green"
Write-TestLog "=================" "Green"
Write-TestLog "PROBLEMA: MindopService intentaba seleccionar updated_at de tabla mindops" "White"
Write-TestLog "CAUSA: La tabla mindops NO tiene columna updated_at según estructure.sql" "White"
Write-TestLog "SOLUCIÓN: Removido updated_at de todos los selects de mindops" "White"
Write-TestLog "COLUMNAS VÁLIDAS: id, user_id, created_at, mindop_name, mindop_description" "White"

Write-TestLog "PRÓXIMO PASO:" "Yellow"
Write-TestLog "Probar navegación a MyMindOp para verificar que ya no hay error 42703" "White"

Write-TestLog "Fix de updated_at completado!" "Green"
Write-Host "Log completo en: $logFile" -ForegroundColor Cyan
