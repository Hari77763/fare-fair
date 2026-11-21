-- FairFare Database Schema Migration 001_initial.sql
-- PostgreSQL syntax with uuid-ossp extension and complete normalized schema

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom Enumeration Types
CREATE TYPE cabin_class_enum AS ENUM (
    'economy',
    'premium_economy',
    'business',
    'first'
);

CREATE TYPE trip_type_enum AS ENUM (
    'one_way',
    'round_trip',
    'multi_city'
);

CREATE TYPE search_status_enum AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'failed'
);

CREATE TYPE supplier_type_enum AS ENUM (
    'ota',
    'aggregator',
    'airline_direct',
    'gds'
);

CREATE TYPE verification_status_enum AS ENUM (
    'unverified',
    'verified',
    'stale',
    'unavailable'
);

-- 3. Core Tables

-- Table: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_superuser BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    supplier_type supplier_type_enum NOT NULL DEFAULT 'ota',
    api_base_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_trusted BOOLEAN NOT NULL DEFAULT true,
    trust_score DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    priority INTEGER NOT NULL DEFAULT 10,
    rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
    timeout_seconds INTEGER NOT NULL DEFAULT 15,
    terms_url VARCHAR(255),
    data_usage_policy TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: airports
CREATE TABLE airports (
    code CHAR(3) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
    lat NUMERIC(10, 6) NOT NULL,
    lng NUMERIC(10, 6) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: airlines
CREATE TABLE airlines (
    code CHAR(2) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: search_requests
CREATE TABLE search_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    origin_code CHAR(3) NOT NULL REFERENCES airports(code) ON DELETE RESTRICT,
    destination_code CHAR(3) NOT NULL REFERENCES airports(code) ON DELETE RESTRICT,
    departure_date DATE NOT NULL,
    return_date DATE,
    passengers_adults INTEGER NOT NULL DEFAULT 1,
    passengers_children INTEGER NOT NULL DEFAULT 0,
    passengers_infants INTEGER NOT NULL DEFAULT 0,
    cabin_class cabin_class_enum NOT NULL DEFAULT 'economy',
    trip_type trip_type_enum NOT NULL DEFAULT 'one_way',
    status search_status_enum NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Table: journeys
CREATE TABLE journeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    search_request_id UUID NOT NULL REFERENCES search_requests(id) ON DELETE CASCADE,
    airline_code VARCHAR(10) NOT NULL,
    airline_name VARCHAR(100) NOT NULL,
    departure_airport CHAR(3) NOT NULL REFERENCES airports(code) ON DELETE RESTRICT,
    arrival_airport CHAR(3) NOT NULL REFERENCES airports(code) ON DELETE RESTRICT,
    departure_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    stops INTEGER NOT NULL DEFAULT 0,
    journey_fingerprint VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: flight_segments
CREATE TABLE flight_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
    segment_order INTEGER NOT NULL DEFAULT 0,
    flight_number VARCHAR(20) NOT NULL,
    airline_code VARCHAR(10) NOT NULL,
    aircraft_type VARCHAR(100),
    departure_airport CHAR(3) NOT NULL REFERENCES airports(code) ON DELETE RESTRICT,
    arrival_airport CHAR(3) NOT NULL REFERENCES airports(code) ON DELETE RESTRICT,
    departure_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    cabin_class cabin_class_enum NOT NULL DEFAULT 'economy',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: fare_products
CREATE TABLE fare_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    base_fare_paise BIGINT NOT NULL,
    taxes_paise BIGINT NOT NULL DEFAULT 0,
    fees_paise BIGINT NOT NULL DEFAULT 0,
    total_price_paise BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    cabin_class cabin_class_enum NOT NULL DEFAULT 'economy',
    fare_class VARCHAR(50),
    baggage_allowance VARCHAR(100),
    is_refundable BOOLEAN NOT NULL DEFAULT false,
    cancellation_fee_paise BIGINT,
    change_fee_paise BIGINT,
    meal_included BOOLEAN NOT NULL DEFAULT false,
    seat_selection_included BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ,
    verification_status verification_status_enum NOT NULL DEFAULT 'unverified',
    booking_url TEXT
);

-- Table: supplier_offers
CREATE TABLE supplier_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fare_product_id UUID NOT NULL REFERENCES fare_products(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_price_paise BIGINT NOT NULL,
    supplier_currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    raw_response JSONB,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latency_ms INTEGER
);

-- Table: price_history
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fare_product_id UUID NOT NULL REFERENCES fare_products(id) ON DELETE CASCADE,
    price_paise BIGINT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(100) NOT NULL DEFAULT 'metasearch_scan'
);

-- Table: supplier_api_logs
CREATE TABLE supplier_api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    search_request_id UUID REFERENCES search_requests(id) ON DELETE SET NULL,
    request_url TEXT NOT NULL,
    request_method VARCHAR(10) NOT NULL DEFAULT 'GET',
    response_status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: price_alerts
CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_code CHAR(3) NOT NULL REFERENCES airports(code) ON DELETE RESTRICT,
    destination_code CHAR(3) NOT NULL REFERENCES airports(code) ON DELETE RESTRICT,
    departure_date DATE NOT NULL,
    return_date DATE,
    target_price_paise BIGINT NOT NULL,
    current_lowest_paise BIGINT,
    cabin_class cabin_class_enum NOT NULL DEFAULT 'economy',
    is_active BOOLEAN NOT NULL DEFAULT true,
    trigger_count INTEGER NOT NULL DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Money Column Comments (Paise = 1/100 INR)
COMMENT ON COLUMN fare_products.base_fare_paise IS 'Amount in paise (1/100 INR)';
COMMENT ON COLUMN fare_products.taxes_paise IS 'Amount in paise (1/100 INR)';
COMMENT ON COLUMN fare_products.fees_paise IS 'Amount in paise (1/100 INR)';
COMMENT ON COLUMN fare_products.total_price_paise IS 'Amount in paise (1/100 INR)';
COMMENT ON COLUMN fare_products.cancellation_fee_paise IS 'Amount in paise (1/100 INR)';
COMMENT ON COLUMN fare_products.change_fee_paise IS 'Amount in paise (1/100 INR)';
COMMENT ON COLUMN supplier_offers.supplier_price_paise IS 'Amount in paise (1/100 INR)';
COMMENT ON COLUMN price_history.price_paise IS 'Amount in paise (1/100 INR)';
COMMENT ON COLUMN price_alerts.target_price_paise IS 'Amount in paise (1/100 INR)';
COMMENT ON COLUMN price_alerts.current_lowest_paise IS 'Amount in paise (1/100 INR)';

-- 5. Indexes
-- Foreign Key Indexes
CREATE INDEX idx_search_requests_user_id ON search_requests(user_id);
CREATE INDEX idx_journeys_search_request_id ON journeys(search_request_id);
CREATE INDEX idx_flight_segments_journey_id ON flight_segments(journey_id);
CREATE INDEX idx_fare_products_journey_id ON fare_products(journey_id);
CREATE INDEX idx_fare_products_supplier_id ON fare_products(supplier_id);
CREATE INDEX idx_supplier_offers_fare_product_id ON supplier_offers(fare_product_id);
CREATE INDEX idx_supplier_offers_supplier_id ON supplier_offers(supplier_id);
CREATE INDEX idx_price_history_fare_product_id ON price_history(fare_product_id);
CREATE INDEX idx_supplier_api_logs_supplier_id ON supplier_api_logs(supplier_id);
CREATE INDEX idx_supplier_api_logs_search_request_id ON supplier_api_logs(search_request_id);
CREATE INDEX idx_price_alerts_user_id ON price_alerts(user_id);

-- Business Logic & Filtering Indexes
CREATE INDEX idx_search_requests_route_dept ON search_requests(origin_code, destination_code, departure_date);
CREATE INDEX idx_search_requests_status ON search_requests(status);
CREATE INDEX idx_journeys_fingerprint ON journeys(journey_fingerprint);
CREATE INDEX idx_journeys_departure_time ON journeys(departure_time);
CREATE INDEX idx_fare_products_total_price ON fare_products(total_price_paise);
CREATE INDEX idx_fare_products_status ON fare_products(verification_status);
CREATE INDEX idx_price_alerts_user_active ON price_alerts(user_id, is_active);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at);
CREATE INDEX idx_airports_city ON airports(city);
CREATE INDEX idx_airports_country ON airports(country);
CREATE INDEX idx_suppliers_code ON suppliers(code);
CREATE INDEX idx_airlines_is_active ON airlines(is_active);

-- 6. Trigger Function and Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_price_alerts_updated_at
    BEFORE UPDATE ON price_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Table Comments
COMMENT ON TABLE users IS 'User authentication accounts, credentials, and profile settings';
COMMENT ON TABLE suppliers IS 'Integrated flight inventory providers including OTAs, aggregators, airlines, and GDS';
COMMENT ON TABLE airports IS 'Worldwide airport directory with IATA codes, cities, countries, and geographical coordinates';
COMMENT ON TABLE airlines IS 'Commercial airline carrier registry with IATA codes and operational status';
COMMENT ON TABLE search_requests IS 'Flight metasearch queries requested by users or guest travelers';
COMMENT ON TABLE journeys IS 'Unique flight itinerary combinations matching search requests';
COMMENT ON TABLE flight_segments IS 'Individual flight legs and connecting flights within a journey';
COMMENT ON TABLE fare_products IS 'Normalized fare offerings and passenger baggage/meal amenities per journey';
COMMENT ON TABLE supplier_offers IS 'Raw supplier price quotes and latency tracking data';
COMMENT ON TABLE price_history IS 'Historical price point snapshots for flight fare trend tracking';
COMMENT ON TABLE supplier_api_logs IS 'Supplier API integration audit log capturing request latencies and response codes';
COMMENT ON TABLE price_alerts IS 'User price drop notifications and automated target price monitoring';
