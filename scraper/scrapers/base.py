from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime


@dataclass
class EventData:
    title: str
    description: str
    datetime_start: datetime
    venue_name: str
    city: str
    category: list[str]
    source_url: str
    source_platform: str
    address: str = ""
    datetime_end: Optional[datetime] = None
    price_min: int = 0
    price_max: Optional[int] = None
    is_free: bool = False
    image_url: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    tags: list[str] = field(default_factory=list)
    zone: Optional[str] = None


class BaseScraper:
    name: str = "base"

    def scrape(self) -> list[EventData]:
        raise NotImplementedError

    def log(self, msg: str):
        print(f"[{self.name}] {msg}")
