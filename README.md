# MindOps Frontend

Una aplicación de frontend moderna construida con React, TypeScript, Vite, Tailwind CSS y Supabase.

## 🚀 Tecnologías

- **React 18** - Librería de interfaz de usuario
- **TypeScript** - Tipado estático
- **Vite** - Herramienta de desarrollo y construcción rápida
- **Tailwind CSS** - Framework CSS utilitario
- **Supabase** - Backend-as-a-Service (autenticación, base de datos)
- **React Router** - Navegación del lado del cliente

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd mindgrate-mvp
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

Edita el archivo `.env` y agrega tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=tu-url-de-supabase
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
```

## 🛠️ Desarrollo

Inicia el servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables (.tsx)
│   ├── layout/         # Componentes de layout (Header, Footer, etc.)
│   └── index.ts        # Exportaciones de componentes
├── pages/              # Vistas de página completas (.tsx)
├── services/           # Lógica de Supabase y otras APIs
│   └── supabaseClient.ts
├── contexts/           # Context API para estado global (.tsx)
├── types/              # Definiciones de tipos TypeScript
├── hooks/              # Hooks personalizados
├── utils/              # Funciones utilitarias
└── assets/             # Recursos estáticos (imágenes, fuentes, etc.)
```

## 🔧 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta ESLint
- `npm run type-check` - Verifica tipos TypeScript

## 🎨 Características

- ✅ Configuración optimizada de TypeScript
- ✅ Tailwind CSS integrado y configurado
- ✅ SDK de Supabase instalado y configurado
- ✅ Context API para gestión de autenticación
- ✅ Componentes reutilizables con Tailwind
- ✅ Routing configurado con React Router
- ✅ Layout responsivo y moderno
- ✅ Path aliases configurados (@/* imports)

## 🔐 Autenticación

La aplicación incluye un sistema de autenticación completo usando Supabase:

- Registro de usuarios
- Inicio de sesión
- Gestión de sesiones
- Context API para estado de autenticación

## 📱 Componentes

### Layout
- `Header` - Barra de navegación responsiva

### Páginas
- `Home` - Página de inicio
- `Dashboard` - Panel de control
- `Login` - Formulario de inicio de sesión
- `Register` - Formulario de registro
- `NotFound` - Página 404

### Componentes UI
- `Button` - Componente de botón reutilizable con variantes

## 🚀 Despliegue

Para construir la aplicación para producción:

```bash
npm run build
```

Los archivos de construcción se generarán en la carpeta `dist/`.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
