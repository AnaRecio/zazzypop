"""
Scraper for agenda.mcj.go.cr — official Ministry of Culture events calendar.
Collects event slugs from the listing pages, then visits each event page.
"""
import re
from datetime import datetime, timedelta, timezone

CR_TZ = timezone(timedelta(hours=-6))
from playwright.sync_api import sync_playwright
from .base import BaseScraper, EventData

BASE = "https://agenda.mcj.go.cr"
LISTING = f"{BASE}/listado-eventos"

MONTHS = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
    "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
    "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
}

PROVINCE_MAP = {
    "san josé": "San José", "san jose": "San José",
    "alajuela": "Alajuela", "cartago": "Cartago",
    "heredia": "Heredia", "guanacaste": "Liberia",
    "puntarenas": "Puntarenas", "limón": "Limón", "limon": "Limón",
}

CATEGORY_MAP = {
    "música": "musica", "musica": "musica", "ópera": "musica", "opera": "musica",
    "danza": "danza", "teatro": "teatro", "artes visuales": "arte",
    "literatura": "otro", "cine": "cine", "patrimonio": "otro",
    "talleres": "talleres", "feria": "mercado",
}


def _parse_date(text: str) -> datetime | None:
    """Parse Spanish date string like '19 de mayo 2026'."""
    text = text.lower().strip()
    for name, num in MONTHS.items():
        if name in text:
            day_m = re.search(r"\b(\d{1,2})\b", text)
            year_m = re.search(r"\b(20\d{2})\b", text)
            if not day_m:
                return None
            day = int(day_m.group(1))
            year = int(year_m.group(1)) if year_m else datetime.now().year
            try:
                return datetime(year, num, day, 20, 0, tzinfo=CR_TZ)
            except ValueError:
                return None
    return None


def _parse_time(text: str, base: datetime) -> datetime:
    """Extract hour/minute from text like '3:00 p.m.' and apply to base date."""
    m = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)", text, re.IGNORECASE)
    if not m:
        return base
    hour = int(m.group(1))
    minute = int(m.group(2)) if m.group(2) else 0
    ampm = m.group(3).lower().replace(".", "")
    if ampm == "pm" and hour != 12:
        hour += 12
    elif ampm == "am" and hour == 12:
        hour = 0
    return base.replace(hour=hour, minute=minute)


def _detect_province(text: str) -> str:
    lower = text.lower()
    for key, city in PROVINCE_MAP.items():
        if key in lower:
            return city
    return "San José"


def _detect_category(text: str) -> list[str]:
    lower = text.lower()
    for key, cat in CATEGORY_MAP.items():
        if key in lower:
            return [cat]
    return ["otro"]


class McjScraper(BaseScraper):
    name = "mcj"

    def scrape(self) -> list[EventData]:
        events = []
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.set_extra_http_headers({"Accept-Language": "es-CR,es;q=0.9"})

                # Step 1: collect event slugs from listing pages
                slugs: set[str] = set()
                for page_num in range(1, 7):
                    url = f"{LISTING}?page={page_num}"
                    self.log(f"Listing page {page_num}")
                    try:
                        page.goto(url, wait_until="networkidle", timeout=30000)
                        page.wait_for_timeout(1500)
                        links = page.query_selector_all("a[href*='/evento/']")
                        found = 0
                        for lnk in links:
                            href = lnk.get_attribute("href") or ""
                            if href.startswith("/evento/") and len(href) > 8:
                                slugs.add(href)
                                found += 1
                        self.log(f"  Found {found} links (total {len(slugs)})")
                        if found == 0:
                            break  # No more pages
                    except Exception as e:
                        self.log(f"  Listing error: {e}")

                self.log(f"Total unique event slugs: {len(slugs)}")

                # Step 2: scrape each event page
                for slug in list(slugs)[:60]:
                    try:
                        event = self._scrape_event(page, f"{BASE}{slug}")
                        if event:
                            events.append(event)
                    except Exception as e:
                        self.log(f"  Event error {slug}: {e}")

                browser.close()
        except Exception as e:
            self.log(f"Scraper error: {e}")

        self.log(f"Scraped {len(events)} events")
        return events

    def _scrape_event(self, page, url: str) -> EventData | None:
        page.goto(url, wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(800)
        content = page.content()

        # Title
        title_el = page.query_selector("h1")
        if not title_el:
            return None
        title = title_el.inner_text().strip()
        if not title:
            return None

        # Full page text for parsing
        body = page.inner_text("body")

        # Date — look for "dd de mes yyyy" pattern
        date_m = re.search(
            r"(\d{1,2})\s+de\s+(" + "|".join(MONTHS.keys()) + r")\s+(\d{4})",
            body, re.IGNORECASE
        )
        if not date_m:
            return None
        day = int(date_m.group(1))
        month = MONTHS[date_m.group(2).lower()]
        year = int(date_m.group(3))
        try:
            dt_start = datetime(year, month, day, 20, 0, tzinfo=CR_TZ)
        except ValueError:
            return None

        # Time — look for HH:MM or H:MM am/pm
        time_m = re.search(r"(\d{1,2}:\d{2})\s*(a\.?m\.?|p\.?m\.?)?", body, re.IGNORECASE)
        if time_m:
            dt_start = _parse_time(time_m.group(0), dt_start)

        # Venue — usually right after date block or in a dedicated section
        venue = "Por confirmar"
        venue_el = (
            page.query_selector("[class*='venue']") or
            page.query_selector("[class*='lugar']") or
            page.query_selector("[class*='location']")
        )
        if venue_el:
            venue = venue_el.inner_text().strip()[:200]
        else:
            # Heuristic: line after "Lugar:" or "Sede:"
            venue_m = re.search(r"(?:Lugar|Sede|Recinto)[:\s]+([^\n]{5,100})", body)
            if venue_m:
                venue = venue_m.group(1).strip()

        # Coordinates from Google Maps / Waze links
        lat, lng = None, None
        coord_m = re.search(r"(-?\d{1,2}\.\d{4,}),(-?\d{2,3}\.\d{4,})", content)
        if coord_m:
            try:
                lat = float(coord_m.group(1))
                lng = float(coord_m.group(2))
            except ValueError:
                pass

        # City/province
        city = _detect_province(body)

        # Category
        category_els = page.query_selector_all("a[href*='categoria']")
        category_text = " ".join(el.inner_text() for el in category_els)
        category = _detect_category(category_text) if category_text else _detect_category(title)

        # Free / price
        is_free = bool(re.search(r"\bgratu[ií]t[ao]\b|\bentrada\s+libre\b|\bsin\s+costo\b", body, re.IGNORECASE))
        price_min = 0

        # Description — get meta description or first long paragraph
        desc = ""
        desc_el = page.query_selector("meta[name='description']")
        if desc_el:
            desc = desc_el.get_attribute("content") or ""
        if not desc:
            paras = page.query_selector_all("p")
            for p in paras:
                t = p.inner_text().strip()
                if len(t) > 80:
                    desc = t[:1000]
                    break

        # Image
        image_url = None
        img_el = page.query_selector("meta[property='og:image']")
        if img_el:
            image_url = img_el.get_attribute("content")
        if not image_url:
            img_el = page.query_selector("img[src*='mcj.go.cr']") or page.query_selector("main img")
            if img_el:
                src = img_el.get_attribute("src") or ""
                if src.startswith("/_next/image"):
                    url_m = re.search(r"url=([^&]+)", src)
                    if url_m:
                        from urllib.parse import unquote
                        image_url = unquote(url_m.group(1))
                else:
                    image_url = src if src.startswith("http") else f"{BASE}{src}"

        return EventData(
            title=title[:200],
            description=desc[:1000],
            datetime_start=dt_start,
            venue_name=venue[:200],
            city=city,
            category=category,
            price_min=price_min,
            is_free=is_free,
            image_url=image_url,
            lat=lat,
            lng=lng,
            source_url=url,
            source_platform="mcj",
        )
