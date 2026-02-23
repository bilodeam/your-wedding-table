export interface Guest {
  id: string;
  name: string;
  plusOne: string;
  dietary: 'none' | 'vegetarian' | 'vegan' | 'gluten-free';
  rsvp: 'confirmed' | 'pending' | 'declined';
  tableId: string | null;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  shape: 'round' | 'rectangular';
  position: { x: number; y: number };
}

export interface WeddingData {
  guests: Guest[];
  tables: Table[];
}

export const DIETARY_LABELS: Record<Guest['dietary'], string> = {
  none: 'No restrictions',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  'gluten-free': 'Gluten Free',
};

export const RSVP_LABELS: Record<Guest['rsvp'], string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  declined: 'Declined',
};
