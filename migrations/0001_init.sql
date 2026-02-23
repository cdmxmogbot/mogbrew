CREATE TABLE IF NOT EXISTS beer_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  beer_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  abv REAL DEFAULT 5.0,
  container_type TEXT NOT NULL,
  volume_ml REAL NOT NULL,
  logged_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT
);
