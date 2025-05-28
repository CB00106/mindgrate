-- Verificar si la tabla mindop_document_chunks existe
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'mindop_document_chunks' 
ORDER BY ordinal_position;

-- Si no existe, crearla (ejecutar el contenido del archivo mindop_document_chunk.sql)
-- También verificar si la extensión vector está habilitada
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Verificar las tablas actuales relacionadas con vectores
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%chunk%' 
  OR table_name LIKE '%vector%' 
  OR table_name LIKE '%document%';
