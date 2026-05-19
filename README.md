# ZazzyPop — Eventos Cool en Costa Rica

Cartelera moderna de eventos pequeños y cool en Costa Rica: ferias, música en vivo, mercaditos, stand-up, talleres, brunch, cine al aire libre y más.

## Estructura

```
eventos-cr/
├── web/          → Next.js 14 (App Router) + Tailwind + Supabase
├── mobile/       → Flutter (Android + iOS)
├── scraper/      → Python: Eventbrite API + TicketCR + RSS feeds
└── supabase/     → Migraciones SQL
```

## Setup rápido

### 1. Supabase
1. Crear proyecto en https://supabase.com
2. Correr migraciones: `supabase/migrations/001_initial_schema.sql`
3. (Opcional) Correr datos de prueba: `002_seed_sample_events.sql`

### 2. Web (Next.js)
```bash
cd web
cp .env.local.example .env.local
# Llenar credenciales de Supabase en .env.local
npm install
npm run dev        # http://localhost:3000
```

**Páginas:**
- `/` — Home: "Qué hacer hoy", eventos destacados, este finde
- `/eventos` — Listado filtrable con FilterBar
- `/evento/[id]` — Detalle de evento
- `/mapa` — Vista mapa con Leaflet + OpenStreetMap
- `/publicar` — Formulario para organizadores (entrada libre)
- `/admin` — Panel de aprobación (contraseña: `zazzy2024`, cambiar en `.env.local`)

**Deploy:** Vercel (conectar repo, agregar env vars)

### 3. Scraper (Python)
```bash
cd scraper
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
# Llenar credenciales en .env

# Correr una vez
python scheduler.py --once

# Correr cada 8 horas (producción)
python scheduler.py
```

**Fuentes incluidas:**
- Eventbrite API (legal, gratis — necesita token)
- TicketCR.com (Playwright headless)
- RSS de CRhoy y Semanario UCR

**Deploy del scraper:** Railway o Render (agregar env vars, start command: `python scheduler.py`)

### 4. Flutter (Android)
```bash
cd mobile
# Instalar Flutter: https://docs.flutter.dev/get-started/install/macos
flutter create . --org com.zazzypop --project-name eventos_cr
flutter pub get
# Editar lib/config.dart con credenciales de Supabase
flutter run
```

## Variables de entorno

**web/.env.local:**
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_ADMIN_PASSWORD=tu-password-admin
```

**scraper/.env:**
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
EVENTBRITE_API_TOKEN=...   # Gratis en eventbrite.com/platform
```

## Monetización (roadmap)
1. **Hoy**: Google AdSense (web) + AdMob (Android)
2. **Mes 3**: Eventos destacados — SINPE manual, ₡5,000–₡25,000
3. **Mes 6**: Premium users — ₡2,000/mes sin ads + filtros extra
