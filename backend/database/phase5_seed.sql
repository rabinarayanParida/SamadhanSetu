-- ============================================
-- Phase 5: Demo Seed Data
-- [DEMO DATA] All records are fictional/representative
-- ============================================

-- ============================================
-- Research Areas (Lookup)
-- ============================================
INSERT INTO research_areas (name, description) VALUES
  ('Water Resources Engineering', 'Study of water supply, distribution, treatment, and watershed management'),
  ('Environmental Engineering', 'Pollution control, waste management, and environmental impact assessment'),
  ('Computer Science & AI', 'Artificial intelligence, machine learning, data science, and software engineering'),
  ('IoT & Embedded Systems', 'Internet of Things, sensor networks, embedded computing'),
  ('Civil Engineering', 'Structural engineering, construction, urban infrastructure'),
  ('Agriculture & Crop Science', 'Crop management, soil science, sustainable farming'),
  ('Public Health', 'Community health, epidemiology, health systems'),
  ('Renewable Energy', 'Solar, wind, biomass energy systems and grid integration'),
  ('Rural Development', 'Livelihood improvement, rural infrastructure, community empowerment'),
  ('GIS & Remote Sensing', 'Geographic Information Systems, satellite data analysis, spatial mapping'),
  ('Biotechnology', 'Genetic engineering, bioinformatics, pharmaceutical sciences'),
  ('Mechanical Engineering', 'Manufacturing, automation, thermal systems'),
  ('Electrical Engineering', 'Power systems, electronics, signal processing'),
  ('Education Technology', 'Digital learning, educational tools, pedagogy innovation'),
  ('Mining & Mineral Engineering', 'Mine safety, mineral processing, geological survey'),
  ('Management & Public Policy', 'Governance, policy analysis, organizational management'),
  ('Forestry & Ecology', 'Forest conservation, biodiversity, ecological restoration'),
  ('Biomedical Engineering', 'Medical devices, health informatics, clinical engineering'),
  ('Urban Planning', 'Smart cities, transportation planning, urban governance'),
  ('Social Innovation', 'Community-driven innovation, social entrepreneurship')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- University 1: BIT Mesra
-- [DEMO DATA]
-- ============================================
INSERT INTO universities (id, name, code, type, location, district, state, website, description, established_year, capacity_status)
VALUES (
  'a0000001-0000-0000-0000-000000000001',
  'Birla Institute of Technology, Mesra',
  'BIT-MESRA',
  'Deemed University',
  'Mesra, Ranchi',
  'Ranchi',
  'Jharkhand',
  'https://www.bitmesra.ac.in',
  '[DEMO DATA] Premier technical institution offering engineering, science, and management programs. Strong research capability in water resources, IoT, and environmental engineering.',
  1955,
  'AVAILABLE'
);

-- BIT Departments
INSERT INTO departments (id, university_id, name, code, description) VALUES
  ('d1000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Civil & Environmental Engineering', 'CEE', '[DEMO] Water resources, environmental systems, structural engineering'),
  ('d1000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Computer Science & Engineering', 'CSE', '[DEMO] AI/ML, data science, software systems'),
  ('d1000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'Electronics & Communication', 'ECE', '[DEMO] IoT, embedded systems, signal processing'),
  ('d1000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'Electrical Engineering', 'EE', '[DEMO] Power systems, renewable energy, smart grids');

-- BIT Faculty
INSERT INTO faculty (id, university_id, department_id, name, designation, specialization, profile_summary) VALUES
  ('f1000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000001', 'Dr. Amit Kumar Singh', 'Professor', 'Water Resources Engineering', '[DEMO] Expert in hydrology, watershed management, and rural water supply systems. 15+ years of research.'),
  ('f1000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000001', 'Dr. Priya Sharma', 'Associate Professor', 'Environmental Engineering', '[DEMO] Specializes in water quality analysis, wastewater treatment, and environmental impact assessment.'),
  ('f1000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000002', 'Dr. Rajesh Verma', 'Professor', 'Artificial Intelligence', '[DEMO] Research in AI for social good, predictive analytics, natural language processing.'),
  ('f1000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000003', 'Dr. Sneha Gupta', 'Associate Professor', 'IoT & Smart Systems', '[DEMO] IoT sensor networks, smart water monitoring, embedded systems for rural applications.'),
  ('f1000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000001', 'Dr. Vikram Tiwari', 'Assistant Professor', 'GIS & Remote Sensing', '[DEMO] Geographic information systems, remote sensing for water resource mapping.'),
  ('f1000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000004', 'Dr. Ananya Das', 'Professor', 'Renewable Energy', '[DEMO] Solar energy systems, micro-grids for rural electrification.');

-- BIT Faculty Expertise
INSERT INTO faculty_expertise (faculty_id, expertise_area, keywords, research_interests) VALUES
  ('f1000001-0000-0000-0000-000000000001', 'Water Resources', '["hydrology","watershed management","water supply","groundwater","rural water","drinking water","water distribution"]', '["rural water supply optimization","groundwater recharge","flood risk assessment"]'),
  ('f1000001-0000-0000-0000-000000000002', 'Environmental Engineering', '["water quality","wastewater treatment","pollution control","environmental monitoring","sanitation"]', '["low-cost water purification","industrial effluent treatment","environmental health"]'),
  ('f1000001-0000-0000-0000-000000000003', 'Artificial Intelligence', '["machine learning","deep learning","NLP","data analytics","predictive modeling","computer vision"]', '["AI for social impact","predictive analytics for governance","smart city analytics"]'),
  ('f1000001-0000-0000-0000-000000000004', 'IoT & Embedded Systems', '["IoT","sensors","embedded systems","smart monitoring","wireless networks","SCADA","remote monitoring"]', '["smart water monitoring systems","IoT for rural infrastructure","precision agriculture sensors"]'),
  ('f1000001-0000-0000-0000-000000000005', 'GIS & Remote Sensing', '["GIS","remote sensing","spatial analysis","mapping","satellite imagery","geospatial"]', '["water resource mapping","land use analysis","flood zone identification"]'),
  ('f1000001-0000-0000-0000-000000000006', 'Renewable Energy', '["solar energy","micro-grid","rural electrification","power systems","energy storage"]', '["off-grid solar solutions","community energy systems","energy access"]');

-- BIT Research Areas
INSERT INTO university_research_areas (university_id, research_area_id, strength_level)
SELECT 'a0000001-0000-0000-0000-000000000001', id, 
  CASE name
    WHEN 'Water Resources Engineering' THEN 'LEADING'
    WHEN 'IoT & Embedded Systems' THEN 'STRONG'
    WHEN 'Computer Science & AI' THEN 'STRONG'
    WHEN 'Environmental Engineering' THEN 'STRONG'
    WHEN 'GIS & Remote Sensing' THEN 'MODERATE'
    WHEN 'Renewable Energy' THEN 'MODERATE'
    WHEN 'Civil Engineering' THEN 'STRONG'
  END
FROM research_areas
WHERE name IN ('Water Resources Engineering','IoT & Embedded Systems','Computer Science & AI','Environmental Engineering','GIS & Remote Sensing','Renewable Energy','Civil Engineering')
ON CONFLICT DO NOTHING;

-- BIT Labs
INSERT INTO university_labs (university_id, department_id, name, description, capabilities, technologies) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000001', 'Hydrology & Water Resources Lab', '[DEMO] Research facility for water flow analysis, groundwater modeling, and water quality testing', '["water quality testing","flow analysis","groundwater modeling","watershed simulation"]', '["MODFLOW","HEC-RAS","ArcGIS","water sensors"]'),
  ('a0000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000003', 'IoT & Smart Systems Lab', '[DEMO] Facility for IoT prototyping, sensor network development, and embedded system design', '["IoT prototyping","sensor networks","embedded programming","wireless communication"]', '["Arduino","Raspberry Pi","LoRa","MQTT","NodeMCU"]'),
  ('a0000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000001', 'GIS & Remote Sensing Lab', '[DEMO] Spatial data analysis and mapping laboratory', '["spatial analysis","satellite imagery","terrain modeling","land use mapping"]', '["ArcGIS","QGIS","Google Earth Engine","ERDAS"]'),
  ('a0000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000002', 'AI & Data Analytics Lab', '[DEMO] Computing facility for AI/ML research and data analysis', '["machine learning","deep learning","data analytics","NLP","computer vision"]', '["Python","TensorFlow","PyTorch","GPU cluster"]');

-- BIT Innovation Centre
INSERT INTO university_innovation_centres (university_id, name, capability, description) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'BIT Innovation & Incubation Centre', 'Technology Incubation', '[DEMO] Supports student and faculty startups with mentorship, prototyping facilities, and industry connections. Focus on rural tech and social innovation.');

-- BIT Previous Projects
INSERT INTO university_projects (university_id, department_id, title, description, domain, technologies, challenge_category, year, outcomes) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000001', 'Rural Water Supply Optimization in Ranchi District', '[DEMO] Developed optimized water distribution network for 12 villages using GIS mapping and hydraulic modeling', 'Water Resources', '["GIS","hydraulic modeling","EPANET","field surveys"]', 'Water Resources', 2023, '[DEMO] Improved water access for 3,500 households'),
  ('a0000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000003', 'IoT-based Water Quality Monitoring System', '[DEMO] Deployed IoT sensors for real-time water quality monitoring in rural handpumps across 5 blocks', 'Water Resources', '["IoT","sensors","LoRa","cloud analytics","dashboard"]', 'Water Resources', 2024, '[DEMO] Real-time monitoring of 50 handpumps deployed'),
  ('a0000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000001', 'Environmental Impact Assessment of Subarnarekha Basin', '[DEMO] Comprehensive environmental study of industrial pollution in the Subarnarekha river basin', 'Environment', '["water sampling","GIS","remote sensing","statistical analysis"]', 'Environment', 2022, '[DEMO] Policy recommendations adopted by state pollution control board'),
  ('a0000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000004', 'Solar Micro-grid for Tribal Village Electrification', '[DEMO] Designed and deployed a 25kW solar micro-grid for an off-grid tribal village', 'Energy', '["solar PV","battery storage","micro-grid controller","community training"]', 'Energy', 2023, '[DEMO] 60 households electrified, community-managed operation');


-- ============================================
-- University 2: Ranchi University
-- [DEMO DATA]
-- ============================================
INSERT INTO universities (id, name, code, type, location, district, state, website, description, established_year, capacity_status)
VALUES (
  'a0000001-0000-0000-0000-000000000002',
  'Ranchi University',
  'RU-RANCHI',
  'State University',
  'Morabadi, Ranchi',
  'Ranchi',
  'Jharkhand',
  'https://www.ranchiuniversity.ac.in',
  '[DEMO DATA] One of the oldest universities in Jharkhand offering programs in arts, science, commerce, and education. Strong focus on environmental science and agriculture.',
  1960,
  'AVAILABLE'
);

INSERT INTO departments (id, university_id, name, code, description) VALUES
  ('d2000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'Environmental Science', 'ENV', '[DEMO] Environmental studies, ecology, conservation biology'),
  ('d2000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'Botany & Agriculture', 'BOT', '[DEMO] Plant science, agricultural methods, horticulture'),
  ('d2000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'Geography', 'GEO', '[DEMO] Physical geography, urban studies, GIS applications'),
  ('d2000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 'Education', 'EDU', '[DEMO] Teacher training, pedagogy, educational technology');

INSERT INTO faculty (id, university_id, department_id, name, designation, specialization, profile_summary) VALUES
  ('f2000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'd2000001-0000-0000-0000-000000000001', 'Dr. Meera Jha', 'Professor', 'Ecology & Conservation', '[DEMO] Forest ecology, biodiversity conservation, tribal community resource management.'),
  ('f2000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'd2000001-0000-0000-0000-000000000002', 'Dr. Rakesh Oraon', 'Associate Professor', 'Sustainable Agriculture', '[DEMO] Organic farming, drought-resistant crops, tribal farming practices.'),
  ('f2000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'd2000001-0000-0000-0000-000000000003', 'Dr. Sunita Kumari', 'Professor', 'Rural Geography', '[DEMO] Land use patterns, rural infrastructure mapping, migration studies.'),
  ('f2000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 'd2000001-0000-0000-0000-000000000004', 'Dr. Praveen Mahato', 'Associate Professor', 'Education Technology', '[DEMO] Digital literacy, mobile learning, education for rural communities.');

INSERT INTO faculty_expertise (faculty_id, expertise_area, keywords, research_interests) VALUES
  ('f2000001-0000-0000-0000-000000000001', 'Ecology & Environment', '["ecology","conservation","biodiversity","forest management","tribal communities","natural resources"]', '["forest resource mapping","community-based conservation","biodiversity assessment"]'),
  ('f2000001-0000-0000-0000-000000000002', 'Agriculture', '["organic farming","crop science","drought resistance","soil health","sustainable agriculture","food security"]', '["drought-resistant variety development","soil health improvement","tribal farming"]'),
  ('f2000001-0000-0000-0000-000000000003', 'Geography & GIS', '["rural geography","land use","GIS","mapping","migration","infrastructure"]', '["rural infrastructure spatial analysis","migration patterns","land use change detection"]'),
  ('f2000001-0000-0000-0000-000000000004', 'Education Technology', '["digital learning","mobile education","e-learning","pedagogy","rural education","literacy"]', '["mobile-first learning for rural areas","digital literacy programs","teacher training"]');

INSERT INTO university_research_areas (university_id, research_area_id, strength_level)
SELECT 'a0000001-0000-0000-0000-000000000002', id,
  CASE name
    WHEN 'Agriculture & Crop Science' THEN 'STRONG'
    WHEN 'Environmental Engineering' THEN 'MODERATE'
    WHEN 'Rural Development' THEN 'STRONG'
    WHEN 'Education Technology' THEN 'MODERATE'
    WHEN 'GIS & Remote Sensing' THEN 'MODERATE'
    WHEN 'Forestry & Ecology' THEN 'STRONG'
  END
FROM research_areas
WHERE name IN ('Agriculture & Crop Science','Environmental Engineering','Rural Development','Education Technology','GIS & Remote Sensing','Forestry & Ecology')
ON CONFLICT DO NOTHING;

INSERT INTO university_labs (university_id, department_id, name, description, capabilities, technologies) VALUES
  ('a0000001-0000-0000-0000-000000000002', 'd2000001-0000-0000-0000-000000000001', 'Environmental Science Lab', '[DEMO] Water and soil testing, environmental sampling, ecological assessment', '["water testing","soil analysis","environmental sampling","biodiversity survey"]', '["spectrophotometer","pH meter","field kits","GIS"]'),
  ('a0000001-0000-0000-0000-000000000002', 'd2000001-0000-0000-0000-000000000002', 'Agricultural Research Station', '[DEMO] Field research for crop varieties, soil management techniques', '["crop trials","soil testing","seed technology","irrigation experiments"]', '["field plots","greenhouse","soil lab","seed storage"]');

INSERT INTO university_projects (university_id, department_id, title, description, domain, technologies, challenge_category, year, outcomes) VALUES
  ('a0000001-0000-0000-0000-000000000002', 'd2000001-0000-0000-0000-000000000002', 'Drought-Resistant Crop Varieties for Palamau District', '[DEMO] Field trials of drought-resistant rice and millet varieties across 8 villages', 'Agriculture', '["field trials","seed technology","soil analysis"]', 'Agriculture', 2023, '[DEMO] 3 successful varieties identified, distributed to 200 farmers'),
  ('a0000001-0000-0000-0000-000000000002', 'd2000001-0000-0000-0000-000000000001', 'Biodiversity Assessment of Dalma Wildlife Sanctuary', '[DEMO] Comprehensive species survey and habitat mapping', 'Environment', '["field surveys","GIS mapping","species identification"]', 'Environment', 2024, '[DEMO] Documented 45 new species records, habitat conservation plan submitted');


-- ============================================
-- University 3: IIT (ISM) Dhanbad
-- [DEMO DATA]
-- ============================================
INSERT INTO universities (id, name, code, type, location, district, state, website, description, established_year, capacity_status)
VALUES (
  'a0000001-0000-0000-0000-000000000003',
  'Indian Institute of Technology (Indian School of Mines), Dhanbad',
  'IIT-ISM',
  'IIT',
  'Dhanbad',
  'Dhanbad',
  'Jharkhand',
  'https://www.iitism.ac.in',
  '[DEMO DATA] Premier national institute with excellence in mining, environmental, civil, and computer science research. Strong industry connections and advanced research infrastructure.',
  1926,
  'LIMITED'
);

INSERT INTO departments (id, university_id, name, code, description) VALUES
  ('d3000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'Environmental Science & Engineering', 'ESE', '[DEMO] Environmental monitoring, pollution control, climate science'),
  ('d3000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'Computer Science & Engineering', 'CSE', '[DEMO] AI, cybersecurity, data science, distributed systems'),
  ('d3000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'Civil Engineering', 'CE', '[DEMO] Structural engineering, geotechnical, transportation, urban infrastructure'),
  ('d3000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000003', 'Mining Engineering', 'MIN', '[DEMO] Mine safety, mineral processing, sustainable mining');

INSERT INTO faculty (id, university_id, department_id, name, designation, specialization, profile_summary) VALUES
  ('f3000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'd3000001-0000-0000-0000-000000000001', 'Dr. Sanjay Mishra', 'Professor', 'Air & Water Pollution Control', '[DEMO] Expert in industrial pollution monitoring, air quality management, wastewater engineering.'),
  ('f3000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'd3000001-0000-0000-0000-000000000002', 'Dr. Deepak Yadav', 'Associate Professor', 'Data Science & AI', '[DEMO] Big data analytics, AI for infrastructure, smart city platforms.'),
  ('f3000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'd3000001-0000-0000-0000-000000000003', 'Dr. Kavita Pandey', 'Professor', 'Urban Infrastructure', '[DEMO] Urban water systems, road infrastructure, public works engineering.'),
  ('f3000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000003', 'd3000001-0000-0000-0000-000000000004', 'Dr. Ranjan Prasad', 'Professor', 'Mine Safety & Environment', '[DEMO] Mine ventilation, occupational safety, environmental remediation of mined areas.');

INSERT INTO faculty_expertise (faculty_id, expertise_area, keywords, research_interests) VALUES
  ('f3000001-0000-0000-0000-000000000001', 'Environmental Engineering', '["pollution control","air quality","wastewater","industrial effluent","environmental monitoring","sanitation"]', '["industrial pollution mitigation","real-time air quality monitoring","wastewater treatment"]'),
  ('f3000001-0000-0000-0000-000000000002', 'Data Science & AI', '["big data","machine learning","AI","smart city","analytics","prediction","dashboard"]', '["AI for urban planning","predictive maintenance","smart governance platforms"]'),
  ('f3000001-0000-0000-0000-000000000003', 'Urban Infrastructure', '["urban planning","water systems","roads","public infrastructure","smart city","construction"]', '["urban water distribution optimization","smart road infrastructure","green building"]'),
  ('f3000001-0000-0000-0000-000000000004', 'Mining & Environment', '["mine safety","mineral processing","environmental remediation","occupational health","geology"]', '["post-mining land reclamation","mine water treatment","safety monitoring systems"]');

INSERT INTO university_research_areas (university_id, research_area_id, strength_level)
SELECT 'a0000001-0000-0000-0000-000000000003', id,
  CASE name
    WHEN 'Environmental Engineering' THEN 'LEADING'
    WHEN 'Computer Science & AI' THEN 'STRONG'
    WHEN 'Civil Engineering' THEN 'LEADING'
    WHEN 'Mining & Mineral Engineering' THEN 'LEADING'
    WHEN 'Urban Planning' THEN 'STRONG'
  END
FROM research_areas
WHERE name IN ('Environmental Engineering','Computer Science & AI','Civil Engineering','Mining & Mineral Engineering','Urban Planning')
ON CONFLICT DO NOTHING;

INSERT INTO university_labs (university_id, department_id, name, description, capabilities, technologies) VALUES
  ('a0000001-0000-0000-0000-000000000003', 'd3000001-0000-0000-0000-000000000001', 'Environmental Monitoring & Analytics Lab', '[DEMO] Advanced environmental monitoring, pollution modeling, and water/air quality analysis', '["air quality monitoring","water analysis","pollution modeling","environmental data analytics"]', '["CEMS sensors","gas chromatograph","AQI stations","data platforms"]'),
  ('a0000001-0000-0000-0000-000000000003', 'd3000001-0000-0000-0000-000000000003', 'Geotechnical & Infrastructure Lab', '[DEMO] Soil mechanics, foundation testing, structural analysis', '["soil testing","structural analysis","foundation design","material testing"]', '["triaxial machine","load frames","concrete testing","NDT equipment"]');

INSERT INTO university_innovation_centres (university_id, name, capability, description) VALUES
  ('a0000001-0000-0000-0000-000000000003', 'IIT ISM Technology Business Incubator', 'Deep-Tech Incubation', '[DEMO] Incubates technology startups in mining, environment, energy, and AI domains. Strong industry partner network.');

INSERT INTO university_projects (university_id, department_id, title, description, domain, technologies, challenge_category, year, outcomes) VALUES
  ('a0000001-0000-0000-0000-000000000003', 'd3000001-0000-0000-0000-000000000001', 'Real-time Air Quality Monitoring Network for Dhanbad', '[DEMO] Deployed 20 IoT-based AQI monitoring stations across Dhanbad municipality', 'Environment', '["IoT sensors","data analytics","dashboard","real-time monitoring"]', 'Environment', 2024, '[DEMO] 20 stations operational, public dashboard launched'),
  ('a0000001-0000-0000-0000-000000000003', 'd3000001-0000-0000-0000-000000000003', 'Smart Urban Water Distribution for Dhanbad Municipal Corp', '[DEMO] Optimized pipe network and leakage detection using SCADA and AI', 'Water Resources', '["SCADA","AI","pipe network modeling","leakage detection"]', 'Urban Development', 2023, '[DEMO] 30% reduction in water loss, serving 50,000 residents');


-- ============================================
-- University 4: XLRI Jamshedpur
-- [DEMO DATA]
-- ============================================
INSERT INTO universities (id, name, code, type, location, district, state, website, description, established_year, capacity_status)
VALUES (
  'a0000001-0000-0000-0000-000000000004',
  'XLRI - Xavier School of Management, Jamshedpur',
  'XLRI-JSR',
  'Autonomous Institute',
  'Circuit House Area, Jamshedpur',
  'East Singhbhum',
  'Jharkhand',
  'https://www.xlri.ac.in',
  '[DEMO DATA] Leading management institute with strong capabilities in public policy, social innovation, governance, and organizational development. Active rural outreach programs.',
  1949,
  'AVAILABLE'
);

INSERT INTO departments (id, university_id, name, code, description) VALUES
  ('d4000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'Public Policy & Governance', 'PPG', '[DEMO] Policy analysis, governance reform, social impact assessment'),
  ('d4000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'Social Innovation & Entrepreneurship', 'SIE', '[DEMO] Social enterprise, community development, impact measurement');

INSERT INTO faculty (id, university_id, department_id, name, designation, specialization, profile_summary) VALUES
  ('f4000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'd4000001-0000-0000-0000-000000000001', 'Dr. Asha Mehta', 'Professor', 'Public Administration', '[DEMO] Governance, public service delivery, e-governance, citizen engagement.'),
  ('f4000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'd4000001-0000-0000-0000-000000000002', 'Dr. Nitin Rao', 'Associate Professor', 'Social Entrepreneurship', '[DEMO] Impact measurement, rural livelihood programs, community-based organizations.');

INSERT INTO faculty_expertise (faculty_id, expertise_area, keywords, research_interests) VALUES
  ('f4000001-0000-0000-0000-000000000001', 'Public Policy', '["governance","public administration","e-governance","citizen services","policy analysis","transparency","public delivery"]', '["digital governance","service delivery improvement","citizen feedback systems"]'),
  ('f4000001-0000-0000-0000-000000000002', 'Social Innovation', '["social enterprise","community development","rural livelihoods","impact assessment","self-help groups","microfinance"]', '["livelihood program design","community organization","social impact bonds"]');

INSERT INTO university_research_areas (university_id, research_area_id, strength_level)
SELECT 'a0000001-0000-0000-0000-000000000004', id,
  CASE name
    WHEN 'Management & Public Policy' THEN 'LEADING'
    WHEN 'Social Innovation' THEN 'STRONG'
    WHEN 'Rural Development' THEN 'MODERATE'
  END
FROM research_areas
WHERE name IN ('Management & Public Policy','Social Innovation','Rural Development')
ON CONFLICT DO NOTHING;

INSERT INTO university_projects (university_id, department_id, title, description, domain, technologies, challenge_category, year, outcomes) VALUES
  ('a0000001-0000-0000-0000-000000000004', 'd4000001-0000-0000-0000-000000000001', 'E-Governance Improvement for East Singhbhum District', '[DEMO] Assessed and redesigned citizen service delivery workflows', 'Governance', '["process mapping","citizen surveys","digital tools"]', 'Public Administration', 2024, '[DEMO] 40% reduction in service delivery time for 5 key services'),
  ('a0000001-0000-0000-0000-000000000004', 'd4000001-0000-0000-0000-000000000002', 'Livelihood Enhancement Program for Tribal Women SHGs', '[DEMO] Capacity building and market linkage for 150 self-help groups', 'Rural Development', '["training modules","market analysis","SHG management"]', 'Rural Livelihoods', 2023, '[DEMO] Average income increased 35% for participating SHGs');


-- ============================================
-- University 5: Birsa Agricultural University
-- [DEMO DATA]
-- ============================================
INSERT INTO universities (id, name, code, type, location, district, state, website, description, established_year, capacity_status)
VALUES (
  'a0000001-0000-0000-0000-000000000005',
  'Birsa Agricultural University',
  'BAU-RANCHI',
  'Agricultural University',
  'Kanke, Ranchi',
  'Ranchi',
  'Jharkhand',
  'https://www.bfranchiuniv.ac.in',
  '[DEMO DATA] Premier agricultural university in Jharkhand specializing in crop science, soil management, horticulture, forestry, and veterinary sciences. Strong extension programs for tribal farming communities.',
  1981,
  'AVAILABLE'
);

INSERT INTO departments (id, university_id, name, code, description) VALUES
  ('d5000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000005', 'Agronomy & Crop Science', 'AGR', '[DEMO] Crop production, seed technology, farming systems'),
  ('d5000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000005', 'Soil Science & Agricultural Chemistry', 'SSC', '[DEMO] Soil health, nutrient management, sustainable soil practices'),
  ('d5000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000005', 'Horticulture', 'HOR', '[DEMO] Fruit cultivation, vegetable science, floriculture'),
  ('d5000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'Forestry & Environmental Science', 'FES', '[DEMO] Agroforestry, forest management, watershed development');

INSERT INTO faculty (id, university_id, department_id, name, designation, specialization, profile_summary) VALUES
  ('f5000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000005', 'd5000001-0000-0000-0000-000000000001', 'Dr. Binod Tirkey', 'Professor', 'Rice Agronomy', '[DEMO] Rice varieties, rainfed agriculture, tribal farming systems.'),
  ('f5000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000005', 'd5000001-0000-0000-0000-000000000002', 'Dr. Savita Lakra', 'Associate Professor', 'Soil Health', '[DEMO] Soil testing, nutrient management, organic soil amendments.'),
  ('f5000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000005', 'd5000001-0000-0000-0000-000000000004', 'Dr. Manish Kumar', 'Professor', 'Watershed Management', '[DEMO] Watershed development, agroforestry, water conservation in rainfed areas.'),
  ('f5000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'd5000001-0000-0000-0000-000000000003', 'Dr. Poonam Devi', 'Assistant Professor', 'Horticulture', '[DEMO] Fruit crop management, post-harvest technology, value addition.');

INSERT INTO faculty_expertise (faculty_id, expertise_area, keywords, research_interests) VALUES
  ('f5000001-0000-0000-0000-000000000001', 'Agriculture', '["rice","agronomy","rainfed farming","crop management","seed technology","food security","irrigation"]', '["climate-resilient rice varieties","integrated farming systems","farmer training"]'),
  ('f5000001-0000-0000-0000-000000000002', 'Soil Science', '["soil health","nutrient management","organic farming","soil testing","fertilizer","composting"]', '["soil carbon sequestration","micronutrient deficiency correction","biofertilizers"]'),
  ('f5000001-0000-0000-0000-000000000003', 'Watershed & Forestry', '["watershed","agroforestry","water conservation","reforestation","land reclamation","natural resources"]', '["participatory watershed development","community forest management","water harvesting"]'),
  ('f5000001-0000-0000-0000-000000000004', 'Horticulture', '["fruits","vegetables","post-harvest","value addition","protected cultivation","mushroom"]', '["mango and litchi improvement","vegetable seed production","processing technology"]');

INSERT INTO university_research_areas (university_id, research_area_id, strength_level)
SELECT 'a0000001-0000-0000-0000-000000000005', id,
  CASE name
    WHEN 'Agriculture & Crop Science' THEN 'LEADING'
    WHEN 'Water Resources Engineering' THEN 'STRONG'
    WHEN 'Forestry & Ecology' THEN 'STRONG'
    WHEN 'Rural Development' THEN 'STRONG'
    WHEN 'Biotechnology' THEN 'MODERATE'
  END
FROM research_areas
WHERE name IN ('Agriculture & Crop Science','Water Resources Engineering','Forestry & Ecology','Rural Development','Biotechnology')
ON CONFLICT DO NOTHING;

INSERT INTO university_labs (university_id, department_id, name, description, capabilities, technologies) VALUES
  ('a0000001-0000-0000-0000-000000000005', 'd5000001-0000-0000-0000-000000000002', 'Soil Testing & Nutrient Analysis Lab', '[DEMO] Comprehensive soil testing for farmers, nutrient analysis, pH mapping', '["soil testing","nutrient analysis","pH measurement","organic content analysis"]', '["atomic absorption spectrophotometer","flame photometer","pH meters"]'),
  ('a0000001-0000-0000-0000-000000000005', 'd5000001-0000-0000-0000-000000000001', 'Seed Technology Lab', '[DEMO] Seed quality testing, variety development, germination analysis', '["seed quality testing","variety trials","germination testing","seed certification"]', '["seed analyzer","growth chambers","cold storage"]');

INSERT INTO university_innovation_centres (university_id, name, capability, description) VALUES
  ('a0000001-0000-0000-0000-000000000005', 'Krishi Vigyan Kendra (KVK)', 'Agricultural Extension', '[DEMO] Technology transfer to farmers, training programs, demonstration farms. Serves 6 districts.');

INSERT INTO university_projects (university_id, department_id, title, description, domain, technologies, challenge_category, year, outcomes) VALUES
  ('a0000001-0000-0000-0000-000000000005', 'd5000001-0000-0000-0000-000000000001', 'Climate-Resilient Rice for Jharkhand Tribal Belt', '[DEMO] Developed 5 rice varieties suitable for rainfed conditions in Jharkhand plateau region', 'Agriculture', '["breeding","field trials","farmer participatory research"]', 'Agriculture', 2024, '[DEMO] 5 varieties released, 2,000+ farmers adopted'),
  ('a0000001-0000-0000-0000-000000000005', 'd5000001-0000-0000-0000-000000000004', 'Watershed Development Project in Gumla District', '[DEMO] Participatory watershed management across 15 micro-watersheds', 'Water Resources', '["watershed design","check dams","contour bunding","community training"]', 'Water Resources', 2023, '[DEMO] Groundwater level rose by 2m average, crop yield improved 25%');


-- ============================================
-- University 6: NIT Jamshedpur
-- [DEMO DATA]
-- ============================================
INSERT INTO universities (id, name, code, type, location, district, state, website, description, established_year, capacity_status)
VALUES (
  'a0000001-0000-0000-0000-000000000006',
  'National Institute of Technology, Jamshedpur',
  'NIT-JSR',
  'NIT',
  'Adityapur, Jamshedpur',
  'East Singhbhum',
  'Jharkhand',
  'https://www.nitjsr.ac.in',
  '[DEMO DATA] National technical institution with strong programs in civil, electrical, mechanical, and computer engineering. Active industry collaboration through proximity to Tata Steel and other Jamshedpur industries.',
  1960,
  'AVAILABLE'
);

INSERT INTO departments (id, university_id, name, code, description) VALUES
  ('d6000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'Civil Engineering', 'CE', '[DEMO] Structural, geotechnical, water resources, and transportation engineering'),
  ('d6000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 'Computer Science & Engineering', 'CSE', '[DEMO] Software engineering, data science, cybersecurity'),
  ('d6000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000006', 'Electrical Engineering', 'EE', '[DEMO] Power systems, control systems, renewable energy'),
  ('d6000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000006', 'Mechanical Engineering', 'ME', '[DEMO] Manufacturing, automation, thermal engineering');

INSERT INTO faculty (id, university_id, department_id, name, designation, specialization, profile_summary) VALUES
  ('f6000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'd6000001-0000-0000-0000-000000000001', 'Dr. Anil Toppo', 'Professor', 'Structural & Water Engineering', '[DEMO] Bridge design, water supply infrastructure, rural construction.'),
  ('f6000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 'd6000001-0000-0000-0000-000000000003', 'Dr. Ritu Sinha', 'Associate Professor', 'Power Systems', '[DEMO] Electrical grid optimization, rural electrification, smart meters.'),
  ('f6000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000006', 'd6000001-0000-0000-0000-000000000004', 'Dr. Suresh Mahli', 'Professor', 'Manufacturing & Automation', '[DEMO] Low-cost manufacturing, assistive devices, industrial automation.'),
  ('f6000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000006', 'd6000001-0000-0000-0000-000000000002', 'Dr. Neha Kumari', 'Assistant Professor', 'Cybersecurity & E-Governance', '[DEMO] Digital security, e-governance platforms, secure citizen services.');

INSERT INTO faculty_expertise (faculty_id, expertise_area, keywords, research_interests) VALUES
  ('f6000001-0000-0000-0000-000000000001', 'Civil & Water Engineering', '["structural engineering","water supply","infrastructure","bridges","rural construction","pipeline","roads"]', '["rural water supply infrastructure","low-cost housing","bridge assessment"]'),
  ('f6000001-0000-0000-0000-000000000002', 'Power Systems', '["electrical grid","rural electrification","smart meters","power distribution","energy efficiency","solar"]', '["smart metering","rural grid optimization","distributed energy resources"]'),
  ('f6000001-0000-0000-0000-000000000003', 'Manufacturing', '["manufacturing","automation","assistive technology","low-cost devices","accessibility","prosthetics"]', '["low-cost assistive devices","rural manufacturing","3D printing for healthcare"]'),
  ('f6000001-0000-0000-0000-000000000004', 'Cybersecurity', '["cybersecurity","e-governance","digital services","data privacy","secure platforms","authentication"]', '["secure e-governance","citizen data protection","blockchain for governance"]');

INSERT INTO university_research_areas (university_id, research_area_id, strength_level)
SELECT 'a0000001-0000-0000-0000-000000000006', id,
  CASE name
    WHEN 'Civil Engineering' THEN 'STRONG'
    WHEN 'Electrical Engineering' THEN 'STRONG'
    WHEN 'Mechanical Engineering' THEN 'STRONG'
    WHEN 'Computer Science & AI' THEN 'MODERATE'
    WHEN 'Renewable Energy' THEN 'MODERATE'
  END
FROM research_areas
WHERE name IN ('Civil Engineering','Electrical Engineering','Mechanical Engineering','Computer Science & AI','Renewable Energy')
ON CONFLICT DO NOTHING;

INSERT INTO university_labs (university_id, department_id, name, description, capabilities, technologies) VALUES
  ('a0000001-0000-0000-0000-000000000006', 'd6000001-0000-0000-0000-000000000001', 'Structural & Hydraulics Lab', '[DEMO] Structural testing, hydraulic flow experiments, water infrastructure modeling', '["structural testing","hydraulics","water flow analysis","material testing"]', '["hydraulic flume","UTM machine","concrete lab","pipe network simulator"]'),
  ('a0000001-0000-0000-0000-000000000006', 'd6000001-0000-0000-0000-000000000004', 'Advanced Manufacturing Lab', '[DEMO] CNC machining, 3D printing, prototyping facility', '["CNC machining","3D printing","prototyping","reverse engineering"]', '["CNC machines","3D printers","laser cutter","CAD/CAM software"]');

INSERT INTO university_innovation_centres (university_id, name, capability, description) VALUES
  ('a0000001-0000-0000-0000-000000000006', 'NIT JSR Entrepreneurship Cell', 'Product Prototyping', '[DEMO] Student-led innovation hub supporting hardware prototyping and social tech projects.');

INSERT INTO university_projects (university_id, department_id, title, description, domain, technologies, challenge_category, year, outcomes) VALUES
  ('a0000001-0000-0000-0000-000000000006', 'd6000001-0000-0000-0000-000000000001', 'Bridge Safety Assessment in East Singhbhum', '[DEMO] Structural health monitoring of 15 aging bridges using sensor networks', 'Infrastructure', '["structural sensors","data analytics","NDT testing"]', 'Urban Development', 2024, '[DEMO] 3 critical bridges identified for immediate repair'),
  ('a0000001-0000-0000-0000-000000000006', 'd6000001-0000-0000-0000-000000000004', 'Low-Cost Prosthetic Devices for Rural Communities', '[DEMO] Developed 3D-printed prosthetic limbs for below-knee amputees', 'Healthcare', '["3D printing","biomechanics","user testing","material science"]', 'Accessibility', 2023, '[DEMO] 50 prosthetics provided free, adoption rate 85%');


-- ============================================
-- University 7: Central University of Jharkhand
-- [DEMO DATA]
-- ============================================
INSERT INTO universities (id, name, code, type, location, district, state, website, description, established_year, capacity_status)
VALUES (
  'a0000001-0000-0000-0000-000000000007',
  'Central University of Jharkhand',
  'CUJ-RANCHI',
  'Central University',
  'Brambe, Ranchi',
  'Ranchi',
  'Jharkhand',
  'https://www.cuj.ac.in',
  '[DEMO DATA] Central university with interdisciplinary approach combining science, education, and environmental studies. Strong focus on tribal education and community development research.',
  2009,
  'AVAILABLE'
);

INSERT INTO departments (id, university_id, name, code, description) VALUES
  ('d7000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000007', 'Environmental Science', 'ES', '[DEMO] Environmental studies, climate change, waste management'),
  ('d7000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000007', 'Education & Educational Technology', 'EDT', '[DEMO] Teacher education, digital pedagogy, inclusive education'),
  ('d7000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000007', 'Life Sciences', 'LS', '[DEMO] Biodiversity, microbiology, biotechnology');

INSERT INTO faculty (id, university_id, department_id, name, designation, specialization, profile_summary) VALUES
  ('f7000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000007', 'd7000001-0000-0000-0000-000000000001', 'Dr. Alok Tigga', 'Associate Professor', 'Waste Management', '[DEMO] Solid waste management, recycling systems, circular economy.'),
  ('f7000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000007', 'd7000001-0000-0000-0000-000000000002', 'Dr. Rekha Minz', 'Professor', 'Inclusive Education', '[DEMO] Tribal education, special needs education, mother-tongue-based learning.'),
  ('f7000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000007', 'd7000001-0000-0000-0000-000000000003', 'Dr. Suman Soren', 'Assistant Professor', 'Microbiology', '[DEMO] Water microbiology, food safety, public health microbiology.');

INSERT INTO faculty_expertise (faculty_id, expertise_area, keywords, research_interests) VALUES
  ('f7000001-0000-0000-0000-000000000001', 'Environmental Science', '["waste management","solid waste","recycling","sanitation","circular economy","composting","plastic waste"]', '["decentralized waste processing","community waste management","plastic alternatives"]'),
  ('f7000001-0000-0000-0000-000000000002', 'Education', '["tribal education","inclusive education","mother tongue","special needs","literacy","rural education","teacher training"]', '["multilingual education models","digital learning for tribal areas","inclusive classroom"]'),
  ('f7000001-0000-0000-0000-000000000003', 'Life Sciences', '["microbiology","water quality","food safety","public health","pathogens","drinking water"]', '["waterborne disease monitoring","food safety in rural markets","antimicrobial resistance"]');

INSERT INTO university_research_areas (university_id, research_area_id, strength_level)
SELECT 'a0000001-0000-0000-0000-000000000007', id,
  CASE name
    WHEN 'Environmental Engineering' THEN 'MODERATE'
    WHEN 'Education Technology' THEN 'STRONG'
    WHEN 'Biotechnology' THEN 'MODERATE'
    WHEN 'Rural Development' THEN 'MODERATE'
  END
FROM research_areas
WHERE name IN ('Environmental Engineering','Education Technology','Biotechnology','Rural Development')
ON CONFLICT DO NOTHING;

INSERT INTO university_projects (university_id, department_id, title, description, domain, technologies, challenge_category, year, outcomes) VALUES
  ('a0000001-0000-0000-0000-000000000007', 'd7000001-0000-0000-0000-000000000001', 'Decentralized Solid Waste Management for Ranchi Peri-Urban Areas', '[DEMO] Community-based composting and recycling program across 10 wards', 'Sanitation', '["composting","segregation","community training","IEC"]', 'Sanitation', 2024, '[DEMO] 60% waste diversion from landfill achieved in pilot wards'),
  ('a0000001-0000-0000-0000-000000000007', 'd7000001-0000-0000-0000-000000000002', 'Digital Literacy Program for Tribal Schools', '[DEMO] Tablet-based learning program in Santhali and Hindi for 30 tribal schools', 'Education', '["tablet-based learning","content creation","teacher training"]', 'Education', 2023, '[DEMO] Learning outcomes improved 20% in participating schools');


-- ============================================
-- University 8: RIMS Ranchi
-- [DEMO DATA]
-- ============================================
INSERT INTO universities (id, name, code, type, location, district, state, website, description, established_year, capacity_status)
VALUES (
  'a0000001-0000-0000-0000-000000000008',
  'Rajendra Institute of Medical Sciences (RIMS), Ranchi',
  'RIMS-RANCHI',
  'Medical Institute',
  'Bariatu, Ranchi',
  'Ranchi',
  'Jharkhand',
  'https://www.rimsranchi.ac.in',
  '[DEMO DATA] Premier medical institution in Jharkhand providing healthcare, public health research, and medical education. Strong community health outreach in tribal regions.',
  1960,
  'LIMITED'
);

INSERT INTO departments (id, university_id, name, code, description) VALUES
  ('d8000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000008', 'Community Medicine & Public Health', 'CMPH', '[DEMO] Epidemiology, community health, preventive medicine'),
  ('d8000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000008', 'General Medicine', 'MED', '[DEMO] Internal medicine, tropical diseases, clinical research'),
  ('d8000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000008', 'Biomedical Sciences', 'BMS', '[DEMO] Medical devices, clinical technology, health informatics');

INSERT INTO faculty (id, university_id, department_id, name, designation, specialization, profile_summary) VALUES
  ('f8000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000008', 'd8000001-0000-0000-0000-000000000001', 'Dr. Suresh Bhagat', 'Professor', 'Community Health', '[DEMO] Public health program design, disease surveillance, maternal health, tribal healthcare.'),
  ('f8000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000008', 'd8000001-0000-0000-0000-000000000002', 'Dr. Anjali Singh', 'Associate Professor', 'Tropical Medicine', '[DEMO] Vector-borne diseases, malaria prevention, community diagnostic programs.'),
  ('f8000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000008', 'd8000001-0000-0000-0000-000000000003', 'Dr. Pankaj Kumar', 'Assistant Professor', 'Health Informatics', '[DEMO] Health data systems, telemedicine, mHealth applications for rural areas.');

INSERT INTO faculty_expertise (faculty_id, expertise_area, keywords, research_interests) VALUES
  ('f8000001-0000-0000-0000-000000000001', 'Public Health', '["community health","epidemiology","maternal health","child health","disease prevention","vaccination","nutrition","healthcare access"]', '["tribal health improvement","maternal mortality reduction","nutrition intervention programs"]'),
  ('f8000001-0000-0000-0000-000000000002', 'Tropical Medicine', '["malaria","dengue","vector-borne diseases","disease surveillance","diagnostic","prevention"]', '["integrated vector management","rapid diagnostic tools","community disease surveillance"]'),
  ('f8000001-0000-0000-0000-000000000003', 'Health Informatics', '["telemedicine","mHealth","health data","EHR","digital health","remote diagnostics"]', '["telemedicine for rural Jharkhand","mHealth for community health workers","AI-assisted diagnostics"]');

INSERT INTO university_research_areas (university_id, research_area_id, strength_level)
SELECT 'a0000001-0000-0000-0000-000000000008', id,
  CASE name
    WHEN 'Public Health' THEN 'LEADING'
    WHEN 'Biomedical Engineering' THEN 'MODERATE'
  END
FROM research_areas
WHERE name IN ('Public Health','Biomedical Engineering')
ON CONFLICT DO NOTHING;

INSERT INTO university_labs (university_id, department_id, name, description, capabilities, technologies) VALUES
  ('a0000001-0000-0000-0000-000000000008', 'd8000001-0000-0000-0000-000000000001', 'Community Health Research Lab', '[DEMO] Epidemiological studies, health surveys, diagnostic testing', '["epidemiology","health surveys","diagnostic testing","data analysis"]', '["survey tools","diagnostic kits","statistical software","GIS health mapping"]');

INSERT INTO university_projects (university_id, department_id, title, description, domain, technologies, challenge_category, year, outcomes) VALUES
  ('a0000001-0000-0000-0000-000000000008', 'd8000001-0000-0000-0000-000000000001', 'Maternal Health Improvement in Tribal Blocks of Ranchi', '[DEMO] Community health worker training and referral system for 50 villages', 'Healthcare', '["community training","referral systems","health monitoring","mobile app"]', 'Healthcare', 2024, '[DEMO] Institutional delivery rate increased from 45% to 72%'),
  ('a0000001-0000-0000-0000-000000000008', 'd8000001-0000-0000-0000-000000000002', 'Malaria Surveillance & Prevention in Simdega District', '[DEMO] Integrated vector management and rapid diagnostic deployment', 'Healthcare', '["RDT kits","bed nets","surveillance data","community awareness"]', 'Healthcare', 2023, '[DEMO] 40% reduction in malaria incidence in intervention areas');
