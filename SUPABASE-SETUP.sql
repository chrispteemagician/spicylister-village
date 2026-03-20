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
