# Edge Function: ingest-csv-data

## Descripción
La función `ingest-csv-data` permite a los usuarios autenticados cargar archivos CSV, procesarlos, generar embeddings vectoriales usando OpenAI, y almacenar los datos segmentados en la base de datos vectorial.

## Funcionalidades
- ✅ Autenticación de usuarios via JWT
- ✅ Validación de archivos CSV
- ✅ Parsing inteligente de datos CSV
- ✅ Segmentación (chunking) de contenido con overlap
- ✅ Generación de embeddings con OpenAI text-embedding-3-small
- ✅ Almacenamiento en base de datos vectorial
- ✅ Asociación con MindOp del usuario
- ✅ Manejo robusto de errores

## Endpoint
```
POST /functions/v1/ingest-csv-data
```

## Headers Requeridos
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

## Request Body
Multipart form data con:
- `file`: Archivo CSV a procesar

## Response Format

### Éxito (200)
```json
{
  "success": true,
  "message": "CSV file processed successfully",
  "file_name": "data.csv",
  "document_id": "uuid-of-created-document",
  "chunks_created": 15,
  "total_rows_processed": 100,
  "mindop_id": "uuid-of-user-mindop"
}
```

### Error (4xx/5xx)
```json
{
  "error": "Error description",
  "details": "Detailed error message"
}
```

## Códigos de Error
- `400` - Archivo inválido o datos malformados
- `401` - Usuario no autenticado
- `405` - Método no permitido
- `500` - Error interno del servidor

## Estrategia de Chunking
- **Tamaño**: 400-500 tokens por chunk
- **Overlap**: 50 tokens entre chunks consecutivos
- **Estimación**: ~4 caracteres = 1 token (aproximado)

## Base de Datos
Los datos se almacenan en:
- `vectors.documents`: Metadatos del documento CSV
- `vectors.embeddings`: Chunks individuales con sus embeddings

## Variables de Entorno Requeridas
- `OPENAI_API_KEY`: Clave API de OpenAI
- `SUPABASE_URL`: URL del proyecto Supabase
- `SUPABASE_ANON_KEY`: Clave anónima de Supabase

## Ejemplo de Uso
```javascript
const formData = new FormData()
formData.append('file', csvFile)

const response = await fetch('/functions/v1/ingest-csv-data', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})

const result = await response.json()
```

## Limitaciones Actuales
- Solo archivos CSV
- Máximo tamaño de archivo limitado por Supabase Edge Functions
- Rate limiting de OpenAI API
- Embeddings de 1536 dimensiones (text-embedding-3-small)

## Próximas Mejoras
- [ ] Soporte para otros formatos (Excel, JSON)
- [ ] Procesamiento en lotes para archivos grandes
- [ ] Cache de embeddings para contenido duplicado
- [ ] Compresión de embeddings
- [ ] Métricas de rendimiento
