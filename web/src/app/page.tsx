export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import { Calendar, Zap, Gift, ArrowRight } from "lucide-react";
import EventCard from "@/components/EventCard";
import { getEvents } from "@/lib/events";
import { CATEGORIES } from "@/lib/types";
import { startOfDay, endOfDay, addDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const CR_TZ = "America/Costa_Rica";

type When = "today" | "tomorrow" | "weekend" | "week";

const TIME_TABS: { value: When; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "tomorrow", label: "Mañana" },
  { value: "weekend", label: "Este finde" },
  { value: "week", label: "Esta semana" },
];

function crRange(start: Date, end: Date) {
  return {
    date_from: fromZonedTime(startOfDay(toZonedTime(start, CR_TZ)), CR_TZ).toISOString(),
    date_to: fromZonedTime(endOfDay(toZonedTime(end, CR_TZ)), CR_TZ).toISOString(),
  };
}

function getDateRange(when: When): { date_from: string; date_to: string } {
  const now = new Date();
  const nowCR = toZonedTime(now, CR_TZ);
  if (when === "tomorrow") {
    const tmrw = addDays(nowCR, 1);
    return crRange(tmrw, tmrw);
  }
  if (when === "weekend") {
    const daysUntilFri = (5 - nowCR.getDay() + 7) % 7 || 7;
    const friday = addDays(nowCR, daysUntilFri);
    const sunday = addDays(friday, 2);
    return crRange(friday, sunday);
  }
  if (when === "week") {
    return { date_from: now.toISOString(), date_to: addDays(nowCR, 7).toISOString() };
  }
  return crRange(now, now);
}

async function EventsSection({ when }: { when: When }) {
  const range = getDateRange(when);
  const events = await getEvents(range);
  const sorted = [...events].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));

  if (sorted.length === 0)
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-gray-500 font-medium">No hay eventos registrados para este período todavía.</p>
        <Link
          href="/eventos"
          className="text-orange-500 hover:text-orange-600 text-sm mt-2 inline-flex items-center gap-1"
        >
          Ver todos los próximos eventos <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sorted.slice(0, 9).map((e) => (
        <EventCard key={e.id} event={e} featured={e.is_featured} />
      ))}
    </div>
  );
}

function EventGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
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

interface PageProps {
  searchParams: Promise<{ when?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const when: When =
    ["today", "tomorrow", "weekend", "week"].includes(params.when ?? "")
      ? (params.when as When)
      : "today";

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 via-white to-pink-50 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            ¿Qué hacemos{" "}
            <span className="text-orange-500">este finde</span>?
          </h1>
          <p className="text-lg text-gray-500 mb-8">
            Qué hacer en Costa Rica. Música, ferias, mercaditos,
            stand-up, talleres y mucho más — todo en un solo lugar.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <Link
              href="/eventos?free=1"
              className="flex items-center gap-1.5 bg-green-100 text-green-700 font-medium px-4 py-2 rounded-full hover:bg-green-200 transition-colors"
            >
              <Gift className="w-4 h-4" />
              Eventos gratis
            </Link>
            <Link
              href="/eventos?max_price=10000"
              className="flex items-center gap-1.5 bg-blue-100 text-blue-700 font-medium px-4 py-2 rounded-full hover:bg-blue-200 transition-colors"
            >
              Por menos de ₡10,000
            </Link>
            <Link
              href="/eventos"
              className="flex items-center gap-1.5 bg-orange-500 text-white font-medium px-4 py-2 rounded-full hover:bg-orange-600 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Explorar todo
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={`/eventos?category=${cat.value}`}
                className="text-sm px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors"
              >
                {cat.emoji} {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Time tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          {TIME_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/?when=${tab.value}`}
              className={`shrink-0 text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                when === tab.value
                  ? "bg-orange-500 text-white"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </Link>
          ))}
          <Link
            href="/eventos"
            className="shrink-0 text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1 ml-auto"
          >
            Ver todo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Events — single Suspense boundary */}
        <Suspense key={when} fallback={<EventGridSkeleton />}>
          <EventsSection when={when} />
        </Suspense>
      </div>
    </div>
  );
}
