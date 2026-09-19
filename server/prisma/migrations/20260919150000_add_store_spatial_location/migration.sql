-- Ensure PostGIS extension is active
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add spatial location column generated from longitude and latitude
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography) STORED;

-- Create GiST spatial index on store location
CREATE INDEX IF NOT EXISTS "stores_location_gist_idx" ON "stores" USING GIST ("location");

-- Safe timestamptz conversion function with resilient fallback to Asia/Karachi
CREATE OR REPLACE FUNCTION safe_timestamptz_at_tz(t timestamptz, tz text, fallback text DEFAULT 'Asia/Karachi')
RETURNS timestamp AS $$
BEGIN
    RETURN t AT TIME ZONE tz;
EXCEPTION WHEN OTHERS THEN
    RETURN t AT TIME ZONE fallback;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

