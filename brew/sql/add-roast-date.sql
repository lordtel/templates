-- Add roast_date to bags so we can show a freshness pill on bag cards.
-- Run once in the Supabase SQL editor.

ALTER TABLE bags
  ADD COLUMN IF NOT EXISTS roast_date DATE;
