-- Crear datos de prueba para la tabla mindops
-- Primero, obtener el user_id del usuario de prueba
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Buscar el usuario de prueba
    SELECT id INTO test_user_id
    FROM auth.users 
    WHERE email = 'cesar_106@hotmail.com'
    LIMIT 1;

    -- Si no existe el usuario, mostrar mensaje
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Usuario cesar_106@hotmail.com no encontrado';
        RETURN;
    END IF;

    -- Insertar MindOps de prueba si no existen
    INSERT INTO mindops (user_id, mindop_name, mindop_description)
    VALUES 
        (test_user_id, 'Marketing Digital', 'Análisis de campañas de marketing digital y métricas de conversión'),
        (test_user_id, 'Análisis de Ventas', 'Dashboard de ventas mensuales y tendencias del mercado'),
        (test_user_id, 'Gestión de Inventario', 'Control de stock y predicción de demanda'),
        (test_user_id, 'Recursos Humanos', 'Métricas de empleados y análisis de rendimiento'),
        (test_user_id, 'Finanzas Corporativas', 'Estados financieros y análisis de rentabilidad')
    ON CONFLICT (user_id, mindop_name) DO NOTHING;

    RAISE NOTICE 'Datos de prueba insertados para usuario: %', test_user_id;
END $$;
