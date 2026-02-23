import { useState, useEffect, useCallback } from 'react';
import { Guest, Table, WeddingData } from '@/types/wedding';

const STORAGE_KEY = 'wedding-seating-data';

const generateId = () => Math.random().toString(36).substring(2, 10);

const loadData = (): WeddingData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { guests: [], tables: [] };
};

const saveData = (data: WeddingData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export function useWeddingData() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

  useEffect(() => {
    const data = loadData();
    setGuests(data.guests);
    setTables(data.tables);
  }, []);

  useEffect(() => {
    saveData({ guests, tables });
  }, [guests, tables]);

  const addGuest = useCallback((guest: Omit<Guest, 'id' | 'tableId'>) => {
    setGuests(prev => [...prev, { ...guest, id: generateId(), tableId: null }]);
  }, []);

  const removeGuest = useCallback((id: string) => {
    setGuests(prev => prev.filter(g => g.id !== id));
  }, []);

  const updateGuest = useCallback((id: string, updates: Partial<Guest>) => {
    setGuests(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  }, []);

  const assignGuestToTable = useCallback((guestId: string, tableId: string | null) => {
    setGuests(prev => {
      const guest = prev.find(g => g.id === guestId);
      if (!guest) return prev;

      if (tableId !== null) {
        const table = tables.find(t => t.id === tableId);
        if (!table) return prev;
        const currentCount = prev.filter(g => g.tableId === tableId).length;
        // Count plus-ones for capacity
        const plusOnes = prev.filter(g => g.tableId === tableId && g.plusOne).length;
        const guestPlusOne = guest.plusOne && guest.tableId !== tableId ? 1 : 0;
        const seatsNeeded = 1 + guestPlusOne;
        const seatsUsed = currentCount + plusOnes - (guest.tableId === tableId ? (1 + (guest.plusOne ? 1 : 0)) : 0);
        if (seatsUsed + seatsNeeded > table.capacity) return prev;
      }

      return prev.map(g => g.id === guestId ? { ...g, tableId } : g);
    });
  }, [tables]);

  const addTable = useCallback((name: string, capacity: number) => {
    setTables(prev => [...prev, { id: generateId(), name, capacity }]);
  }, []);

  const removeTable = useCallback((id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
    setGuests(prev => prev.map(g => g.tableId === id ? { ...g, tableId: null } : g));
  }, []);

  const getTableGuests = useCallback((tableId: string) => {
    return guests.filter(g => g.tableId === tableId);
  }, [guests]);

  const getSeatsUsed = useCallback((tableId: string) => {
    const tableGuests = guests.filter(g => g.tableId === tableId);
    return tableGuests.reduce((acc, g) => acc + 1 + (g.plusOne ? 1 : 0), 0);
  }, [guests]);

  const unassignedGuests = guests.filter(g => g.tableId === null);
  const confirmedGuests = guests.filter(g => g.rsvp === 'confirmed');
  const totalHeadcount = guests.reduce((acc, g) => acc + 1 + (g.plusOne ? 1 : 0), 0);
  const fullTables = tables.filter(t => getSeatsUsed(t.id) >= t.capacity).length;

  return {
    guests, tables,
    addGuest, removeGuest, updateGuest,
    assignGuestToTable, addTable, removeTable,
    getTableGuests, getSeatsUsed,
    unassignedGuests, confirmedGuests,
    totalHeadcount, fullTables,
  };
}
