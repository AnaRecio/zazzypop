import Link from "next/link";
import { MapPin, Clock, Ticket } from "lucide-react";
import { parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";

const CR_TZ = "America/Costa_Rica";
import type { Event } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

interface Props {
  event: Event;
  featured?: boolean;
}

export default function EventCard({ event, featured }: Props) {
  const startDate = parseISO(event.datetime_start);
  const categoryInfo = CATEGORIES.find((c) => event.category.includes(c.value));

  const priceLabel = event.is_free
    ? "Gratis"
    : event.price_min === 0
    ? "Entrada libre"
    : `₡${event.price_min.toLocaleString()}`;

  return (
    <Link
      href={`/evento/${event.id}`}
      className={`group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-200 ${
        featured ? "shadow-md" : ""
      }`}
    >
      {/* Image */}
      <div className="relative aspect-video bg-gradient-to-br from-orange-100 to-pink-100 overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">
            {categoryInfo?.emoji ?? "✨"}
          </div>
        )}
        {event.is_featured && (
          <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            Destacado
          </span>
        )}
        <span
          className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
            event.is_free
              ? "bg-green-100 text-green-700"
              : "bg-white/90 text-gray-700"
          }`}
        >
          {priceLabel}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category pill */}
        {categoryInfo && (
          <span className="inline-block text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mb-2">
            {categoryInfo.emoji} {categoryInfo.label}
          </span>
        )}

        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 mb-2 group-hover:text-orange-600 transition-colors">
          {event.title}
        </h3>

        <div className="space-y-1 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>
              {formatInTimeZone(startDate, CR_TZ, "EEE d MMM · HH:mm", { locale: es })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {event.venue_name} · {event.city}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
