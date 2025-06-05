# Test específico para HTTP 406 con logging detallado
# Simula la navegación que causa el problema

Write-Host "PRUEBA ESPECÍFICA PARA HTTP 406 ERROR" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "test-http406-specific-$timestamp.log"

function Write-DetailedLog {
    param($Message, $Color = "White")
    $timestampedMessage = "$(Get-Date -Format 'HH:mm:ss.fff') - $Message"
    Write-Host $timestampedMessage -ForegroundColor $Color
    Add-Content -Path $logFile -Value $timestampedMessage
}

Write-DetailedLog "Iniciando prueba específica para HTTP 406" "Green"

# Verificar que el servidor esté corriendo
Write-DetailedLog "Verificando estado del servidor..." "Cyan"
try {
    $serverCheck = Invoke-WebRequest -Uri "http://localhost:3002" -TimeoutSec 5 -UseBasicParsing
    Write-DetailedLog "Servidor activo en puerto 3002 (Status: $($serverCheck.StatusCode))" "Green"
} catch {
    Write-DetailedLog "Servidor no disponible: $($_.Exception.Message)" "Red"
    Write-DetailedLog "Intentando iniciar servidor..." "Yellow"
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "." -WindowStyle Minimized
    Start-Sleep -Seconds 15
}

# Leer la clave anon de Supabase del .env
Write-DetailedLog "Obteniendo clave de Supabase..." "Cyan"
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue
$anonKey = $null

if ($envContent) {
    foreach ($line in $envContent) {
        if ($line -match "VITE_SUPABASE_ANON_KEY=(.+)") {
            $anonKey = $matches[1]
            break
        }
    }
}

if ($anonKey) {
    Write-DetailedLog "Clave de Supabase encontrada (longitud: $($anonKey.Length))" "Green"
} else {
    Write-DetailedLog "No se pudo obtener la clave de Supabase del .env" "Yellow"
}

# Crear script de JavaScript para probar específicamente el endpoint problemático
$testScript = @"
console.log('Iniciando test específico para HTTP 406...');

// Simular el comportamiento exacto que causa el error
async function testMindOpEndpoint() {
    const userId = 'becf060f-0d0e-43a2-9870-7ff36cf1ed01'; // Usuario del error reportado
    const supabaseUrl = 'https://khzbklcvmlkhrraibksx.supabase.co';
    const endpoint = `${supabaseUrl}/rest/v1/mindops?select=*&user_id=eq.${userId}`;
    
    console.log('Testing endpoint:', endpoint);
    
    try {
        // Test 1: Sin headers específicos (reproducing original error)
        console.log('Test 1: Request sin headers específicos...');
        const response1 = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer $anonKey'
            }
        });
        
        console.log('Response 1 status:', response1.status);
        if (response1.status === 406) {
            console.error('HTTP 406 detectado en test 1!');
        } else {
            console.log('Test 1 exitoso:', response1.status);
        }
        
    } catch (error1) {
        console.error('Test 1 falló:', error1.message);
    }
    
    try {
        // Test 2: Con headers mejorados
        console.log('Test 2: Request con headers mejorados...');
        const response2 = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer $anonKey',
                'Accept': 'application/json, application/vnd.pgrst.object+json',
                'Content-Type': 'application/json',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Prefer': 'return=representation',
                'X-Client-Info': 'mindgrate-web-client/1.0.0'
            }
        });
        
        console.log('Response 2 status:', response2.status);
        if (response2.status === 406) {
            console.error('HTTP 406 persiste en test 2!');
        } else {
            console.log('Test 2 exitoso:', response2.status);
            const data = await response2.json();
            console.log('Data received:', data);
        }
        
    } catch (error2) {
        console.error('Test 2 falló:', error2.message);
    }
    
    // Test 3: Usando query alternativa (limit approach)
    try {
        console.log('Test 3: Query con limit approach...');
        const altEndpoint = `${supabaseUrl}/rest/v1/mindops?select=*&user_id=eq.${userId}&limit=1`;
        
        const response3 = await fetch(altEndpoint, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer $anonKey',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        });
        
        console.log('Response 3 status:', response3.status);
        if (response3.status === 406) {
            console.error('HTTP 406 persiste en test 3!');
        } else {
            console.log('Test 3 exitoso:', response3.status);
            const data = await response3.json();
            console.log('Data received:', data);
        }
        
    } catch (error3) {
        console.error('Test 3 falló:', error3.message);
    }
}

// Ejecutar tests
testMindOpEndpoint();
"@

$testJsFile = "test-http406-endpoint.js"
Set-Content -Path $testJsFile -Value $testScript

Write-DetailedLog "Script de test creado: $testJsFile" "Green"

Write-DetailedLog "Instrucciones para test manual:" "Yellow"
Write-DetailedLog "1. Abrir DevTools en Chrome/Edge (F12)" "White"
Write-DetailedLog "2. Ir a la pestaña Console" "White"
Write-DetailedLog "3. Pegar y ejecutar el contenido de $testJsFile" "White"
Write-DetailedLog "4. Observar los resultados para cada test" "White"
Write-DetailedLog "5. Verificar si HTTP 406 persiste o se resuelve" "White"

Write-DetailedLog "Abriendo aplicación en navegador..." "Cyan"
Start-Process "http://localhost:3002"

Write-DetailedLog "RESUMEN DE MEJORAS IMPLEMENTADAS:" "Green"
Write-DetailedLog "=================================" "Green"
Write-DetailedLog "Headers mejorados en supabaseClient.ts:" "White"
Write-DetailedLog "  - Accept: application/json, text/plain, */*" "Gray"
Write-DetailedLog "  - Prefer: return=representation" "Gray"
Write-DetailedLog "  - Cache-Control: no-cache" "Gray"
Write-DetailedLog "Estrategia dual en mindopService.ts:" "White"
Write-DetailedLog "  - Array query primero (más confiable)" "Gray"
Write-DetailedLog "  - Fallback a maybeSingle()" "Gray"
Write-DetailedLog "Retry mejorado en useMindOp.ts:" "White"
Write-DetailedLog "  - Detección específica de HTTP 406" "Gray"
Write-DetailedLog "  - Retry automático hasta 3 veces" "Gray"
Write-DetailedLog "  - Delays progresivos: 500ms, 1s, 2s" "Gray"

Write-DetailedLog "PRÓXIMO PASO CRÍTICO:" "Yellow"
Write-DetailedLog "Navegar a /my-mindop, luego a otra página, y regresar para verificar si el error persiste" "White"

Write-DetailedLog "Test específico HTTP 406 completado!" "Green"
Write-Host "Log completo en: $logFile" -ForegroundColor Cyan
