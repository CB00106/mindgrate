import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMindOp } from '@/hooks/useMindOp';
import { ProfileService, type ProfileStats, type RecentActivity, type ChartData } from '@/services/profileService';
import { ActivityChart, StatsOverview, ProductivityChart, CollaborationMetrics } from '@/components/ProfileCharts';
import type { Mindop } from '@/types/mindops';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { mindop, loading: mindOpLoading } = useMindOp();
  
  // Real data states
  const [stats, setStats] = useState<ProfileStats>({
    mindOps: 0,
    followers: 0,
    following: 0,
    collaborations: 0,
    totalDocuments: 0,
    totalChunks: 0
  });
  const [recentMindOps, setRecentMindOps] = useState<Mindop[]>([]);  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data when component mounts
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id || !mindop?.id || mindOpLoading) return;      setDataLoading(true);
      setError(null);
      try {
        console.log('🔄 Fetching profile data for user:', user.id, 'mindop:', mindop.id);
        
        const [profileStats, recentMindOpsData, activityData, chartDataResult] = await Promise.all([
          ProfileService.getProfileStats(user.id, mindop.id),
          ProfileService.getRecentMindOps(user.id),
          ProfileService.getRecentActivity(user.id, mindop.id),
          ProfileService.getChartData(user.id, mindop.id)
        ]);

        console.log('✅ Profile data fetched:', { profileStats, recentMindOpsData: recentMindOpsData.length, activityData: activityData.length, chartDataResult: chartDataResult.length });

        setStats(profileStats);
        setRecentMindOps(recentMindOpsData);
        setRecentActivity(activityData);
        setChartData(chartDataResult);
      } catch (error) {
        console.error('❌ Error fetching profile data:', error);
        setError('Error al cargar los datos del perfil. Por favor, intenta nuevamente.');
      } finally {
        setDataLoading(false);
      }
    };

    fetchProfileData();  }, [user?.id, mindop?.id, mindOpLoading]);
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-500 mr-3">⚠️</div>
            <div>
              <p className="text-red-800 font-medium">Error al cargar el perfil</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-2xl md:text-3xl font-bold text-white">
                {user?.user_metadata?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {user?.user_metadata?.first_name && user?.user_metadata?.last_name
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                  : user?.user_metadata?.full_name || 'Usuario'}
              </h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
            
            {user?.user_metadata?.bio && (
              <p className="text-gray-700 mb-4">{user.user_metadata.bio}</p>
            )}
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-600">
              {user?.user_metadata?.location && (
                <span className="flex items-center">
                  📍 {user.user_metadata.location}
                </span>
              )}
              {user?.user_metadata?.website && (
                <a
                  href={user.user_metadata.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  🌐 {user.user_metadata.website}
                </a>
              )}
              <span className="flex items-center">
                📅 Miembro desde {new Date(user?.created_at || '').toLocaleDateString()}
              </span>
            </div>
            
            {user?.user_metadata?.skills && Array.isArray(user.user_metadata.skills) && user.user_metadata.skills.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Habilidades</h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {user.user_metadata.skills.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>{/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 text-center transform hover:scale-105 transition-transform duration-200">
          <div className="text-xl md:text-2xl font-bold text-purple-600 mb-2">
            {dataLoading ? (
              <div className="animate-pulse bg-purple-200 h-6 w-8 mx-auto rounded"></div>
            ) : (
              stats.mindOps
            )}
          </div>
          <div className="text-xs md:text-sm text-gray-600">MindOps</div>
          {!dataLoading && stats.totalChunks > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              {stats.totalChunks} chunks
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 text-center transform hover:scale-105 transition-transform duration-200">
          <div className="text-xl md:text-2xl font-bold text-blue-600 mb-2">
            {dataLoading ? (
              <div className="animate-pulse bg-blue-200 h-6 w-8 mx-auto rounded"></div>
            ) : (
              stats.followers
            )}
          </div>
          <div className="text-xs md:text-sm text-gray-600">Seguidores</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 text-center transform hover:scale-105 transition-transform duration-200">
          <div className="text-xl md:text-2xl font-bold text-green-600 mb-2">
            {dataLoading ? (
              <div className="animate-pulse bg-green-200 h-6 w-8 mx-auto rounded"></div>
            ) : (
              stats.following
            )}
          </div>
          <div className="text-xs md:text-sm text-gray-600">Siguiendo</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 text-center transform hover:scale-105 transition-transform duration-200">
          <div className="text-xl md:text-2xl font-bold text-orange-600 mb-2">
            {dataLoading ? (
              <div className="animate-pulse bg-orange-200 h-6 w-8 mx-auto rounded"></div>
            ) : (
              stats.collaborations
            )}
          </div>
          <div className="text-xs md:text-sm text-gray-600">Colaboraciones</div>
          {!dataLoading && stats.totalDocuments > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              {stats.totalDocuments} docs
            </div>
          )}
        </div>
      </div>      {/* Charts Section */}
      {dataLoading ? (
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : chartData.length > 0 ? (
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <ActivityChart data={chartData} />
          <StatsOverview stats={stats} />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 mb-8 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin datos suficientes para gráficos</h3>
          <p className="text-gray-500">Continúa usando MindOps para ver tus estadísticas visuales</p>
        </div>
      )}

      {/* Additional Charts */}
      {!dataLoading && chartData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <ProductivityChart data={chartData} />
          <CollaborationMetrics data={chartData} />
        </div>
      )}      {/* Recent MindOps */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">MindOps Recientes</h2>
          {!dataLoading && recentMindOps.length > 0 && (
            <button className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors">
              Ver todas ({recentMindOps.length})
            </button>
          )}
        </div>
        
        {dataLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Cargando MindOps...</p>
          </div>
        ) : recentMindOps.length > 0 ? (
          <div className="space-y-4">
            {recentMindOps.slice(0, 5).map((mindOp) => (
              <div
                key={mindOp.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-purple-300"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h3 className="font-medium text-gray-900">{mindOp.mindop_name}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">
                    📅 Creada el {new Date(mindOp.created_at).toLocaleDateString()}
                  </p>
                  {mindOp.mindop_description && (
                    <p className="text-sm text-gray-600 truncate max-w-md">
                      {mindOp.mindop_description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                    Activa
                  </span>
                  <button className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors">
                    Ver →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🧠</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">¡Crea tu primer MindOp!</h3>
            <p className="text-gray-500 mb-4">Los MindOps te ayudan a organizar y procesar información de manera inteligente</p>
            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 font-medium">
              Crear MindOp
            </button>
          </div>
        )}
      </div>{/* Recent Activity Section */}
      {dataLoading ? (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3 p-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : recentActivity.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Actividad Reciente</h2>
            <span className="text-sm text-gray-500">{recentActivity.length} actividades</span>
          </div>
          <div className="space-y-4">
            {recentActivity.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-purple-500"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                    {activity.type === 'mindop_created' && '🧠'}
                    {activity.type === 'collaboration' && '🤝'}
                    {activity.type === 'document_upload' && '📄'}
                    {activity.type === 'follow_request' && '👤'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-2 flex items-center">
                    🕒 {activity.createdAt.toLocaleDateString()} a las {activity.createdAt.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 mt-8 text-center">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin actividad reciente</h3>
          <p className="text-gray-500">Tu actividad aparecerá aquí cuando comiences a usar MindOps</p>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
