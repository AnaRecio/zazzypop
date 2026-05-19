# ZazzyPop — Costa Rica Events

Event listing platform for Costa Rica. Aggregates events from multiple sources into a filterable, searchable web app and mobile app.

## Structure

```
eventos-cr/
├── web/          → Next.js 14 (App Router) + Tailwind + Supabase
├── mobile/       → Flutter (Android + iOS)
├── scraper/      → Python: Playwright scrapers + RSS feeds
└── supabase/     → SQL migrations
```

## Setup

### 1. Supabase

1. Create a project at https://supabase.com
2. Run migrations: `supabase/migrations/001_initial_schema.sql`
3. (Optional) Seed sample data: `002_seed_sample_events.sql`

### 2. Web (Next.js)

```bash
cd web
cp .env.local.example .env.local
# Fill in Supabase credentials in .env.local
npm install
npm run dev        # http://localhost:3000
```

**Pages:**
- `/` — Home: today's events, featured, this weekend
- `/eventos` — Filterable event listing
- `/evento/[id]` — Event detail
- `/mapa` — Map view (Leaflet + OpenStreetMap)
- `/publicar` — Organizer submission form
- `/admin` — Approval queue (password set in `.env.local`)

**Deploy:** Vercel — set root directory to `web/`, add environment variables.

### 3. Scraper (Python)

```bash
cd scraper
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
# Fill in credentials in .env

# Run once
python scheduler.py --once

# Run on a schedule (every 8 hours)
python scheduler.py
```

**Sources:**
- Eventbrite (JSON-LD, Playwright)
- GAM Cultural (`gamcultural.com/cr`)
- MCJ (`agenda.mcj.go.cr` — Ministry of Culture)
- eTicket CR (sports events)
- A Buen Paso (running events)

**Automated scraping:** GitHub Actions (`.github/workflows/scraper.yml`) runs every 8 hours. Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as repository secrets.

### 4. Flutter (Android / iOS)

```bash
cd mobile
flutter pub get
# Edit lib/config.dart with Supabase credentials
flutter run
```

## Environment Variables

**web/.env.local:**
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_ADMIN_PASSWORD=...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

**scraper/.env:**
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```
