-- One row per published JSON file. WITHOUT ROWID avoids a separate primary-key
-- index, which D1 would count as an extra row written on every upsert.
CREATE TABLE IF NOT EXISTS files (
  name TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  updated_at INTEGER NOT NULL
) WITHOUT ROWID;

-- At most one reservation per GPU. An expired row stays until the GPU is
-- reserved again, which overwrites it, so a reservation costs one row written.
CREATE TABLE IF NOT EXISTS reservations (
  host TEXT NOT NULL,
  gpu INTEGER NOT NULL,
  user TEXT NOT NULL,
  starts_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  PRIMARY KEY (host, gpu)
) WITHOUT ROWID;
