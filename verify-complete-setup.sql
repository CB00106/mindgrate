# Script para verificar el flujo completo de vectorización y consulta
# Ejecutar este script paso a paso en el SQL Editor de Supabase

# Paso 1: Verificar que la extensión vector esté habilitada
SELECT * FROM pg_extension WHERE extname = 'vector';

# Paso 2: Verificar que la tabla mindop_document_chunks existe
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'mindop_document_chunks' 
ORDER BY ordinal_position;

# Paso 3: Verificar que hay datos en la tabla
SELECT 
    COUNT(*) as total_chunks,
    COUNT(DISTINCT mindop_id) as unique_mindops,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT source_csv_name) as unique_csvs
FROM mindop_document_chunks;

# Paso 4: Ver algunos datos de ejemplo
SELECT 
    id, 
    mindop_id, 
    user_id,
    LEFT(content, 100) as content_preview,
    source_csv_name,
    created_at
FROM mindop_document_chunks 
ORDER BY created_at DESC 
LIMIT 5;

# Paso 5: Crear la función search_relevant_chunks si no existe
CREATE OR REPLACE FUNCTION search_relevant_chunks(
    query_embedding VECTOR(1536),
    target_mindop_id UUID,
    similarity_threshold FLOAT DEFAULT 0.3,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity FLOAT,
    source_csv_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        mdc.id,
        mdc.content,
        1 - (mdc.embedding <=> query_embedding) AS similarity,
        mdc.source_csv_name,
        mdc.created_at
    FROM mindop_document_chunks mdc
    WHERE 
        mdc.mindop_id = target_mindop_id
        AND (1 - (mdc.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY mdc.embedding <=> query_embedding
    LIMIT match_count;
$$;

# Paso 6: Verificar que la función se creó correctamente
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'search_relevant_chunks';
