# Debug simple para MindOp Coke
Write-Host "Debugging MindOp Coke data..." -ForegroundColor Cyan

# Cargar variables de entorno desde .env
if (Test-Path ".env") {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
        }
    }
}

# Verificar variable de entorno (usar VITE_SUPABASE_ANON_KEY)
$supabaseKey = $env:VITE_SUPABASE_ANON_KEY
if (-not $supabaseKey) {
    Write-Host "ERROR: VITE_SUPABASE_ANON_KEY no esta configurado" -ForegroundColor Red
    exit 1
}

$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
}

# Buscar MindOp Coke
Write-Host "`nBuscando MindOp con 'Coke'..." -ForegroundColor Yellow

try {
    # Usar comillas simples para evitar problemas con &
    $uri = 'https://khzbklcvmlkhrraibksx.supabase.co/rest/v1/mindops?select=id,mindop_name,user_id,created_at&mindop_name=ilike.*coke*'
    $mindops = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    
    Write-Host "MindOps encontrados: $($mindops.Count)" -ForegroundColor Green
    
    if ($mindops.Count -gt 0) {
        foreach ($mindop in $mindops) {
            Write-Host "`nMindOp encontrado:" -ForegroundColor White
            Write-Host "  ID: $($mindop.id)"
            Write-Host "  Nombre: $($mindop.mindop_name)"
            Write-Host "  Usuario: $($mindop.user_id)"
            
            # Verificar chunks
            $mindopId = $mindop.id
            $chunksUri = "https://khzbklcvmlkhrraibksx.supabase.co/rest/v1/mindop_document_chunks?select=*&mindop_id=eq.$mindopId"
            
            try {
                $chunks = Invoke-RestMethod -Uri $chunksUri -Method GET -Headers $headers
                Write-Host "  Chunks: $($chunks.Count)" -ForegroundColor $(if ($chunks.Count -gt 0) { "Green" } else { "Red" })
                
                if ($chunks.Count -gt 0) {
                    $files = $chunks | Group-Object source_csv_name
                    Write-Host "  Archivos:"
                    foreach ($file in $files) {
                        Write-Host "    - $($file.Name): $($file.Count) chunks"
                    }
                } else {
                    Write-Host "  PROBLEMA: NO HAY CHUNKS!" -ForegroundColor Red
                }
            }
            catch {
                Write-Host "  Error verificando chunks: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "No se encontraron MindOps con 'Coke'" -ForegroundColor Red
          # Mostrar algunos MindOps existentes
        Write-Host "`nMostrando algunos MindOps existentes:" -ForegroundColor Yellow
        $allUri = 'https://khzbklcvmlkhrraibksx.supabase.co/rest/v1/mindops?select=id,mindop_name&limit=5'
        
        try {
            $allMindops = Invoke-RestMethod -Uri $allUri -Method GET -Headers $headers
            Write-Host "Total MindOps encontrados: $($allMindops.Count)" -ForegroundColor Cyan
            
            foreach ($mindop in $allMindops) {
                Write-Host "  - $($mindop.mindop_name) (ID: $($mindop.id))"
            }
        }
        catch {
            Write-Host "Error obteniendo MindOps existentes: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Detalles del error: $($_.Exception)" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nDebug completado" -ForegroundColor Green
