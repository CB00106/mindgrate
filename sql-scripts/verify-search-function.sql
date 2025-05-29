-- Verificar si la función search_relevant_chunks existe
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'search_relevant_chunks' 
AND routine_schema = 'public';

-- Verificar si la tabla mindop_document_chunks existe
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'mindop_document_chunks'
ORDER BY ordinal_position;

-- Verificar si hay datos en la tabla
SELECT COUNT(*) as total_chunks FROM mindop_document_chunks;
