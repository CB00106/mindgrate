-- Función específica para la Edge Function mindop-service
-- Busca chunks relevantes por mindop_id con embedding vector
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
