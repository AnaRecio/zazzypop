"""
Inserts scraped events into Supabase.
- Deduplicates by source_url (primary) or title+date (fallback for organizer events).
- Provides cleanup of past events.
"""
import os
from datetime import datetime, timezone
from supabase import create_client, Client
from scrapers.base import EventData


def get_client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def delete_past_events() -> int:
    """Delete non-featured events whose start date is before today. Returns count."""
    client = get_client()
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    result = (
        client.table("events")
        .delete()
        .lt("datetime_start", today.isoformat())
        .eq("is_featured", False)
        .execute()
    )
    return len(result.data) if result.data else 0


def upsert_events(events: list[EventData]) -> tuple[int, int]:
    """Insert new events, skip duplicates. Returns (inserted, skipped)."""
    client = get_client()
    inserted = 0
    skipped = 0

    now = datetime.now(timezone.utc)

    for event in events:
        # Skip events that have already passed
        if event.datetime_start < now:
            skipped += 1
            continue

        # Primary dedup: source_url is unique per event page
        if event.source_url:
            existing = (
                client.table("events")
                .select("id")
                .eq("source_url", event.source_url)
                .execute()
            )
            if existing.data:
                skipped += 1
                continue
        else:
            # Fallback for organizer-submitted events: title + same day
            date_str = event.datetime_start.strftime("%Y-%m-%d")
            existing = (
                client.table("events")
                .select("id")
                .eq("title", event.title[:200])
                .gte("datetime_start", f"{date_str}T00:00:00")
                .lte("datetime_start", f"{date_str}T23:59:59")
                .execute()
            )
            if existing.data:
                skipped += 1
                continue

        payload = {
            "title": event.title[:200],
            "description": event.description[:2000],
            "datetime_start": event.datetime_start.isoformat(),
            "venue_name": event.venue_name[:200],
            "address": event.address[:300],
            "city": event.city,
            "category": event.category,
            "tags": event.tags,
            "price_min": event.price_min,
            "is_free": event.is_free,
            "image_url": event.image_url,
            "source_url": event.source_url,
            "source_platform": event.source_platform,
            "is_approved": False,
            "is_featured": False,
        }
        if event.datetime_end:
            payload["datetime_end"] = event.datetime_end.isoformat()
        if event.lat is not None:
            payload["lat"] = event.lat
        if event.lng is not None:
            payload["lng"] = event.lng
        if event.price_max is not None:
            payload["price_max"] = event.price_max
        if event.zone:
            payload["zone"] = event.zone

        try:
            client.table("events").insert(payload).execute()
            inserted += 1
        except Exception as e:
            print(f"[db] Insert error for '{event.title}': {e}")

    return inserted, skipped
