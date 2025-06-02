# Guía de Despliegue en Render - MindOps

## 📋 Preparación

### 1. Verificar que el código esté listo
```bash
npm run type-check
npm run build
```

### 2. Limpiar y preparar el test file
Elimina o mueve el archivo `test-csv-upload.mjs` a la carpeta `tests/` para que no interfiera con el build.

## 🚀 Configuración en Render

### 1. Crear Nueva Web Service
1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio `mindgrate`

### 2. Configuración del Servicio

**Configuración Básica:**
- **Name**: `mindops-app`
- **Environment**: `Static Site`
- **Branch**: `main` (o tu rama principal)
- **Root Directory**: (dejar vacío)

**Build Settings:**
- **Build Command**: `npm ci && npm run build`
- **Publish Directory**: `dist`

### 3. Variables de Entorno

Agrega estas variables en la sección "Environment Variables":

```
VITE_SUPABASE_URL=https://khzbklcvmlkhrraibksx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoemJrbGN2bWxraHJyYWlia3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1NDc1MjYsImV4cCI6MjA0ODEyMzUyNn0.mKLSyJCFNJ1KFYgZhQ2R8j4wpvmTYJV1Z2LDbpgEGpA
VITE_APP_TITLE=MindOps
VITE_APP_VERSION=1.0.0
NODE_VERSION=18
```

### 4. Configuración de Redireccionamiento (SPA)

En la configuración avanzada, agrega:
- **Redirects and Rewrites**: 
  - Source: `/*`
  - Destination: `/index.html`
  - Action: `Rewrite`

## 🔧 Headers de Seguridad

Render automáticamente configurará headers de seguridad básicos, pero puedes agregar estos en el archivo `render.yaml`:

```yaml
headers:
  - path: /*
    name: X-Frame-Options
    value: DENY
  - path: /*
    name: X-Content-Type-Options
    value: nosniff
  - path: /*
    name: Referrer-Policy
    value: strict-origin-when-cross-origin
```

## 📦 Proceso de Despliegue

### Automático (Recomendado)
1. Haz push de tus cambios a GitHub
2. Render detectará automáticamente los cambios
3. Iniciará el build automáticamente
4. El sitio estará disponible en la URL proporcionada

### Manual
1. Ve al dashboard de Render
2. Selecciona tu servicio
3. Click en "Deploy latest commit"

## 🔍 Verificación Post-Despliegue

### 1. Probar funcionalidades críticas:
- ✅ Registro de usuarios
- ✅ Login
- ✅ Auto-creación de MindOps
- ✅ Carga de archivos CSV
- ✅ Chat functionality

### 2. Verificar en el navegador:
- Abrir la URL de Render
- Verificar que no hay errores de consola
- Probar el flujo completo de usuario

### 3. Verificar variables de entorno:
- Las variables `VITE_*` deben estar accesibles en el cliente
- Verificar en DevTools → Application → Local Storage

## 🔧 Solución de Problemas

### Build Fails
```bash
# Verificar localmente
npm ci
npm run type-check
npm run build
```

### Variables de entorno no disponibles
- Asegúrate que todas las variables empiecen con `VITE_`
- Verifica que estén configuradas en Render Dashboard

### Rutas no funcionan (404)
- Verifica que la configuración de rewrite esté correcta
- Source: `/*` → Destination: `/index.html`

### Assets no cargan
- Verifica que `Publish Directory` sea `dist`
- Asegúrate que el build genere la carpeta `dist` correctamente

## 📱 URLs de Resultado

Después del despliegue exitoso, tendrás:
- **URL de producción**: `https://mindops-app.onrender.com` (o similar)
- **Logs de build**: Disponibles en Render Dashboard
- **Métricas**: Disponibles en Render Dashboard

## 🔄 Actualizaciones Futuras

Para actualizar la aplicación:
1. Haz commit de tus cambios localmente
2. Push a GitHub
3. Render automáticamente rebuild y redeploy

## 📞 Soporte

- **Render Docs**: https://render.com/docs/static-sites
- **React + Vite**: https://vitejs.dev/guide/build.html
- **Supabase Edge Functions**: Funcionarán normalmente desde cualquier dominio
