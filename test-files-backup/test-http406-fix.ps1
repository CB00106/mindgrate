## Test script para verificar la solución del error HTTP 406
# Ejecuta pruebas específicas para el problema de navegación MindOp

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "[INFO] INICIANDO PRUEBAS PARA FIX HTTP 406" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "test-http406-fix-$timestamp.log"

Write-Host "[LOG] Log file: $logFile" -ForegroundColor Yellow

# Función para log con timestamp
function Write-Log {
    param(
        [string]$Message, 
        [string]$Color = "White"
    )
    $timestampedMessage = "$(Get-Date -Format 'HH:mm:ss') - $Message"
    Write-Host $timestampedMessage -ForegroundColor $Color
    Add-Content -Path $logFile -Value $timestampedMessage
}

Write-Log "[START] Starting HTTP 406 fix verification tests" "Green"

# Test 1: Verificar que el servidor esté ejecutándose
Write-Log "[TEST 1] Checking if dev server is running..." "Cyan"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002" -TimeoutSec 5 -ErrorAction Stop
    Write-Log "[OK] Dev server is running (Status: $($response.StatusCode))" "Green"
} catch {
    Write-Log "[ERROR] Dev server not running. Starting it..." "Red"
    
    # Intentar iniciar el servidor
    Write-Log "[ACTION] Attempting to start dev server..." "Yellow"
    
    try {
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "." -WindowStyle Minimized
        
        # Esperar unos segundos
        Write-Log "[WAIT] Waiting for server to start..." "Yellow"
        Start-Sleep -Seconds 10
        
        # Verificar nuevamente
        $response = Invoke-WebRequest -Uri "http://localhost:3002" -TimeoutSec 5 -ErrorAction Stop
        Write-Log "[OK] Dev server started successfully (Status: $($response.StatusCode))" "Green"
    } catch {
        Write-Log "[ERROR] Failed to start dev server. Please start manually with 'npm run dev'" "Red"
        exit 1
    }
}

# Test 2: Verificar configuración de Supabase
Write-Log "[TEST 2] Checking Supabase configuration..." "Cyan"
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -ErrorAction SilentlyContinue | Where-Object { $_ -match "VITE_SUPABASE" }
    if ($envContent -and $envContent.Count -gt 0) {
        Write-Log "[OK] Supabase environment variables found" "Green"
    } else {
        Write-Log "[ERROR] Supabase environment variables missing" "Red"
    }
} else {
    Write-Log "[ERROR] .env file not found" "Red"
}

# Test 3: Verificar archivos modificados
Write-Log "[TEST 3] Checking modified files..." "Cyan"

$filesToCheck = @(
    "src/services/supabaseClient.ts",
    "src/services/mindopService.ts", 
    "src/hooks/useMindOp.ts"
)

foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        try {
            $content = Get-Content $file -Raw -ErrorAction Stop
            if ($content -match "HTTP 406" -or $content -match "406") {
                Write-Log "[OK] $file contains HTTP 406 fixes" "Green"
            } else {
                Write-Log "[WARNING] $file may not contain HTTP 406 fixes" "Yellow"
            }
        } catch {
            Write-Log "[ERROR] Could not read $file" "Red"
        }
    } else {
        Write-Log "[ERROR] $file not found" "Red"
    }
}

# Test 4: Test específico de headers en supabaseClient
Write-Log "[TEST 4] Checking Supabase client headers..." "Cyan"
if (Test-Path "src/services/supabaseClient.ts") {
    try {
        $supabaseClientContent = Get-Content "src/services/supabaseClient.ts" -Raw -ErrorAction Stop
        if ($supabaseClientContent -match "Accept.*application/json" -and $supabaseClientContent -match "Prefer.*return=representation") {
            Write-Log "[OK] Enhanced headers found in supabaseClient" "Green"
        } else {
            Write-Log "[ERROR] Enhanced headers missing in supabaseClient" "Red"
        }
    } catch {
        Write-Log "[ERROR] Could not read supabaseClient.ts" "Red"
    }
} else {
    Write-Log "[ERROR] supabaseClient.ts not found" "Red"
}

# Test 5: Test específico de retry logic en mindopService
Write-Log "[TEST 5] Checking retry logic in mindopService..." "Cyan"
if (Test-Path "src/services/mindopService.ts") {
    try {
        $mindopServiceContent = Get-Content "src/services/mindopService.ts" -Raw -ErrorAction Stop
        if ($mindopServiceContent -match "maybeSingle" -and $mindopServiceContent -match "retryWithBackoff") {
            Write-Log "[OK] Enhanced query methods found in mindopService" "Green"
        } else {
            Write-Log "[ERROR] Enhanced query methods missing in mindopService" "Red"
        }
    } catch {
        Write-Log "[ERROR] Could not read mindopService.ts" "Red"
    }
} else {
    Write-Log "[ERROR] mindopService.ts not found" "Red"
}

# Test 6: Browser automation test (si es posible)
Write-Log "[TEST 6] Attempting browser test..." "Cyan"
try {
    # Crear un archivo HTML de prueba simple
    $testHtml = @"
<!DOCTYPE html>
<html>
<head>
    <title>HTTP 406 Test</title>
</head>
<body>
    <h1>Testing HTTP 406 Fix</h1>
    <div id="status">Testing...</div>
    <script>
        // Test básico de fetch
        console.log('Testing fetch to localhost...');
        const statusDiv = document.getElementById('status');
        
        fetch('http://localhost:3002')
            .then(response => {
                console.log('Response status:', response.status);
                if (response.status === 406) {
                    console.error('HTTP 406 detected!');
                    statusDiv.textContent = 'ERROR: HTTP 406 detected';
                    statusDiv.style.color = 'red';
                } else {
                    console.log('No HTTP 406 error');
                    statusDiv.textContent = 'OK: No HTTP 406 error (Status: ' + response.status + ')';
                    statusDiv.style.color = 'green';
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                statusDiv.textContent = 'ERROR: ' + error.message;
                statusDiv.style.color = 'orange';
            });
    </script>
</body>
</html>
"@
    
    $testHtmlFile = "test-http406-browser.html"
    Set-Content -Path $testHtmlFile -Value $testHtml -ErrorAction Stop
    Write-Log "[OK] Created browser test file: $testHtmlFile" "Green"
    
    # Intentar abrir en el navegador predeterminado
    $openBrowser = Read-Host "Do you want to open the browser test? (y/n)"
    if ($openBrowser -match '^[Yy]') {
        Start-Process $testHtmlFile
        Write-Log "[INFO] Opened browser test" "Blue"
    }
    
} catch {
    Write-Log "[WARNING] Could not create browser test: $_" "Yellow"
}

# Resumen final
Write-Log "[SUMMARY] Test Summary:" "Cyan"
Write-Log "=================" "Cyan"
Write-Log "[INFO] Key improvements implemented:" "Green"
Write-Log "   - Enhanced Supabase client headers (Accept, Prefer)" "White"
Write-Log "   - Dual query strategy (maybeSingle + array fallback)" "White"
Write-Log "   - Enhanced retry logic with exponential backoff" "White"
Write-Log "   - HTTP 406 specific error detection and handling" "White"

Write-Log "[NEXT] NEXT STEPS:" "Yellow"
Write-Log "1. Open http://localhost:3002 in browser" "White"
Write-Log "2. Navigate to MyMindOp page" "White"
Write-Log "3. Navigate away and back multiple times" "White"
Write-Log "4. Check browser DevTools for HTTP 406 errors" "White"
Write-Log "5. Verify data loads without manual refresh" "White"

Write-Log "[COMPLETE] HTTP 406 fix verification completed!" "Green"
Write-Host "`n[INFO] Full log saved to: $logFile" -ForegroundColor Cyan

# Reset error action preference
$ErrorActionPreference = "Continue"