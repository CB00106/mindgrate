import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { ChartData, ProfileStats } from '@/services/profileService';

interface ActivityChartProps {
  data: ChartData[];
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad de los Últimos 30 Días</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            interval="preserveStartEnd"
          />
          <YAxis />
          <Tooltip 
            labelFormatter={(value) => `Fecha: ${formatDate(value as string)}`}
            formatter={(value, name) => [value, name === 'mindOps' ? 'MindOps' : 
                                                name === 'collaborations' ? 'Colaboraciones' :
                                                name === 'followers' ? 'Seguidores' : 'Documentos']}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="mindOps"
            stackId="1"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.6}
            name="MindOps"
          />
          <Area
            type="monotone"
            dataKey="collaborations"
            stackId="1"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
            name="Colaboraciones"
          />
          <Area
            type="monotone"
            dataKey="documents"
            stackId="1"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.6}
            name="Documentos"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface StatsOverviewProps {
  stats: ProfileStats;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const pieData = [
    { name: 'MindOps', value: stats.mindOps, color: '#8b5cf6' },
    { name: 'Colaboraciones', value: stats.collaborations, color: '#f59e0b' },
    { name: 'Seguidores', value: stats.followers, color: '#3b82f6' },
    { name: 'Siguiendo', value: stats.following, color: '#10b981' }
  ];

  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Actividad</h3>
      {total > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>No hay datos para mostrar</p>
            <p className="text-sm">Comienza creando MindOps y colaborando</p>
          </div>
        </div>
      )}
    </div>
  );
};

interface ProductivityChartProps {
  data: ChartData[];
}

export const ProductivityChart: React.FC<ProductivityChartProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM');
    } catch {
      return dateString;
    }
  };

  // Calculate productivity score (weighted sum of activities)
  const productivityData = data.map(item => ({
    ...item,
    productivity: (item.mindOps * 3) + (item.collaborations * 2) + (item.documents * 1)
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Índice de Productividad</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={productivityData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            interval="preserveStartEnd"
          />
          <YAxis />
          <Tooltip 
            labelFormatter={(value) => `Fecha: ${formatDate(value as string)}`}
            formatter={(value) => [`${value} puntos`, 'Productividad']}
          />
          <Line
            type="monotone"
            dataKey="productivity"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 text-xs text-gray-600">
        <p>* Fórmula: MindOps (×3) + Colaboraciones (×2) + Documentos (×1)</p>
      </div>
    </div>
  );
};

interface CollaborationMetricsProps {
  data: ChartData[];
}

export const CollaborationMetrics: React.FC<CollaborationMetricsProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM');
    } catch {
      return dateString;
    }
  };

  const recentData = data.slice(-14); // Last 2 weeks

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Colaboraciones Recientes</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={recentData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            interval="preserveStartEnd"
          />
          <YAxis />
          <Tooltip 
            labelFormatter={(value) => `Fecha: ${formatDate(value as string)}`}
            formatter={(value) => [`${value}`, 'Colaboraciones']}
          />
          <Bar 
            dataKey="collaborations" 
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
