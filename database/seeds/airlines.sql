-- FairFare Airline Seeds
-- Domestic Indian carriers and key international airlines

INSERT INTO airlines (code, name, country, is_active) VALUES
-- Indian Airlines
('AI', 'Air India', 'India', true),
('6E', 'IndiGo', 'India', true),
('SG', 'SpiceJet', 'India', true),
('UK', 'Vistara', 'India', true),
('QP', 'Akasa Air', 'India', true),
('IX', 'Air India Express', 'India', true),
('G8', 'Go First', 'India', true),
('I5', 'AirAsia India', 'India', true),
('S5', 'Star Air', 'India', true),
('2T', 'TruJet', 'India', true),

-- International Airlines
('EK', 'Emirates', 'UAE', true),
('SQ', 'Singapore Airlines', 'Singapore', true),
('TG', 'Thai Airways', 'Thailand', true),
('BA', 'British Airways', 'UK', true),
('LH', 'Lufthansa', 'Germany', true),
('QR', 'Qatar Airways', 'Qatar', true),
('EY', 'Etihad Airways', 'UAE', true),
('CX', 'Cathay Pacific', 'Hong Kong', true),
('NH', 'ANA', 'Japan', true),
('KE', 'Korean Air', 'South Korea', true),
('MH', 'Malaysia Airlines', 'Malaysia', true),
('UL', 'SriLankan Airlines', 'Sri Lanka', true),
('BG', 'Biman Bangladesh', 'Bangladesh', true),
('RA', 'Nepal Airlines', 'Nepal', true),

-- Inactive Carriers
('9W', 'Jet Airways', 'India', false)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    country = EXCLUDED.country,
    is_active = EXCLUDED.is_active;
