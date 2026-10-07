-- One row per published JSON file. WITHOUT ROWID avoids a separate primary-key
-- index, which D1 would count as an extra row written on every upsert.
CREATE TABLE IF NOT EXISTS files (
  name TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  updated_at INTEGER NOT NULL
) WITHOUT ROWID;
