"""
Scraper for abuenpaso.cr — "La Página de los Corredores".
Running events in Costa Rica (5K, 10K, trail, marathons).

Page structure:
- Listing: single page with all events as /Race/detail/{id}/{slug} links
- Detail: sidebar (race list) + event section starting after "Datos Fotos Resultados"
  Info line format: "Domingo 10 Mayo 2026 | 6 am | Lindora, Santa Ana | 5-10 km | ¢20.000"
"""
import re
from datetime import datetime, timedelta, timezone

CR_TZ = timezone(timedelta(hours=-6))
from playwright.sync_api import sync_playwright
from .base import BaseScraper, EventData

BASE = "https://www.abuenpaso.cr"

MONTHS = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
    "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
    "septiembre": 9, "setiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
}

CITIES = [
    "San José", "Heredia", "Alajuela", "Cartago", "Liberia",
    "Puntarenas", "Limón", "Escazú", "Desamparados",
    "Santa Ana", "Curridabat", "Pavas", "Tibás", "Aserrí",
    "La Sabana", "San Pedro", "Ciudad Colón",
    "Orotina", "Tamarindo", "Jacó", "Manzanillo", "Corcovado",
    "Belén", "Lindora", "Turrialba", "Grecia", "Palmares",
    "Flores", "La Unión", "Tres Ríos", "Oreamuno", "Dota",
    "Santa María de Dota", "Flamingo", "Nosara",
]


def _detect_city(text: str) -> str:
    for city in CITIES:
        if city.lower() in text.lower():
            return city
    if "guanacaste" in text.lower():
        return "Liberia"
    if "puntarenas" in text.lower():
        return "Puntarenas"
    if "limón" in text.lower() or "limon" in text.lower():
        return "Limón"
    return "San José"


def _parse_price(text: str) -> tuple[int, int | None, bool]:
    if re.search(r"\bgratis\b|\bgratuita\b|\blibre\b", text, re.IGNORECASE):
        return 0, None, True
    # USD: $65-$120
    usd = re.findall(r"\$\s*(\d+(?:[.,]\d+)?)", text)
    if usd:
        nums = [int(float(u.replace(",", "")) * 520) for u in usd]
        return min(nums), max(nums) if len(nums) > 1 else None, False
    # Colones: ¢20.000
    crc = re.findall(r"[¢₡]\s*(\d+(?:\.\d{3})*(?:,\d+)?)", text)
    if crc:
        nums = [int(c.replace(".", "").replace(",", "")) for c in crc]
        return min(nums), max(nums) if len(nums) > 1 else None, False
    return 0, None, False


def _parse_info_line(line: str) -> dict:
    """Parse 'Domingo 10 Mayo 2026 | 6 am | Lindora, Santa Ana | 5-10 km | ¢20.000'"""
    parts = [p.strip() for p in line.split("|")]
    result = {"dt": None, "location": "", "distances": [], "price_raw": ""}

    for part in parts:
        lower = part.lower()
        # Date part: contains a month name
        if any(m in lower for m in MONTHS):
            for name, num in MONTHS.items():
                m = re.search(rf"(\d{{1,2}})\s+{name}\s+(\d{{4}})", part, re.IGNORECASE)
                if m:
                    day, year = int(m.group(1)), int(m.group(2))
                    hour, minute = 7, 0
                    # Check for time in same or next part
                    time_m = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)", part, re.IGNORECASE)
                    if time_m:
                        hour = int(time_m.group(1))
                        minute = int(time_m.group(2) or 0)
                        if time_m.group(3).lower() == "pm" and hour != 12:
                            hour += 12
                        elif time_m.group(3).lower() == "am" and hour == 12:
                            hour = 0
                    try:
                        result["dt"] = datetime(year, num, day, hour, minute, tzinfo=CR_TZ)
                    except ValueError:
                        pass
                    break
        # Time-only part: "6 am"
        elif re.match(r"^\d{1,2}(?::\d{2})?\s*(am|pm)$", part, re.IGNORECASE):
            if result["dt"]:
                time_m = re.match(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)", part, re.IGNORECASE)
                if time_m:
                    hour = int(time_m.group(1))
                    minute = int(time_m.group(2) or 0)
                    if time_m.group(3).lower() == "pm" and hour != 12:
                        hour += 12
                    elif time_m.group(3).lower() == "am" and hour == 12:
                        hour = 0
                    result["dt"] = result["dt"].replace(hour=hour, minute=minute)
        # Price part: contains ¢ or $
        elif re.search(r"[¢₡$]", part):
            result["price_raw"] = part
        # Distance part: contains km or millas
        elif re.search(r"\b\d+\s*(?:km|k|millas)\b", part, re.IGNORECASE):
            result["distances"] = re.findall(r"\d+(?:\.\d+)?\s*(?:km|k|millas)", part, re.IGNORECASE)
        # Location part: text without numbers (mostly)
        elif len(part) > 3 and not re.match(r"^\d", part):
            result["location"] = part

    return result


class AbuenpasoScraper(BaseScraper):
    name = "abuenpaso"

    def scrape(self) -> list[EventData]:
        events = []
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.set_extra_http_headers({"Accept-Language": "es-CR,es;q=0.9"})

                self.log(f"Loading {BASE}")
                page.goto(BASE, wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(1500)

                links = page.query_selector_all("a[href*='/Race/detail/']")
                event_urls: set[str] = set()
                for lnk in links:
                    href = lnk.get_attribute("href") or ""
                    if "/Race/detail/" in href:
                        full = href if href.startswith("http") else f"{BASE}{href}"
                        event_urls.add(full.split("?")[0])

                self.log(f"Found {len(event_urls)} event URLs")

                for url in list(event_urls):
                    try:
                        event = self._scrape_event(page, url)
                        if event:
                            events.append(event)
                    except Exception as e:
                        self.log(f"Event error {url}: {e}")

                browser.close()
        except Exception as e:
            self.log(f"Scraper error: {e}")

        self.log(f"Scraped {len(events)} events")
        return events

    def _scrape_event(self, page, url: str) -> EventData | None:
        page.goto(url, wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(600)

        # Title: find h1 elements, skip "Carreras" and "Lo último"
        title = ""
        h1_els = page.query_selector_all("h1")
        skip = {"carreras", "lo último", "lo ultimo"}
        for el in h1_els:
            t = el.inner_text().strip()
            if t.lower() not in skip and len(t) > 3:
                title = t
                break
        if not title:
            return None

        # Body text — only the section after the sidebar
        full_body = page.inner_text("body")

        # Landmark: "Datos Fotos Resultados" separates sidebar from event content
        landmark = "Datos Fotos Resultados"
        idx = full_body.find(landmark)
        event_section = full_body[idx:] if idx != -1 else full_body[1500:]

        # Info line: first non-empty line after landmark (contains date)
        info_line = ""
        for line in event_section.split("\n"):
            line = line.strip()
            if any(m in line.lower() for m in MONTHS) and "|" in line:
                info_line = line
                break

        if not info_line:
            return None

        info = _parse_info_line(info_line)
        if not info["dt"]:
            return None

        location = info.get("location", "")
        city = _detect_city(location or event_section[:300])
        venue = location[:200] if location else city

        price_min, price_max, is_free = _parse_price(info.get("price_raw", "") or event_section[:500])

        # Description: after "Descripción:"
        desc = ""
        desc_m = re.search(r"Descripci[oó]n:\s*(.+?)(?:\n\n|\nInscripci[oó]n|\nContacto|\Z)",
                            event_section, re.DOTALL | re.IGNORECASE)
        if desc_m:
            desc = desc_m.group(1).strip()[:1000]

        # Image: /files/race/images/principal/{id}_{name}.jpg
        image_url = None
        race_id_m = re.search(r"/Race/detail/(\d+)/", url)
        if race_id_m:
            race_id = race_id_m.group(1)
            img_el = page.query_selector(f"img[src*='/{race_id}_']") or \
                     page.query_selector(f"img[src*='/principal/{race_id}']")
            if not img_el:
                img_el = page.query_selector("img[src*='/files/race/images/']")
            if img_el:
                src = img_el.get_attribute("src") or ""
                image_url = src if src.startswith("http") else f"{BASE}{src}"

        tags = [d.lower().replace(" ", "") for d in info.get("distances", [])[:5]]

        return EventData(
            title=title[:200],
            description=desc,
            datetime_start=info["dt"],
            venue_name=venue,
            city=city,
            category=["deporte"],
            tags=tags,
            price_min=price_min,
            price_max=price_max,
            is_free=is_free,
            image_url=image_url,
            source_url=url,
            source_platform="abuenpaso",
        )
