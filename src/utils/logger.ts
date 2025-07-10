/**
 * Utilidad de logging que solo muestra logs en desarrollo
 * y evita que aparezcan en la terminal del navegador en producción
 */

// Determinar si estamos en modo desarrollo
const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Log normal - solo en desarrollo
   */
  log: (message?: any, ...optionalParams: any[]) => {
    if (isDevelopment) {
      console.log(message, ...optionalParams);
    }
  },

  /**
   * Log de error - siempre se muestra pero sin emojis en producción
   */
  error: (message?: any, ...optionalParams: any[]) => {
    if (isDevelopment) {
      console.error(message, ...optionalParams);
    } else {
      // En producción, log simplificado sin emojis
      const cleanMessage = typeof message === 'string' 
        ? message.replace(/[🔥💥❌⚠️🚨]/g, '').trim()
        : message;
      console.error(cleanMessage, ...optionalParams);
    }
  },

  /**
   * Log de advertencia - siempre se muestra pero sin emojis en producción
   */
  warn: (message?: any, ...optionalParams: any[]) => {
    if (isDevelopment) {
      console.warn(message, ...optionalParams);
    } else {
      // En producción, log simplificado sin emojis
      const cleanMessage = typeof message === 'string' 
        ? message.replace(/[⚠️🚨📣]/g, '').trim()
        : message;
      console.warn(cleanMessage, ...optionalParams);
    }
  },

  /**
   * Log de información - solo en desarrollo
   */
  info: (message?: any, ...optionalParams: any[]) => {
    if (isDevelopment) {
      console.info(message, ...optionalParams);
    }
  },

  /**
   * Debug específico con prefijo para fácil filtrado
   */
  debug: (component: string, message?: any, ...optionalParams: any[]) => {
    if (isDevelopment) {
      console.log(`🔍 [${component}]`, message, ...optionalParams);
    }
  },

  /**
   * Para tracking de requests con ID
   */
  request: (requestId: string, message?: any, ...optionalParams: any[]) => {
    if (isDevelopment) {
      console.log(`📡 [${requestId}]`, message, ...optionalParams);
    }
  },

  /**
   * Para logs de base de datos
   */
  database: (operation: string, message?: any, ...optionalParams: any[]) => {
    if (isDevelopment) {
      console.log(`💾 [DB:${operation}]`, message, ...optionalParams);
    }
  },

  /**
   * Para logs de colaboración
   */
  collaboration: (message?: any, ...optionalParams: any[]) => {
    if (isDevelopment) {
      console.log(`🤝 [COLLAB]`, message, ...optionalParams);
    }
  }
};

// Export por defecto para uso simple
export default logger;
