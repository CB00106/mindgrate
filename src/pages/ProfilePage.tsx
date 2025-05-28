import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.user_metadata?.first_name || '',
    lastName: user?.user_metadata?.last_name || '',
    bio: user?.user_metadata?.bio || '',
    website: user?.user_metadata?.website || '',
    location: user?.user_metadata?.location || '',
    skills: user?.user_metadata?.skills || [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const stats = {
    mindOps: 12,
    followers: 45,
    following: 32,
    collaborations: 8,
  };

  const recentMindOps = [
    {
      id: 1,
      title: 'Análisis de Mercado Q1',
      status: 'active',
      createdAt: new Date('2025-01-15'),
    },
    {
      id: 2,
      title: 'Estrategia de Producto',
      status: 'completed',
      createdAt: new Date('2025-01-10'),
    },
    {
      id: 3,
      title: 'Optimización de Procesos',
      status: 'pending',
      createdAt: new Date('2025-01-08'),
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      skills,
    }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        bio: formData.bio,
        website: formData.website,
        location: formData.location,
        skills: formData.skills,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'completed': return 'Completada';
      case 'pending': return 'Pendiente';
      default: return status;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-600">
                {user?.user_metadata?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Nombre"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Apellido"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Biografía"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
                
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Ubicación"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="Sitio web"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                
                <input
                  type="text"
                  value={formData.skills.join(', ')}
                  onChange={handleSkillsChange}
                  placeholder="Habilidades (separadas por comas)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {formData.firstName} {formData.lastName}
                    </h1>
                    <p className="text-gray-600">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-black border border-black rounded-md hover:bg-black hover:text-white transition-colors"
                  >
                    Editar Perfil
                  </button>
                </div>
                
                {formData.bio && (
                  <p className="text-gray-700 mb-4">{formData.bio}</p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {formData.location && (
                    <span className="flex items-center">
                      📍 {formData.location}
                    </span>
                  )}
                  {formData.website && (
                    <a
                      href={formData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      🌐 {formData.website}
                    </a>
                  )}
                  <span className="flex items-center">
                    📅 Miembro desde {new Date(user?.created_at || '').toLocaleDateString()}
                  </span>
                </div>
                
                {formData.skills.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Habilidades</h3>                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">{stats.mindOps}</div>
          <div className="text-sm text-gray-600">MindOps</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">{stats.followers}</div>
          <div className="text-sm text-gray-600">Seguidores</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">{stats.following}</div>
          <div className="text-sm text-gray-600">Siguiendo</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-2xl font-bold text-orange-600 mb-2">{stats.collaborations}</div>
          <div className="text-sm text-gray-600">Colaboraciones</div>
        </div>
      </div>

      {/* Recent MindOps */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">MindOps Recientes</h2>
          <button className="text-sm text-black hover:text-gray-700">
            Ver todas
          </button>
        </div>
        
        <div className="space-y-4">
          {recentMindOps.map((mindOp) => (
            <div
              key={mindOp.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">{mindOp.title}</h3>
                <p className="text-sm text-gray-500">
                  Creada el {mindOp.createdAt.toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(mindOp.status)}`}>
                  {getStatusText(mindOp.status)}
                </span>
                <button className="text-sm text-black hover:text-gray-700">
                  Ver →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
