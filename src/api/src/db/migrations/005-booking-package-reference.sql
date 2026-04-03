ALTER TABLE bookings ADD COLUMN client_package_id TEXT REFERENCES client_packages(id);

CREATE INDEX IF NOT EXISTS idx_bookings_client_package ON bookings(client_package_id);
