-- Create the mindop_document_chunks table for vector search
-- This migration ensures the table exists for the mindop-service Edge Function

-- Enable the pgvector extension for vector support
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the mindop_document_chunks table
CREATE TABLE IF NOT EXISTS mindop_document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mindop_id UUID NOT NULL REFERENCES public.mindops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    source_csv_name TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE mindop_document_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own document chunks" ON mindop_document_chunks;
CREATE POLICY "Users can view their own document chunks" ON mindop_document_chunks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert chunks for their own mindops" ON mindop_document_chunks;
CREATE POLICY "Users can insert chunks for their own mindops" ON mindop_document_chunks
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM public.mindops 
            WHERE id = mindop_id 
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own document chunks" ON mindop_document_chunks;
CREATE POLICY "Users can update their own document chunks" ON mindop_document_chunks
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own document chunks" ON mindop_document_chunks;
CREATE POLICY "Users can delete their own document chunks" ON mindop_document_chunks
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mindop_document_chunks_user_id ON mindop_document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_mindop_document_chunks_mindop_id ON mindop_document_chunks(mindop_id);
CREATE INDEX IF NOT EXISTS idx_mindop_document_chunks_created_at ON mindop_document_chunks(created_at DESC);

-- Vector index for semantic search (HNSW for fast queries)
-- Note: This may take time to build, so we'll create it after data is inserted
CREATE INDEX IF NOT EXISTS idx_mindop_document_chunks_embedding_hnsw ON mindop_document_chunks 
USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Function optimized for the mindop-service Edge Function
-- Searches relevant chunks by mindop_id with embedding vector
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