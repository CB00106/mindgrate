-- Debug script para verificar el MindOp "Coke" y sus chunks
-- Ejecutar en la consola de Supabase (producción)

-- 1. Buscar el MindOp "Coke"
SELECT 
    id,
    mindop_name,
    mindop_description,
    user_id,
    created_at,
    updated_at
FROM mindops 
WHERE mindop_name ILIKE '%coke%' 
   OR mindop_name ILIKE '%coca%'
ORDER BY created_at DESC;

-- 2. Verificar chunks para todos los MindOPs encontrados arriba
-- (Reemplazar 'TARGET_MINDOP_ID' con el ID del MindOp "Coke")
SELECT 
    mindop_id,
    COUNT(*) as chunk_count,
    MIN(created_at) as first_chunk,
    MAX(created_at) as last_chunk,
    COUNT(DISTINCT source_csv_name) as file_count,
    STRING_AGG(DISTINCT source_csv_name, ', ') as files
FROM mindop_document_chunks 
WHERE mindop_id IN (
    SELECT id FROM mindops WHERE mindop_name ILIKE '%coke%' OR mindop_name ILIKE '%coca%'
)
GROUP BY mindop_id;

-- 3. Ver sample de chunks si existen
SELECT 
    m.mindop_name,
    c.id,
    c.source_csv_name,
    LEFT(c.content, 100) as content_preview,
    c.created_at
FROM mindop_document_chunks c
JOIN mindops m ON c.mindop_id = m.id
WHERE m.mindop_name ILIKE '%coke%' OR m.mindop_name ILIKE '%coca%'
ORDER BY c.created_at DESC
LIMIT 5;

-- 4. Verificar si hay algún problema con los IDs
SELECT 
    'mindops' as table_name,
    COUNT(*) as total_records
FROM mindops
UNION ALL
SELECT 
    'mindop_document_chunks' as table_name,
    COUNT(*) as total_records
FROM mindop_document_chunks
UNION ALL
SELECT 
    'collaboration_tasks' as table_name,
    COUNT(*) as total_records
FROM mindop_collaboration_tasks;

-- 5. Verificar últimas tareas de colaboración
SELECT 
    t.id,
    m1.mindop_name as requester_mindop,
    m2.mindop_name as target_mindop,
    t.requester_user_query,
    t.status,
    t.metadata,
    t.created_at
FROM mindop_collaboration_tasks t
LEFT JOIN mindops m1 ON t.requester_mindop_id = m1.id
LEFT JOIN mindops m2 ON t.target_mindop_id = m2.id
WHERE m2.mindop_name ILIKE '%coke%' OR m2.mindop_name ILIKE '%coca%'
ORDER BY t.created_at DESC
LIMIT 10;
