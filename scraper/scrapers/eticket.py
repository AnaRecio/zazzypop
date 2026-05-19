"""
Scraper for eticket.cr — sports events (triathlon, cycling, MTB, off-road, etc).
Navigates the Deportes category, collects event series pages, then individual events.
Excludes running events (covered by abuenpaso) and soccer.
"""
import re
from datetime import datetime, timedelta, timezone

CR_TZ = timezone(timedelta(hours=-6))
from playwright.sync_api import sync_playwright
from .base import BaseScraper, EventData

BASE = "https://www.eticket.cr"

SKIP_KEYWORDS = [
    "fútbol", "futbol", "soccer", "liga", "torneo de fútbol",
    "concierto", "teatro", "festival de música",
]

SPORT_KEYWORDS = [
    "triatlón", "triatlon", "ciclismo", "mtb", "mountain bike",
    "off road", "gran fondo", "natación", "natacion", "surf",
    "crossfit", "rodeo", "trail", "carrera", "run", "maratón",
    "maraton", "ruta", "atletismo", "kayak", "paddle",
]

CITIES = [
    "San José", "Heredia", "Alajuela", "Cartago", "Liberia",
    "Puntarenas", "Limón", "Santa Ana", "Curridabat", "La Sabana",
    "Tamarindo", "Jacó", "Monteverde", "Turrialba", "Guanacaste",
    "Santa Cruz", "Nosara", "Samara", "Palmares",
]

MONTHS = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
    "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
    "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


def _is_sport_event(text: str) -> bool:
    lower = text.lower()
    if any(kw in lower for kw in SKIP_KEYWORDS):
        return False
    return any(kw in lower for kw in SPORT_KEYWORDS)


def _detect_city(text: str) -> str:
    for city in CITIES:
        if city.lower() in text.lower():
            return city
    return "San José"


def _parse_date(text: str) -> datetime | None:
    lower = text.lower()
    for name, num in MONTHS.items():
        m = re.search(
            rf"(\d{{1,2}})\s*(?:de\s*)?{name}(?:\s*(?:de\s*)?(\d{{4}}))?",
            lower
        )
        if m:
            day = int(m.group(1))
            year = int(m.group(2)) if m.group(2) else datetime.now().year
            try:
                return datetime(year, num, day, 6, 0, tzinfo=CR_TZ)
            except ValueError:
                return None
    # Try numeric: 2026/8/9 or 9/8/2026
    m = re.search(r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})", text)
    if m:
        try:
            return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)),
                            6, 0, tzinfo=CR_TZ)
        except ValueError:
            pass
    return None


def _parse_price(text: str) -> tuple[int, int | None, bool]:
    if re.search(r"\bgratis\b|\bgratuito\b|\blibre\b", text, re.IGNORECASE):
        return 0, None, True
    # eticket shows prices in colones; amounts like "₡35,000" or "35.000"
    amounts = re.findall(r"[₡¢]\s*(\d[\d.,]+)", text)
    if not amounts:
        amounts = re.findall(r"\b(\d{2,3}(?:[.,]\d{3})+)\b", text)
    nums = []
    for a in amounts:
        try:
            nums.append(int(a.replace(".", "").replace(",", "")))
        except ValueError:
            pass
    if not nums:
        return 0, None, False
    return min(nums), max(nums) if len(nums) > 1 else None, False


class EticketScraper(BaseScraper):
    name = "eticket"

    def scrape(self) -> list[EventData]:
        events = []
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.set_extra_http_headers({"Accept-Language": "es-CR,es;q=0.9"})

                # Step 1: collect idartista links from homepage (sports section)
                self.log(f"Loading {BASE}")
                page.goto(BASE, wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(2000)

                artist_urls: set[str] = set()
                links = page.query_selector_all("a[href*='idartista=']")
                for lnk in links:
                    href = lnk.get_attribute("href") or ""
                    title_text = lnk.inner_text().strip()
                    parent_text = ""
                    try:
                        parent = lnk.evaluate("el => el.closest('div,li,article')?.innerText || ''")
                        parent_text = str(parent)
                    except Exception:
                        pass
                    combined = f"{title_text} {parent_text}"
                    if _is_sport_event(combined):
                        full = href if href.startswith("http") else f"{BASE}/{href.lstrip('/')}"
                        artist_urls.add(full)

                self.log(f"Found {len(artist_urls)} sport series pages")

                # Step 2: from each series page, collect individual idevento links
                event_urls: set[str] = set()
                for artist_url in artist_urls:
                    try:
                        page.goto(artist_url, wait_until="domcontentloaded", timeout=20000)
                        page.wait_for_timeout(800)
                        ev_links = page.query_selector_all("a[href*='idevento=']")
                        for lnk in ev_links:
                            href = lnk.get_attribute("href") or ""
                            if "masinformacion" in href or "idevento=" in href:
                                full = href if href.startswith("http") else f"{BASE}/{href.lstrip('/')}"
                                event_urls.add(full)
                    except Exception as e:
                        self.log(f"Series page error {artist_url}: {e}")

                self.log(f"Found {len(event_urls)} individual event URLs")

                # Step 3: scrape each event detail page
                for event_url in list(event_urls)[:40]:
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

        body = page.inner_text("body")

        # Title is the first line after "COMPRAR BOLETOS" header
        title = ""
        marker = "COMPRAR BOLETOS"
        idx = body.find(marker)
        if idx != -1:
            after = body[idx + len(marker):].strip()
            title = after.split("\n")[0].strip()

        if not title or not _is_sport_event(title):
            return None

        # Event section: everything after title line
        event_body = body[body.find(title):]

        # Date — "Domingo, 26 de julio de 2026 05:00 HRS"
        dt_start = _parse_date(event_body)
        if not dt_start:
            return None

        time_m = re.search(r"\b(\d{1,2}):(\d{2})\s*(?:hrs?|am|pm)?\b", event_body, re.IGNORECASE)
        if time_m:
            try:
                dt_start = dt_start.replace(hour=int(time_m.group(1)), minute=int(time_m.group(2)))
            except ValueError:
                pass

        # Venue and city — lines 3-4 after the date line
        lines = [l.strip() for l in event_body.split("\n") if l.strip()]
        venue = "Por confirmar"
        for i, line in enumerate(lines[:10]):
            if any(m in line.lower() for m in MONTHS):
                # Next non-empty lines are venue and city
                next_lines = [l for l in lines[i+1:i+4] if l and not re.match(r"^\d", l)]
                if next_lines:
                    venue = next_lines[0][:200]
                break

        city = _detect_city(event_body[:400])

        price_min, price_max, is_free = _parse_price(event_body)

        # Image
        image_url = None
        og_img = page.query_selector("meta[property='og:image']")
        if og_img:
            image_url = og_img.get_attribute("content")
        if not image_url:
            img_el = page.query_selector("img[src*='eticket']") or page.query_selector("img[src*='eventos']")
            if img_el:
                src = img_el.get_attribute("src") or ""
                image_url = src if src.startswith("http") else f"{BASE}{src}"

        return EventData(
            title=title[:200],
            description="",
            datetime_start=dt_start,
            venue_name=venue,
            city=city,
            category=["deporte"],
            price_min=price_min,
            price_max=price_max,
            is_free=is_free,
            image_url=image_url,
            source_url=url,
            source_platform="eticket",
        )
