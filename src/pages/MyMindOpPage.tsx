import React, { useState, useEffect } from 'react';
import { useMindOp } from '@/hooks/useMindOp';
import { CreateMindopData } from '@/types/mindops';
import supabase from '@/services/supabaseClient';

interface FormData {
  mindop_name: string;
  mindop_description: string;
}

interface FormErrors {
  mindop_name?: string;
  csvFile?: string;
}

const MyMindOpPage: React.FC = () => {
  const { mindop, loading: mindopLoading, error: mindopError, saveMindOp, refetch, retryCount, isStale } = useMindOp();
  
  const [formData, setFormData] = useState<FormData>({
    mindop_name: '',
    mindop_description: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);  
  
  // CSV file handling
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [vectorizeMessage, setVectorizeMessage] = useState<string | null>(null);
  
  // CSV file management state
  const [csvFiles, setCsvFiles] = useState<Array<{
    source_csv_name: string;
    chunk_count: number;
    created_at: string;
  }>>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  
  // Pre-fill form when MindOp data is loaded
  useEffect(() => {
    if (mindop) {
      setFormData({
        mindop_name: mindop.mindop_name || '',
        mindop_description: mindop.mindop_description || '',
      });
      // Load CSV files when MindOp is available
      loadCsvFiles();
    }
  }, [mindop]);

  // Load CSV files for this MindOp
  const loadCsvFiles = async () => {
    if (!mindop?.id) return;
    
    setIsLoadingFiles(true);
    try {
      const { data, error } = await supabase
        .from('mindop_document_chunks')
        .select('source_csv_name, created_at')
        .eq('mindop_id', mindop.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading CSV files:', error);
        return;
      }

      // Group by source_csv_name and count chunks
      const fileMap = new Map<string, { chunk_count: number; created_at: string }>();
      
      data?.forEach(chunk => {
        const existing = fileMap.get(chunk.source_csv_name);
        if (existing) {
          existing.chunk_count++;
          // Keep the earliest created_at for the file
          if (chunk.created_at < existing.created_at) {
            existing.created_at = chunk.created_at;
          }
        } else {
          fileMap.set(chunk.source_csv_name, {
            chunk_count: 1,
            created_at: chunk.created_at,
          });
        }
      });

      const files = Array.from(fileMap.entries()).map(([source_csv_name, info]) => ({
        source_csv_name,
        chunk_count: info.chunk_count,
        created_at: info.created_at,
      }));

      setCsvFiles(files);
    } catch (error) {
      console.error('Error loading CSV files:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Delete CSV file
  const deleteCsvFile = async (fileName: string) => {
    if (!mindop?.id) return;
    
    setIsDeletingFile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mindop_id: mindop.id,
          source_csv_name: fileName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar el archivo');
      }

      setSuccessMessage(`Archivo "${fileName}" eliminado exitosamente`);
      
      // Reload CSV files list
      await loadCsvFiles();
      
    } catch (error) {
      console.error('Error deleting CSV file:', error);
      setErrorMessage(`Error al eliminar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsDeletingFile(false);
      setFileToDelete(null);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate mindop_name (required)
    if (!formData.mindop_name.trim()) {
      newErrors.mindop_name = 'El nombre del MindOp es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific field error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setErrors(prev => ({
          ...prev,
          csvFile: 'Por favor, selecciona un archivo CSV válido',
        }));
        setSelectedFile(null);
        return;
      }

      // Clear any previous errors
      setErrors(prev => ({
        ...prev,
        csvFile: undefined,
      }));
      
      setSelectedFile(file);
      setVectorizeMessage(null);
    } else {
      setSelectedFile(null);
    }
  };  const handleVectorizeCSVButton = async () => {
    // Check if MindOp exists first
    if (!mindop) {
      setVectorizeMessage('Error: Debes guardar la configuración del MindOp primero antes de cargar archivos CSV.');
      return;
    }

    try {
      await handleVectorizeCSV();
    } catch (error) {
      // Error is already handled in handleVectorizeCSV
      console.error('CSV vectorization failed:', error);
    }
  };

  const handleVectorizeCSV = async (): Promise<void> => {
    if (!selectedFile) {
      setErrors(prev => ({
        ...prev,
        csvFile: 'Por favor, selecciona un archivo CSV primero',
      }));
      throw new Error('No hay archivo CSV seleccionado');
    }

    setIsVectorizing(true);
    setVectorizeMessage(null);
    
    try {      
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión.');
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Call the ingest-csv-data Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-csv-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Error al procesar el archivo CSV');
      }      setVectorizeMessage(
        `¡Archivo CSV procesado exitosamente! Se crearon ${result.chunks_created} chunks de ${result.total_rows_processed} filas.`
      );
      
      // Clear the selected file after successful processing
      setSelectedFile(null);
      
      // Reset the file input
      const fileInput = document.getElementById('csv_file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Reload CSV files list to show the new file
      await loadCsvFiles();} catch (error) {
      console.error('Error vectorizing CSV:', error);
      let errorMessage = 'Error desconocido';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more user-friendly error messages
        if (errorMessage.includes('CSV contiene comillas mal formateadas')) {
          errorMessage = 'CSV con formato incorrecto: Las comillas en tu archivo CSV no están correctamente cerradas. Por favor revisa y corrige el formato de tu archivo.';
        } else if (errorMessage.includes('archivo CSV tiene un formato inválido')) {
          errorMessage = 'Archivo CSV inválido: El formato de tu archivo CSV no es correcto. Asegúrate de que esté separado por comas y sin caracteres especiales malformados.';
        } else if (errorMessage.includes('bare " in non-quoted-field')) {
          errorMessage = 'Error de formato CSV: Hay comillas sin cerrar en tu archivo. Por favor revisa que todas las comillas estén correctamente emparejadas.';
        } else if (errorMessage.includes('parse error')) {
          errorMessage = 'Error de formato CSV: Tu archivo tiene un formato que no se puede procesar. Verifica que sea un CSV válido separado por comas.';
        }
      }
      
      setVectorizeMessage(`Error al procesar el archivo CSV: ${errorMessage}`);
      throw error; // Re-throw to handle in parent function
    } finally {
      setIsVectorizing(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Step 1: Save MindOp configuration first
      const submitData: CreateMindopData = {
        mindop_name: formData.mindop_name.trim(),
        mindop_description: formData.mindop_description.trim() || undefined,
      };

      await saveMindOp(submitData);
      
      // Step 2: If there's a CSV file selected, upload it after MindOp is saved
      if (selectedFile) {
        console.log('MindOp saved successfully, now uploading CSV file...');
        try {
          await handleVectorizeCSV();
          setSuccessMessage('¡Configuración guardada y archivo CSV procesado correctamente!');
        } catch (csvError) {
          console.error('Error uploading CSV:', csvError);
          setSuccessMessage('Configuración guardada correctamente, pero hubo un error al procesar el archivo CSV.');
          setErrorMessage(`Error al procesar CSV: ${csvError instanceof Error ? csvError.message : 'Error desconocido'}`);
        }
      } else {
        setSuccessMessage('¡Configuración guardada correctamente!');
      }
    } catch (error) {
      console.error('Error saving MindOp:', error);
      setErrorMessage('Error al guardar los datos. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const hasChanges = () => {
    if (!mindop) return formData.mindop_name.trim() !== '';
    
    return (
      formData.mindop_name !== (mindop.mindop_name || '') ||
      formData.mindop_description !== (mindop.mindop_description || '')
    );
  };  // Show loading state only when actually loading
  if (mindopLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <span className="ml-3 text-gray-600">Cargando configuración...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state with retry button when there's an error
  if (mindopError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="mb-4">
              <span className="text-red-600 text-4xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Error al cargar la configuración
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {mindopError}
            </p>
            <div className="space-x-3">
              <button
                onClick={() => refetch()}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors font-medium"
              >
                Reintentar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
              >
                Recargar página
              </button>
            </div>
            {retryCount > 0 && (
              <p className="text-sm text-gray-500 mt-4">
                Intentos realizados: {retryCount}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi MindOp</h1>
            <p className="text-gray-600">
              Configura tu MindOp personal para optimizar tu flujo de trabajo
            </p>
          </div>
            {/* Manual Refresh Button */}
          <button
            onClick={() => {
              refetch();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors"
            disabled={mindopLoading}
          >
            {mindopLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2 inline-block"></div>
                Cargando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Actualizar
              </>
            )}
          </button>
        </div>      </div>

      {/* Stale Data Indicator */}
      {isStale && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-amber-600 text-lg">📱</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Datos guardados localmente.</span> 
                {' '}La configuración se está actualizando en segundo plano.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {(errorMessage || mindopError) && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-600 text-xl">❌</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                {errorMessage || mindopError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* MindOp Name */}
          <div>
            <label htmlFor="mindop_name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del MindOp *
            </label>
            <input
              type="text"
              id="mindop_name"
              name="mindop_name"
              value={formData.mindop_name}
              onChange={handleInputChange}
              placeholder="Ej: Análisis de Mercado Q1"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors ${
                errors.mindop_name 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              disabled={isSubmitting}
            />
            {errors.mindop_name && (
              <p className="mt-1 text-sm text-red-600">{errors.mindop_name}</p>
            )}
          </div>

          {/* MindOp Description */}
          <div>
            <label htmlFor="mindop_description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              id="mindop_description"
              name="mindop_description"
              rows={4}
              value={formData.mindop_description}
              onChange={handleInputChange}
              placeholder="Describe el propósito y objetivos de tu MindOp..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent hover:border-gray-400 transition-colors resize-vertical"
              disabled={isSubmitting}
            />
          </div>          {/* CSV File Upload */}
          <div>
            <label htmlFor="csv_file" className="block text-sm font-medium text-gray-700 mb-2">
              Cargar Archivo CSV
            </label>
            <div className="space-y-4">
              {/* File Input */}
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  id="csv_file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isSubmitting || isVectorizing}
                />
                <label
                  htmlFor="csv_file"
                  className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors ${
                    isSubmitting || isVectorizing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Seleccionar Archivo CSV
                </label>
                
                {selectedFile && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    {selectedFile.name}
                  </div>
                )}
              </div>              {/* Vectorize Button */}
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleVectorizeCSVButton}
                  disabled={isVectorizing || isSubmitting || !mindop}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white transition-colors ${
                    isVectorizing || isSubmitting || !mindop
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2'
                  }`}
                >
                  {isVectorizing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Vectorizando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                      </svg>
                      {!mindop ? 'Guarda la configuración primero' : 'Cargar y Vectorizar CSV'}
                    </>
                  )}
                </button>
              )}

              {/* Error Messages */}
              {errors.csvFile && (
                <p className="text-sm text-red-600">{errors.csvFile}</p>
              )}

              {/* Vectorize Status Messages */}
              {vectorizeMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  vectorizeMessage.includes('Error') 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {vectorizeMessage}
                </div>
              )}              {/* Info Text */}
              <p className="text-sm text-gray-500">
                <strong>Flujo de trabajo:</strong>
                <br />
                1. Primero guarda la configuración del MindOp (nombre y descripción)
                <br />
                2. Luego selecciona y carga archivos CSV para vectorizar tus datos
                <br />
                <br />
                <strong>Formato CSV recomendado:</strong>
                <br />
                • Separado por comas (,)
                <br />
                • Evita comillas dobles (") dentro del contenido o úsalas correctamente
                <br />
                • Codificación UTF-8
                <br />
                • Máximo 1000 filas por archivo para mejor rendimiento
                <br />
                <br />
                Puedes hacer ambos pasos en una sola acción usando "Guardar y Procesar CSV" o por separado.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">            <div className="text-sm text-gray-500">
              {mindop ? (
                <span>
                  Última actualización: {new Date(mindop.created_at).toLocaleDateString()}
                </span>
              ) : (
                <span>Configuración nueva</span>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || !hasChanges()}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isSubmitting || !hasChanges()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2'
              }`}
            >              {isSubmitting ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {selectedFile ? 'Guardando y procesando CSV...' : 'Guardando...'}
                </span>
              ) : (
                selectedFile ? 'Guardar y Procesar CSV' : 'Guardar Cambios'
              )}
            </button>
          </div>        </form>
      </div>

      {/* CSV Files Management Section */}
      {mindop && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Archivos CSV Cargados
              </h2>
              <p className="text-sm text-gray-600">
                Gestiona los archivos CSV que has subido a tu MindOp
              </p>
            </div>
            <button
              onClick={loadCsvFiles}
              disabled={isLoadingFiles}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {isLoadingFiles ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2 inline-block"></div>
                  Cargando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Actualizar
                </>
              )}
            </button>
          </div>

          {isLoadingFiles ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              <span className="ml-3 text-gray-600">Cargando archivos...</span>
            </div>
          ) : csvFiles.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay archivos CSV cargados
              </h3>
              <p className="text-gray-500 mb-4">
                Usa el formulario de arriba para cargar tu primer archivo CSV
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {csvFiles.map((file) => (
                <div key={file.source_csv_name} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {file.source_csv_name}
                        </h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Vectorizado
                          </span>
                          <span className="text-xs text-gray-500">
                            {file.chunk_count} chunks
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(file.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setFileToDelete(file.source_csv_name)}
                      disabled={isDeletingFile}
                      className="ml-4 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
            <div className="mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirmar eliminación
                  </h3>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                ¿Estás seguro de que quieres eliminar el archivo <strong>"{fileToDelete}"</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Esta acción eliminará todos los chunks vectorizados de este archivo y no se puede deshacer.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setFileToDelete(null)}
                disabled={isDeletingFile}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteCsvFile(fileToDelete)}
                disabled={isDeletingFile}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {isDeletingFile ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Eliminando...
                  </>
                ) : (
                  'Eliminar archivo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}{/* Info Card */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-600 text-xl">💡</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 mb-1">
              ¿Qué es un MindOp?
            </h3>
            <p className="text-sm text-blue-700">
              Un MindOp es tu espacio de trabajo personalizado donde defines y ejecutas 
              operaciones mentales estructuradas. Carga archivos CSV para convertir tus datos 
              en embeddings vectoriales y realizar búsquedas semánticas avanzadas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyMindOpPage;
