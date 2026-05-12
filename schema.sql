-- D1 Database Schema for RSVPs

CREATE TABLE IF NOT EXISTS rsvps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  answer TEXT NOT NULL CHECK(answer IN ('yes', 'maybe', 'no')),
  ip TEXT,
  user_agent TEXT,
  country TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for cron job that fetches recent submissions
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at);

-- Index for rate-limiting lookups by IP
CREATE INDEX IF NOT EXISTS idx_rsvps_ip ON rsvps(ip);
