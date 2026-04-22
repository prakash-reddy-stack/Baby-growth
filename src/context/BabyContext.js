import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getBaby, getFeedings, getGrowthRecords, getVaccinations } from '../database/db';

const BabyContext = createContext(null);

export const BabyProvider = ({ children }) => {
  const [baby, setBaby] = useState(null);
  const [feedings, setFeedings] = useState([]);
  const [growthRecords, setGrowthRecords] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshBaby = useCallback(async () => {
    const b = await getBaby();
    setBaby(b || null);
    return b;
  }, []);

  const refreshFeedings = useCallback(async (babyId) => {
    if (!babyId) return;
    const data = await getFeedings(babyId);
    setFeedings(data);
  }, []);

  const refreshGrowth = useCallback(async (babyId) => {
    if (!babyId) return;
    const data = await getGrowthRecords(babyId);
    setGrowthRecords(data);
  }, []);

  const refreshVaccinations = useCallback(async (babyId) => {
    if (!babyId) return;
    const data = await getVaccinations(babyId);
    setVaccinations(data);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    const b = await getBaby();
    setBaby(b || null);
    if (b) {
      await Promise.all([
        refreshFeedings(b.id),
        refreshGrowth(b.id),
        refreshVaccinations(b.id),
      ]);
    }
    setLoading(false);
  }, [refreshFeedings, refreshGrowth, refreshVaccinations]);

  useEffect(() => {
    refreshAll();
  }, []);

  return (
    <BabyContext.Provider value={{
      baby, feedings, growthRecords, vaccinations, loading,
      refreshBaby, refreshFeedings, refreshGrowth, refreshVaccinations, refreshAll,
      setBaby,
    }}>
      {children}
    </BabyContext.Provider>
  );
};

export const useBaby = () => {
  const ctx = useContext(BabyContext);
  if (!ctx) throw new Error('useBaby must be used within BabyProvider');
  return ctx;
};
