export type EventCategory =
  | "musica"
  | "arte"
  | "comida"
  | "familia"
  | "teatro"
  | "cine"
  | "deporte"
  | "talleres"
  | "fiesta"
  | "mercado"
  | "standup"
  | "brunch"
  | "otro";

export interface Event {
  id: string;
  title: string;
  description: string;
  datetime_start: string;
  datetime_end: string | null;
  venue_name: string;
  address: string;
  city: string;
  zone: string | null;
  lat: number | null;
  lng: number | null;
  category: EventCategory[];
  tags: string[];
  price_min: number;
  price_max: number | null;
  is_free: boolean;
  image_url: string | null;
  source_url: string | null;
  source_platform: string;
  is_featured: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface Organizer {
  id: string;
  name: string;
  contact_email: string;
  instagram: string | null;
  website: string | null;
  is_verified: boolean;
}

export interface EventFilters {
  city?: string;
  category?: EventCategory[];
  is_free?: boolean;
  max_price?: number;
  date_from?: string;
  date_to?: string;
  query?: string;
}

export const CITIES = [
  "San José",
  "Cartago",
  "Heredia",
  "Alajuela",
  "Liberia",
  "Pérez Zeledón",
  "Limón",
  "Puntarenas",
];

export const CATEGORIES: { value: EventCategory; label: string; emoji: string }[] = [
  { value: "musica", label: "Música", emoji: "🎵" },
  { value: "arte", label: "Arte", emoji: "🎨" },
  { value: "comida", label: "Comida", emoji: "🍽️" },
  { value: "familia", label: "Familia", emoji: "👨‍👩‍👧" },
  { value: "teatro", label: "Teatro", emoji: "🎭" },
  { value: "cine", label: "Cine", emoji: "🎬" },
  { value: "deporte", label: "Deporte", emoji: "⚽" },
  { value: "talleres", label: "Talleres", emoji: "🛠️" },
  { value: "fiesta", label: "Fiesta", emoji: "🎉" },
  { value: "mercado", label: "Mercadito", emoji: "🛍️" },
  { value: "standup", label: "Stand-up", emoji: "🎤" },
  { value: "brunch", label: "Brunch", emoji: "☕" },
  { value: "otro", label: "Otro", emoji: "✨" },
];
