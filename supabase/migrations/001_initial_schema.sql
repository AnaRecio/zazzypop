-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Events
create table events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null default '',
  datetime_start timestamptz not null,
  datetime_end timestamptz,
  venue_name text not null,
  address text not null default '',
  city text not null,
  zone text,
  lat decimal(10, 7),
  lng decimal(10, 7),
  category text[] not null default '{}',
  tags text[] not null default '{}',
  price_min integer not null default 0,
  price_max integer,
  is_free boolean not null default false,
  image_url text,
  source_url text,
  source_platform text not null default 'manual',
  is_featured boolean not null default false,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Organizers
create table organizers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_email text,
  instagram text,
  website text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Saved events (requires auth)
create table saved_events (
  user_id uuid references auth.users on delete cascade,
  event_id uuid references events on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

-- Event reminders
create table event_reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  event_id uuid references events on delete cascade,
  remind_at timestamptz not null,
  sent boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

-- Indexes for common queries
create index events_datetime_start_idx on events (datetime_start);
create index events_city_idx on events (city);
create index events_is_approved_idx on events (is_approved);
create index events_is_free_idx on events (is_free);
create index events_price_min_idx on events (price_min);
create index events_category_idx on events using gin (category);
create index events_search_idx on events using gin (to_tsvector('spanish', title || ' ' || description));

-- Row level security
alter table events enable row level security;
alter table saved_events enable row level security;
alter table event_reminders enable row level security;

-- Public can read approved events
create policy "public read approved events"
  on events for select
  using (is_approved = true);

-- Authenticated users can insert events (for organizer form)
create policy "authenticated insert events"
  on events for insert
  with check (true);

-- Users can manage their saved events
create policy "users manage saved events"
  on saved_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can manage their reminders
create policy "users manage reminders"
  on event_reminders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
