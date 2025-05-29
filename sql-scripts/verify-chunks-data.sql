-- Verificar datos en la tabla mindop_document_chunks
SELECT COUNT(*) as total_chunks FROM mindop_document_chunks;

-- Verificar chunks por mindop
SELECT mindop_id, COUNT(*) as chunks_count 
FROM mindop_document_chunks 
GROUP BY mindop_id;

-- Verificar algunos chunks de ejemplo
SELECT 
  id,
  mindop_id,
  user_id,
  content,
  source_csv_name,
  created_at
FROM mindop_document_chunks 
LIMIT 5;

-- Verificar mindops existentes
SELECT id, user_id, mindop_name FROM mindops;
