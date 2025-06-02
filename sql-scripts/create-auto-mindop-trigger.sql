-- Script para crear trigger que automáticamente crea un MindOp para nuevos usuarios
-- Este trigger se ejecuta cuando un nuevo usuario se registra en Supabase Auth

-- Función que crea el MindOp automáticamente
CREATE OR REPLACE FUNCTION public.create_mindop_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_first_name TEXT;
    user_email TEXT;
    default_mindop_name TEXT;
BEGIN
    -- Extraer información del nuevo usuario
    user_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuario');
    user_email := NEW.email;
    
    -- Crear un nombre por defecto para el MindOp
    IF user_first_name IS NOT NULL AND user_first_name != '' THEN
        default_mindop_name := 'Mi MindOp de ' || user_first_name;
    ELSE
        default_mindop_name := 'MindOp Principal';
    END IF;
    
    -- Insertar el nuevo MindOp en la tabla public.mindops
    INSERT INTO public.mindops (
        user_id,
        mindop_name,
        mindop_description,
        created_at
    ) VALUES (
        NEW.id,
        default_mindop_name,
        'MindOp creado automáticamente para gestionar tus datos y conversaciones.',
        NOW()
    );
    
    -- Log de la creación (opcional, para debugging)
    INSERT INTO public.system_logs (
        log_level,
        message,
        metadata,
        created_at
    ) VALUES (
        'INFO',
        'Auto-created MindOp for new user',
        jsonb_build_object(
            'user_id', NEW.id,
            'email', user_email,
            'mindop_name', default_mindop_name
        ),
        NOW()
    ) ON CONFLICT DO NOTHING; -- En caso de que la tabla system_logs no exista
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- En caso de error, log el problema pero no fallar el registro del usuario
    INSERT INTO public.system_logs (
        log_level,
        message,
        metadata,
        created_at
    ) VALUES (
        'ERROR',
        'Failed to auto-create MindOp for new user: ' || SQLERRM,
        jsonb_build_object(
            'user_id', NEW.id,
            'email', NEW.email,
            'error', SQLERRM
        ),
        NOW()
    ) ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger que se ejecuta después de insertar un nuevo usuario
DROP TRIGGER IF EXISTS trigger_create_mindop_for_new_user ON auth.users;

CREATE TRIGGER trigger_create_mindop_for_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_mindop_for_new_user();

-- Crear tabla de logs si no existe (opcional, para debugging)
CREATE TABLE IF NOT EXISTS public.system_logs (
    id BIGSERIAL PRIMARY KEY,
    log_level TEXT NOT NULL DEFAULT 'INFO',
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para logs
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(log_level);

-- Otorgar permisos necesarios
GRANT USAGE ON SEQUENCE mindops_id_seq TO service_role;
GRANT INSERT ON public.mindops TO service_role;
GRANT INSERT ON public.system_logs TO service_role;

-- Comentarios para documentación
COMMENT ON FUNCTION public.create_mindop_for_new_user() IS 'Función que automáticamente crea un MindOp para cada nuevo usuario registrado';
COMMENT ON TRIGGER trigger_create_mindop_for_new_user ON auth.users IS 'Trigger que ejecuta la creación automática de MindOp para nuevos usuarios';
