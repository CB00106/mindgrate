-- Script para crear la tabla mindop_document_chunks si no existe
-- Ejecutar en el SQL Editor del dashboard de Supabase

-- 1. Habilitar la extensión vector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Verificar si la tabla existe
DO $$
BEGIN
    -- Crear la tabla solo si no existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'mindop_document_chunks') THEN
        
        CREATE TABLE mindop_document_chunks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            mindop_id UUID NOT NULL REFERENCES public.mindops(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            embedding VECTOR(1536) NOT NULL,
            source_csv_name TEXT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Habilitar RLS
        ALTER TABLE mindop_document_chunks ENABLE ROW LEVEL SECURITY;

        -- Políticas RLS
        CREATE POLICY "Users can view their own document chunks" ON mindop_document_chunks
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert chunks for their own mindops" ON mindop_document_chunks
            FOR INSERT WITH CHECK (
                auth.uid() = user_id 
                AND EXISTS (
                    SELECT 1 FROM public.mindops 
                    WHERE id = mindop_id 
                    AND user_id = auth.uid()
                )
            );

        CREATE POLICY "Users can update their own document chunks" ON mindop_document_chunks
            FOR UPDATE USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own document chunks" ON mindop_document_chunks
            FOR DELETE USING (auth.uid() = user_id);

        -- Índices
        CREATE INDEX idx_mindop_document_chunks_user_id ON mindop_document_chunks(user_id);
        CREATE INDEX idx_mindop_document_chunks_mindop_id ON mindop_document_chunks(mindop_id);
        CREATE INDEX idx_mindop_document_chunks_created_at ON mindop_document_chunks(created_at DESC);
        CREATE INDEX idx_mindop_document_chunks_source_csv ON mindop_document_chunks(source_csv_name) 
        WHERE source_csv_name IS NOT NULL;
        CREATE INDEX idx_mindop_document_chunks_user_mindop ON mindop_document_chunks(user_id, mindop_id);

        -- Índice vectorial (crear después de tener datos)
        CREATE INDEX idx_mindop_document_chunks_embedding_hnsw ON mindop_document_chunks 
        USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

        RAISE NOTICE 'Tabla mindop_document_chunks creada exitosamente con todos los índices y políticas RLS';
        
    ELSE
        RAISE NOTICE 'La tabla mindop_document_chunks ya existe';
    END IF;
END $$;

-- 3. Verificar que la tabla fue creada correctamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'mindop_document_chunks' 
ORDER BY ordinal_position;
