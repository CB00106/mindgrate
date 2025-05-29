-- Verificar si hay datos en la tabla mindops
SELECT 
  id,
  mindop_name,
  mindop_description,
  user_id,
  created_at
FROM mindops
ORDER BY created_at DESC
LIMIT 10;
