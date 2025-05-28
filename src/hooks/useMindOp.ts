import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { Mindop, CreateMindopData } from '@/types/mindops';
import MindopService from '@/services/mindopService';

interface UseMindOpReturn {
  mindop: Mindop | null;
  loading: boolean;
  error: string | null;
  saveMindOp: (data: CreateMindopData) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useMindOp = (): UseMindOpReturn => {
  const { user } = useAuth();
  const [mindop, setMindop] = useState<Mindop | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMindOp = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await MindopService.getUserMindOp(user.id);
      setMindop(data);
    } catch (err) {
      console.error('Error fetching MindOp:', err);
      setError('Error al cargar la configuración del MindOp');
    } finally {
      setLoading(false);
    }
  };

  const saveMindOp = async (data: CreateMindopData) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await MindopService.upsertUserMindOp(user.id, data);
      setMindop(result);
    } catch (err) {
      console.error('Error saving MindOp:', err);
      setError('Error al guardar la configuración del MindOp');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchMindOp();
  };

  useEffect(() => {
    if (user?.id) {
      fetchMindOp();
    }
  }, [user?.id]);

  return {
    mindop,
    loading,
    error,
    saveMindOp,
    refetch,
  };
};
