-- Check the current structure of the mindops table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mindops' 
ORDER BY ordinal_position;

-- Also check if the table exists
SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables 
    WHERE table_name = 'mindops'
) as table_exists;
