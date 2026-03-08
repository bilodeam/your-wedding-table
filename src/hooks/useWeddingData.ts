import { useState, useEffect, useCallback } from 'react';
import { Guest, Table, WeddingData, DEFAULT_MEAL_OPTIONS } from '@/types/wedding';

const STORAGE_KEY = 'wedding-seating-data';

const generateId = () => Math.random().toString(36).substring(2, 10);

const loadData = (): WeddingData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migration: rename dietary → meal
      if (parsed.guests) {
        parsed.guests = parsed.guests.map((g: any) => {
          if ('dietary' in g && !('meal' in g)) {
            const { dietary, ...rest } = g;
            const mealMap: Record<string, string> = {
              none: '',
              vegetarian: 'Vegetarian',
              vegan: 'Vegan',
              'gluten-free': 'Gluten Free',
            };
            return { ...rest, meal: mealMap[dietary] || '' };
          }
          // Migration: add notes field if missing
          if (!('notes' in g)) {
            return { ...g, notes: '' };
          }
          return g;
        });
      }
      if (!parsed.mealOptions) {
        parsed.mealOptions = DEFAULT_MEAL_OPTIONS;
      }
      return parsed;
    }
  } catch {}
  return { guests: [], tables: [], mealOptions: [...DEFAULT_MEAL_OPTIONS] };
};

const saveData = (data: WeddingData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export function useWeddingData() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [mealOptions, setMealOptions] = useState<string[]>([...DEFAULT_MEAL_OPTIONS]);

  useEffect(() => {
    const data = loadData();
    setGuests(data.guests);
    setTables(data.tables);
    setMealOptions(data.mealOptions);
  }, []);

  useEffect(() => {
    saveData({ guests, tables, mealOptions });
  }, [guests, tables, mealOptions]);

  const addGuest = useCallback((guest: Omit<Guest, 'id' | 'tableId'>) => {
    setGuests(prev => [...prev, { ...guest, id: generateId(), tableId: null }]);
  }, []);

  const addGuestsBulk = useCallback((newGuests: Omit<Guest, 'id' | 'tableId'>[]) => {
    setGuests(prev => [
      ...prev,
      ...newGuests.map(g => ({ ...g, id: generateId(), tableId: null, notes: g.notes || '' })),
    ]);
  }, []);

  const removeGuest = useCallback((id: string) => {
    setGuests(prev => prev.filter(g => g.id !== id));
    // Also clean up seatOrder on any table
    setTables(prev =>
      prev.map(t => ({
        ...t,
        seatOrder: t.seatOrder.filter(s => s !== id && s !== `${id}:plus`),
      }))
    );
  }, []);

  const updateGuest = useCallback((id: string, updates: Partial<Guest>) => {
    setGuests(prev => prev.map(g => (g.id === id ? { ...g, ...updates } : g)));
  }, []);

  // FIX: Rewritten to avoid stale closure — all logic uses latest state via functional updaters
  const assignGuestToTable = useCallback((guestId: string, tableId: string | null) => {
    setGuests(prevGuests => {
      const guest = prevGuests.find(g => g.id === guestId);
      if (!guest) return prevGuests;

      if (tableId !== null) {
        // FIX: Correct seat counting using functional updater (no stale state)
        setTables(prevTables => {
          const table = prevTables.find(t => t.id === tableId);
          if (!table) return prevTables;

          // Count seats currently used at target table, excluding this guest if already assigned there
          const seatsUsed = prevGuests
            .filter(g => g.tableId === tableId && g.id !== guestId)
            .reduce((acc, g) => acc + 1 + (g.plusOne ? 1 : 0), 0);

          const seatsNeeded = 1 + (guest.plusOne ? 1 : 0);

          if (seatsUsed + seatsNeeded > table.capacity) return prevTables;

          return prevTables.map(t => {
            if (t.id !== tableId) return t;
            const newOrder = t.seatOrder.filter(s => s !== guestId && s !== `${guestId}:plus`);
            newOrder.push(guestId);
            if (guest.plusOne) newOrder.push(`${guestId}:plus`);
            return { ...t, seatOrder: newOrder };
          });
        });

        return prevGuests.map(g => (g.id === guestId ? { ...g, tableId } : g));
      } else {
        // Unassigning
        setTables(prevTables =>
          prevTables.map(t => ({
            ...t,
            seatOrder: t.seatOrder.filter(s => s !== guestId && s !== `${guestId}:plus`),
          }))
        );
        return prevGuests.map(g => (g.id === guestId ? { ...g, tableId: null } : g));
      }
    });
  }, []);

  const addTable = useCallback((name: string, capacity: number, shape: 'round' | 'rectangular' = 'round') => {
    setTables(prev => {
      const col = prev.length % 3;
      const row = Math.floor(prev.length / 3);
      return [
        ...prev,
        {
          id: generateId(),
          name,
          capacity,
          shape,
          position: { x: col * 280 + 20, y: row * 280 + 20 },
          seatOrder: [],
        },
      ];
    });
  }, []);

  const swapSeats = useCallback((tableId: string, fromIndex: number, toIndex: number) => {
    setTables(prev =>
      prev.map(t => {
        if (t.id !== tableId) return t;
        const order = [...t.seatOrder];
        if (fromIndex < 0 || toIndex < 0 || fromIndex >= order.length || toIndex >= order.length)
          return t;
        [order[fromIndex], order[toIndex]] = [order[toIndex], order[fromIndex]];
        return { ...t, seatOrder: order };
      })
    );
  }, []);

  const updateTablePosition = useCallback((id: string, position: { x: number; y: number }) => {
    const TABLE_W = 240;
    const TABLE_H = 260;
    const PAD = 12;

    setTables(prev => {
      let updated = prev.map(t => (t.id === id ? { ...t, position } : t));

      let changed = true;
      let iterations = 0;
      while (changed && iterations < 20) {
        changed = false;
        iterations++;
        const movedTable = updated.find(t => t.id === id)!;

        updated = updated.map(t => {
          if (t.id === id) return t;
          const overlapX = TABLE_W + PAD - Math.abs(movedTable.position.x - t.position.x);
          const overlapY = TABLE_H + PAD - Math.abs(movedTable.position.y - t.position.y);
          if (overlapX > 0 && overlapY > 0) {
            changed = true;
            if (overlapX < overlapY) {
              const dir = t.position.x >= movedTable.position.x ? 1 : -1;
              return { ...t, position: { x: Math.max(0, t.position.x + dir * overlapX), y: t.position.y } };
            } else {
              const dir = t.position.y >= movedTable.position.y ? 1 : -1;
              return { ...t, position: { x: t.position.x, y: Math.max(0, t.position.y + dir * overlapY) } };
            }
          }
          return t;
        });
      }

      return updated;
    });
  }, []);

  const updateTable = useCallback((id: string, updates: Partial<Table>) => {
    setTables(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const removeTable = useCallback((id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
    setGuests(prev => prev.map(g => (g.tableId === id ? { ...g, tableId: null } : g)));
  }, []);

  const getTableGuests = useCallback(
    (tableId: string) => guests.filter(g => g.tableId === tableId),
    [guests]
  );

  const getSeatsUsed = useCallback(
    (tableId: string) => {
      const tableGuests = guests.filter(g => g.tableId === tableId);
      return tableGuests.reduce((acc, g) => acc + 1 + (g.plusOne ? 1 : 0), 0);
    },
    [guests]
  );

  const updateMealOptions = useCallback((options: string[]) => {
    setMealOptions(options);
  }, []);

  const unassignedGuests = guests.filter(g => g.tableId === null);
  const confirmedGuests = guests.filter(g => g.rsvp === 'confirmed');
  const totalHeadcount = guests.reduce((acc, g) => acc + 1 + (g.plusOne ? 1 : 0), 0);
  const fullTables = tables.filter(t => getSeatsUsed(t.id) >= t.capacity).length;

  return {
    guests, tables, mealOptions,
    addGuest, addGuestsBulk, removeGuest, updateGuest,
    assignGuestToTable, addTable, removeTable, updateTable, swapSeats,
    getTableGuests, getSeatsUsed, updateTablePosition, updateMealOptions,
    unassignedGuests, confirmedGuests,
    totalHeadcount, fullTables,
  };
}
