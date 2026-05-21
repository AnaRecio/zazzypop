import { supabase } from "./supabase";
import type { Event, EventFilters } from "./types";
import { startOfDay, endOfDay, addDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const CR_TZ = "America/Costa_Rica";
function crRange(start: Date, end: Date) {
  return {
    date_from: fromZonedTime(startOfDay(toZonedTime(start, CR_TZ)), CR_TZ).toISOString(),
    date_to: fromZonedTime(endOfDay(toZonedTime(end, CR_TZ)), CR_TZ).toISOString(),
  };
}

export async function getEvents(filters: EventFilters = {}): Promise<Event[]> {
  let query = supabase
    .from("events")
    .select("*")
    .eq("is_approved", true)
    .order("is_featured", { ascending: false })
    .order("datetime_start", { ascending: true });

  if (filters.city) query = query.eq("city", filters.city);
  if (filters.is_free) query = query.eq("is_free", true);
  if (filters.max_price != null)
    query = query.lte("price_min", filters.max_price);
  if (filters.category && filters.category.length > 0)
    query = query.overlaps("category", filters.category);
  if (filters.date_from) query = query.gte("datetime_start", filters.date_from);
  if (filters.date_to) query = query.lte("datetime_start", filters.date_to);
  if (filters.query)
    query = query.ilike("title", `%${filters.query}%`);

  const { data, error } = await query.limit(100);
  if (error) throw error;
  return (data as Event[]) ?? [];
}

export async function getEventById(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Event;
}

export async function getTodayEvents(): Promise<Event[]> {
  const now = new Date();
  return getEvents(crRange(now, now));
}

export async function getWeekendEvents(): Promise<Event[]> {
  const now = new Date();
  const nowCR = toZonedTime(now, CR_TZ);
  const daysUntilFri = (5 - nowCR.getDay() + 7) % 7 || 7;
  const friday = addDays(nowCR, daysUntilFri);
  return getEvents(crRange(friday, addDays(friday, 2)));
}

export async function getWeekEvents(): Promise<Event[]> {
  const now = new Date();
  return getEvents({
    date_from: now.toISOString(),
    date_to: addDays(toZonedTime(now, CR_TZ), 7).toISOString(),
  });
}

export async function getFeaturedEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_approved", true)
    .eq("is_featured", true)
    .gte("datetime_start", new Date().toISOString())
    .order("datetime_start", { ascending: true })
    .limit(6);
  if (error) throw error;
  return (data as Event[]) ?? [];
}

export async function submitEvent(payload: {
  title: string;
  description: string;
  datetime_start: string;
  datetime_end?: string;
  venue_name: string;
  address: string;
  city: string;
  category: string[];
  price_min: number;
  is_free: boolean;
  image_url?: string;
  source_url?: string;
  contact_email?: string;
}) {
  const { error } = await supabase.from("events").insert({
    ...payload,
    source_platform: "organizer",
    is_approved: false,
    is_featured: false,
    tags: [],
  });
  if (error) throw error;
}

export async function getPendingEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_approved", false)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Event[]) ?? [];
}

export async function approveEvent(id: string) {
  const { error } = await supabase
    .from("events")
    .update({ is_approved: true })
    .eq("id", id);
  if (error) throw error;
}

export async function rejectEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}
