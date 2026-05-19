"""
Main scheduler — runs all scrapers every 8 hours and inserts results into Supabase.
Run with: python scheduler.py
Or run once immediately: python scheduler.py --once
"""
import sys
from dotenv import load_dotenv

load_dotenv()

from scrapers import ALL_SCRAPERS
from db import upsert_events, delete_past_events


def run_all():
    print(f"\n{'='*50}")

    # 1. Clean up events that have already passed
    deleted = delete_past_events()
    if deleted:
        print(f"[cleanup] Removed {deleted} past events")

    # 2. Scrape all sources
    print("Running all scrapers...")
    all_events = []
    for ScraperClass in ALL_SCRAPERS:
        scraper = ScraperClass()
        try:
            events = scraper.scrape()
            all_events.extend(events)
            print(f"[{scraper.name}] {len(events)} events found")
        except Exception as e:
            print(f"[{scraper.name}] FAILED: {e}")

    # 3. Insert new events
    inserted, skipped = upsert_events(all_events)
    print(f"\nDone: {inserted} inserted, {skipped} skipped (already exist)")
    print(f"Total scraped: {len(all_events)}")
    print('='*50)


if __name__ == "__main__":
    if "--once" in sys.argv:
        run_all()
    else:
        from apscheduler.schedulers.blocking import BlockingScheduler
        from apscheduler.triggers.interval import IntervalTrigger

        scheduler = BlockingScheduler()
        scheduler.add_job(run_all, IntervalTrigger(hours=8), id="scrape_all")

        print("Scheduler started. Scraping every 8 hours.")
        print("First run in 10 seconds...")

        import time
        time.sleep(10)
        run_all()

        scheduler.start()
