# 🔍 GUÍA DE VERIFICACIÓN MANUAL - INGEST CSV DATA

## 📋 VERIFICACIONES SIN SUPABASE CLI

Como no puedes instalar el CLI de Supabase, aquí están las verificaciones manuales paso a paso.

---

## ✅ **PASO 1: VERIFICAR EDGE FUNCTION EN SUPABASE DASHBOARD**

### 1.1 Acceder al Dashboard
1. Ve a https://supabase.com
2. Accede a tu proyecto (khzbklcvmlkhrraibksx)
3. Navega a **Edge Functions** en el sidebar

### 1.2 Verificar si `ingest-csv-data` existe
- [ ] **SI LA FUNCIÓN EXISTE**: Verás `ingest-csv-data` en la lista
- [ ] **SI NO EXISTE**: Necesitas subirla manualmente

### 1.3 Desplegar manualmente (si no existe)
1. En Edge Functions, click **"New Function"**
2. Nombre: `ingest-csv-data`
3. Copia el contenido de `supabase/functions/ingest-csv-data/index.ts`
4. Click **"Deploy Function"**

---

## ✅ **PASO 2: CONFIGURAR VARIABLES DE ENTORNO**

### 2.1 En Supabase Dashboard
1. Ve a **Settings** > **Edge Functions**
2. Section **"Secrets"**
3. Añadir:
   ```
   OPENAI_API_KEY = tu_clave_openai_aqui
   ```

### 2.2 En tu archivo `.env.local` (proyecto local)
```env
VITE_SUPABASE_URL=https://khzbklcvmlkhrraibksx.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

---

## ✅ **PASO 3: VERIFICAR BASE DE DATOS**

### 3.1 En Supabase Dashboard > SQL Editor
Ejecuta estas consultas para verificar las tablas:

```sql
-- 1. Verificar tabla documents existe
SELECT COUNT(*) as total_docs FROM vectors.documents;

-- 2. Verificar tabla embeddings existe  
SELECT COUNT(*) as total_embeddings FROM vectors.embeddings;

-- 3. Verificar estructura de documents
\d vectors.documents;

-- 4. Verificar estructura de embeddings
\d vectors.embeddings;
```

**Resultado esperado**: Sin errores, debe mostrar las tablas y conteos.

---

## ✅ **PASO 4: TESTING BÁSICO CON CURL**

### 4.1 Test de conectividad
```bash
curl -X OPTIONS https://khzbklcvmlkhrraibksx.supabase.co/functions/v1/ingest-csv-data \
  -H "Origin: http://localhost:3009" \
  -v
```

**Resultado esperado**: Código 200 con headers CORS.

### 4.2 Test sin autenticación
```bash
curl -X POST https://khzbklcvmlkhrraibksx.supabase.co/functions/v1/ingest-csv-data \
  -H "Content-Type: multipart/form-data" \
  -v
```

**Resultado esperado**: Código 401 (Unauthorized).

---

## ✅ **PASO 5: TESTING CON LA APLICACIÓN WEB**

### 5.1 Preparar datos de prueba
Crea un archivo `test.csv`:
```csv
nombre,edad,ciudad,profesion
Juan Pérez,30,Madrid,Ingeniero
María García,25,Barcelona,Diseñadora
Carlos López,35,Valencia,Médico
```

### 5.2 Proceso completo
1. **Iniciar servidor**: `npm run dev`
2. **Ir a**: http://localhost:3009
3. **Login**: Autentícate con tu cuenta
4. **Ir a MindOp**: Navega a `/mindop`
5. **Crear MindOp**: 
   - Nombre: "Test CSV Manual"
   - Descripción: "Prueba manual del sistema"
   - Click "Guardar Cambios"
6. **Subir CSV**:
   - Click "Seleccionar Archivo CSV"
   - Selecciona tu `test.csv`
   - Click "Cargar y Vectorizar CSV"

### 5.3 Resultados esperados
- ✅ **Éxito**: Mensaje "CSV procesado exitosamente con X chunks"
- ❌ **Error**: Mensaje de error específico

---

## ✅ **PASO 6: DEBUGGING EN NAVEGADOR**

### 6.1 Abrir herramientas de desarrollador
- Presiona **F12**
- Ve a **Console** y **Network**

### 6.2 Ejecutar funciones de test manual
En la consola del navegador:

```javascript
// Test completo automático
testIngestCSV()

// Solo probar la función
testFunctionOnly()

// Solo verificar base de datos
verifyDatabase()
```

### 6.3 Analizar respuestas
- **Network tab**: Ver request/response de la Edge Function
- **Console**: Ver logs detallados
- **Storage**: Verificar tokens de autenticación

---

## ✅ **PASO 7: VERIFICAR EN BASE DE DATOS**

### 7.1 Consultas de verificación post-test
En Supabase SQL Editor:

```sql
-- Ver documentos recientes
SELECT 
    id, title, content_type, 
    metadata->>'source_csv_name' as csv_name,
    created_at
FROM vectors.documents 
WHERE title LIKE 'CSV Import:%' 
ORDER BY created_at DESC 
LIMIT 5;

-- Ver embeddings recientes  
SELECT 
    d.title,
    e.chunk_index,
    LENGTH(e.content) as content_length,
    array_length(e.embedding, 1) as embedding_dimensions
FROM vectors.documents d
JOIN vectors.embeddings e ON d.id = e.document_id
WHERE d.title LIKE 'CSV Import:%'
ORDER BY d.created_at DESC, e.chunk_index
LIMIT 10;

-- Contar chunks por documento
SELECT 
    d.title,
    COUNT(e.id) as total_chunks,
    d.metadata->>'rows_count' as original_rows
FROM vectors.documents d
LEFT JOIN vectors.embeddings e ON d.id = e.document_id
WHERE d.title LIKE 'CSV Import:%'
GROUP BY d.id, d.title, d.metadata
ORDER BY d.created_at DESC;
```

### 7.2 Métricas de éxito
Para un CSV de 3 filas:
- ✅ **1 documento** creado en `vectors.documents`
- ✅ **2-4 chunks** creados en `vectors.embeddings` 
- ✅ **Embeddings** de 1536 dimensiones cada uno
- ✅ **Metadata** correcta (mindop_id, source_csv_name, etc.)

---

## 🚨 **TROUBLESHOOTING COMÚN**

### Problema: "Edge Function not found"
**Solución**: La función no está desplegada
- Ve a Supabase Dashboard > Edge Functions
- Despliega manualmente copiando el código

### Problema: "OpenAI API error"
**Solución**: Variable de entorno mal configurada
- Ve a Settings > Edge Functions > Secrets
- Verifica que `OPENAI_API_KEY` esté configurada

### Problema: "Database error"
**Solución**: Migraciones no aplicadas
- Ve a SQL Editor
- Verifica que las tablas `vectors.documents` y `vectors.embeddings` existen

### Problema: "Unauthorized"
**Solución**: Problema de autenticación
- Verifica que estás logueado
- Revisa los tokens en localStorage del navegador

### Problema: "CORS error"
**Solución**: Headers incorrectos
- Verifica que el archivo `_shared/cors.ts` existe
- Comprueba que la función esté usando CORS headers

---

## 📈 **MÉTRICAS DE ÉXITO FINAL**

✅ **Edge Function desplegada** y accesible
✅ **Variables de entorno** configuradas
✅ **Base de datos** con tablas vectoriales funcionando
✅ **Interfaz web** permite subir CSV
✅ **Procesamiento completo** desde upload hasta embeddings
✅ **Datos almacenados** correctamente en BD
✅ **Associación con MindOp** del usuario

---

## 🔄 **PRÓXIMOS PASOS DESPUÉS DE VERIFICACIÓN**

1. **Si todo funciona**: Probar con archivos CSV más grandes
2. **Si hay errores**: Revisar logs específicos en cada paso
3. **Optimización**: Ajustar chunking y embeddings según necesidades
4. **Producción**: Configurar rate limiting y monitoring

---

## 🆘 **NECESITAS AYUDA?**

Si algo no funciona:
1. Copia exactamente el error que aparece
2. Indica en qué paso específico falla
3. Comparte los logs de consola del navegador
4. Verifica el estado en Supabase Dashboard

**Nota**: Este proceso manual es equivalente al despliegue con CLI, solo que verificamos cada paso manualmente para asegurar que todo funciona correctamente.
