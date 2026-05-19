"use client";

import { useEffect, useRef } from "react";
import type { Event } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";

const CR_TZ = "America/Costa_Rica";

interface Props {
  events: Event[];
}

export default function EventMapClient({ events }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Fix default icon paths for Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView([9.9281, -84.0907], 11);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      events.forEach((event) => {
        if (event.lat == null || event.lng == null) return;
        const cat = CATEGORIES.find((c) => event.category.includes(c.value));
        const priceLabel = event.is_free
          ? "Gratis"
          : `₡${event.price_min.toLocaleString()}`;

        const popup = `
          <div style="max-width:220px;font-family:sans-serif">
            ${event.image_url ? `<img src="${event.image_url}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px"/>` : ""}
            <div style="font-size:11px;color:#ea580c;font-weight:600;margin-bottom:4px">${cat?.emoji ?? ""} ${cat?.label ?? ""}</div>
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;line-height:1.3">${event.title}</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:2px">📅 ${formatInTimeZone(parseISO(event.datetime_start), CR_TZ, "EEE d MMM · HH:mm", { locale: es })}</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:8px">📍 ${event.venue_name}</div>
            <div style="font-size:12px;font-weight:600;color:${event.is_free ? "#16a34a" : "#111"};margin-bottom:8px">${priceLabel}</div>
            <a href="/evento/${event.id}" style="display:block;text-align:center;background:#f97316;color:#fff;font-weight:600;font-size:12px;padding:6px 12px;border-radius:8px;text-decoration:none">Ver más</a>
          </div>
        `;

        L.marker([event.lat!, event.lng!])
          .addTo(map)
          .bindPopup(popup);
      });
    })();

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="text-gray-500">No hay eventos con ubicación disponible.</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full" />;
}
