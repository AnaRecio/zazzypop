"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Check, X, MapPin, Clock, ExternalLink, Pencil, Search } from "lucide-react";
import type { Event } from "@/lib/types";
import { CITIES } from "@/lib/types";

type Tab = "pending" | "published";

interface EditDraft {
  title: string;
  date: string;
  time: string;
  venue_name: string;
  city: string;
  price_min: number;
  is_free: boolean;
}

function toLocalDatetime(iso: string): { date: string; time: string } {
  const dt = parseISO(iso);
  return { date: format(dt, "yyyy-MM-dd"), time: format(dt, "HH:mm") };
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [tab, setTab] = useState<Tab>("pending");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionIds, setActionIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [search, setSearch] = useState("");

  const fetchEvents = (view: Tab, password = pw) => {
    setLoading(true);
    setEditingId(null);
    setDraft(null);
    const approved = view === "published";
    fetch(`/api/admin/events?approved=${approved}`, {
      headers: { "x-admin-password": password },
    })
      .then((r) => r.json())
      .then((data) => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const login = () => {
    fetch("/api/admin/events?approved=false", { headers: { "x-admin-password": pw } })
      .then((r) => {
        if (r.ok) {
          setAuthed(true);
          return r.json().then((data) => { setEvents(data); setLoading(false); });
        } else {
          alert("Contraseña incorrecta");
          setLoading(false);
        }
      })
      .catch(() => { alert("Error al conectar"); setLoading(false); });
    setLoading(true);
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    fetchEvents(t);
  };

  const approve = async (id: string) => {
    setActionIds((s) => new Set(s).add(id));
    await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-password": pw },
      body: JSON.stringify({ id }),
    });
    setEvents((evs) => evs.filter((e) => e.id !== id));
    setActionIds((s) => { const n = new Set(s); n.delete(id); return n; });
  };

  const reject = async (id: string) => {
    if (!confirm("¿Eliminar este evento?")) return;
    setActionIds((s) => new Set(s).add(id));
    await fetch("/api/admin/reject", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-password": pw },
      body: JSON.stringify({ id }),
    });
    setEvents((evs) => evs.filter((e) => e.id !== id));
    setActionIds((s) => { const n = new Set(s); n.delete(id); return n; });
  };

  const startEdit = (event: Event) => {
    const { date, time } = toLocalDatetime(event.datetime_start);
    setDraft({ title: event.title, date, time, venue_name: event.venue_name, city: event.city, price_min: event.price_min, is_free: event.is_free });
    setEditingId(event.id);
  };

  const cancelEdit = () => { setEditingId(null); setDraft(null); };

  const saveEdit = async (id: string): Promise<boolean> => {
    if (!draft) return false;
    const datetime_start = new Date(`${draft.date}T${draft.time}:00`).toISOString();
    const res = await fetch("/api/admin/update", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-password": pw },
      body: JSON.stringify({ id, ...draft, datetime_start }),
    });
    if (!res.ok) { alert("Error al guardar"); return false; }
    setEvents((evs) => evs.map((e) => e.id === id ? { ...e, ...draft, datetime_start } : e));
    cancelEdit();
    return true;
  };

  const saveAndApprove = async (id: string) => {
    const ok = await saveEdit(id);
    if (ok) await approve(id);
  };

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-6">Admin ZazzyPop</h1>
        <div className="space-y-3">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Contraseña"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-400"
          />
          <button onClick={login} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition-colors">
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin ZazzyPop</h1>
        <button onClick={() => fetchEvents(tab)} className="text-sm text-orange-500 hover:text-orange-600">
          Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => switchTab("pending")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            tab === "pending" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Pendientes {tab === "pending" && !loading && `(${events.length})`}
        </button>
        <button
          onClick={() => switchTab("published")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            tab === "published" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Publicados {tab === "published" && !loading && `(${events.length})`}
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400"
        />
      </div>

      {loading && <p className="text-gray-400">Cargando...</p>}

      {!loading && events.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">{tab === "pending" ? "✅" : "📭"}</p>
          <p className="text-gray-500">
            {tab === "pending" ? "No hay eventos pendientes." : "No hay eventos publicados."}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {events.filter((e) => e.title.toLowerCase().includes(search.toLowerCase())).map((event) => {
          const busy = actionIds.has(event.id);
          const isEditing = editingId === event.id;

          return (
            <div key={event.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="p-5 flex gap-4">
                <div className="w-24 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-orange-100 to-pink-100 shrink-0">
                  {event.image_url && (
                    <img src={event.image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate mb-1">{event.title}</h3>
                  <div className="text-sm text-gray-500 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {format(parseISO(event.datetime_start), "EEE d MMM · HH:mm", { locale: es })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.venue_name} · {event.city}
                    </div>
                    <div className="text-xs text-gray-400">via {event.source_platform}</div>
                  </div>
                  {event.source_url && (
                    <a href={event.source_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-orange-500 mt-1 hover:text-orange-600">
                      Ver fuente <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {tab === "pending" && (
                    <>
                      <button onClick={() => approve(event.id)} disabled={busy || isEditing}
                        className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                        <Check className="w-4 h-4" /> Aprobar
                      </button>
                      <button onClick={() => reject(event.id)} disabled={busy || isEditing}
                        className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                        <X className="w-4 h-4" /> Rechazar
                      </button>
                    </>
                  )}
                  {tab === "published" && (
                    <button onClick={() => reject(event.id)} disabled={busy || isEditing}
                      className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                      <X className="w-4 h-4" /> Eliminar
                    </button>
                  )}
                  <button
                    onClick={() => isEditing ? cancelEdit() : startEdit(event)}
                    disabled={busy}
                    className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
                      isEditing ? "bg-gray-100 text-gray-500" : "bg-orange-50 hover:bg-orange-100 text-orange-600"
                    }`}
                  >
                    <Pencil className="w-4 h-4" />
                    {isEditing ? "Cancelar" : "Editar"}
                  </button>
                </div>
              </div>

              {/* Inline edit form */}
              {isEditing && draft && (
                <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
                  <p className="text-sm font-semibold text-gray-700">Editar evento</p>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Título</label>
                    <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-orange-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Fecha</label>
                      <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                        style={{ colorScheme: "light" }}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-orange-400" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Hora</label>
                      <input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })}
                        style={{ colorScheme: "light" }}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-orange-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Lugar</label>
                      <input value={draft.venue_name} onChange={(e) => setDraft({ ...draft, venue_name: e.target.value })}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-orange-400" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Ciudad</label>
                      <select value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-orange-400">
                        {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Precio mínimo (₡)</label>
                      <input type="number" value={draft.price_min} disabled={draft.is_free}
                        onChange={(e) => setDraft({ ...draft, price_min: Number(e.target.value) })}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-orange-400 disabled:bg-gray-100 disabled:text-gray-400" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 mt-4 cursor-pointer">
                      <input type="checkbox" checked={draft.is_free}
                        onChange={(e) => setDraft({ ...draft, is_free: e.target.checked, price_min: e.target.checked ? 0 : draft.price_min })}
                        className="w-4 h-4 accent-green-500" />
                      Gratis
                    </label>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {tab === "pending" ? (
                      <>
                        <button onClick={() => saveAndApprove(event.id)}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                          Guardar y aprobar
                        </button>
                        <button onClick={() => saveEdit(event.id)}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                          Solo guardar
                        </button>
                      </>
                    ) : (
                      <button onClick={() => saveEdit(event.id)}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                        Guardar cambios
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
