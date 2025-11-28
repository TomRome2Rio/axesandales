import { Booking, Table, TerrainBox } from '../types';
import { INITIAL_TABLES, INITIAL_TERRAIN_BOXES } from '../constants';

const BOOKINGS_STORAGE_KEY = 'axes_ales_bookings_v2';
const TABLES_STORAGE_KEY = 'axes_ales_tables_v1';
const TERRAIN_STORAGE_KEY = 'axes_ales_terrain_v1';
const CANCELLED_DATES_KEY = 'axes_ales_cancelled_dates_v1';
const SPECIAL_EVENT_DATES_KEY = 'axes_ales_special_events_v1';

// --- Bookings ---
export const getBookings = (): Booking[] => {
  const data = localStorage.getItem(BOOKINGS_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveBooking = (booking: Booking): void => {
  const all = getBookings();
  const index = all.findIndex(b => b.id === booking.id);
  
  if (index >= 0) {
    all[index] = booking;
  } else {
    all.push(booking);
  }
  
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(all));
};

export const deleteBooking = (id: string): void => {
  const all = getBookings();
  const filtered = all.filter(b => b.id !== id);
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(filtered));
};

// --- Inventory ---
export const getTables = (): Table[] => {
  const data = localStorage.getItem(TABLES_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTables = (tables: Table[]): void => {
  localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(tables));
};

export const getTerrainBoxes = (): TerrainBox[] => {
  const data = localStorage.getItem(TERRAIN_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTerrainBoxes = (terrainBoxes: TerrainBox[]): void => {
  localStorage.setItem(TERRAIN_STORAGE_KEY, JSON.stringify(terrainBoxes));
};

// --- Schedule ---
export const getCancelledDates = (): string[] => {
    const data = localStorage.getItem(CANCELLED_DATES_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveCancelledDates = (dates: string[]): void => {
    localStorage.setItem(CANCELLED_DATES_KEY, JSON.stringify(dates));
};

export const getSpecialEventDates = (): string[] => {
    const data = localStorage.getItem(SPECIAL_EVENT_DATES_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveSpecialEventDates = (dates: string[]): void => {
    localStorage.setItem(SPECIAL_EVENT_DATES_KEY, JSON.stringify(dates));
};

// --- Initialization ---
export const initInventory = () => {
    if (!localStorage.getItem(TABLES_STORAGE_KEY)) {
        saveTables(INITIAL_TABLES);
    }
    if (!localStorage.getItem(TERRAIN_STORAGE_KEY)) {
        saveTerrainBoxes(INITIAL_TERRAIN_BOXES);
    }
};
