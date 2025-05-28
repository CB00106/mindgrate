-- Verificación detallada de chunks y datos de prueba

-- 1. Verificar total de chunks
SELECT 'Total chunks' as check_type, COUNT(*) as count FROM mindop_document_chunks;

-- 2. Verificar chunks por mindop
SELECT 'Chunks por mindop' as check_type, mindop_id, COUNT(*) as chunks_count 
FROM mindop_document_chunks 
GROUP BY mindop_id;

-- 3. Verificar mindops existentes
SELECT 'Mindops existentes' as check_type, id, user_id, mindop_name 
FROM mindops;

-- 4. Verificar estructura de la tabla
SELECT 'Estructura tabla' as check_type, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mindop_document_chunks';

-- 5. Ver algunos chunks de ejemplo (si existen)
SELECT 'Ejemplo chunks' as check_type, 
       id, 
       mindop_id, 
       LEFT(content, 100) as content_preview,
       source_csv_name,
       created_at
FROM mindop_document_chunks 
LIMIT 5;
