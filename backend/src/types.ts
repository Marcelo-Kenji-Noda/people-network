export type PersonSource = 'manual' | 'contacts';

export interface Person {
  id: string;
  name: string;
  context: string | null;
  source: PersonSource;
  created_at: string; // ISO timestamp
}

export interface Interaction {
  id: string;
  date: string; // YYYY-MM-DD
  created_at: string; // ISO timestamp
}
