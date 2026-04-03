ALTER TABLE client_packages ADD COLUMN grace_until TEXT;
ALTER TABLE client_packages ADD COLUMN grace_reason TEXT;
ALTER TABLE client_packages ADD COLUMN grace_set_by TEXT REFERENCES users(id);
ALTER TABLE client_packages ADD COLUMN grace_set_at TEXT;
