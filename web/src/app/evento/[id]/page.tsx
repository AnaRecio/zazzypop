export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { MapPin, Clock, ExternalLink, Tag } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import BackButton from "@/components/BackButton";
import { parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";

const CR_TZ = "America/Costa_Rica";
import { getEventById } from "@/lib/events";
import { CATEGORIES } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventoPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const startDate = parseISO(event.datetime_start);
  const categories = CATEGORIES.filter((c) => event.category.includes(c.value));
  const priceLabel = event.is_free
    ? "Gratis"
    : event.price_min === 0
    ? "Entrada libre"
    : event.price_max
    ? `₡${event.price_min.toLocaleString()} – ₡${event.price_max.toLocaleString()}`
    : `Desde ₡${event.price_min.toLocaleString()}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <BackButton />

      {/* Image */}
      {event.image_url ? (
        <div className="rounded-2xl overflow-hidden aspect-video mb-6 bg-gray-100">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="rounded-2xl aspect-video mb-6 bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
          <span className="text-8xl opacity-20">
            {categories[0]?.emoji ?? "✨"}
          </span>
        </div>
      )}

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((c) => (
          <span
            key={c.value}
            className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full"
          >
            {c.emoji} {c.label}
          </span>
        ))}
        {event.is_featured && (
          <span className="text-sm font-bold text-white bg-orange-500 px-3 py-1 rounded-full">
            Destacado
          </span>
        )}
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">{event.title}</h1>

      {/* Info grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-gray-900">
                {formatInTimeZone(startDate, CR_TZ, "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </p>
              <p className="text-sm text-gray-500">
                {formatInTimeZone(startDate, CR_TZ, "HH:mm", { locale: es })}
                {event.datetime_end &&
                  ` – ${formatInTimeZone(parseISO(event.datetime_end), CR_TZ, "HH:mm", { locale: es })}`}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{event.venue_name}</p>
              <p className="text-sm text-gray-500">
                {event.address}, {event.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-orange-400 shrink-0" />
            <span
              className={`font-semibold ${event.is_free ? "text-green-600" : "text-gray-900"}`}
            >
              {priceLabel}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {event.source_url && (
            <a
              href={event.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Ver más / Entradas
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <ShareButton title={event.title} />

          {event.lat && event.lng && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-gray-200 hover:border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Cómo llegar
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">Sobre el evento</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">
            {event.description}
          </p>
        </div>
      )}
    </div>
  );
}

