"""
Scrapes Eventbrite CR events by collecting event URLs from listing pages,
then extracting JSON-LD structured data from each event page.
"""
import re
import json
from datetime import datetime, timedelta, timezone

CR_TZ = timezone(timedelta(hours=-6))
from playwright.sync_api import sync_playwright
from .base import BaseScraper, EventData

LISTING_URL = "https://www.eventbrite.com/d/costa-rica/all-events/"

KEYWORD_CATEGORY = {
    "música": "musica", "music": "musica", "concierto": "musica", "banda": "musica",
    "arte": "arte", "galería": "arte", "exposición": "arte", "exhibition": "arte",
    "comida": "comida", "food": "comida", "gastro": "comida",
    "mercado": "mercado", "feria": "mercado", "fair": "mercado",
    "familia": "familia", "niños": "familia", "kids": "familia", "family": "familia",
    "stand-up": "humor", "comedia": "humor", "comedy": "humor",
    "taller": "talleres", "workshop": "talleres", "curso": "talleres",
    "cine": "cine", "film": "cine",
    "teatro": "teatro", "theater": "teatro", "theatre": "teatro",
    "deporte": "deporte", "run": "deporte", "carrera": "deporte",
    "fiesta": "fiesta", "party": "fiesta",
}

CITIES = ["San José", "Heredia", "Alajuela", "Cartago", "Liberia", "Pérez Zeledón", "Limón"]


def _detect_category(text: str) -> list[str]:
    lower = text.lower()
    for kw, cat in KEYWORD_CATEGORY.items():
        if kw in lower:
            return [cat]
    return ["otro"]


def _detect_city(text: str) -> str:
    for city in CITIES:
        if city.lower() in text.lower():
            return city
    return "San José"


class EventbriteScraper(BaseScraper):
    name = "eventbrite"

    def scrape(self) -> list[EventData]:
        events = []
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.set_extra_http_headers({"Accept-Language": "es-CR,es;q=0.9"})

                # Step 1: collect unique event URLs from listing pages
                event_urls: set[str] = set()
                for page_num in range(1, 4):
                    url = f"{LISTING_URL}?page={page_num}"
                    self.log(f"Collecting URLs from page {page_num}")
                    try:
                        page.goto(url, wait_until="networkidle", timeout=35000)
                        page.wait_for_timeout(2000)
                        links = page.query_selector_all("a[href*='/e/']")
                        for lnk in links:
                            href = lnk.get_attribute("href") or ""
                            if "/e/" in href and "eventbrite.com" in href:
                                event_urls.add(href.split("?")[0])
                            elif href.startswith("/e/"):
                                event_urls.add("https://www.eventbrite.com" + href.split("?")[0])
                    except Exception as e:
                        self.log(f"Listing page {page_num} error: {e}")

                self.log(f"Found {len(event_urls)} unique event URLs")

                # Step 2: scrape each event page via JSON-LD
                for event_url in list(event_urls)[:30]:
                    try:
                        event = self._scrape_event_page(page, event_url)
                        if event:
                            events.append(event)
                    except Exception as e:
                        self.log(f"Event page error {event_url}: {e}")

                browser.close()
        except Exception as e:
            self.log(f"Scraper error: {e}")

        self.log(f"Scraped {len(events)} events")
        return events

    def _scrape_event_page(self, page, url: str) -> EventData | None:
        page.goto(url, wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(1000)

        # Try JSON-LD first (most reliable)
        ld_scripts = page.query_selector_all("script[type='application/ld+json']")
        for script in ld_scripts:
            try:
                data = json.loads(script.inner_text())
                if isinstance(data, list):
                    data = data[0]
                if data.get("@type") == "Event":
                    return self._parse_jsonld(data, url)
            except Exception:
                continue

        # Fallback: parse HTML directly
        return self._parse_html(page, url)

    def _parse_jsonld(self, data: dict, url: str) -> EventData | None:
        title = data.get("name", "")
        if not title:
            return None

        start_str = data.get("startDate", "")
        end_str = data.get("endDate", "")
        if not start_str:
            return None

        try:
            dt_start = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
            if dt_start.tzinfo is None:
                dt_start = dt_start.replace(tzinfo=timezone.utc)
            dt_end = None
            if end_str:
                dt_end = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
                if dt_end.tzinfo is None:
                    dt_end = dt_end.replace(tzinfo=timezone.utc)
        except ValueError:
            return None

        location = data.get("location") or {}
        if isinstance(location, list):
            location = location[0] if location else {}
        venue_name = location.get("name", "Por confirmar")
        address_obj = location.get("address") or {}
        if isinstance(address_obj, str):
            address = address_obj
            city = _detect_city(address_obj)
        else:
            address = address_obj.get("streetAddress", "")
            city = address_obj.get("addressLocality") or _detect_city(address)

        offers = data.get("offers") or {}
        if isinstance(offers, list):
            offers = offers[0] if offers else {}
        is_free = offers.get("price") in (0, "0", "0.00", None) or \
                  offers.get("availability", "").lower() == "free"
        price_min = 0
        if not is_free and offers.get("price"):
            try:
                price_usd = float(offers["price"])
                price_min = int(price_usd * 615)
            except (ValueError, TypeError):
                pass

        image = data.get("image")
        if isinstance(image, list):
            image = image[0] if image else None
        if isinstance(image, dict):
            image = image.get("url")

        full_text = f"{title} {venue_name}"
        return EventData(
            title=title[:200],
            description=(data.get("description") or "")[:1000],
            datetime_start=dt_start,
            datetime_end=dt_end,
            venue_name=venue_name[:200],
            address=address[:300],
            city=city or "San José",
            category=_detect_category(full_text),
            price_min=price_min,
            is_free=is_free,
            image_url=image,
            source_url=url,
            source_platform="eventbrite",
        )

    def _parse_html(self, page, url: str) -> EventData | None:
        title_el = page.query_selector("h1")
        if not title_el:
            return None
        title = title_el.inner_text().strip()
        if not title:
            return None

        # Look for date in structured elements
        date_el = page.query_selector("time") or page.query_selector("[class*='date']")
        date_text = date_el.inner_text().strip() if date_el else ""

        venue_el = page.query_selector("[class*='venue']") or page.query_selector("[class*='location']")
        venue = venue_el.inner_text().strip()[:200] if venue_el else "Por confirmar"

        img_el = page.query_selector("img[class*='event']") or page.query_selector(".event-hero img")
        image_url = img_el.get_attribute("src") if img_el else None

        # Best-effort date parse
        now = datetime.now()
        dt_start = None
        months = {"jan":1,"feb":2,"mar":3,"apr":4,"may":5,"jun":6,
                  "jul":7,"aug":8,"sep":9,"oct":10,"nov":11,"dec":12,
                  "ene":1,"abr":4,"ago":8,"dic":12}
        lower = date_text.lower()
        for abbr, m in months.items():
            if abbr in lower:
                day_m = re.search(r"\b(\d{1,2})\b", date_text)
                day = int(day_m.group(1)) if day_m else 1
                try:
                    dt_start = datetime(now.year if m >= now.month else now.year+1, m, day, 20, 0, tzinfo=CR_TZ)
                except ValueError:
                    pass
                break

        if not dt_start:
            return None

        return EventData(
            title=title[:200],
            description="",
            datetime_start=dt_start,
            venue_name=venue,
            address="",
            city=_detect_city(f"{title} {venue}"),
            category=_detect_category(title),
            price_min=0,
            is_free=False,
            image_url=image_url,
            source_url=url,
            source_platform="eventbrite",
        )
