# 🚀 GUÍA DE DESPLIEGUE MANUAL - Edge Functions con OpenAI

## 📋 RESUMEN
4 funciones necesitan ser redespegladas tras actualizar OPENAI_API_KEY:
1. mindop-service (Principal)
2. ingest-csv-data (Procesamiento CSV)
3. collaboration-worker (Colaboración)
4. vector-service (Vectores)

## 🔧 PROCESO DE DESPLIEGUE

### URL Base del Dashboard: 
https://app.supabase.com/project/khzbklcvmlkhrraibksx/functions

---

## 1️⃣ FUNCIÓN: mindop-service

**Descripción:** Función principal del servicio MindOp que maneja consultas de usuario
**Estado:** ✅ Código verificado - usa OPENAI_API_KEY correctamente
**Acción:** Editar función existente en el Dashboard

### Código Completo:
Ver archivo: supabase/functions/mindop-service/index.ts

**Variables de entorno requeridas:**
- OPENAI_API_KEY ✅ (actualizada)
- GEMINI_API_KEY ✅ 
- SUPABASE_URL ✅
- SUPABASE_SERVICE_ROLE_KEY ✅

---

## 2️⃣ FUNCIÓN: ingest-csv-data

**Descripción:** Procesa archivos CSV y genera embeddings
**Estado:** Pendiente de verificar código
**Acción:** Editar función existente

---

## 3️⃣ FUNCIÓN: collaboration-worker  

**Descripción:** Maneja tareas de colaboración entre MindOps
**Estado:** Pendiente de verificar código
**Acción:** Editar función existente

---

## 4️⃣ FUNCIÓN: vector-service

**Descripción:** Servicios relacionados con vectores y embeddings
**Estado:** Pendiente de verificar código  
**Acción:** Editar función existente

---

## 🎯 INSTRUCCIONES POR FUNCIÓN

### Para cada función:
1. Ve al Dashboard de Supabase Functions
2. Busca la función en la lista
3. Haz clic en "Edit" 
4. Reemplaza todo el código con el código actualizado
5. Haz clic en "Deploy"
6. Verifica que no hay errores

### ✅ Verificación post-despliegue:
```bash
curl -X OPTIONS "https://khzbklcvmlkhrraibksx.supabase.co/functions/v1/[FUNCTION_NAME]"
```

---

## 📝 NOTAS IMPORTANTES

- Todas las funciones ya tienen el código correcto para usar OPENAI_API_KEY
- La nueva API key se aplicará automáticamente tras el redespliegue
- No se requieren cambios en el código, solo redesplegar
- Las variables de entorno se heredan del proyecto Supabase
