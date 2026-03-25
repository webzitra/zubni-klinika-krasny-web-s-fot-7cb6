-- Auto-generated SQL migrations for installed plugins
-- Run this against your Supabase database to set up plugin tables.

-- Plugin: Recenze
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  featured BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_project ON reviews(project_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(project_id, rating);