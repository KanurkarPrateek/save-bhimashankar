CREATE TABLE IF NOT EXISTS counter (id TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0);
INSERT OR IGNORE INTO counter (id, n) VALUES ('visits', 0);
INSERT OR IGNORE INTO counter (id, n) VALUES ('signs', 0);
-- hashed IPs for the 5-per-hour limit (rows older than an hour are deleted)
CREATE TABLE IF NOT EXISTS hits (ip TEXT NOT NULL, ts INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS hits_ip ON hits (ip);
-- hashed emails so each email signs once (the email itself is never stored here)
CREATE TABLE IF NOT EXISTS signers (email TEXT PRIMARY KEY);
