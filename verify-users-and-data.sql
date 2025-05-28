-- Verificar usuarios existentes y crear usuario de prueba si es necesario

-- 1. Verificar usuarios existentes
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    email_confirmed_at
FROM auth.users;

-- 2. Si no hay usuarios o el usuario no existe, podemos verificar las configuraciones
SELECT 
    id,
    user_id,
    mindop_name,
    created_at
FROM mindops;

-- 3. Verificar si hay chunks de datos
SELECT 
    COUNT(*) as total_chunks,
    mindop_id,
    source_csv_name
FROM mindop_document_chunks 
GROUP BY mindop_id, source_csv_name;

-- NOTAS:
-- Si no hay usuarios, necesitaremos:
-- 1. Registrar un usuario desde la aplicación web
-- 2. O crear uno manualmente (pero esto es más complejo)
-- 3. Verificar que la configuración de auth esté habilitada en Supabase
