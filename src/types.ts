export enum TableSize {
  LARGE = '6x4',
  SMALL = '3x4'
}

export interface Table {
  id: string;
  name: string;
  size: TableSize;
}

export enum TerrainCategory {
  SCIFI = 'Sci-Fi',
  HISTORICAL = 'Historical',
  FANTASY = 'Fantasy',
  AOS = 'Age of Sigmar',
  WARHAMMER_40K = 'Warhammer 40k'
}

export interface TerrainBox {
  id: string;
  category: TerrainCategory;
  name: string;
  imageUrl: string;
  uploadedImageUrl?: string;
  disabled?: boolean;
}

export interface Booking {
  id: string;
  date: string; // YYYY-MM-DD
  tableId: string;
  terrainBoxId?: string | null; // Optional
  memberName: string;
  memberId: string; // To link to logged in user
  gameSystem: string;
  playerCount: number;
  timestamp: number;
  status: 'active' | 'cancelled';
  cancelledAt?: number; // Timestamp of when the booking was cancelled
  cancelledBy?: string; // User ID of who cancelled the booking
}

export interface User {
  id: string; // Firebase UID
  email: string;
  name: string;
  isMember: boolean;
  isAdmin?: boolean;
  membershipPaidDate?: string; // ISO date string (YYYY-MM-DD) of when membership was last paid
}

export interface DateStat {
  date: string;
  game: string;
}