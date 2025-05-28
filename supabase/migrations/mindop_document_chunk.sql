-- Habilitar la extensión pgvector para soporte de vectores
CREATE EXTENSION IF NOT EXISTS vector;

-- Crear la tabla mindop_document_chunks
CREATE TABLE mindop_document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mindop_id UUID NOT NULL REFERENCES public.mindops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    source_csv_name TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE mindop_document_chunks ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS DE SEGURIDAD RLS
-- ========================================

-- Política para SELECT: Los usuarios pueden leer solo sus propios chunks
CREATE POLICY "Users can view their own document chunks" ON mindop_document_chunks
    FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT: Los usuarios pueden insertar chunks solo si:
-- 1. El user_id coincide con su propio ID
-- 2. El mindop_id les pertenece (verificado mediante join con la tabla mindops)
CREATE POLICY "Users can insert chunks for their own mindops" ON mindop_document_chunks
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM public.mindops 
            WHERE id = mindop_id 
            AND user_id = auth.uid()
        )
    );

-- Política para UPDATE: Los usuarios pueden actualizar solo sus propios chunks
CREATE POLICY "Users can update their own document chunks" ON mindop_document_chunks
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política para DELETE: Los usuarios pueden eliminar solo sus propios chunks
-- Necesario para reemplazar o eliminar datasets
CREATE POLICY "Users can delete their own document chunks" ON mindop_document_chunks
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- ÍNDICES PARA RENDIMIENTO
-- ========================================

-- Índice para búsquedas por user_id
CREATE INDEX idx_mindop_document_chunks_user_id ON mindop_document_chunks(user_id);

-- Índice para búsquedas por mindop_id
CREATE INDEX idx_mindop_document_chunks_mindop_id ON mindop_document_chunks(mindop_id);

-- Índice para búsquedas por fecha de creación
CREATE INDEX idx_mindop_document_chunks_created_at ON mindop_document_chunks(created_at DESC);

-- Índice para búsquedas por nombre del archivo CSV fuente
CREATE INDEX idx_mindop_document_chunks_source_csv ON mindop_document_chunks(source_csv_name) 
WHERE source_csv_name IS NOT NULL;

-- Índice compuesto para consultas frecuentes (user_id + mindop_id)
CREATE INDEX idx_mindop_document_chunks_user_mindop ON mindop_document_chunks(user_id, mindop_id);

-- ========================================
-- ÍNDICES VECTORIALES PARA BÚSQUEDA SEMÁNTICA
-- ========================================

-- Opción 1: HNSW (Hierarchical Navigable Small World) - RECOMENDADO
-- Mejor para datasets dinámicos, consultas rápidas y alta precisión
-- Soportado en pgvector 0.5.0+ y Supabase
-- NOTA: Crear DESPUÉS de insertar datos para mejor rendimiento
CREATE INDEX idx_mindop_document_chunks_embedding_hnsw ON mindop_document_chunks 
USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Opción 2: IVFFlat (Inverted File with Flat compression) - FALLBACK
-- Mejor para datasets grandes y estáticos, menor uso de memoria
-- Descomentar si HNSW no está disponible en tu versión de pgvector
/*
CREATE INDEX idx_mindop_document_chunks_embedding_ivfflat ON mindop_document_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
*/

-- ========================================
-- FUNCIONES AUXILIARES PARA BÚSQUEDA VECTORIAL
-- ========================================

-- Función para búsqueda de similitud semántica con filtros de seguridad
CREATE OR REPLACE FUNCTION search_document_chunks(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    filter_user_id UUID DEFAULT NULL,
    filter_mindop_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    mindop_id UUID,
    user_id UUID,
    content TEXT,
    source_csv_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    similarity FLOAT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        mdc.id,
        mdc.mindop_id,
        mdc.user_id,
        mdc.content,
        mdc.source_csv_name,
        mdc.created_at,
        1 - (mdc.embedding <=> query_embedding) AS similarity
    FROM mindop_document_chunks mdc
    WHERE 
        -- Aplicar umbral de similitud
        (mdc.embedding <=> query_embedding) < (1 - match_threshold)
        -- Filtros opcionales
        AND (filter_user_id IS NULL OR mdc.user_id = filter_user_id)
        AND (filter_mindop_id IS NULL OR mdc.mindop_id = filter_mindop_id)
        -- Seguridad: El usuario solo puede buscar en sus propios chunks
        AND (
            -- Si es llamada por un usuario autenticado, solo sus chunks
            (auth.uid() IS NOT NULL AND mdc.user_id = auth.uid())
            OR 
            -- Si es llamada por service_role (Edge Functions), sin restricción
            (auth.jwt() ->> 'role' = 'service_role')
        )
    ORDER BY mdc.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Función específica para Edge Functions con service_role
-- Esta función bypassa RLS y es para uso interno de las Edge Functions
CREATE OR REPLACE FUNCTION search_document_chunks_internal(
    query_embedding VECTOR(1536),
    target_user_id UUID,
    target_mindop_id UUID DEFAULT NULL,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    mindop_id UUID,
    user_id UUID,
    content TEXT,
    source_csv_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    similarity FLOAT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        mdc.id,
        mdc.mindop_id,
        mdc.user_id,
        mdc.content,
        mdc.source_csv_name,
        mdc.created_at,
        1 - (mdc.embedding <=> query_embedding) AS similarity
    FROM mindop_document_chunks mdc
    WHERE 
        mdc.user_id = target_user_id
        AND (target_mindop_id IS NULL OR mdc.mindop_id = target_mindop_id)
        AND (mdc.embedding <=> query_embedding) < (1 - match_threshold)
    ORDER BY mdc.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Eliminar función existente si existe para evitar conflictos de tipo
DROP FUNCTION IF EXISTS get_vectorization_stats(uuid);

-- Función para obtener estadísticas de vectorización por usuario
CREATE OR REPLACE FUNCTION get_vectorization_stats(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    user_id UUID,
    total_chunks INTEGER,
    total_mindops INTEGER,
    total_csv_files INTEGER,
    earliest_chunk TIMESTAMP WITH TIME ZONE,
    latest_chunk TIMESTAMP WITH TIME ZONE,
    avg_content_length FLOAT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        mdc.user_id,
        COUNT(*)::INTEGER as total_chunks,
        COUNT(DISTINCT mdc.mindop_id)::INTEGER as total_mindops,
        COUNT(DISTINCT mdc.source_csv_name)::INTEGER as total_csv_files,
        MIN(mdc.created_at) as earliest_chunk,
        MAX(mdc.created_at) as latest_chunk,
        AVG(LENGTH(mdc.content))::FLOAT as avg_content_length
    FROM mindop_document_chunks mdc
    WHERE 
        (target_user_id IS NULL OR mdc.user_id = target_user_id)
        AND (
            -- Seguridad: Solo stats propias o service_role
            (auth.uid() IS NOT NULL AND mdc.user_id = auth.uid())
            OR 
            (auth.jwt() ->> 'role' = 'service_role')
        )
    GROUP BY mdc.user_id;
$$;

-- Función para limpiar chunks de un MindOp específico
-- Útil para reemplazar datasets completos
CREATE OR REPLACE FUNCTION delete_mindop_chunks(
    target_mindop_id UUID,
    target_user_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
AS $$
    WITH deleted AS (
        DELETE FROM mindop_document_chunks 
        WHERE 
            mindop_id = target_mindop_id
            AND (target_user_id IS NULL OR user_id = target_user_id)
            AND (
                -- Seguridad: Solo eliminar propios chunks o service_role
                (auth.uid() IS NOT NULL AND user_id = auth.uid())
                OR 
                (auth.jwt() ->> 'role' = 'service_role')
            )
        RETURNING id
    )
    SELECT COUNT(*)::INTEGER FROM deleted;
$$;

-- ========================================
-- FUNCIÓN ESPECÍFICA PARA EDGE FUNCTION MINDOP-SERVICE
-- ========================================

-- Función optimizada para la Edge Function mindop-service
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

-- ========================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ========================================

COMMENT ON TABLE mindop_document_chunks IS 'Almacena fragmentos de documentos vectorizados para búsqueda semántica con seguridad RLS';
COMMENT ON COLUMN mindop_document_chunks.id IS 'Identificador único del fragmento de documento';
COMMENT ON COLUMN mindop_document_chunks.mindop_id IS 'Referencia al MindOp al que pertenece este fragmento';
COMMENT ON COLUMN mindop_document_chunks.user_id IS 'Referencia al usuario propietario del fragmento';
COMMENT ON COLUMN mindop_document_chunks.content IS 'Contenido de texto del fragmento del documento';
COMMENT ON COLUMN mindop_document_chunks.embedding IS 'Vector de embedding de 1536 dimensiones generado por text-embedding-3-small de OpenAI';
COMMENT ON COLUMN mindop_document_chunks.source_csv_name IS 'Nombre del archivo CSV original del que se extrajo este fragmento';
COMMENT ON COLUMN mindop_document_chunks.created_at IS 'Timestamp de creación del fragmento';

-- Comentarios sobre las políticas RLS
COMMENT ON POLICY "Users can view their own document chunks" ON mindop_document_chunks IS 'Permite a los usuarios ver solo sus propios chunks de documentos';
COMMENT ON POLICY "Users can insert chunks for their own mindops" ON mindop_document_chunks IS 'Permite insertar chunks solo si el user_id coincide y el mindop_id les pertenece';
COMMENT ON POLICY "Users can update their own document chunks" ON mindop_document_chunks IS 'Permite actualizar solo chunks propios';
COMMENT ON POLICY "Users can delete their own document chunks" ON mindop_document_chunks IS 'Permite eliminar solo chunks propios - necesario para reemplazar datasets';

-- Comentarios sobre índices vectoriales
COMMENT ON INDEX idx_mindop_document_chunks_embedding_hnsw IS 'Índice HNSW para búsqueda vectorial rápida con cosine similarity. Parámetros: m=16, ef_construction=64';

-- ========================================
-- VERIFICACIÓN DE LA IMPLEMENTACIÓN
-- ========================================

-- Consulta para verificar que la tabla fue creada correctamente
/*
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mindop_document_chunks' 
ORDER BY ordinal_position;

-- Consulta para verificar las políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'mindop_document_chunks';

-- Consulta para verificar los índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'mindop_document_chunks';
*/