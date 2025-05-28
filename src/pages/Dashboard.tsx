import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Resumen de tu actividad y métricas principales</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Operaciones</p>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
            </div>
            <div className="bg-primary-100 rounded-full p-3">
              <span className="text-primary-600 text-xl">📈</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completadas</p>
              <p className="text-2xl font-bold text-green-600">987</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <span className="text-green-600 text-xl">✅</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Progreso</p>
              <p className="text-2xl font-bold text-yellow-600">157</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <span className="text-yellow-600 text-xl">⏳</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-red-600">90</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <span className="text-red-600 text-xl">🔴</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Actividad Reciente</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-2">
                <span className="text-blue-600 text-sm">📝</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Nueva operación creada</p>
                <p className="text-xs text-gray-500">Hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-full p-2">
                <span className="text-green-600 text-sm">✅</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Operación completada</p>
                <p className="text-xs text-gray-500">Hace 4 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 rounded-full p-2">
                <span className="text-purple-600 text-sm">🔄</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Estado actualizado</p>
                <p className="text-xs text-gray-500">Hace 1 día</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Próximas Tareas</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm font-medium text-gray-800">Revisar análisis de datos</p>
              <p className="text-xs text-gray-500">Vence en 2 días</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <p className="text-sm font-medium text-gray-800">Actualizar documentación</p>
              <p className="text-xs text-gray-500">Vence en 3 días</p>
            </div>
            <div className="border-l-4 border-red-500 pl-4">
              <p className="text-sm font-medium text-gray-800">Reunión con el equipo</p>
              <p className="text-xs text-gray-500">Vence mañana</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
