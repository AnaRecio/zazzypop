"""
Scraper for gamcultural.com/cr — GAM Cultural events calendar.

Date badge structure (CSS class*="date"):
  Future: "VIE\n22\nMAYO\n2026"  (day_abbr, day, month, year — separate lines)
  Today:  "HOY"
  Tmrw:   "MAÑANA"

Time (CSS class*="time" or <time>): "18:00", "19:00"
"""
import re
from datetime import datetime, timedelta, timezone

CR_TZ = timezone(timedelta(hours=-6))
from playwright.sync_api import sync_playwright
from .base import BaseScraper, EventData

BASE = "https://www.gamcultural.com"
LISTING = f"{BASE}/cr/"

MONTHS = {
    "ene": 1, "enero": 1,
    "feb": 2, "febrero": 2,
    "mar": 3, "marzo": 3,
    "abr": 4, "abril": 4,
    "may": 5, "mayo": 5,
    "jun": 6, "junio": 6,
    "jul": 7, "julio": 7,
    "ago": 8, "agosto": 8,
    "sep": 9, "set": 9, "septiembre": 9, "setiembre": 9,
    "oct": 10, "octubre": 10,
    "nov": 11, "noviembre": 11,
    "dic": 12, "diciembre": 12,
}

CITIES = [
    "San José", "Heredia", "Alajuela", "Cartago", "Liberia",
    "Pérez Zeledón", "Limón", "Puntarenas", "Escazú", "Desamparados",
    "San Pedro", "Montes de Oca", "Curridabat", "La Sabana", "Barrio Amón",
    "San Ramón", "Palmares", "Grecia", "Atenas", "Belén", "Santa Ana",
    "Tibás", "Moravia", "Goicoechea", "Coronado", "Tres Ríos",
]

CATEGORY_MAP = {
    "música": "musica", "música en vivo": "musica", "concierto": "musica",
    "ópera": "musica", "jazz": "musica", "orquesta": "musica",
    "teatro": "teatro", "danza": "danza",
    "expo": "arte", "exposición": "arte", "galería": "arte", "arte": "arte",
    "cine": "cine", "película": "cine",
    "literatura": "otro", "libro": "otro",
    "feria": "mercado", "mercado": "mercado",
    "taller": "talleres", "workshop": "talleres",
    "stand-up": "humor", "comedia": "humor",
    "familia": "familia", "infantil": "familia", "niños": "familia",
}


def _detect_city(text: str) -> str:
    for city in CITIES:
        if city.lower() in text.lower():
            return city
    return "San José"


def _detect_category(text: str) -> list[str]:
    lower = text.lower()
    for key, cat in CATEGORY_MAP.items():
        if key in lower:
            return [cat]
    return ["otro"]


def _parse_price(text: str) -> tuple[int, int | None, bool]:
    if re.search(r"\bgratis\b|\bgratuito\b|\blibre\b|\bfree\b", text, re.IGNORECASE):
        return 0, None, True
    amounts = re.findall(r"[\d.,]+(?=\s*₡)|(?<=₡)\s*[\d.,]+|[\d.,]+(?=\s*¢)|(?<=¢)\s*[\d.,]+", text)
    nums = []
    for a in amounts:
        try:
            nums.append(int(a.strip().replace(",", "").replace(".", "")))
        except ValueError:
            pass
    if not nums:
        return 0, None, False
    return min(nums), max(nums) if len(nums) > 1 else None, False


def _parse_badge(badge_text: str) -> tuple[int, int, int] | None:
    """Parse 'VIE\\n22\\nMAYO\\n2026' → (day, month, year). Returns None if unparseable."""
    now = datetime.now()
    lines = [l.strip() for l in badge_text.strip().split("\n") if l.strip()]

    # HOY / MAÑANA
    if lines and lines[0].upper() in ("HOY", "TODAY"):
        return now.day, now.month, now.year
    if lines and lines[0].upper() in ("MAÑANA", "MANANA", "TOMORROW"):
        tmrw = now + timedelta(days=1)
        return tmrw.day, tmrw.month, tmrw.year

    # Expected: [day_abbr, day_num, month_name, year?]
    # Find day number (1-2 digit line)
    day, month, year = None, None, now.year
    for line in lines:
        if re.match(r"^\d{1,2}$", line):
            day = int(line)
        elif re.match(r"^\d{4}$", line):
            year = int(line)
        else:
            low = line.lower()
            for name, num in MONTHS.items():
                if low == name or low.startswith(name):
                    month = num
                    break

    if day and month:
        # Infer year if not explicit and month already passed
        if year == now.year and month < now.month:
            year += 1
        return day, month, year
    return None


def _parse_time(time_text: str) -> tuple[int, int]:
    """Parse '18:00' or '6:00 p.m.' → (hour, minute)."""
    m = re.match(r"(\d{1,2}):(\d{2})\s*(am|pm|a\.m\.|p\.m\.)?", time_text.strip(), re.IGNORECASE)
    if not m:
        return 20, 0
    hour, minute = int(m.group(1)), int(m.group(2))
    ampm = (m.group(3) or "").lower().replace(".", "")
    if ampm == "pm" and hour != 12:
        hour += 12
    elif ampm == "am" and hour == 12:
        hour = 0
    return hour, minute


class GamCulturalScraper(BaseScraper):
    name = "gamcultural"

    def scrape(self) -> list[EventData]:
        events = []
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.set_extra_http_headers({"Accept-Language": "es-CR,es;q=0.9"})

                event_urls: set[str] = set()
                self.log(f"Loading {LISTING}")
                try:
                    page.goto(LISTING, wait_until="networkidle", timeout=35000)
                    page.wait_for_timeout(2000)

                    for _ in range(5):
                        page.keyboard.press("End")
                        page.wait_for_timeout(1000)

                    links = page.query_selector_all("a[href*='/cr/events/']")
                    for lnk in links:
                        href = lnk.get_attribute("href") or ""
                        if "/cr/events/" in href:
                            full = href if href.startswith("http") else f"{BASE}{href}"
                            event_urls.add(full.split("?")[0])
                    self.log(f"Found {len(event_urls)} event URLs")
                except Exception as e:
                    self.log(f"Listing error: {e}")

                for event_url in list(event_urls)[:50]:
                    try:
                        event = self._scrape_event(page, event_url)
                        if event:
                            events.append(event)
                    except Exception as e:
                        self.log(f"Event error {event_url}: {e}")

                browser.close()
        except Exception as e:
            self.log(f"Scraper error: {e}")

        self.log(f"Scraped {len(events)} events")
        return events

    def _scrape_event(self, page, url: str) -> EventData | None:
        page.goto(url, wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(800)

        # Title
        title_el = page.query_selector("h1") or page.query_selector("h2")
        if not title_el:
            return None
        title = title_el.inner_text().strip()
        if not title:
            return None

        # ── Date: first [class*="date"] element is always the current event's badge ──
        dt_start = None
        date_el = page.query_selector("[class*='date']")
        if date_el:
            badge = date_el.inner_text().strip()
            parsed = _parse_badge(badge)
            if parsed:
                day, month, year = parsed
                # Time: first [class*="time"] element
                hour, minute = 20, 0
                time_el = page.query_selector("[class*='time']")
                if time_el:
                    raw = time_el.inner_text().strip().split("\n")[0]
                    hour, minute = _parse_time(raw)
                try:
                    dt_start = datetime(year, month, day, hour, minute, tzinfo=CR_TZ)
                except ValueError:
                    pass

        # Fallback: search body text for date patterns
        if not dt_start:
            body = page.inner_text("body")
            dt_start = self._parse_date_from_text(body)

        if not dt_start:
            return None

        # Venue & city
        body_text = page.inner_text("body")
        venue = "Por confirmar"
        city = "San José"

        venue_el = (
            page.query_selector("[class*='venue']") or
            page.query_selector("[class*='place']") or
            page.query_selector("[class*='location']") or
            page.query_selector("[itemprop='location']")
        )
        if venue_el:
            venue = venue_el.inner_text().strip().split("\n")[0][:200]
            city = _detect_city(venue)
        else:
            city = _detect_city(body_text[:800])

        # Category
        slug = url.split("/")[-1].replace("-", " ")
        category = _detect_category(f"{title} {slug} {body_text[:300]}")

        # Price — search near top of body (before related events)
        price_min, price_max, is_free = _parse_price(body_text[:1500])

        # Description
        desc = ""
        for attr, name in [("property", "og:description"), ("name", "description")]:
            meta_el = page.query_selector(f"meta[{attr}='{name}']")
            if meta_el:
                desc = meta_el.get_attribute("content") or ""
                if desc:
                    break
        if not desc:
            for p_el in page.query_selector_all("p"):
                t = p_el.inner_text().strip()
                if len(t) > 80:
                    desc = t[:1000]
                    break

        # Image
        image_url = None
        og_img = page.query_selector("meta[property='og:image']")
        if og_img:
            image_url = og_img.get_attribute("content")
        if not image_url:
            img_el = page.query_selector("img[src*='viralagenda']") or page.query_selector("img[src*='cdn']")
            if img_el:
                image_url = img_el.get_attribute("src")

        return EventData(
            title=title[:200],
            description=desc[:1000],
            datetime_start=dt_start,
            venue_name=venue[:200],
            city=city,
            category=category,
            price_min=price_min,
            price_max=price_max,
            is_free=is_free,
            image_url=image_url,
            source_url=url,
            source_platform="gamcultural",
        )

    def _parse_date_from_text(self, text: str) -> datetime | None:
        """Fallback: parse date from body text. Tries long month names first."""
        now = datetime.now()
        # Long names first to avoid "may" matching inside "mayo"
        ordered = sorted(MONTHS.items(), key=lambda x: -len(x[0]))
        for name, num in ordered:
            m = re.search(
                rf"(\d{{1,2}})\s+(?:de\s+)?{re.escape(name)}\s*(?:de\s+)?(\d{{4}})?",
                text, re.IGNORECASE
            )
            if m:
                day = int(m.group(1))
                year = int(m.group(2)) if m.group(2) else now.year
                if year == now.year and num < now.month:
                    year += 1
                try:
                    dt = datetime(year, num, day, 20, 0, tzinfo=CR_TZ)
                    time_m = re.search(r"(\d{1,2}):(\d{2})", text[:300])
                    if time_m:
                        dt = dt.replace(hour=int(time_m.group(1)), minute=int(time_m.group(2)))
                    return dt
                except ValueError:
                    return None
        return None
