export const dynamic = "force-dynamic";

import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import EventMapClient from "@/components/EventMapClient";
import { getEvents } from "@/lib/events";
import type { EventCategory, EventFilters } from "@/lib/types";
import { startOfDay, endOfDay, addDays } from "date-fns";

interface PageProps {
  searchParams: Promise<{
    city?: string;
    category?: string;
    free?: string;
    max_price?: string;
    when?: string;
    date?: string;
  }>;
}

function resolveDateRange(when?: string, date?: string): { date_from?: string; date_to?: string } {
  if (date) {
    const d = new Date(date + "T12:00:00");
    return { date_from: startOfDay(d).toISOString(), date_to: endOfDay(d).toISOString() };
  }
  const now = new Date();
  if (when === "today") return { date_from: startOfDay(now).toISOString(), date_to: endOfDay(now).toISOString() };
  if (when === "tomorrow") {
    const t = addDays(now, 1);
    return { date_from: startOfDay(t).toISOString(), date_to: endOfDay(t).toISOString() };
  }
  if (when === "weekend") {
    const daysUntilFri = (5 - now.getDay() + 7) % 7 || 7;
    const fri = addDays(now, daysUntilFri);
    return { date_from: startOfDay(fri).toISOString(), date_to: endOfDay(addDays(fri, 2)).toISOString() };
  }
  if (when === "week") return { date_from: now.toISOString(), date_to: addDays(now, 7).toISOString() };
  return {};
}

async function MapContent({ filters }: { filters: EventFilters }) {
  const events = await getEvents(filters);
  const eventsWithCoords = events.filter((e) => e.lat != null && e.lng != null);
  return <EventMapClient events={eventsWithCoords} />;
}

export default async function MapaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const dateRange = resolveDateRange(params.when, params.date);

  const filters: EventFilters = {
    city: params.city,
    category: params.category ? [params.category as EventCategory] : undefined,
    is_free: params.free === "1",
    max_price: params.max_price ? Number(params.max_price) : undefined,
    ...dateRange,
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
      <FilterBar />
      <div className="flex-1 min-h-0">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full bg-gray-50">
            <p className="text-gray-400">Cargando mapa...</p>
          </div>
        }>
          <MapContent filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}
