-- Verificar si existe la tabla mindop_document_chunks
SELECT COUNT(*) as total_chunks FROM mindop_document_chunks;

-- Verificar la estructura de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mindop_document_chunks';

-- Ver algunos datos de ejemplo
SELECT id, mindop_id, user_id, 
       LEFT(content, 100) as content_preview,
       source_csv_name, created_at
FROM mindop_document_chunks 
ORDER BY created_at DESC 
LIMIT 5;
