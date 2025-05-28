# Guía para Desplegar Edge Function ingest-csv-data

## Opción 1: Usar el Dashboard de Supabase (Recomendado)

### Pasos:

1. **Accede al Dashboard de Supabase**
   - Ve a https://app.supabase.com
   - Abre tu proyecto: `khzbklcvmlkhrraibksx`

2. **Navega a Edge Functions**
   - En el menú lateral, busca "Edge Functions"
   - Haz clic en "Edge Functions"

3. **Crear nueva función**
   - Clic en "New Function" 
   - Nombre: `ingest-csv-data`
   - Copia y pega el contenido del archivo `supabase/functions/ingest-csv-data/index.ts`

4. **Configurar variables de entorno**
   - Ve a Settings → API → Environment Variables
   - Asegúrate de que esté configurado:
     - `OPENAI_API_KEY`: tu clave de OpenAI
     - `SUPABASE_URL`: https://khzbklcvmlkhrraibksx.supabase.co
     - `SUPABASE_ANON_KEY`: tu clave anon

5. **Desplegar la función**
   - Clic en "Deploy function"
   - Espera a que se complete el despliegue

## Opción 2: Usar npx supabase (Sin instalación global)

Si puedes usar npx:

```powershell
# Navegar al directorio del proyecto
cd "c:\Users\cesar\OneDrive\Documents\MVP\Mindgrate-MVP"

# Desplegar la función usando npx
npx supabase functions deploy ingest-csv-data --project-ref khzbklcvmlkhrraibksx
```

## Opción 3: Verificar si la función ya existe

Puedes verificar si la función existe haciendo una petición simple:

```powershell
# Probar la función con una petición OPTIONS
curl -X OPTIONS "https://khzbklcvmlkhrraibksx.supabase.co/functions/v1/ingest-csv-data" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoemJrbGN2bWxraHJyYWlia3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3Njk5NjQsImV4cCI6MjA2MzM0NTk2NH0.-f3mBw4m5YDn-mPA_JPjQ7PeNNugMweFXA-IbavMR6o"
```

## Verificación después del despliegue

Una vez desplegada, verifica que funciona:

1. **Accede a la página /mindop en tu aplicación**
   - http://localhost:3009/mindop

2. **Sube un archivo CSV de prueba**
   - Crea un archivo CSV simple con datos de ejemplo
   - Selecciona el archivo y haz clic en "Cargar y Vectorizar CSV"

3. **Verifica en la consola del navegador**
   - Abre DevTools (F12)
   - Busca logs de éxito o errores

## Datos de prueba CSV

Crea un archivo llamado `test-data.csv` con este contenido:

```csv
Producto,Precio,Categoria,Descripcion
Laptop,999.99,Electronica,Computadora portatil de alta gama
Mouse,29.99,Accesorios,Mouse inalambrico ergonomico
Teclado,79.99,Accesorios,Teclado mecanico RGB
Monitor,299.99,Electronica,Monitor 4K de 27 pulgadas
```

## Si la función no funciona

Revisa:
1. Variables de entorno configuradas correctamente
2. API key de OpenAI válida y con créditos
3. Permisos de la base de datos
4. Logs de la función en el dashboard de Supabase

## Contacto para troubleshooting

Si encuentras errores específicos, proporciona:
- Mensaje de error completo
- Logs del navegador
- Response de la petición HTTP
