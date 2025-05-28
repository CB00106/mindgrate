import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import MindopEdgeService, { MindopServiceResponse } from '@/services/mindopEdgeService';

const MindopServiceTestPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MindopServiceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxRows, setMaxRows] = useState(10);
  const [parsedData, setParsedData] = useState<any>(null);

  const handleTestService = async () => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setParsedData(null);

    try {
      const response = await MindopEdgeService.getMindopSheetData({
        maxRows: maxRows
      });

      setResult(response);

      // Parse the data for better display
      const parsed = MindopEdgeService.parseSheetData(response.sheetData, true);
      setParsedData(parsed);

    } catch (err: any) {
      console.error('Error testing service:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setError(null);

    try {
      const isConnected = await MindopEdgeService.testConnection();
      if (isConnected) {
        setError(null);
        alert('✅ Conexión exitosa con la Edge Function');
      } else {
        setError('❌ Fallo en la conexión con la Edge Function');
      }
    } catch (err: any) {
      setError(err.message || 'Error en la prueba de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Debes estar autenticado para probar el servicio MindOp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Prueba del Servicio MindOp Edge Function
        </h1>
        <p className="text-gray-600">
          Prueba la funcionalidad de lectura de Google Sheets a través de la Edge Function
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Controles de Prueba</h2>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="maxRows" className="text-sm font-medium text-gray-700">
              Máximo de filas:
            </label>
            <input
              type="number"
              id="maxRows"
              value={maxRows}
              onChange={(e) => setMaxRows(parseInt(e.target.value) || 10)}
              min="1"
              max="1000"
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleTestConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Probando...' : 'Probar Conexión'}
          </button>

          <button
            onClick={handleTestService}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Leyendo...' : 'Leer Google Sheet'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-600 text-xl">❌</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 mb-1">Error</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Información del MindOp</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Nombre:</span>
                <p className="text-gray-900">{result.mindop.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">ID del Sheet:</span>
                <p className="text-gray-900 font-mono text-sm">{result.sheetData.sheetId}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Descripción:</span>
                <p className="text-gray-900">{result.mindop.description || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Timestamp:</span>
                <p className="text-gray-900 text-sm">
                  {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Sheet Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Estadísticas del Sheet</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {result.sheetData.totalRows}
                </div>
                <div className="text-sm text-gray-500">Filas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {result.sheetData.totalColumns}
                </div>
                <div className="text-sm text-gray-500">Columnas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {result.sheetData.sheetName}
                </div>
                <div className="text-sm text-gray-500">Hoja</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {result.sheetData.data.length * result.sheetData.totalColumns}
                </div>
                <div className="text-sm text-gray-500">Celdas</div>
              </div>
            </div>
          </div>

          {/* Parsed Data Table */}
          {parsedData && parsedData.rows.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Datos Procesados</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  {parsedData.headers && (
                    <thead className="bg-gray-50">
                      <tr>
                        {parsedData.headers.map((header: string, index: number) => (
                          <th
                            key={index}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedData.rows.slice(0, 10).map((row: any, rowIndex: number) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {Object.values(row).map((cell: any, cellIndex: number) => (
                          <td
                            key={cellIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          >
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.rows.length > 10 && (
                  <div className="mt-3 text-sm text-gray-500 text-center">
                    Mostrando las primeras 10 filas de {parsedData.rows.length} total
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Raw Data (collapsible) */}
          <details className="bg-white rounded-lg shadow-md">
            <summary className="p-6 cursor-pointer font-semibold">
              Ver Datos Brutos (JSON)
            </summary>
            <div className="px-6 pb-6">
              <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default MindopServiceTestPage;
