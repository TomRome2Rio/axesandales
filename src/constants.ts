import { Booking } from './types';
import { Table, TableSize, TerrainBox, TerrainCategory } from './types';

// Inventory is now managed in localStorage. These are the default first-time values.
export const INITIAL_TABLES: Table[] = [
  ...Array.from({ length: 16 }, (_, i) => ({
    id: `L${i + 1}`,
    name: `Large Table ${i + 1}`,
    size: TableSize.LARGE
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `S${i + 1}`,
    name: `Small Table ${i + 1}`,
    size: TableSize.SMALL
  }))
];

const getTerrainImage = (cat: TerrainCategory) => {
    const configs: Record<TerrainCategory, {color: string, text: string}> = {
        [TerrainCategory.SCIFI]: { color: '1e293b', text: 'Sci-Fi+Set' },
        [TerrainCategory.HISTORICAL]: { color: '3f2c22', text: 'Historical+Set' },
        [TerrainCategory.FANTASY]: { color: '064e3b', text: 'Fantasy+Set' },
        [TerrainCategory.AOS]: { color: '450a0a', text: 'AoS+Realm' },
        [TerrainCategory.WARHAMMER_40K]: { color: '172554', text: '40k+Ruins' },
        [TerrainCategory.HILLS]: { color: '365314', text: 'Hills+Pack' },
        [TerrainCategory.MODERN]: { color: '4b5563', text: 'Modern+Set' }
    };
    const config = configs[cat];
    return `https://placehold.co/400x300/${config.color}/e2e8f0/png?text=${config.text}`;
};

export const INITIAL_TERRAIN_BOXES: TerrainBox[] = [
  ...Array.from({ length: 10 }, (_, i) => ({ 
      id: `SCIFI-${i+1}`, 
      category: TerrainCategory.SCIFI, 
      name: `Sci-Fi Box ${i+1}`,
      imageUrl: getTerrainImage(TerrainCategory.SCIFI)
  })),
  ...Array.from({ length: 4 }, (_, i) => ({ 
      id: `HIST-${i+1}`, 
      category: TerrainCategory.HISTORICAL, 
      name: `Historical Box ${i+1}`,
      imageUrl: getTerrainImage(TerrainCategory.HISTORICAL)
  })),
  ...Array.from({ length: 2 }, (_, i) => ({ 
      id: `FANT-${i+1}`, 
      category: TerrainCategory.FANTASY, 
      name: `Fantasy Box ${i+1}`,
      imageUrl: getTerrainImage(TerrainCategory.FANTASY)
  })),
  ...Array.from({ length: 2 }, (_, i) => ({ 
      id: `AOS-${i+1}`, 
      category: TerrainCategory.AOS, 
      name: `AoS Box ${i+1}`,
      imageUrl: getTerrainImage(TerrainCategory.AOS)
  })),
  ...Array.from({ length: 2 }, (_, i) => ({ 
      id: `40K-${i+1}`, 
      category: TerrainCategory.WARHAMMER_40K, 
      name: `40k Box ${i+1}`,
      imageUrl: getTerrainImage(TerrainCategory.WARHAMMER_40K)
  })),
  { 
      id: 'HILLS-1', 
      category: TerrainCategory.HILLS, 
      name: 'Hills Box 1',
      imageUrl: getTerrainImage(TerrainCategory.HILLS)
  }
];

export const getUpcomingTuesdays = (): string[] => {
  const dates: string[] = [];
  let d = new Date();
  while (d.getDay() !== 2) {
    d.setDate(d.getDate() + 1);
  }
  
  for (let i = 0; i < 8; i++) {
    dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 7);
  }
  return dates;
};

export const getSelectableDates = (specialEventDates: string[], allBookings: Booking[], cancelledDates: string[]): {value: string, isCancelled: boolean}[] => {
    const tuesdays = new Set(getUpcomingTuesdays());
    const specialDays = new Set(specialEventDates);
    const bookingDays = new Set(allBookings.map(b => b.date));

    const combinedDates = Array.from(new Set([...tuesdays, ...specialDays, ...bookingDays])).sort();
    
    const today = new Date().toISOString().split('T')[0];

    return combinedDates
      .filter(date => date >= today || allBookings.some(b => b.date === date))
      .map(date => ({
        value: date,
        isCancelled: cancelledDates.includes(date)
      }));
};
