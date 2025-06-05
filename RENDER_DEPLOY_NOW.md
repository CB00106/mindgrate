# 🚀 INSTRUCCIONES INMEDIATAS PARA DEPLOY EN RENDER

## ⚡ ACCIÓN REQUERIDA AHORA

### 1. Ve a Render Dashboard
- URL: https://dashboard.render.com
- Inicia sesión con tu cuenta

### 2. Crear Nueva Web Service
```
1. Click "New +" → "Static Site"
2. Connect tu repositorio GitHub
3. Selecciona el repositorio "mindgrate"
4. Branch: "main"
```

### 3. Configuración del Servicio
```
Name: mindops-app
Build Command: npm ci && npm run build
Publish Directory: dist
Auto-Deploy: Yes
```

### 4. Variables de Entorno (CRÍTICO)
Copia y pega EXACTAMENTE estas variables:

```
VITE_SUPABASE_URL=https://khzbklcvmlkhrraibksx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoemJrbGN2bWxraHJyYWlia3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1NDc1MjYsImV4cCI6MjA0ODEyMzUyNn0.mKLSyJCFNJ1KFYgZhQ2R8j4wpvmTYJV1Z2LDbpgEGpA
VITE_APP_TITLE=MindOps
VITE_APP_VERSION=1.0.0
NODE_VERSION=18
```

### 5. Configurar Redirects (SPA)
```
Source: /*
Destination: /index.html
Action: Rewrite
```

## ✅ ESTADO ACTUAL

- ✅ Código pushado a GitHub
- ✅ Build verificado localmente (467.43 kB)
- ✅ TypeScript sin errores
- ✅ Edge Functions desplegadas en Supabase
- ✅ Auto-creación de MindOps funcional

## 🎯 RESULTADO ESPERADO

Después del deploy tendrás:
- URL de producción: `https://mindops-app.onrender.com`
- Aplicación completamente funcional
- Auto-creación de MindOps para nuevos usuarios
- CSV upload y chat operativos

## 🆘 SI ALGO FALLA

1. **Build Error**: Verificar variables de entorno
2. **404 en rutas**: Verificar redirect configuration
3. **App no carga**: Verificar Publish Directory = `dist`

---

**¡Todo está listo! Solo necesitas seguir estos pasos en Render Dashboard.**
