import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bienvenido a MindOps
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Tu plataforma de gestión de operaciones mentales
        </p>
          {/* Call to Action */}
        <div className="mb-12">
          {user ? (
            <Link to="/chat">
              <Button size="lg" className="text-lg px-8 py-3">
                Ir al Chat
              </Button>
            </Link>
          ) : (
            <div className="space-x-4">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 py-3">
                  Comenzar Ahora
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Características principales
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 text-2xl">📊</span>
              </div>
              <h3 className="font-medium text-gray-800 mb-2">Analytics</h3>
              <p className="text-gray-600 text-sm">
                Visualiza tus datos de manera intuitiva
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 text-2xl">🚀</span>
              </div>
              <h3 className="font-medium text-gray-800 mb-2">Productividad</h3>
              <p className="text-gray-600 text-sm">
                Optimiza tus procesos de trabajo
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 text-2xl">🔒</span>
              </div>
              <h3 className="font-medium text-gray-800 mb-2">Seguridad</h3>
              <p className="text-gray-600 text-sm">
                Tus datos están protegidos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
