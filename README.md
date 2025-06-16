# Mindgrate - Infraestructura Colaborativa de IA

Una plataforma innovadora de inteligencia artificial colaborativa que permite crear, gestionar y colaborar con MindOps (operaciones mentales inteligentes). Construida con React, TypeScript, Vite, Tailwind CSS y Supabase.

## 🌟 ¿Qué es Mindgrate?

Mindgrate no es un chatbot ni una suite tradicional de herramientas. Es una **infraestructura colaborativa de inteligencia artificial** donde cada agente es una unidad inteligente que forma parte de una red segura, modular y adaptable.

### 🧠 Concepto de MindOp

Un **MindOp** (Mind Operation) es tu espacio de trabajo personalizado donde defines y ejecutas operaciones mentales estructuradas. Cada MindOp puede:

- Procesar y analizar datos CSV mediante vectorización
- Realizar búsquedas semánticas avanzadas
- Colaborar con otros MindOps de manera inteligente
- Mantener conversaciones contextuales persistentes

## ✨ Características Principales

### � Chat Inteligente Conversacional
- **Interfaz ChatGPT-like**: Sidebar con gestión completa de conversaciones
- **Historial persistente**: Todas las conversaciones se guardan automáticamente
- **Búsqueda de conversaciones**: Encuentra rápidamente conversaciones anteriores
- **Contexto inteligente**: Cada conversación mantiene su contexto independiente
- **Respuestas en tiempo real**: Sistema de streaming para respuestas fluidas

### 🤝 Sistema de Colaboración Avanzado
- **Colaboración entre MindOps**: Conecta y colabora con otros usuarios
- **Consultas dirigidas**: Haz preguntas específicas a MindOps conectados
- **Notificaciones inteligentes**: Recibe alertas automáticas de nuevas respuestas
- **Gestión de conexiones**: Sistema robusto para manejar colaboraciones
- **Debug y diagnóstico**: Herramientas integradas para diagnosticar conexiones

### 💾 Gestión Inteligente de Datos CSV
- **Carga y procesamiento**: Importa CSV y convierte datos en embeddings vectoriales
- **Listado de archivos**: Ve todos tus archivos CSV cargados con detalles
- **Eliminación segura**: Elimina archivos con confirmación y validación de propiedad
- **Estados de vectorización**: Monitorea el progreso del procesamiento
- **Análisis conversacional**: Haz preguntas en lenguaje natural sobre tus datos

### 🔐 Autenticación y Seguridad Robusta
- **Autenticación completa**: Registro, login, recuperación de contraseña
- **Perfiles de usuario**: Gestión completa de información personal
- **Privacidad de datos**: Cada usuario accede solo a sus propios datos
- **Validación de propiedad**: Sistema de verificación para operaciones sensibles

### 🏗️ Arquitectura Edge Functions
- **Supabase Edge Functions**: Backend serverless para operaciones complejas
- **Funciones desplegadas**:
  - `collaboration-worker`: Maneja colaboraciones entre MindOps
  - `ingest-csv-data`: Procesa y vectoriza archivos CSV
  - `delete-document`: Eliminación segura de documentos

## 🚀 Tecnologías

### Frontend
- **React 18** con hooks avanzados
- **TypeScript** para tipado estático robusto
- **Vite** para desarrollo y construcción rápida
- **Tailwind CSS** para styling moderno y responsivo
- **Framer Motion** para animaciones fluidas
- **React Router** para navegación SPA

### Backend & Servicios
- **Supabase** - Backend-as-a-Service completo
  - PostgreSQL database con RLS (Row Level Security)
  - Edge Functions para lógica de negocio
  - Autenticación y autorización
  - Real-time subscriptions
- **OpenAI API** para procesamiento de lenguaje natural
- **Embeddings vectoriales** para búsqueda semántica

## 📦 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Cuenta de OpenAI (para funcionalidades de IA)

### 1. Clonación e Instalación
```bash
git clone <repository-url>
cd mindgrate
npm install
```

### 2. Configuración de Variables de Entorno
```bash
cp .env.example .env
```

Configura tu archivo `.env`:
```env
# Supabase Configuration
VITE_SUPABASE_URL=tu-url-de-supabase
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase

# OpenAI Configuration (para Edge Functions)
OPENAI_API_KEY=tu-api-key-de-openai
```

### 3. Configuración de Supabase

#### Instalar CLI de Supabase
```bash
npm install -g @supabase/cli
supabase login
```

#### Vincular proyecto local
```bash
supabase link --project-ref tu-project-id
```

#### Ejecutar migraciones
```bash
supabase db push
```

#### Desplegar Edge Functions
```bash
supabase functions deploy collaboration-worker
supabase functions deploy ingest-csv-data  
supabase functions deploy delete-document
```

## 🛠️ Desarrollo

### Comandos Principales
```bash
# Desarrollo
npm run dev                 # Servidor de desarrollo (puerto 3000)

# Construcción
npm run build              # Build para producción
npm run preview            # Preview de build

# Calidad de código
npm run lint               # ESLint
npm run type-check         # Verificación TypeScript

# Supabase local
supabase start            # Base de datos local
supabase stop             # Detener servicios locales
```

### Estructura del Proyecto
```
mindgrate/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── layout/         # Header, Footer, etc.
│   │   ├── AuthPage.tsx    # Componentes de autenticación
│   │   ├── Button.tsx      # Botones reutilizables
│   │   └── index.ts        # Exportaciones
│   ├── pages/              # Páginas principales
│   │   ├── Home.tsx        # Landing page
│   │   ├── ChatPage.tsx    # Chat principal
│   │   ├── MyMindOpPage.tsx # Gestión de MindOp
│   │   ├── ProfilePage.tsx # Perfil de usuario
│   │   └── SearchPage.tsx  # Búsqueda colaborativa
│   ├── services/           # Lógica de negocio
│   │   ├── supabaseClient.ts
│   │   ├── notificationService.ts
│   │   └── collaborationService.ts
│   ├── contexts/           # Context API
│   │   └── AuthContext.tsx
│   ├── hooks/              # Hooks personalizados
│   │   ├── useAuth.ts
│   │   └── useMindOp.ts
│   ├── types/              # Definiciones TypeScript
│   └── utils/              # Utilidades
├── supabase/
│   ├── functions/          # Edge Functions
│   │   ├── collaboration-worker/
│   │   ├── ingest-csv-data/
│   │   └── delete-document/
│   └── migrations/         # Migraciones de DB
├── scripts/                # Scripts de utilidades
└── sql-scripts/           # Scripts SQL adicionales
```

## 🎯 Funcionalidades Implementadas

### ✅ Autenticación Completa
- [x] Registro e inicio de sesión
- [x] Recuperación de contraseña
- [x] Gestión de perfil de usuario
- [x] Validación de sesiones

### ✅ Gestión de MindOps
- [x] Creación y configuración de MindOps
- [x] Carga de archivos CSV
- [x] Vectorización automática de datos
- [x] Listado y gestión de archivos
- [x] Eliminación segura de documentos

### ✅ Chat Inteligente
- [x] Interfaz de chat moderna
- [x] Historial de conversaciones
- [x] Búsqueda de conversaciones
- [x] Respuestas contextuales con IA

### ✅ Sistema de Colaboración
- [x] Conexiones entre MindOps
- [x] Consultas dirigidas
- [x] Notificaciones automáticas
- [x] Debug y diagnóstico de conexiones

### ✅ Arquitectura Robusta
- [x] Edge Functions desplegadas
- [x] Base de datos con RLS
- [x] Manejo de errores completo
- [x] Logging y debugging

## 🔮 Próximas Funcionalidades

### � Conexión Multi-fuente y Visualizaciones
- Conecta agentes a herramientas externas
- Genera dashboards automáticos
- Gráficos de Gantt dinámicos

### ⚡ Colaboración Inteligente (A2A)
- Colaboración entre agentes automática
- Ejecución de tareas conjuntas
- Workflows inteligentes

### 🛡️ Gobernanza Avanzada
- Control granular de permisos
- Auditoría de acciones
- Políticas de datos personalizables

## 🚀 Despliegue

### Construcción para Producción
```bash
npm run build
```

### Deploy en Vercel/Netlify
La aplicación está optimizada para deployment en plataformas modernas:

1. Conecta tu repositorio
2. Configura variables de entorno
3. Deploy automático desde main branch

### Variables de Entorno en Producción
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-key-de-produccion
```

## 🤝 Contribución

### Proceso de Desarrollo
1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Añadir nueva funcionalidad'`
4. Push rama: `git push origin feature/nueva-funcionalidad`  
5. Crear Pull Request

### Estándares de Código
- TypeScript estricto
- ESLint con configuración personalizada
- Prettier para formateo automático
- Convenciones de naming consistentes

## 📊 Estado del Proyecto

**Estado Actual**: ✅ **MVP Completado**

### Métricas del Proyecto
- **Líneas de código**: ~15,000+
- **Componentes React**: 25+
- **Edge Functions**: 3 desplegadas
- **Páginas implementadas**: 8
- **Hooks personalizados**: 5+

### Testing y Calidad
- **Coverage**: En desarrollo
- **E2E Tests**: Planeados
- **Performance**: Optimizado para Lighthouse

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**. Ver el archivo `LICENSE` para más detalles.

---

## 🎯 Visión

Mindgrate representa el futuro de la colaboración inteligente, donde la IA no reemplaza el pensamiento humano, sino que lo amplifica a través de una infraestructura colaborativa que evoluciona con cada interacción.

**¿Listo para cambiar tu forma de operar?** 🚀
