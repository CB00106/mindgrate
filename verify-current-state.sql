-- Verificar usuarios existentes y configuraciones de MindOp
SELECT 
    'Users' as table_name,
    COUNT(*) as count,
    string_agg(email, ', ') as emails
FROM auth.users

UNION ALL

SELECT 
    'MindOps' as table_name,
    COUNT(*) as count,
    string_agg(mindop_name, ', ') as names
FROM mindops

UNION ALL

SELECT 
    'Document Chunks' as table_name,
    COUNT(*) as count,
    string_agg(DISTINCT source_csv_name, ', ') as sources
FROM mindop_document_chunks;
