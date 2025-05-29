-- Verificación directa de la función search_relevant_chunks
-- Este script verifica que la función SQL existe y funciona

-- 1. Verificar que la extensión vector está habilitada
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 2. Verificar que la tabla mindop_document_chunks existe
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mindop_document_chunks' 
ORDER BY ordinal_position;

-- 3. Verificar que la función search_relevant_chunks existe
SELECT 
    routine_name,
    routine_type,
    specific_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'search_relevant_chunks';

-- 4. Contar chunks existentes por usuario
SELECT 
    user_id,
    COUNT(*) as total_chunks,
    COUNT(DISTINCT mindop_id) as mindops_with_data,
    MAX(created_at) as last_upload
FROM mindop_document_chunks 
GROUP BY user_id 
ORDER BY total_chunks DESC 
LIMIT 5;

-- 5. Verificar índices vectoriales
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'mindop_document_chunks' 
AND indexname LIKE '%embedding%';

-- 6. Test básico de la función (solo si hay datos)
-- Esto fallaría si no hay un mindop_id válido, pero mostraría si la función existe
DO $$
DECLARE
    test_embedding vector(1536);
    test_mindop_id uuid;
    result_count integer;
BEGIN
    -- Crear un vector de prueba (todos ceros)
    test_embedding := array_fill(0.1, ARRAY[1536])::vector;
    
    -- Buscar el primer mindop_id disponible
    SELECT id INTO test_mindop_id FROM mindops LIMIT 1;
    
    IF test_mindop_id IS NOT NULL THEN
        -- Probar la función
        SELECT COUNT(*) INTO result_count
        FROM search_relevant_chunks(
            test_embedding,
            test_mindop_id,
            0.1,  -- threshold bajo para obtener resultados
            1     -- solo 1 resultado
        );
        
        RAISE NOTICE 'Función search_relevant_chunks funciona. Resultados encontrados: %', result_count;
    ELSE
        RAISE NOTICE 'No hay mindops disponibles para probar, pero la función existe';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error probando función: %', SQLERRM;
END $$;
