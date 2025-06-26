# Script para debuggear el problema del MindOp "Coke"
# Este script consulta directamente la base de datos de producción

Write-Host "🔍 Debugging MindOp 'Coke' data..." -ForegroundColor Cyan

# Verificar variables de entorno
if (-not $env:SUPABASE_ANON_KEY) {
    Write-Host "❌ SUPABASE_ANON_KEY no está configurado" -ForegroundColor Red
    Write-Host "💡 Ejecuta: `$env:SUPABASE_ANON_KEY = 'tu_clave_aqui'" -ForegroundColor Yellow
    exit 1
}

# Headers comunes para todas las peticiones
$headers = @{
    "apikey" = $env:SUPABASE_ANON_KEY
    "Authorization" = "Bearer $env:SUPABASE_ANON_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

$baseUrl = "https://khzbklcvmlkhrraibksx.supabase.co/rest/v1"

# 1. Buscar MindOp "Coke" con múltiples variaciones
Write-Host "`n🔍 Buscando MindOp 'Coke'..." -ForegroundColor Cyan

$searchTerms = @("coke", "coca", "Coke", "COKE", "Coca")
$allMindOps = @()

foreach ($term in $searchTerms) {
    try {
        $url = "$baseUrl/mindops?select=id,mindop_name,user_id,created_at&mindop_name=ilike.*$term*&order=created_at.desc&limit=10"
        Write-Host "🔍 Buscando con término: '$term'" -ForegroundColor Gray
        
        $response = Invoke-RestMethod -Uri $url -Method GET -Headers $headers
        
        if ($response -and $response.Count -gt 0) {
            $allMindOps += $response
            Write-Host "✅ Encontrados $($response.Count) resultados con '$term'" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⚠️ Error buscando '$term': $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Eliminar duplicados por ID
$uniqueMindOps = $allMindOps | Sort-Object id -Unique

if ($uniqueMindOps.Count -gt 0) {
    Write-Host "`n✅ MindOps encontrados ($($uniqueMindOps.Count)):" -ForegroundColor Green
    
    foreach ($mindop in $uniqueMindOps) {
        Write-Host "`n📋 MindOp Details:" -ForegroundColor Cyan
        Write-Host "  - ID: $($mindop.id)" -ForegroundColor White
        Write-Host "  - Nombre: '$($mindop.mindop_name)'" -ForegroundColor White
        Write-Host "  - Usuario: $($mindop.user_id)" -ForegroundColor White
        Write-Host "  - Creado: $($mindop.created_at)" -ForegroundColor White
        
        # Verificar chunks para este MindOp
        $mindopId = $mindop.id
        Write-Host "  📊 Verificando chunks..." -ForegroundColor Yellow
        
        try {
            $chunksUrl = "$baseUrl/mindop_document_chunks?select=id,source_csv_name,chunk_index,content&mindop_id=eq.$mindopId&order=chunk_index.asc"
            $chunks = Invoke-RestMethod -Uri $chunksUrl -Method GET -Headers $headers
            
            if ($chunks -and $chunks.Count -gt 0) {
                Write-Host "  ✅ Chunks encontrados: $($chunks.Count)" -ForegroundColor Green
                
                # Agrupar por archivo fuente
                $fileGroups = $chunks | Group-Object source_csv_name
                Write-Host "  📄 Archivos fuente:" -ForegroundColor Cyan
                
                foreach ($group in $fileGroups) {
                    $fileName = if ($group.Name) { $group.Name } else { "Sin nombre" }
                    Write-Host "    - $fileName: $($group.Count) chunks" -ForegroundColor White
                }
                
                # Mostrar una muestra del contenido
                Write-Host "  📝 Muestra de contenido (primer chunk):" -ForegroundColor Cyan
                $firstChunk = $chunks[0]
                $preview = if ($firstChunk.content.Length -gt 200) { 
                    $firstChunk.content.Substring(0, 200) + "..." 
                } else { 
                    $firstChunk.content 
                }
                Write-Host "    $preview" -ForegroundColor Gray
                
            } else {
                Write-Host "  ⚠️ NO HAY CHUNKS - Este MindOp no tiene datos procesados!" -ForegroundColor Red
                Write-Host "  💡 Posibles causas:" -ForegroundColor Yellow
                Write-Host "    - El procesamiento de documentos falló" -ForegroundColor Gray
                Write-Host "    - Los archivos no se subieron correctamente" -ForegroundColor Gray
                Write-Host "    - Error en el pipeline de embeddings" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "  ❌ Error consultando chunks: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "  🔧 URL intentada: $chunksUrl" -ForegroundColor Gray
        }
        
        # Verificar documentos originales
        Write-Host "  📄 Verificando documentos originales..." -ForegroundColor Yellow
        try {
            $docsUrl = "$baseUrl/mindop_documents?select=id,original_filename,file_size,upload_status&mindop_id=eq.$mindopId"
            $docs = Invoke-RestMethod -Uri $docsUrl -Method GET -Headers $headers
            
            if ($docs -and $docs.Count -gt 0) {
                Write-Host "  ✅ Documentos encontrados: $($docs.Count)" -ForegroundColor Green
                foreach ($doc in $docs) {
                    $status = if ($doc.upload_status) { $doc.upload_status } else { "desconocido" }
                    $size = if ($doc.file_size) { "$($doc.file_size) bytes" } else { "N/A" }
                    Write-Host "    - $($doc.original_filename) ($size) - Estado: $status" -ForegroundColor White
                }
            } else {
                Write-Host "  ⚠️ NO HAY DOCUMENTOS ORIGINALES" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "  ❌ Error consultando documentos: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host "  " + ("─" * 50) -ForegroundColor DarkGray
    }
} else {
    Write-Host "`n❌ No se encontró ningún MindOp con variaciones de 'Coke'" -ForegroundColor Red
    
    # Buscar todos los MindOps para diagnóstico
    Write-Host "`n🔍 Listando todos los MindOps para diagnóstico..." -ForegroundColor Cyan
    try {
        $allMindopsUrl = "$baseUrl/mindops?select=id,mindop_name,created_at&order=created_at.desc&limit=20"
        $allMindops = Invoke-RestMethod -Uri $allMindopsUrl -Method GET -Headers $headers
        
        if ($allMindops -and $allMindops.Count -gt 0) {
            Write-Host "📋 MindOps existentes (últimos 20):" -ForegroundColor Green
            foreach ($mindop in $allMindops) {
                Write-Host "  - '$($mindop.mindop_name)' (ID: $($mindop.id)) - $($mindop.created_at)" -ForegroundColor White
            }
        } else {
            Write-Host "❌ No hay MindOps en la base de datos" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error listando MindOps: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Verificar conectividad general
Write-Host "`n🔌 Verificando conectividad con Supabase..." -ForegroundColor Cyan
try {
    $healthUrl = "$baseUrl/mindops?select=count&limit=1"
    $healthCheck = Invoke-RestMethod -Uri $healthUrl -Method GET -Headers $headers
    Write-Host "✅ Conexión exitosa con Supabase" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error de conectividad: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Verifica tu clave API y URL de Supabase" -ForegroundColor Yellow
}

Write-Host "`n✅ Debug completado" -ForegroundColor Green
Write-Host "💡 Tip: Si no hay chunks, revisa los logs del procesamiento de documentos" -ForegroundColor Yellow