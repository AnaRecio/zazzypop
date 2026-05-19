"use client";

import { useState } from "react";
import { CATEGORIES, CITIES, type EventCategory } from "@/lib/types";
import { CheckCircle } from "lucide-react";

export default function PublicarPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    datetime_start: "",
    datetime_end: "",
    venue_name: "",
    address: "",
    city: "",
    category: [] as EventCategory[],
    price_min: 0,
    is_free: false,
    image_url: "",
    source_url: "",
    contact_email: "",
  });

  const toggleCategory = (cat: EventCategory) => {
    setForm((f) => ({
      ...f,
      category: f.category.includes(cat)
        ? f.category.filter((c) => c !== cat)
        : [...f.category, cat],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/submit-event", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          datetime_end: form.datetime_end || undefined,
          image_url: form.image_url || undefined,
          source_url: form.source_url || undefined,
          contact_email: form.contact_email || undefined,
        }),
      });
      if (!res.ok) throw new Error("Error del servidor");
      setSubmitted(true);
    } catch (err) {
      alert("Hubo un error al enviar el evento. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">¡Evento enviado!</h1>
        <p className="text-gray-500">
          Lo revisamos en las próximas horas y lo publicamos si cumple los requisitos.
          Gracias por compartir tu evento.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Publicar un evento</h1>
        <p className="text-gray-500">
          El listado básico es <strong>gratis</strong>. Lo revisamos y publicamos en
          pocas horas. Para destacar tu evento, contáctanos en Instagram.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <Field label="Nombre del evento *">
          <input
            required
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="ej. Feria del Maíz en San Pedro"
            className={inputCls}
          />
        </Field>

        {/* Description */}
        <Field label="Descripción *">
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Contá qué es el evento, qué pueden esperar..."
            className={inputCls}
          />
        </Field>

        {/* Dates */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Fecha y hora de inicio *">
            <input
              required
              type="datetime-local"
              value={form.datetime_start}
              onChange={(e) => setForm({ ...form, datetime_start: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Fecha y hora de fin">
            <input
              type="datetime-local"
              value={form.datetime_end}
              onChange={(e) => setForm({ ...form, datetime_end: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>

        {/* Venue */}
        <Field label="Lugar / Venue *">
          <input
            required
            type="text"
            value={form.venue_name}
            onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
            placeholder="ej. Jazz Café San Pedro"
            className={inputCls}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Dirección">
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="ej. De la UCR 200m norte"
              className={inputCls}
            />
          </Field>
          <Field label="Ciudad *">
            <select
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={inputCls}
            >
              <option value="">Seleccioná una ciudad</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Categories */}
        <Field label="Categorías *">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => toggleCategory(cat.value)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  form.category.includes(cat.value)
                    ? "bg-orange-500 text-white border-orange-500"
                    : "border-gray-200 text-gray-600 hover:border-orange-300"
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Price */}
        <Field label="Precio">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_free}
                onChange={(e) =>
                  setForm({ ...form, is_free: e.target.checked, price_min: 0 })
                }
                className="accent-orange-500 w-4 h-4"
              />
              <span className="text-sm font-medium">Entrada gratis</span>
            </label>
            {!form.is_free && (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-gray-500">₡</span>
                <input
                  type="number"
                  min={0}
                  value={form.price_min}
                  onChange={(e) =>
                    setForm({ ...form, price_min: Number(e.target.value) })
                  }
                  placeholder="Precio desde"
                  className={`${inputCls} flex-1`}
                />
              </div>
            )}
          </div>
        </Field>

        {/* Links */}
        <Field label="Link de la imagen (opcional)">
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="https://..."
            className={inputCls}
          />
        </Field>

        <Field label="Link para más info / entradas (opcional)">
          <input
            type="url"
            value={form.source_url}
            onChange={(e) => setForm({ ...form, source_url: e.target.value })}
            placeholder="https://..."
            className={inputCls}
          />
        </Field>

        <Field label="Tu email de contacto (opcional)">
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            placeholder="hola@tuevento.cr"
            className={inputCls}
          />
        </Field>

        <button
          type="submit"
          disabled={loading || form.category.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {loading ? "Enviando..." : "Enviar evento"}
        </button>
        <p className="text-xs text-gray-400 text-center">
          Al enviar aceptás que revisemos y publiquemos el evento en la plataforma.
        </p>
      </form>
    </div>
  );
}

const inputCls =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
