# 🧪 GUÍA DE TESTING MANUAL - INGEST CSV DATA

## 📋 CHECKLIST DE COMPROBACIONES

### ✅ 1. FRONTEND - Interfaz de Usuario
- [ ] La página `/mindop` carga correctamente
- [ ] Se muestra el formulario con nombre y descripción del MindOp
- [ ] Aparece la sección "Cargar Archivo CSV"
- [ ] El botón "Seleccionar Archivo CSV" funciona
- [ ] Solo acepta archivos .csv
- [ ] Muestra el nombre del archivo seleccionado
- [ ] Aparece el botón "Cargar y Vectorizar CSV" cuando hay archivo
- [ ] Los mensajes de error/éxito se muestran correctamente

### ✅ 2. AUTENTICACIÓN
- [ ] Debes estar logueado para usar la funcionalidad
- [ ] El sistema detecta si no hay sesión activa
- [ ] Los tokens de autenticación se envían correctamente

### ✅ 3. EDGE FUNCTION - Despliegue
**IMPORTANTE**: Para que funcione la Edge Function, necesitas:

1. **Desplegar la función a Supabase**:
   ```bash
   # Si tuvieras CLI:
   supabase functions deploy ingest-csv-data
   ```

2. **Configurar secretos en Supabase Dashboard**:
   - Ve a tu proyecto en https://supabase.com
   - Settings > Edge Functions > Secrets
   - Añade: `OPENAI_API_KEY` con tu clave de OpenAI

3. **Verificar que las migraciones están aplicadas**:
   - Ve a SQL Editor en Supabase Dashboard
   - Ejecuta: `SELECT * FROM vectors.documents LIMIT 1;`
   - Debe funcionar sin errores

### ✅ 4. VARIABLES DE ENTORNO
Verifica en tu archivo `.env.local`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima
```

### ✅ 5. TESTING PASO A PASO

#### Paso 1: Preparación
1. Asegúrate de que el servidor dev esté corriendo: `npm run dev`
2. Ve a http://localhost:3009
3. Inicia sesión si no lo has hecho
4. Ve a la página "Mi MindOp" (`/mindop`)

#### Paso 2: Crear MindOp
1. Completa el nombre del MindOp (ej: "Test CSV")
2. Opcional: añade una descripción
3. Haz click en "Guardar Cambios"
4. Debe mostrar mensaje de éxito

#### Paso 3: Crear archivo CSV de prueba
Crea un archivo llamado `test.csv` con este contenido:
```csv
nombre,edad,ciudad,profesion
Juan Pérez,30,Madrid,Ingeniero
María García,25,Barcelona,Diseñadora
Carlos López,35,Valencia,Médico
Ana Martín,28,Sevilla,Abogada
Luis Rodríguez,32,Bilbao,Arquitecto
```

#### Paso 4: Probar carga de CSV
1. Haz click en "Seleccionar Archivo CSV"
2. Selecciona tu archivo `test.csv`
3. Debe aparecer el nombre del archivo
4. Haz click en "Cargar y Vectorizar CSV"
5. Debe mostrar el spinner "Vectorizando..."

#### Paso 5: Verificar resultado
**Si la Edge Function está desplegada correctamente**:
- Debe mostrar mensaje de éxito con número de chunks creados
- El archivo se limpia automáticamente

**Si hay errores**:
- Revisa la consola del navegador (F12)
- Verifica los logs en Supabase Dashboard > Edge Functions

### ✅ 6. TESTING CON SCRIPT AUTOMÁTICO

En la consola del navegador (F12), puedes ejecutar:

```javascript
// Ejecutar test completo
testIngestCSV()

// Solo probar la función
testFunctionOnly()

// Solo verificar base de datos
verifyDatabase()
```

### ✅ 7. VERIFICACIÓN EN BASE DE DATOS

En Supabase Dashboard > SQL Editor, ejecuta:

```sql
-- Ver documentos creados
SELECT * FROM vectors.documents 
WHERE title LIKE 'CSV Import:%' 
ORDER BY created_at DESC LIMIT 5;

-- Ver embeddings creados
SELECT d.title, e.chunk_index, LENGTH(e.content) as content_length
FROM vectors.documents d
JOIN vectors.embeddings e ON d.id = e.document_id
WHERE d.title LIKE 'CSV Import:%'
ORDER BY d.created_at DESC, e.chunk_index
LIMIT 10;

-- Contar total de chunks por documento
SELECT d.title, COUNT(e.id) as total_chunks
FROM vectors.documents d
LEFT JOIN vectors.embeddings e ON d.id = e.document_id
WHERE d.title LIKE 'CSV Import:%'
GROUP BY d.id, d.title
ORDER BY d.created_at DESC;
```

### ✅ 8. TROUBLESHOOTING

#### Error: "Failed to process CSV file"
- [ ] Verificar que OPENAI_API_KEY está configurada en Supabase
- [ ] Revisar logs en Edge Functions
- [ ] Verificar formato del CSV

#### Error: "No MindOp found for this user"
- [ ] Crear un MindOp primero
- [ ] Verificar que el usuario está autenticado

#### Error: "Unauthorized"
- [ ] Hacer login nuevamente
- [ ] Verificar tokens en localStorage

#### Error de red/CORS
- [ ] Verificar que la Edge Function está desplegada
- [ ] Verificar URL de Supabase en variables de entorno

### ✅ 9. MÉTRICAS DE ÉXITO

Un test exitoso debe mostrar:
- ✅ Archivo CSV aceptado y procesado
- ✅ X chunks creados (depende del tamaño del archivo)
- ✅ Documento guardado en `vectors.documents`
- ✅ Embeddings guardados en `vectors.embeddings`
- ✅ Metadatos correctos (mindop_id, source_csv_name, etc.)

### ✅ 10. PRÓXIMOS PASOS

Una vez que todo funcione:
- [ ] Probar con archivos CSV más grandes
- [ ] Verificar búsquedas semánticas
- [ ] Optimizar rendimiento si es necesario
- [ ] Implementar manejo de errores adicional

---

## 🆘 NECESITAS AYUDA?

Si encuentras algún problema:
1. Revisa los logs en la consola del navegador
2. Verifica los logs en Supabase Dashboard
3. Comprueba que todas las variables estén configuradas
4. Asegúrate de que la Edge Function esté desplegada
