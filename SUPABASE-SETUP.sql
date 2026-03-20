-- ============================================================
-- WOMBLE VILLAGE — Supabase Setup
-- Project: pdnjeynugptnavkdbmxh (same family as cannabin-oid)
-- Run this once in Supabase SQL editor
-- ============================================================

-- 1. womble_stalls table
CREATE TABLE IF NOT EXISTS womble_stalls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  ebay_username text NOT NULL,
  tribe text NOT NULL CHECK (tribe IN ('bootsaler', 'thrifter', 'flipper', 'neurospicy')),
  bio text,
  location text,
  website text,
  bluesky text,
  mastodon text,
  email text,
  approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. RLS
ALTER TABLE womble_stalls ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved stalls (public village)
CREATE POLICY "Public can read approved stalls"
  ON womble_stalls FOR SELECT
  USING (approved = true);

-- Anyone can insert (open signup — Chris can flip approved=false if needed)
CREATE POLICY "Anyone can sign up"
  ON womble_stalls FOR INSERT
  WITH CHECK (true);

-- 3. Index for fast slug lookup
CREATE INDEX IF NOT EXISTS womble_stalls_slug_idx ON womble_stalls (slug);
CREATE INDEX IF NOT EXISTS womble_stalls_tribe_idx ON womble_stalls (tribe);

-- ============================================================
-- 4. womble_events table — What's On community board
-- ============================================================

CREATE TABLE IF NOT EXISTS womble_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name text NOT NULL,
  stall_slug text REFERENCES womble_stalls(slug) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('boot_sale','car_boot','market','table_top','flea_market','antique_fair','other')),
  location_name text NOT NULL,
  postcode text,
  event_date date NOT NULL,
  notes text,
  approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE womble_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read approved future events"
  ON womble_events FOR SELECT
  USING (approved = true AND event_date >= (current_date - interval '1 day'));

CREATE POLICY "Anyone can submit an event"
  ON womble_events FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS womble_events_date_idx ON womble_events (event_date);
CREATE INDEX IF NOT EXISTS womble_events_type_idx ON womble_events (event_type);
