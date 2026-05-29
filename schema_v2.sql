-- Migration: Add invitations table and link rsvps to invitations
-- Run with: wrangler d1 execute lirim-elira-db --remote --file=./schema_v2.sql

-- New table: each unique invitation URL
CREATE TABLE IF NOT EXISTS invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guest_name TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  views INTEGER NOT NULL DEFAULT 0,
  first_viewed_at TEXT,
  last_viewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Add invitation_id column to existing rsvps table
-- (Note: SQLite needs explicit ADD COLUMN for each column)
ALTER TABLE rsvps ADD COLUMN invitation_id INTEGER REFERENCES invitations(id);

-- Index for fast lookup by invitation
CREATE INDEX IF NOT EXISTS idx_rsvps_invitation ON rsvps(invitation_id);
