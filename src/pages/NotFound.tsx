import React from 'react';

const NotFound: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="py-12">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
        </div>
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Página no encontrada
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
        </div>

        <div className="space-y-4">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            Volver al inicio
          </a>
          
          <div className="text-sm text-gray-500">
            <span>o </span>
            <button
              onClick={() => window.history.back()}
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              regresar a la página anterior
            </button>
          </div>
        </div>

        <div className="mt-12 bg-gray-50 rounded-lg p-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            ¿Necesitas ayuda?
          </h3>
          <p className="text-gray-600 mb-4">
            Si crees que esto es un error, puedes contactar a nuestro equipo de soporte.
          </p>
          <a
            href="mailto:support@mindops.com"
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            Contactar soporte
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
