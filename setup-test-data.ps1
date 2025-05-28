# Script para verificar y crear datos de prueba para mindops
Write-Host "🔧 === VERIFICACIÓN DE DATOS MINDOPS ===" -ForegroundColor Green

# Configuración
$SUPABASE_URL = "https://khzbklcvmlkhrraibksx.supabase.co"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoemJrbGN2bWxraHJyYWlia3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3Njk5NjQsImV4cCI6MjA2MzM0NTk2NH0.-f3mBw4m5YDn-mPA_JPjQ7PeNNugMweFXA-IbavMR6o"
$TEST_EMAIL = "cesar_106@hotmail.com"
$TEST_PASSWORD = "2812847Wt%"

try {
    # 1. Autenticación
    Write-Host ""
    Write-Host "1. Autenticando usuario..." -ForegroundColor Yellow
    
    $authBody = @{
        email = $TEST_EMAIL
        password = $TEST_PASSWORD
    } | ConvertTo-Json

    $authHeaders = @{
        "Content-Type" = "application/json"
        "apikey" = $ANON_KEY
    }

    $authResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/token?grant_type=password" -Method POST -Body $authBody -Headers $authHeaders
    $accessToken = $authResponse.access_token
    $userId = $authResponse.user.id
    
    Write-Host "✅ Usuario autenticado: $userId" -ForegroundColor Green

    # 2. Verificar mindops existentes
    Write-Host ""
    Write-Host "2. Verificando mindops existentes..." -ForegroundColor Yellow
    
    $checkHeaders = @{
        "apikey" = $ANON_KEY
        "Authorization" = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }

    $existingMindops = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/mindops?select=*" -Method GET -Headers $checkHeaders
    Write-Host "📊 Encontrados $($existingMindops.Count) mindops existentes" -ForegroundColor Cyan
    
    if ($existingMindops.Count -gt 0) {
        foreach ($mindop in $existingMindops) {
            Write-Host "  - $($mindop.mindop_name): $($mindop.mindop_description)" -ForegroundColor Gray
        }
    }

    # 3. Crear mindops de prueba si no existen
    if ($existingMindops.Count -eq 0) {
        Write-Host ""
        Write-Host "3. Creando mindops de prueba..." -ForegroundColor Yellow
        
        $testMindops = @(
            @{
                user_id = $userId
                mindop_name = "Marketing Digital"
                mindop_description = "Análisis de campañas de marketing digital y métricas de conversión"
            },
            @{
                user_id = $userId
                mindop_name = "Análisis de Ventas"
                mindop_description = "Dashboard de ventas mensuales y tendencias del mercado"
            },
            @{
                user_id = $userId
                mindop_name = "Gestión de Inventario"
                mindop_description = "Control de stock y predicción de demanda"
            },
            @{
                user_id = $userId
                mindop_name = "Recursos Humanos"
                mindop_description = "Métricas de empleados y análisis de rendimiento"
            },
            @{
                user_id = $userId
                mindop_name = "Finanzas Corporativas"
                mindop_description = "Estados financieros y análisis de rentabilidad"
            }
        )

        $createBody = $testMindops | ConvertTo-Json
        $createHeaders = @{
            "apikey" = $ANON_KEY
            "Authorization" = "Bearer $accessToken"
            "Content-Type" = "application/json"
            "Prefer" = "return=representation"
        }

        $createdMindops = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/mindops" -Method POST -Body $createBody -Headers $createHeaders
        Write-Host "✅ Creados $($createdMindops.Count) mindops de prueba" -ForegroundColor Green
    } else {
        Write-Host "✅ Ya existen mindops, no es necesario crear más" -ForegroundColor Green
    }

    # 4. Probar función de búsqueda
    Write-Host ""
    Write-Host "4. Probando función de búsqueda..." -ForegroundColor Yellow
    
    $searchHeaders = @{
        "Authorization" = "Bearer $accessToken"
    }

    $searchResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/search-mindops?searchTerm=Marketing" -Method GET -Headers $searchHeaders
    
    if ($searchResponse.success) {
        Write-Host "✅ Función de búsqueda funcionando: $($searchResponse.results.Count) resultados para 'Marketing'" -ForegroundColor Green
        foreach ($result in $searchResponse.results) {
            Write-Host "  - $($result.mindop_name)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Error en función de búsqueda" -ForegroundColor Red
    }

} catch {
    Write-Host ""
    Write-Host "💥 Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
}
