"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { CATEGORIES, CITIES, type EventCategory } from "@/lib/types";
import { SlidersHorizontal, X, CalendarDays } from "lucide-react";

type When = "today" | "tomorrow" | "weekend" | "week";

const WHEN_CHIPS: { value: When; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "tomorrow", label: "Mañana" },
  { value: "weekend", label: "Este finde" },
  { value: "week", label: "Esta semana" },
];

export default function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const city = searchParams.get("city") ?? "";
  const category = searchParams.get("category") ?? "";
  const isFree = searchParams.get("free") === "1";
  const maxPrice = searchParams.get("max_price") ?? "";
  const when = searchParams.get("when") ?? "";
  const date = searchParams.get("date") ?? "";

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const setWhen = (value: When | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("when");
    params.delete("date");
    if (value) params.set("when", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const setDate = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("when");
    params.delete("date");
    if (value) params.set("date", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasFilters = city || category || isFree || maxPrice || when || date;
  const activeDateChip = date ? "custom" : when;

  return (
    <div className="bg-white border-b border-gray-100">
      {/* Row 1: Date chips */}
      <div className="max-w-6xl mx-auto px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />

          <button
            onClick={() => setWhen(null)}
            className={`shrink-0 text-sm px-3 py-1.5 rounded-full border transition-colors ${
              !activeDateChip
                ? "bg-gray-800 text-white border-gray-800"
                : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-800"
            }`}
          >
            Todos
          </button>

          {WHEN_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setWhen(activeDateChip === chip.value ? null : chip.value)}
              className={`shrink-0 text-sm px-3 py-1.5 rounded-full border transition-colors ${
                activeDateChip === chip.value
                  ? "bg-orange-500 text-white border-orange-500"
                  : "border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
              }`}
            >
              {chip.label}
            </button>
          ))}

          {/* Date picker */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            title="Elegir fecha"
            style={{ colorScheme: "light" }}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors cursor-pointer bg-white focus:outline-none ${
              date
                ? "border-purple-500 text-purple-700"
                : "border-gray-200 text-gray-500 hover:border-purple-300"
            }`}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>

      {/* Row 2: Other filters */}
      <div className="max-w-6xl mx-auto px-4 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-gray-400 shrink-0" />

          {/* City */}
          <select
            value={city}
            onChange={(e) => updateParam("city", e.target.value || null)}
            className="text-sm border border-gray-200 rounded-full px-3 py-1.5 bg-white focus:outline-none focus:border-orange-400 cursor-pointer"
          >
            <option value="">Toda CR</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Categories */}
          {CATEGORIES.slice(0, 8).map((cat) => (
            <button
              key={cat.value}
              onClick={() =>
                updateParam("category", category === cat.value ? null : cat.value)
              }
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                category === cat.value
                  ? "bg-orange-500 text-white border-orange-500"
                  : "border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}

          {/* Free toggle */}
          <button
            onClick={() => updateParam("free", isFree ? null : "1")}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              isFree
                ? "bg-green-500 text-white border-green-500"
                : "border-gray-200 text-gray-600 hover:border-green-300"
            }`}
          >
            Gratis
          </button>

          {/* Under 10k */}
          <button
            onClick={() => updateParam("max_price", maxPrice === "10000" ? null : "10000")}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              maxPrice === "10000"
                ? "bg-blue-500 text-white border-blue-500"
                : "border-gray-200 text-gray-600 hover:border-blue-300"
            }`}
          >
            Menos de ₡10,000
          </button>

          {hasFilters && (
            <button
              onClick={() => router.push(pathname)}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
