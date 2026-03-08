export interface Guest {
  id: string;
  name: string;
  plusOne: string;
  meal: string; // empty string = no preference, otherwise a custom meal option
  rsvp: 'confirmed' | 'pending' | 'declined';
  tableId: string | null;
  notes: string; // special notes, dietary needs, accessibility, etc.
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  shape: 'round' | 'rectangular';
  position: { x: number; y: number };
  seatOrder: string[]; // guestId or guestId:plus
}

export const DEFAULT_MEAL_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten Free'];

export interface WeddingData {
  guests: Guest[];
  tables: Table[];
  mealOptions: string[];
}

export const RSVP_LABELS: Record<Guest['rsvp'], string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  declined: 'Declined',
};
