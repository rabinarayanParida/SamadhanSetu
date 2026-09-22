-- ============================================
-- Location Master Data Schema & Seeds
-- ============================================

-- 1. States Table
CREATE TABLE IF NOT EXISTS states (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL,
    code        VARCHAR(10),
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Districts Table
CREATE TABLE IF NOT EXISTS districts (
    id          SERIAL PRIMARY KEY,
    state_id    INTEGER NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(state_id, name)
);

CREATE INDEX IF NOT EXISTS idx_districts_state ON districts(state_id);

-- 3. Blocks / Subdivisions Table
CREATE TABLE IF NOT EXISTS blocks (
    id           SERIAL PRIMARY KEY,
    district_id  INTEGER NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    name         VARCHAR(100) NOT NULL,
    is_active    BOOLEAN DEFAULT true,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(district_id, name)
);

CREATE INDEX IF NOT EXISTS idx_blocks_district ON blocks(district_id);

-- 4. Localities / Villages / Cities Table
CREATE TABLE IF NOT EXISTS localities (
    id          SERIAL PRIMARY KEY,
    block_id    INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    pincode     VARCHAR(10),
    latitude    DECIMAL(10, 8),
    longitude   DECIMAL(11, 8),
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(block_id, name)
);

CREATE INDEX IF NOT EXISTS idx_localities_block ON localities(block_id);

-- Ensure state column exists in challenge_locations
ALTER TABLE challenge_locations ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'Jharkhand';

-- ============================================
-- MASTER SEED DATA
-- ============================================

-- Insert States
INSERT INTO states (name, code) VALUES
('Jharkhand', 'JH'),
('Bihar', 'BR'),
('West Bengal', 'WB'),
('Odisha', 'OD')
ON CONFLICT (name) DO NOTHING;

-- Insert 24 Districts of Jharkhand
DO $$
DECLARE
    jh_id INTEGER;
BEGIN
    SELECT id INTO jh_id FROM states WHERE name = 'Jharkhand';

    INSERT INTO districts (state_id, name) VALUES
    (jh_id, 'Ranchi'),
    (jh_id, 'East Singhbhum'),
    (jh_id, 'Dhanbad'),
    (jh_id, 'Bokaro'),
    (jh_id, 'Hazaribagh'),
    (jh_id, 'Deoghar'),
    (jh_id, 'Giridih'),
    (jh_id, 'Ramgarh'),
    (jh_id, 'Palamu'),
    (jh_id, 'West Singhbhum'),
    (jh_id, 'Saraikela Kharsawan'),
    (jh_id, 'Dumka'),
    (jh_id, 'Godda'),
    (jh_id, 'Sahebganj'),
    (jh_id, 'Pakur'),
    (jh_id, 'Jamtara'),
    (jh_id, 'Chatra'),
    (jh_id, 'Koderma'),
    (jh_id, 'Latehar'),
    (jh_id, 'Garhwa'),
    (jh_id, 'Lohardaga'),
    (jh_id, 'Gumla'),
    (jh_id, 'Simdega'),
    (jh_id, 'Khunti')
    ON CONFLICT (state_id, name) DO NOTHING;
END $$;

-- Insert Blocks & Localities for Jharkhand Districts
DO $$
DECLARE
    d_ranchi INT;
    d_esinghbhum INT;
    d_dhanbad INT;
    d_bokaro INT;
    d_hazaribagh INT;
    d_deoghar INT;
    d_palamu INT;
    d_ramgarh INT;
    d_giridih INT;
    d_simdega INT;
    d_khunti INT;
    d_gumla INT;
    d_dumka INT;
    d_wsinghbhum INT;
    d_latehar INT;
    d_garhwa INT;
    d_lohardaga INT;
    d_koderma INT;
    d_chatra INT;
    d_saraikela INT;
    d_jamtara INT;
    d_godda INT;
    d_sahebganj INT;
    d_pakur INT;

    b_id INT;
BEGIN
    SELECT id INTO d_ranchi FROM districts WHERE name = 'Ranchi';
    SELECT id INTO d_esinghbhum FROM districts WHERE name = 'East Singhbhum';
    SELECT id INTO d_dhanbad FROM districts WHERE name = 'Dhanbad';
    SELECT id INTO d_bokaro FROM districts WHERE name = 'Bokaro';
    SELECT id INTO d_hazaribagh FROM districts WHERE name = 'Hazaribagh';
    SELECT id INTO d_deoghar FROM districts WHERE name = 'Deoghar';
    SELECT id INTO d_palamu FROM districts WHERE name = 'Palamu';
    SELECT id INTO d_ramgarh FROM districts WHERE name = 'Ramgarh';
    SELECT id INTO d_giridih FROM districts WHERE name = 'Giridih';
    SELECT id INTO d_simdega FROM districts WHERE name = 'Simdega';
    SELECT id INTO d_khunti FROM districts WHERE name = 'Khunti';
    SELECT id INTO d_gumla FROM districts WHERE name = 'Gumla';
    SELECT id INTO d_dumka FROM districts WHERE name = 'Dumka';
    SELECT id INTO d_wsinghbhum FROM districts WHERE name = 'West Singhbhum';
    SELECT id INTO d_latehar FROM districts WHERE name = 'Latehar';
    SELECT id INTO d_garhwa FROM districts WHERE name = 'Garhwa';
    SELECT id INTO d_lohardaga FROM districts WHERE name = 'Lohardaga';
    SELECT id INTO d_koderma FROM districts WHERE name = 'Koderma';
    SELECT id INTO d_chatra FROM districts WHERE name = 'Chatra';
    SELECT id INTO d_saraikela FROM districts WHERE name = 'Saraikela Kharsawan';
    SELECT id INTO d_jamtara FROM districts WHERE name = 'Jamtara';
    SELECT id INTO d_godda FROM districts WHERE name = 'Godda';
    SELECT id INTO d_sahebganj FROM districts WHERE name = 'Sahebganj';
    SELECT id INTO d_pakur FROM districts WHERE name = 'Pakur';

    -- --- 1. RANCHI BLOCKS & LOCALITIES ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_ranchi, 'Kanke'), (d_ranchi, 'Ratu'), (d_ranchi, 'Namkum'),
    (d_ranchi, 'Ormanjhi'), (d_ranchi, 'Nagri'), (d_ranchi, 'Mandar'),
    (d_ranchi, 'Bero'), (d_ranchi, 'Bundu'), (d_ranchi, 'Tamar'),
    (d_ranchi, 'Silli'), (d_ranchi, 'Angara'), (d_ranchi, 'Burmu'),
    (d_ranchi, 'Chanho'), (d_ranchi, 'Itki'), (d_ranchi, 'Lapung')
    ON CONFLICT (district_id, name) DO NOTHING;

    -- Kanke localities
    SELECT id INTO b_id FROM blocks WHERE district_id = d_ranchi AND name = 'Kanke';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Bariatu', '834009', 23.3980, 85.3524),
    (b_id, 'Morabadi', '834008', 23.3857, 85.3341),
    (b_id, 'Kanke Village', '834006', 23.4332, 85.3219),
    (b_id, 'Sukurhutu', '834006', 23.4475, 85.3380),
    (b_id, 'Arsande', '834006', 23.4210, 85.3150),
    (b_id, 'Mesra', '835215', 23.4230, 85.4380)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- Ratu localities
    SELECT id INTO b_id FROM blocks WHERE district_id = d_ranchi AND name = 'Ratu';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Ratu Chatti', '835222', 23.4021, 85.2054),
    (b_id, 'Kamre', '835222', 23.3890, 85.2340),
    (b_id, 'Pandra', '834005', 23.3820, 85.2810),
    (b_id, 'Bajra', '834005', 23.3880, 85.2950)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- Namkum localities
    SELECT id INTO b_id FROM blocks WHERE district_id = d_ranchi AND name = 'Namkum';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Namkum Bazar', '834010', 23.3450, 85.3850),
    (b_id, 'Lowadih', '834010', 23.3610, 85.3680),
    (b_id, 'Sidroll', '834010', 23.3320, 85.4010),
    (b_id, 'Tatisilwai', '835103', 23.3680, 85.4320)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- Nagri localities
    SELECT id INTO b_id FROM blocks WHERE district_id = d_ranchi AND name = 'Nagri';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Nagri Market', '835303', 23.3410, 85.1950),
    (b_id, 'Kudlong', '835303', 23.3280, 85.2100),
    (b_id, 'Nayasarai', '835303', 23.3520, 85.2200)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- Ormanjhi localities
    SELECT id INTO b_id FROM blocks WHERE district_id = d_ranchi AND name = 'Ormanjhi';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Ormanjhi Block Chowk', '835219', 23.4850, 85.4780),
    (b_id, 'Irba', '835217', 23.4680, 85.4620),
    (b_id, 'Sikidiri', '835102', 23.5120, 85.5410)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- Bundu localities
    SELECT id INTO b_id FROM blocks WHERE district_id = d_ranchi AND name = 'Bundu';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Bundu Town', '835204', 23.1780, 85.5890),
    (b_id, 'Kanchi', '835204', 23.1540, 85.6120)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 2. EAST SINGHBHUM (JAMSHEDPUR) ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_esinghbhum, 'Golmuri-cum-Jugsalai'), (d_esinghbhum, 'Ghatshila'),
    (d_esinghbhum, 'Potka'), (d_esinghbhum, 'Patamda'),
    (d_esinghbhum, 'Baharagora'), (d_esinghbhum, 'Chakulia'),
    (d_esinghbhum, 'Musabani'), (d_esinghbhum, 'Dumaria')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_esinghbhum AND name = 'Golmuri-cum-Jugsalai';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Bistupur', '831001', 22.7989, 86.1834),
    (b_id, 'Sakchi', '831001', 22.8056, 86.2029),
    (b_id, 'Kadma', '831005', 22.7890, 86.1680),
    (b_id, 'Telco Colony', '831004', 22.7740, 86.2410),
    (b_id, 'Jugsalai', '831006', 22.7710, 86.1920),
    (b_id, 'Sonari', '831011', 22.8120, 86.1620)
    ON CONFLICT (block_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_esinghbhum AND name = 'Ghatshila';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Ghatshila Town', '832303', 22.5840, 86.4820),
    (b_id, 'Moubhandar', '832303', 22.5910, 86.4680),
    (b_id, 'Kashida', '832303', 22.5760, 86.4910)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 3. DHANBAD ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_dhanbad, 'Dhanbad Sadar'), (d_dhanbad, 'Jharia'),
    (d_dhanbad, 'Baghmara'), (d_dhanbad, 'Govindpur'),
    (d_dhanbad, 'Nirsa'), (d_dhanbad, 'Baliapur'),
    (d_dhanbad, 'Topchanchi'), (d_dhanbad, 'Tundi')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_dhanbad AND name = 'Dhanbad Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Bank More', '826001', 23.7915, 86.4278),
    (b_id, 'Hirapur', '826001', 23.8050, 86.4350),
    (b_id, 'Saraidhela', '826127', 23.8210, 86.4560),
    (b_id, 'ISM Campus', '826004', 23.8140, 86.4410)
    ON CONFLICT (block_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_dhanbad AND name = 'Jharia';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Jharia Main Bazar', '828111', 23.7430, 86.4180),
    (b_id, 'Lodna', '828131', 23.7190, 86.4320),
    (b_id, 'Tisra', '828115', 23.7310, 86.4510)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 4. BOKARO ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_bokaro, 'Chas'), (d_bokaro, 'Bermo'),
    (d_bokaro, 'Chandankiyari'), (d_bokaro, 'Gomia'),
    (d_bokaro, 'Peterbar'), (d_bokaro, 'Kasmar'),
    (d_bokaro, 'Jaridih'), (d_bokaro, 'Nawadih')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_bokaro AND name = 'Chas';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Sector 4', '827004', 23.6680, 86.1520),
    (b_id, 'Sector 1', '827001', 23.6820, 86.1410),
    (b_id, 'Chas Main Market', '827013', 23.6390, 86.1780),
    (b_id, 'Marafari Industrial Area', '827011', 23.6910, 86.1080)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 5. HAZARIBAGH ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_hazaribagh, 'Hazaribagh Sadar'), (d_hazaribagh, 'Barhi'),
    (d_hazaribagh, 'Chauparan'), (d_hazaribagh, 'Barkagaon'),
    (d_hazaribagh, 'Katkamsandi'), (d_hazaribagh, 'Bishnugarh'),
    (d_hazaribagh, 'Ichak')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_hazaribagh AND name = 'Hazaribagh Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Matwari', '825301', 23.9920, 85.3640),
    (b_id, 'Korrah', '825301', 23.9850, 85.3780),
    (b_id, 'Canary Hill Road', '825301', 24.0110, 85.3850),
    (b_id, 'Hurhuru', '825301', 23.9780, 85.3520)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 6. DEOGHAR ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_deoghar, 'Deoghar Sadar'), (d_deoghar, 'Madhupur'),
    (d_deoghar, 'Sarwan'), (d_deoghar, 'Mohanpur'),
    (d_deoghar, 'Devipur'), (d_deoghar, 'Karon')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_deoghar AND name = 'Deoghar Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Castairs Town', '814112', 24.4820, 86.7010),
    (b_id, 'Baidyanath Dham Chowk', '814112', 24.4930, 86.6990),
    (b_id, 'Jasidih Junction Area', '814142', 24.5150, 86.6480),
    (b_id, 'Kunda', '814143', 24.4680, 86.7150)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 7. PALAMU ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_palamu, 'Medininagar (Daltonganj)'), (d_palamu, 'Chainpur'),
    (d_palamu, 'Patan'), (d_palamu, 'Lesliganj'),
    (d_palamu, 'Chhatarpur'), (d_palamu, 'Bishrampur')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_palamu AND name = 'Medininagar (Daltonganj)';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Daltonganj Main Chowk', '822101', 24.0410, 84.0720),
    (b_id, 'Redma', '822101', 24.0320, 84.0810),
    (b_id, 'Sudna', '822101', 24.0530, 84.0680),
    (b_id, 'Shahpur', '822101', 24.0280, 84.0590)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 8. RAMGARH ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_ramgarh, 'Ramgarh Sadar'), (d_ramgarh, 'Patratu'),
    (d_ramgarh, 'Gola'), (d_ramgarh, 'Mandu'),
    (d_ramgarh, 'Chitarpur'), (d_ramgarh, 'Dulmi')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_ramgarh AND name = 'Ramgarh Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Ramgarh Cantt', '829122', 23.6320, 85.5180),
    (b_id, 'Kaitha', '829122', 23.6450, 85.5310),
    (b_id, 'Bijulia', '829122', 23.6210, 85.5020)
    ON CONFLICT (block_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_ramgarh AND name = 'Patratu';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Patratu Thermal Colony', '829119', 23.6680, 85.2910),
    (b_id, 'Sayal', '829125', 23.7020, 85.3420),
    (b_id, 'Barkakana', '829103', 23.6180, 85.4650)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 9. GIRIDIH ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_giridih, 'Giridih Sadar'), (d_giridih, 'Dumri'),
    (d_giridih, 'Bagodar'), (d_giridih, 'Bengabad'),
    (d_giridih, 'Gandey'), (d_giridih, 'Tisri')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_giridih AND name = 'Giridih Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Pachamba', '815316', 24.2180, 86.2750),
    (b_id, 'Buxidih', '815301', 24.1870, 86.3020),
    (b_id, 'Makatpur', '815301', 24.1950, 86.3110)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 10. SIMDEGA ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_simdega, 'Simdega Sadar'), (d_simdega, 'Kolebira'),
    (d_simdega, 'Thethaitangar'), (d_simdega, 'Bano'),
    (d_simdega, 'Jaldega'), (d_simdega, 'Kurdeg')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_simdega AND name = 'Simdega Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Simdega Main Town', '835223', 22.6140, 84.5020),
    (b_id, 'Saldega', '835223', 22.6280, 84.4890),
    (b_id, 'Konbegi', '835223', 22.5980, 84.5180)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 11. KHUNTI ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_khunti, 'Khunti Sadar'), (d_khunti, 'Murhu'),
    (d_khunti, 'Torpa'), (d_khunti, 'Karra'),
    (d_khunti, 'Rania'), (d_khunti, 'Arki')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_khunti AND name = 'Khunti Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Khunti Bazar', '835210', 23.0720, 85.2780),
    (b_id, 'Birhu', '835210', 23.0590, 85.2910),
    (b_id, 'Torpa Road', '835210', 23.0810, 85.2620)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 12. GUMLA ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_gumla, 'Gumla Sadar'), (d_gumla, 'Sisai'),
    (d_gumla, 'Raidih'), (d_gumla, 'Chainpur'),
    (d_gumla, 'Bishunpur'), (d_gumla, 'Basia')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_gumla AND name = 'Gumla Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Gumla Main Market', '835207', 23.0450, 84.5420),
    (b_id, 'Asani', '835207', 23.0580, 84.5580),
    (b_id, 'Toto Village', '835207', 23.0310, 84.5210)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 13. DUMKA ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_dumka, 'Dumka Sadar'), (d_dumka, 'Jama'),
    (d_dumka, 'Jarmundi'), (d_dumka, 'Masalia'),
    (d_dumka, 'Raneshwar'), (d_dumka, 'Shikaripara')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_dumka AND name = 'Dumka Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Rasikpur', '814101', 24.2680, 87.2480),
    (b_id, 'Dudhani', '814101', 24.2750, 87.2610),
    (b_id, 'Kurwa', '814101', 24.2510, 87.2340)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 14. WEST SINGHBHUM (CHAIBASA) ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_wsinghbhum, 'Chaibasa Sadar'), (d_wsinghbhum, 'Chakradharpur'),
    (d_wsinghbhum, 'Jagannathpur'), (d_wsinghbhum, 'Manoharpur'),
    (d_wsinghbhum, 'Noamundi'), (d_wsinghbhum, 'Jhinkpani')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_wsinghbhum AND name = 'Chaibasa Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Chaibasa Town', '833201', 22.5520, 85.8110),
    (b_id, 'Tambo', '833201', 22.5680, 85.8240),
    (b_id, 'Lupungutu', '833201', 22.5390, 85.7950)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 15. LATEHAR ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_latehar, 'Latehar Sadar'), (d_latehar, 'Chandwa'),
    (d_latehar, 'Balumath'), (d_latehar, 'Barwadih'),
    (d_latehar, 'Mahuadanr')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_latehar AND name = 'Latehar Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Latehar Bazar', '829206', 23.7420, 84.4980),
    (b_id, 'Demu', '829206', 23.7580, 84.5120)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 16. GARHWA ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_garhwa, 'Garhwa Sadar'), (d_garhwa, 'Meral'),
    (d_garhwa, 'Ranka'), (d_garhwa, 'Bhavnathpur'),
    (d_garhwa, 'Nagar Untari')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_garhwa AND name = 'Garhwa Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Garhwa Town', '822114', 24.1810, 83.8050),
    (b_id, 'Sahijana', '822114', 24.1920, 83.8180)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 17. LOHARDAGA ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_lohardaga, 'Lohardaga Sadar'), (d_lohardaga, 'Kuru'),
    (d_lohardaga, 'Bhandra'), (d_lohardaga, 'Kisko'),
    (d_lohardaga, 'Seno')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_lohardaga AND name = 'Lohardaga Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Lohardaga Main Market', '835302', 23.4380, 84.6820),
    (b_id, 'Jurhiya', '835302', 23.4510, 84.6950)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 18. KODERMA ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_koderma, 'Koderma Sadar'), (d_koderma, 'Jhumri Telaiya'),
    (d_koderma, 'Jainagar'), (d_koderma, 'Markacho'),
    (d_koderma, 'Satgawan')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_koderma AND name = 'Jhumri Telaiya';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Telaiya Dam Road', '825409', 24.4320, 85.5290),
    (b_id, 'Station Road Koderma', '825409', 24.4450, 85.5410)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 19. CHATRA ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_chatra, 'Chatra Sadar'), (d_chatra, 'Hunterganj'),
    (d_chatra, 'Itkhori'), (d_chatra, 'Simaria'),
    (d_chatra, 'Tandwa')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_chatra AND name = 'Chatra Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Chatra Main Chowk', '825401', 24.2090, 84.8720),
    (b_id, 'Gudri Bazar', '825401', 24.2180, 84.8850)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 20. SARAIKELA KHARSAWAN ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_saraikela, 'Saraikela'), (d_saraikela, 'Kharsawan'),
    (d_saraikela, 'Adityapur (Gamharia)'), (d_saraikela, 'Chandil'),
    (d_saraikela, 'Nimdih'), (d_saraikela, 'Ichagarh')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_saraikela AND name = 'Adityapur (Gamharia)';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Adityapur Industrial Area', '831013', 22.7910, 86.1580),
    (b_id, 'Gamharia Town', '832108', 22.8150, 86.0950)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 21. JAMTARA ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_jamtara, 'Jamtara Sadar'), (d_jamtara, 'Narayanpur'),
    (d_jamtara, 'Kundhit'), (d_jamtara, 'Nala'),
    (d_jamtara, 'Karmatanr')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_jamtara AND name = 'Jamtara Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Jamtara Town', '815351', 23.9620, 86.8020),
    (b_id, 'Mihijam', '815354', 23.8540, 86.8890)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 22. GODDA ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_godda, 'Godda Sadar'), (d_godda, 'Mahagama'),
    (d_godda, 'Pathargama'), (d_godda, 'Poreyahat'),
    (d_godda, 'Boarijor')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_godda AND name = 'Godda Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Godda Main Bazar', '814133', 24.8280, 87.2140),
    (b_id, 'Rautara', '814133', 24.8390, 87.2280)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 23. SAHEBGANJ ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_sahebganj, 'Sahebganj Sadar'), (d_sahebganj, 'Rajmahal'),
    (d_sahebganj, 'Barharwa'), (d_sahebganj, 'Taljhari'),
    (d_sahebganj, 'Borio')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_sahebganj AND name = 'Sahebganj Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Sahebganj Town', '816109', 25.2420, 87.6410),
    (b_id, 'Sakrigali Ghat', '816115', 25.2180, 87.7250)
    ON CONFLICT (block_id, name) DO NOTHING;

    -- --- 24. PAKUR ---
    INSERT INTO blocks (district_id, name) VALUES
    (d_pakur, 'Pakur Sadar'), (d_pakur, 'Hiranpur'),
    (d_pakur, 'Littipara'), (d_pakur, 'Pakuria'),
    (d_pakur, 'Maheshpur')
    ON CONFLICT (district_id, name) DO NOTHING;

    SELECT id INTO b_id FROM blocks WHERE district_id = d_pakur AND name = 'Pakur Sadar';
    INSERT INTO localities (block_id, name, pincode, latitude, longitude) VALUES
    (b_id, 'Pakur Main Town', '816107', 24.6340, 87.8480),
    (b_id, 'Harindanga Bazar', '816107', 24.6420, 87.8590)
    ON CONFLICT (block_id, name) DO NOTHING;

END $$;
