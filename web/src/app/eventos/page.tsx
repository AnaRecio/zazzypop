export const dynamic = "force-dynamic";

import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import EventCard from "@/components/EventCard";
import { getEvents } from "@/lib/events";
import type { EventCategory, EventFilters } from "@/lib/types";
import { startOfDay, endOfDay, addDays } from "date-fns";

interface PageProps {
  searchParams: Promise<{
    city?: string;
    category?: string;
    free?: string;
    max_price?: string;
    q?: string;
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
  if (when === "today") {
    return { date_from: startOfDay(now).toISOString(), date_to: endOfDay(now).toISOString() };
  }
  if (when === "tomorrow") {
    const tmrw = addDays(now, 1);
    return { date_from: startOfDay(tmrw).toISOString(), date_to: endOfDay(tmrw).toISOString() };
  }
  if (when === "weekend") {
    const day = now.getDay();
    const daysUntilFri = (5 - day + 7) % 7 || 7;
    const friday = addDays(now, daysUntilFri);
    const sunday = addDays(friday, 2);
    return { date_from: startOfDay(friday).toISOString(), date_to: endOfDay(sunday).toISOString() };
  }
  if (when === "week") {
    return { date_from: now.toISOString(), date_to: addDays(now, 7).toISOString() };
  }
  return {};
}

const PAGE_TITLES: Record<string, string> = {
  today: "Eventos de hoy",
  tomorrow: "Eventos de mañana",
  weekend: "Este finde",
  week: "Esta semana",
};

async function EventsList({ filters }: { filters: EventFilters }) {
  const events = await getEvents(filters);
  if (events.length === 0)
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-gray-500 font-medium">No encontramos eventos con esos filtros.</p>
        <p className="text-gray-400 text-sm mt-1">Intentá con otros filtros o buscá en toda CR.</p>
      </div>
    );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((e) => (
        <EventCard key={e.id} event={e} featured={e.is_featured} />
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
          <div className="aspect-video bg-gray-100" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-gray-100 rounded w-1/4" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function EventosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const dateRange = resolveDateRange(params.when, params.date);

  const filters: EventFilters = {
    city: params.city,
    category: params.category ? [params.category as EventCategory] : undefined,
    is_free: params.free === "1",
    max_price: params.max_price ? Number(params.max_price) : undefined,
    query: params.q,
    ...dateRange,
  };

  const title = params.when
    ? (PAGE_TITLES[params.when] ?? "Explorar eventos")
    : params.date
    ? `Eventos del ${new Date(params.date + "T12:00:00").toLocaleDateString("es-CR", { day: "numeric", month: "long" })}`
    : "Explorar eventos";

  return (
    <div>
      <FilterBar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        <Suspense fallback={<Skeleton />}>
          <EventsList filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}
