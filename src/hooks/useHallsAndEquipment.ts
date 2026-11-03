import { useState, useEffect, useCallback } from 'react';
import { Hall, Equipment } from '../types';
import { hallsApi, equipmentApi } from '../services/api';

export const useHallsAndEquipment = () => {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [hallsData, eqData] = await Promise.all([
        hallsApi.list(),
        equipmentApi.list(),
      ]);
      setHalls(hallsData.filter((h) => h.is_active));
      setEquipmentList(eqData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load halls and equipment';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const checkEquipmentAvailability = async (
    start: string,
    end: string,
    excludeEventId?: number
  ): Promise<Equipment[]> => {
    try {
      const available = await equipmentApi.checkAvailability(start, end, excludeEventId);
      return available;
    } catch {
      return equipmentList;
    }
  };

  return {
    halls,
    equipmentList,
    isLoading,
    error,
    refreshResources: loadResources,
    checkEquipmentAvailability,
  };
};
