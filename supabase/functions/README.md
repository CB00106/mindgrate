# Supabase Edge Functions

Este directorio contiene las Edge Functions de Supabase para el proyecto MindOps.

## 📁 Estructura

```
supabase/
├── config.toml              # Configuración de Supabase
└── functions/
    ├── _shared/
    │   └── cors.ts          # Configuración CORS compartida
    └── mindop-service/
        └── index.ts         # Edge Function principal
```

## 🚀 Edge Function: mindop-service

### Descripción
La función `mindop-service` permite a los usuarios autenticados leer datos de sus Google Sheets configurados en su perfil MindOp.

### Funcionalidades
- ✅ Autenticación de usuarios via JWT
- ✅ Consulta de configuración MindOp desde la base de datos
- ✅ Lectura de Google Sheets públicos (formato CSV)
- ✅ Manejo robusto de errores
- ✅ Parsing inteligente de datos CSV
- ✅ Limitación configurable de filas

### Endpoint
```
POST /functions/v1/mindop-service
```

### Headers Requeridos
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body (opcional)
```json
{
  "maxRows": 50,        // Máximo número de filas a leer (default: 100)
  "sheetName": "Sheet1" // Nombre de la hoja (para referencia)
}
```

### Response Format

#### Éxito (200)
```json
{
  "success": true,
  "mindop": {
    "id": "uuid",
    "name": "Mi MindOp",
    "description": "Descripción opcional"
  },
  "sheetData": {
    "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "sheetName": "Sheet1",
    "data": [
      ["Header1", "Header2", "Header3"],
      ["Row1Col1", "Row1Col2", "Row1Col3"],
      ["Row2Col1", "Row2Col2", "Row2Col3"]
    ],
    "totalRows": 3,
    "totalColumns": 3
  },
  "timestamp": "2025-05-26T14:30:00.000Z"
}
```

#### Error (4xx/5xx)
```json
{
  "error": "Descripción del error",
  "code": "ERROR_CODE",     // Opcional
  "details": "Detalles"     // Opcional
}
```

### Códigos de Error
- `NO_MINDOP_CONFIG` - Usuario no tiene configuración MindOp
- `401` - Token JWT inválido o expirado
- `404` - Configuración no encontrada
- `500` - Error interno del servidor

## 🛠️ Desarrollo Local

### Prerequisitos
1. **Supabase CLI** instalado globalmente:
   ```bash
   npm install -g supabase
   ```

2. **Variables de entorno** configuradas en `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Comandos Disponibles

#### Servir funciones localmente
```bash
npm run supabase:functions:serve
```
Las funciones estarán disponibles en: `http://localhost:54321/functions/v1/`

#### Desplegar función a producción
```bash
npm run supabase:functions:deploy
```

#### Ver logs de la función
```bash
npm run supabase:functions:logs
```

#### Despliegue manual
```bash
supabase functions deploy mindop-service --project-ref your-project-ref
```

## 🧪 Testing

### Usando cURL
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/mindop-service' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"maxRows": 10}'
```

### Usando la aplicación web
1. Inicia la aplicación: `npm run dev`
2. Autentícate en la aplicación
3. Configura tu MindOp con una URL de Google Sheet
4. Ve a `/mindop-test` para probar la función

## 📋 Requisitos para Google Sheets

### Configuración del Sheet
1. El Google Sheet debe ser **público** o **compartido con "cualquier persona con el enlace puede ver"**
2. La URL debe ser del formato: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/...`

### Formato de Datos Esperado
- **Primera fila**: Headers/nombres de columnas
- **Filas siguientes**: Datos
- **Formato**: CSV compatible (comas como separadores, comillas para texto con comas)

### Ejemplo de URL válida
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
```

## 🔒 Seguridad

### Autenticación
- Todos los requests requieren un JWT válido de Supabase
- El token se valida usando el service role key
- Solo usuarios autenticados pueden acceder a sus propios datos

### Autorización
- Cada usuario solo puede acceder a su propia configuración MindOp
- Las URLs de Google Sheets deben ser públicas (no se accede con credenciales privadas)

### Rate Limiting
- Implementado por defecto en Supabase Edge Functions
- Límite configurable por proyecto

## 🐛 Troubleshooting

### Error: "Invalid Google Sheet URL format"
- Verificar que la URL sea de Google Sheets
- Asegurar que contenga el ID del sheet

### Error: "Google Sheet is not publicly accessible"
- Verificar permisos de compartir del Google Sheet
- Cambiar a "Cualquier persona con el enlace puede ver"

### Error: "Missing authorization header"
- Incluir header: `Authorization: Bearer <jwt_token>`
- Verificar que el token no haya expirado

### Error: "No MindOp configuration found"
- Configurar MindOp en `/mindop` antes de usar la función
- Agregar una URL de Google Sheet válida

## 📚 Próximas Mejoras

- [ ] Soporte para sheets privados con OAuth
- [ ] Cache de datos para mejor performance
- [ ] Webhook para actualizaciones automáticas
- [ ] Soporte para múltiples hojas en el mismo documento
- [ ] Filtros y transformaciones de datos
- [ ] Exportación a diferentes formatos (JSON, XML, etc.)
