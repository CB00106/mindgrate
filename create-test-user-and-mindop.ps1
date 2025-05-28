# Test crear usuario y MindOp con PowerShell y curl
Write-Host "🔧 Creando usuario de test y configuración MindOp..." -ForegroundColor Cyan

$supabaseUrl = "https://khzbklcvmlkhrraibksx.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoemJrbGN2bWxraHJyYWlia3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3Njk5NjQsImV4cCI6MjA2MzM0NTk2NH0.-f3mBw4m5YDn-mPA_JPjQ7PeNNugMweFXA-IbavMR6o"
$serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoemJrbGN2bWxraHJyYWlia3N4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzc2OTk2NCwiZXhwIjoyMDYzMzQ1OTY0fQ.7JrhhYkfe0JPeo-pEEE0J9GDyxNEObHJFyxzZH_4iQc"

$testEmail = "testuser@mindops.test"
$testPassword = "TestPassword123!"

# Paso 1: Crear usuario usando Auth API
Write-Host "📝 Paso 1: Creando usuario..." -ForegroundColor Yellow

$signUpData = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/signup" `
        -Method POST `
        -Headers @{
            'Content-Type' = 'application/json'
            'apikey' = $anonKey
        } `
        -Body $signUpData
    
    Write-Host "✅ Usuario creado/existente" -ForegroundColor Green
    Write-Host "👤 ID: $($authResponse.user.id)" -ForegroundColor Green
    Write-Host "📧 Email: $($authResponse.user.email)" -ForegroundColor Green
    
    $userId = $authResponse.user.id
    $userToken = $authResponse.access_token
    
    Write-Host "🔑 Token obtenido: $($userToken.Substring(0,30))..." -ForegroundColor Green
    
} catch {
    Write-Host "⚠️ Usuario puede existir, intentando login..." -ForegroundColor Yellow
    
    $signInData = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json
    
    try {
        $authResponse = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/token?grant_type=password" `
            -Method POST `
            -Headers @{
                'Content-Type' = 'application/json'
                'apikey' = $anonKey
            } `
            -Body $signInData
        
        Write-Host "✅ Login exitoso" -ForegroundColor Green
        $userId = $authResponse.user.id
        $userToken = $authResponse.access_token
        
    } catch {
        Write-Host "❌ Error en autenticación: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Paso 2: Crear configuración MindOp usando service role key
Write-Host "`n📊 Paso 2: Creando configuración MindOp..." -ForegroundColor Yellow

$mindopData = @{
    user_id = $userId
    mindop_name = "Test MindOp"
    mindop_description = "Configuración de prueba para debugging"
} | ConvertTo-Json

try {
    $mindopResponse = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/mindops" `
        -Method POST `
        -Headers @{
            'Content-Type' = 'application/json'
            'apikey' = $serviceKey
            'Authorization' = "Bearer $serviceKey"
            'Prefer' = 'return=representation'
        } `
        -Body $mindopData
    
    Write-Host "✅ MindOp creado" -ForegroundColor Green
    Write-Host "🆔 MindOp ID: $($mindopResponse.id)" -ForegroundColor Green
    Write-Host "📝 Nombre: $($mindopResponse.mindop_name)" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️ Error creando MindOp (puede existir): $($_.Exception.Message)" -ForegroundColor Yellow
}

# Paso 3: Testear función mindop-service con usuario autenticado
Write-Host "`n🧪 Paso 3: Testing mindop-service..." -ForegroundColor Yellow

$testData = @{
    message = "Test con usuario y MindOp configurado correctamente"
    chatId = "test-chat-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/mindop-service" `
        -Method POST `
        -Headers @{
            'Content-Type' = 'application/json'
            'Authorization' = "Bearer $userToken"
        } `
        -Body $testData
    
    Write-Host "✅ ¡ÉXITO! Función respondió correctamente:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
    
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $reader.Close()
        
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
        
        if ($_.Exception.Response.StatusCode -eq 500) {
            Write-Host "💥 ¡ERROR 500 CAPTURADO! Revisando logs..." -ForegroundColor Red
        }
    }
}
