import React, { useState } from 'react';
import { Search, Loader2, Brain, Users, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { CreateFollowRequestData } from '@/types/mindops';

interface MindopSearchResult {
  id: string;
  mindop_name: string;
  mindop_description: string | null;
}

interface SearchResponse {
  success: boolean;
  results: MindopSearchResult[];
  total: number;
  searchTerm: string;
  timestamp: string;
}

interface FollowRequestState {
  [mindopId: string]: 'idle' | 'loading' | 'success' | 'error';
}

interface FollowRequestError {
  [mindopId: string]: string;
}

const SearchPage: React.FC = () => {
  const { userMindOpId } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MindopSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followRequestStates, setFollowRequestStates] = useState<FollowRequestState>({});
  const [followRequestErrors, setFollowRequestErrors] = useState<FollowRequestError>({});
  const callSearchService = async (searchTerm: string): Promise<SearchResponse> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log('🔐 Sesión actual:', !!session);
    console.log('🔑 Token disponible:', !!session?.access_token);
    
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    console.log('🔍 Buscando MindOps con término:', searchTerm);
    console.log('🌐 URL de función:', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-mindops?searchTerm=${encodeURIComponent(searchTerm)}`);
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-mindops?searchTerm=${encodeURIComponent(searchTerm)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response text:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `Error ${response.status}`);
      } catch {
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
    }

    const result = await response.json();
    console.log('✅ Search result:', result);
    return result;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await callSearchService(searchQuery.trim());
      
      if (response.success) {
        setSearchResults(response.results);
      } else {
        setError('Error en la búsqueda');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      setError(error instanceof Error ? error.message : 'Error al buscar MindOps');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  const handleRequestFollow = async (targetMindOpId: string) => {
    // Validación: verificar que el usuario tenga su propio MindOp
    if (!userMindOpId) {
      setFollowRequestErrors({
        ...followRequestErrors,
        [targetMindOpId]: 'Debes crear tu propio MindOp antes de poder seguir a otros.'
      });
      return;
    }

    // Validación: evitar auto-seguimiento
    if (userMindOpId === targetMindOpId) {
      setFollowRequestErrors({
        ...followRequestErrors,
        [targetMindOpId]: 'No puedes solicitar seguimiento a tu propio MindOp.'
      });
      return;
    }

    // Limpiar errores previos y establecer estado de carga
    setFollowRequestErrors({
      ...followRequestErrors,
      [targetMindOpId]: ''
    });
    setFollowRequestStates({
      ...followRequestStates,
      [targetMindOpId]: 'loading'
    });

    try {
      // Crear solicitud de seguimiento
      const followRequestData: CreateFollowRequestData = {
        requester_mindop_id: userMindOpId,
        target_mindop_id: targetMindOpId
      };

      const { data, error } = await supabase
        .from('follow_requests')
        .insert(followRequestData)
        .select()
        .single();

      if (error) {
        console.error('Error al crear solicitud de seguimiento:', error);
        
        // Manejar errores específicos
        let errorMessage = 'Error al enviar solicitud de seguimiento.';
        
        if (error.code === '23505') { // unique_violation
          errorMessage = 'Ya has enviado una solicitud de seguimiento a este MindOp.';
        } else if (error.message.includes('check_mindop_not_self')) {
          errorMessage = 'No puedes solicitar seguimiento a tu propio MindOp.';
        } else if (error.message.includes('RLS')) {
          errorMessage = 'No tienes permisos para realizar esta acción.';
        }

        setFollowRequestStates({
          ...followRequestStates,
          [targetMindOpId]: 'error'
        });
        setFollowRequestErrors({
          ...followRequestErrors,
          [targetMindOpId]: errorMessage
        });
        return;
      }

      // Éxito
      setFollowRequestStates({
        ...followRequestStates,
        [targetMindOpId]: 'success'
      });
      
      console.log('✅ Solicitud de seguimiento enviada:', data);
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      setFollowRequestStates({
        ...followRequestStates,
        [targetMindOpId]: 'error'
      });
      setFollowRequestErrors({
        ...followRequestErrors,
        [targetMindOpId]: 'Error inesperado al enviar solicitud.'
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Buscador de MindOps
        </h1>
        <p className="text-gray-600">
          Descubre y explora MindOps de otros usuarios en la plataforma
        </p>
      </div>

      {/* User MindOp Status Alert */}
      {!userMindOpId && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="text-amber-800 font-medium">Crea tu MindOp primero</h3>
              <p className="text-amber-700 text-sm mt-1">
                Para poder solicitar seguimiento a otros MindOps, primero necesitas crear el tuyo propio en la página "Tu MindOp".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar MindOps por nombre... ej: 'Marketing', 'Análisis', 'Ventas'"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-lg"
                disabled={isSearching}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Buscar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <div className="text-red-500">❌</div>
            <div>
              <h3 className="text-red-800 font-medium">Error en la búsqueda</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Resultados de búsqueda
            </h2>
            {searchResults.length > 0 && (
              <span className="text-sm text-gray-500">
                {searchResults.length} resultado(s) encontrado(s)
                {searchQuery && ` para "${searchQuery}"`}
              </span>
            )}
          </div>

          {/* Results List */}
          {searchResults.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron MindOps
              </h3>
              <p className="text-gray-600 mb-4">
                No hay MindOps que coincidan con tu búsqueda "{searchQuery}"
              </p>
              <div className="text-sm text-gray-500">
                <p>Sugerencias:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Intenta con términos más generales</li>
                  <li>• Verifica la ortografía</li>
                  <li>• Usa palabras clave relacionadas</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((mindop) => (
                <div
                  key={mindop.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Brain className="w-6 h-6 text-purple-600" />
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                          MindOp
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {mindop.mindop_name}
                      </h3>
                      
                      <p className="text-gray-600 mb-4">
                        {mindop.mindop_description || 'Sin descripción disponible'}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>Público</span>
                        </div>
                      </div>                    </div>
                    
                    <div className="ml-6 flex flex-col items-end space-y-2">
                      <button 
                        onClick={() => handleRequestFollow(mindop.id)}
                        disabled={
                          followRequestStates[mindop.id] === 'loading' || 
                          followRequestStates[mindop.id] === 'success' ||
                          !userMindOpId ||
                          userMindOpId === mindop.id
                        }
                        className={`
                          px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-2
                          ${followRequestStates[mindop.id] === 'success' 
                            ? 'bg-green-100 text-green-800 border border-green-300 cursor-default' 
                            : followRequestStates[mindop.id] === 'loading'
                            ? 'bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed'
                            : !userMindOpId || userMindOpId === mindop.id
                            ? 'bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed'
                            : 'text-black border border-black hover:bg-black hover:text-white'
                          }
                        `}
                      >
                        {followRequestStates[mindop.id] === 'loading' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : followRequestStates[mindop.id] === 'success' ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Solicitud Enviada</span>
                          </>
                        ) : !userMindOpId ? (
                          <span>Crear MindOp Primero</span>
                        ) : userMindOpId === mindop.id ? (
                          <span>Tu MindOp</span>
                        ) : (
                          <span>Solicitar Seguimiento</span>
                        )}
                      </button>
                      
                      {/* Error message for this specific mindop */}
                      {followRequestErrors[mindop.id] && (
                        <div className="flex items-start space-x-1 text-red-600 text-xs max-w-xs">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{followRequestErrors[mindop.id]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Busca MindOps Interesantes
          </h3>
          <p className="text-gray-600 mb-4">
            Ingresa un término de búsqueda para descubrir MindOps de otros usuarios
          </p>
          <div className="text-sm text-gray-500">
            <p>Ejemplos de búsqueda:</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {['Marketing', 'Análisis', 'Ventas', 'Tecnología', 'Finanzas'].map((example) => (
                <button
                  key={example}
                  onClick={() => setSearchQuery(example)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};export default SearchPage;
