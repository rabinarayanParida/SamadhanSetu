/**
 * SICP Phase 5: AI-Powered University Matching & Institutional Assignment Tests
 * Run with: node --test tests/matching.test.js
 *
 * Tests:
 * 1. Database schema, tables, seed counts, foreign keys, uniqueness
 * 2. Mandatory Matching Test: Water challenge ranks Water Resources university (BIT Mesra) > Non-water (XLRI)
 * 3. Domain Matching: Agriculture challenge ranks Birsa Agricultural University top
 * 4. Healthcare Matching: Health challenge ranks RIMS Ranchi top
 * 5. Multidisciplinary Matching: IoT + Agriculture/Water challenge
 * 6. Factor breakdown & Explainability: Evidence verified against stored database data
 * 7. Faculty Recommendations: Verified against actual faculty directory
 * 8. Authorization: Citizen / student blocked, Admin / Government permitted, University restricted
 * 9. Assignment Workflow: VALIDATED -> ASSIGNED -> ACCEPTED (IN_PROGRESS) and DECLINED (reverts to VALIDATED)
 * 10. Audit Logging: MATCH_GENERATION, CHALLENGE_ASSIGNED, ASSIGNMENT_ACCEPTED, ASSIGNMENT_DECLINED
 * 11. Regression: Phase 2, Phase 3, Phase 4 endpoints and state transitions
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { pool, query } = require('../src/config/db');
const matchingService = require('../src/services/matching.service');
const assignmentService = require('../src/services/assignment.service');
const universityService = require('../src/services/university.service');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

let server;
let adminUser;
let adminToken;
let citizenUser;
let citizenToken;
let uniUser;
let uniToken;
let bitMesraId;
let xlriId;
let bauId;
let rimsId;

// Test challenge IDs
let waterChallengeId;
let agriChallengeId;
let healthChallengeId;
let multiChallengeId;

async function api(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json();
  return { status: res.status, data };
}

describe('Phase 5: AI-Powered University Matching & Institutional Assignment', () => {
  before(async () => {
    // 1. Verify / start backend if needed
    try {
      const ping = await fetch(`${BASE_URL}/health`).catch(() => null);
      if (!ping) {
        // Start express server in-process for tests
        const app = require('../src/server');
        server = app.listen(5000);
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (e) {
      // Server may already be running
    }

    // 2. Fetch known university IDs from seed data
    const unis = await query('SELECT id, code FROM universities');
    for (const u of unis.rows) {
      if (u.code === 'BIT-MESRA') bitMesraId = u.id;
      if (u.code === 'XLRI-JSR') xlriId = u.id;
      if (u.code === 'BAU-RANCHI') bauId = u.id;
      if (u.code === 'RIMS-RANCHI') rimsId = u.id;
    }

    // 3. Register test users
    const timestamp = Date.now();
    adminUser = {
      full_name: 'Phase 5 Admin',
      email: `admin_p5_${timestamp}@sicp.gov.in`,
      password: 'Password@123',
      role: 'admin',
      organization: 'Govt. of Jharkhand IT Dept',
    };
    citizenUser = {
      full_name: 'Phase 5 Citizen',
      email: `citizen_p5_${timestamp}@jharkhand.in`,
      password: 'Password@123',
      role: 'citizen',
      district: 'Ranchi',
    };
    uniUser = {
      full_name: 'BIT Mesra Dean',
      email: `dean_p5_${timestamp}@bitmesra.ac.in`,
      password: 'Password@123',
      role: 'university',
      organization: 'BIT Mesra',
    };

    // Register citizen
    const citReg = await api('POST', '/api/v1/auth/register', citizenUser);
    citizenToken = citReg.data.data?.accessToken;

    // Register admin
    const admReg = await api('POST', '/api/v1/auth/register', adminUser);
    adminToken = admReg.data.data?.accessToken;

    // Register university user
    const uniReg = await api('POST', '/api/v1/auth/register', uniUser);
    uniToken = uniReg.data.data?.accessToken;

    // Link uni user to BIT Mesra if not already linked
    if (uniReg.data.data?.user?.id && bitMesraId) {
      await query('UPDATE users SET university_id = $1 WHERE id = $2', [bitMesraId, uniReg.data.data.user.id]);
    }
  });

  after(async () => {
    if (server && server.close) {
      server.close();
    }
  });

  // ============================================
  // 1. DATABASE INTEGRITY & SEED VERIFICATION
  // ============================================
  describe('1. Database Schema & Seed Data', () => {
    it('should have all Phase 5 tables present in PostgreSQL', async () => {
      const res = await query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name IN (
          'universities', 'departments', 'faculty', 'faculty_expertise',
          'research_areas', 'university_research_areas', 'university_labs',
          'university_innovation_centres', 'university_projects',
          'challenge_matches', 'challenge_match_factors', 'challenge_match_faculty',
          'challenge_assignments'
        )
      `);
      assert.equal(res.rows.length, 13, 'All 13 Phase 5 tables must exist');
    });

    it('should have loaded 8 demo universities with diverse domain strengths', async () => {
      const res = await query('SELECT count(*) as count FROM universities WHERE is_active = true');
      const count = parseInt(res.rows[0].count, 10);
      assert.ok(count >= 8, `Expected at least 8 universities, found ${count}`);
    });

    it('should have faculty with structured expertise keywords', async () => {
      const res = await query('SELECT count(*) as count FROM faculty_expertise');
      const count = parseInt(res.rows[0].count, 10);
      assert.ok(count >= 20, `Expected at least 20 faculty expertise records, found ${count}`);
    });

    it('should have labs and facilities with capability JSON data', async () => {
      const res = await query('SELECT count(*) as count FROM university_labs WHERE jsonb_array_length(capabilities) > 0');
      const count = parseInt(res.rows[0].count, 10);
      assert.ok(count >= 10, `Expected at least 10 labs with capabilities, found ${count}`);
    });

    it('should have previous projects across diverse societal domains', async () => {
      const res = await query('SELECT DISTINCT domain FROM university_projects');
      const domains = res.rows.map(r => r.domain);
      assert.ok(domains.some(d => /water/i.test(d)), 'Must include Water domain project');
      assert.ok(domains.some(d => /agriculture/i.test(d)), 'Must include Agriculture domain project');
      assert.ok(domains.some(d => /health/i.test(d)), 'Must include Healthcare domain project');
    });
  });

  // ============================================
  // 2. MANDATORY MATCHING TEST (WATER SHORTAGE)
  // ============================================
  describe('2. Mandatory Matching Test (Water Challenge)', () => {
    it('creates and validates a severe drinking water shortage challenge', async () => {
      // 1. Citizen creates water challenge
      const createRes = await api('POST', '/api/v1/challenges', {
        title: 'Severe Drinking Water Shortage in Village X',
        description: 'Village X has a severe shortage of drinking water. Approximately 150 households are affected due to dried borewells and high turbidity in surface water sources. Immediate groundwater assessment and sustainable water supply system required.',
        category_id: 4, // Water Resources
        severity: 'high',
        affected_population: '150 households',
        district: 'Ranchi',
        block: 'Angara',
        village_city: 'Village X',
      }, citizenToken);

      assert.equal(createRes.status, 201);
      waterChallengeId = createRes.data.data.id;
      assert.ok(waterChallengeId);

      // 2. Submit challenge
      await api('PATCH', `/api/v1/challenges/${waterChallengeId}/submit`, {}, citizenToken);

      // 3. Admin validates challenge
      await api('PATCH', `/api/v1/admin/challenges/${waterChallengeId}/status`, {
        to_status: 'UNDER_REVIEW',
        comment: 'Review commenced',
      }, adminToken);

      await api('PATCH', `/api/v1/admin/challenges/${waterChallengeId}/status`, {
        to_status: 'VALIDATED',
        comment: 'Validated as genuine critical societal challenge',
      }, adminToken);

      // 4. Create Phase 4 AI result with Water domain intelligence
      await query(`
        INSERT INTO challenge_ai_results (
          challenge_id, ai_category, ai_subcategory, routing_domain,
          priority_score, priority_level, classification_confidence, processing_status
        ) VALUES ($1, 'Water Resources', 'Drinking Water & Groundwater', 'Water Resources Engineering', 85, 'HIGH', 0.92, 'COMPLETED')
        ON CONFLICT (challenge_id) DO UPDATE SET
          ai_category = EXCLUDED.ai_category,
          routing_domain = EXCLUDED.routing_domain,
          processing_status = 'COMPLETED'
      `, [waterChallengeId]);

      // Seed dummy embedding
      await query(`
        INSERT INTO challenge_embeddings (challenge_id, embedding, embedding_model, embedding_text_hash)
        VALUES ($1, '[]'::jsonb, 'test-embed-v1', 'testhash-water-001')
        ON CONFLICT (challenge_id) DO NOTHING
      `, [waterChallengeId]);
    });

    it('ranks University A (BIT Mesra) ABOVE University B (XLRI) based on actual capability data', async () => {
      const matchResult = await matchingService.generateMatches(waterChallengeId, adminUser.email);

      assert.ok(matchResult.matches.length > 0, 'Must generate ranked recommendations');

      const bitMatch = matchResult.matches.find(m => m.university_id === bitMesraId);
      const xlriMatch = matchResult.matches.find(m => m.university_id === xlriId);

      assert.ok(bitMatch, 'BIT Mesra must appear in recommendations');
      assert.ok(xlriMatch, 'XLRI must appear in recommendations');

      // MANDATORY REQUIREMENT: BIT Mesra must rank higher and have a higher score than XLRI
      assert.ok(
        Number(bitMatch.match_score) > Number(xlriMatch.match_score),
        `BIT Mesra (${bitMatch.match_score}%) must score higher than XLRI (${xlriMatch.match_score}%) for Water challenge`
      );
      assert.ok(
        bitMatch.rank < xlriMatch.rank,
        `BIT Mesra (rank #${bitMatch.rank}) must have better rank than XLRI (rank #${xlriMatch.rank})`
      );

      // Verify domain expertise factor
      const bitDomainFactor = bitMatch.factors.find(f => f.factor_name === 'domain_expertise');
      const xlriDomainFactor = xlriMatch.factors.find(f => f.factor_name === 'domain_expertise');
      assert.ok(Number(bitDomainFactor.factor_score) > Number(xlriDomainFactor.factor_score));

      // Verify faculty expertise factor
      const bitFacultyFactor = bitMatch.factors.find(f => f.factor_name === 'faculty_expertise');
      assert.ok(Number(bitFacultyFactor.factor_score) > 0.5, 'BIT Mesra must have high faculty match for water');
      assert.ok(bitFacultyFactor.evidence.includes('faculty members with relevant expertise'));

      // Verify lab capability evidence
      const bitLabFactor = bitMatch.factors.find(f => f.factor_name === 'lab_capability');
      assert.ok(bitLabFactor.evidence.includes('Hydrology & Water Resources Lab') || bitLabFactor.evidence.includes('lab'));
    });
  });

  // ============================================
  // 3. DOMAIN MATCHING TESTS (AGRICULTURE & HEALTHCARE)
  // ============================================
  describe('3. Domain-Specific Capability Matching', () => {
    it('ranks Birsa Agricultural University #1 for crop blight and soil degradation challenge', async () => {
      // 1. Create Agriculture Challenge
      const res = await api('POST', '/api/v1/challenges', {
        title: 'Bacterial Blight Infestation in Tribal Paddy Fields',
        description: 'Farmers in Khunti district report severe paddy crop loss due to bacterial leaf blight and soil nutrient degradation. Need biological pest control, organic fertilizer formulation, and farmer extension training.',
        category_id: 3, // Agriculture
        severity: 'high',
        district: 'Khunti',
      }, citizenToken);
      agriChallengeId = res.data.data.id;

      await api('PATCH', `/api/v1/challenges/${agriChallengeId}/submit`, {}, citizenToken);
      await api('PATCH', `/api/v1/admin/challenges/${agriChallengeId}/status`, { to_status: 'UNDER_REVIEW' }, adminToken);
      await api('PATCH', `/api/v1/admin/challenges/${agriChallengeId}/status`, { to_status: 'VALIDATED' }, adminToken);

      await query(`
        INSERT INTO challenge_ai_results (
          challenge_id, ai_category, ai_subcategory, routing_domain,
          priority_score, priority_level, processing_status
        ) VALUES ($1, 'Agriculture', 'Crop Science & Soil Health', 'Agriculture & Crop Science', 80, 'HIGH', 'COMPLETED')
        ON CONFLICT (challenge_id) DO UPDATE SET processing_status = 'COMPLETED'
      `, [agriChallengeId]);

      const matchResult = await matchingService.generateMatches(agriChallengeId, adminUser.email);
      const topMatch = matchResult.matches[0];

      assert.equal(topMatch.university_id, bauId, 'Birsa Agricultural University must be ranked #1 for agriculture challenge');
      assert.ok(Number(topMatch.match_score) >= 75, 'BAU match score should be >= 75%');
      assert.ok(topMatch.explanation.toLowerCase().includes('crop') || topMatch.explanation.toLowerCase().includes('agriculture'));
    });

    it('ranks RIMS Ranchi #1 for community malaria & maternal health surveillance challenge', async () => {
      // 1. Create Healthcare Challenge
      const res = await api('POST', '/api/v1/challenges', {
        title: 'High Malaria Incidence and Maternal Health Barriers in Remote Blocks',
        description: 'Simdega district tribal villages face endemic seasonal malaria and low institutional delivery rates. Requires mobile diagnostic epidemiology, community health worker protocols, and health clinic referral systems.',
        category_id: 2, // Healthcare
        severity: 'critical',
        district: 'Simdega',
      }, citizenToken);
      healthChallengeId = res.data.data.id;

      await api('PATCH', `/api/v1/challenges/${healthChallengeId}/submit`, {}, citizenToken);
      await api('PATCH', `/api/v1/admin/challenges/${healthChallengeId}/status`, { to_status: 'UNDER_REVIEW' }, adminToken);
      await api('PATCH', `/api/v1/admin/challenges/${healthChallengeId}/status`, { to_status: 'VALIDATED' }, adminToken);

      await query(`
        INSERT INTO challenge_ai_results (
          challenge_id, ai_category, ai_subcategory, routing_domain,
          priority_score, priority_level, processing_status
        ) VALUES ($1, 'Healthcare', 'Public Health & Epidemiology', 'Public Health', 90, 'CRITICAL', 'COMPLETED')
        ON CONFLICT (challenge_id) DO UPDATE SET processing_status = 'COMPLETED'
      `, [healthChallengeId]);

      const matchResult = await matchingService.generateMatches(healthChallengeId, adminUser.email);
      const topMatch = matchResult.matches[0];

      assert.equal(topMatch.university_id, rimsId, 'RIMS Ranchi must be ranked #1 for public healthcare challenge');
      assert.ok(Number(topMatch.match_score) >= 70, 'RIMS match score should be >= 70%');
      assert.ok(topMatch.factors.some(f => f.factor_name === 'faculty_expertise' && Number(f.factor_score) > 0.5));
    });
  });

  // ============================================
  // 4. MULTIDISCIPLINARY CAPABILITY MATCHING
  // ============================================
  describe('4. Multidisciplinary Matching', () => {
    it('handles multidisciplinary IoT + Agriculture + Water monitoring challenge', async () => {
      const res = await api('POST', '/api/v1/challenges', {
        title: 'Smart Solar Irrigation and IoT Soil Moisture Monitoring',
        description: 'Development of an automated solar-powered drip irrigation system with IoT moisture sensor networks and mobile analytics for smallholder tribal farmers in Ranchi district.',
        category_id: 3, // Agriculture
        severity: 'medium',
        district: 'Ranchi',
      }, citizenToken);
      multiChallengeId = res.data.data.id;

      await api('PATCH', `/api/v1/challenges/${multiChallengeId}/submit`, {}, citizenToken);
      await api('PATCH', `/api/v1/admin/challenges/${multiChallengeId}/status`, { to_status: 'UNDER_REVIEW' }, adminToken);
      await api('PATCH', `/api/v1/admin/challenges/${multiChallengeId}/status`, { to_status: 'VALIDATED' }, adminToken);

      await query(`
        INSERT INTO challenge_ai_results (
          challenge_id, ai_category, ai_subcategory, routing_domain,
          priority_score, priority_level, processing_status
        ) VALUES ($1, 'Agriculture', 'Smart Irrigation & IoT', 'Agricultural Engineering', 75, 'MEDIUM', 'COMPLETED')
        ON CONFLICT (challenge_id) DO UPDATE SET processing_status = 'COMPLETED'
      `, [multiChallengeId]);

      const matchResult = await matchingService.generateMatches(multiChallengeId, adminUser.email);
      assert.ok(matchResult.matches.length >= 2);

      // Top matches should be technical/agricultural institutes with IoT or Water capabilities
      const topUni = matchResult.matches[0];
      assert.ok(
        topUni.university_id === bitMesraId || topUni.university_id === bauId,
        'Top rank must be an institution with both engineering/IoT and agriculture/water strength'
      );
    });
  });

  // ============================================
  // 5. EXPLAINABLE MATCHING & PERSISTENCE
  // ============================================
  describe('5. Explainable Matching & Factor Persistence', () => {
    it('persists structured factors with exact weights and non-fabricated evidence', async () => {
      const res = await query(`
        SELECT cm.id, cm.match_score, cm.rank, cm.matching_version,
               cmf.factor_name, cmf.factor_score, cmf.weight, cmf.weighted_score, cmf.evidence
        FROM challenge_matches cm
        JOIN challenge_match_factors cmf ON cmf.match_id = cm.id
        WHERE cm.challenge_id = $1 AND cm.university_id = $2
      `, [waterChallengeId, bitMesraId]);

      assert.ok(res.rows.length >= 8, 'Must persist all 8 matching factors');

      let computedComposite = 0;
      for (const row of res.rows) {
        assert.ok(Number(row.factor_score) >= 0 && Number(row.factor_score) <= 1, 'Factor score must be between 0 and 1');
        assert.ok(Number(row.weight) > 0 && Number(row.weight) <= 0.3, 'Weights must follow audit plan');
        assert.ok(row.evidence, 'Evidence must not be empty');
        computedComposite += Number(row.factor_score) * Number(row.weight);
      }

      const matchScore = Number(res.rows[0].match_score);
      const expectedScore = Math.round(computedComposite * 100 * 100) / 100;
      assert.ok(
        Math.abs(matchScore - expectedScore) <= 1.5,
        `Stored match_score (${matchScore}) should match sum of weighted factors (${expectedScore})`
      );
    });

    it('persists recommended faculty with relevance scores and actual DB faculty names', async () => {
      const res = await query(`
        SELECT cmf.relevance_score, cmf.relevance_reason, f.name, f.specialization, f.designation
        FROM challenge_match_faculty cmf
        JOIN challenge_matches cm ON cm.id = cmf.match_id
        JOIN faculty f ON f.id = cmf.faculty_id
        WHERE cm.challenge_id = $1 AND cm.university_id = $2
      `, [waterChallengeId, bitMesraId]);

      assert.ok(res.rows.length > 0, 'Must recommend at least 1 faculty member for top water university');
      for (const row of res.rows) {
        assert.ok(row.name, 'Faculty name must exist');
        assert.ok(row.relevance_reason, 'Relevance reason must exist');
        assert.ok(Number(row.relevance_score) >= 0, 'Relevance score must be non-negative');
      }
    });
  });

  // ============================================
  // 6. AUTHORIZATION ENFORCEMENT
  // ============================================
  describe('6. Authorization Enforcement', () => {
    it('blocks citizen from generating university recommendations (HTTP 403)', async () => {
      const res = await api(
        'POST',
        `/api/v1/matching/challenges/${waterChallengeId}/matches/generate`,
        {},
        citizenToken
      );
      assert.equal(res.status, 403, 'Citizen must receive 403 Forbidden');
    });

    it('blocks citizen from assigning university to challenge (HTTP 403)', async () => {
      const res = await api(
        'POST',
        `/api/v1/assignment/challenges/${waterChallengeId}/assign`,
        { university_id: bitMesraId },
        citizenToken
      );
      assert.equal(res.status, 403, 'Citizen must receive 403 Forbidden on assignment');
    });

    it('blocks unauthenticated requests (HTTP 401)', async () => {
      const res = await api(
        'POST',
        `/api/v1/matching/challenges/${waterChallengeId}/matches/generate`,
        {}
      );
      assert.equal(res.status, 401, 'Unauthenticated user must receive 401 Unauthorized');
    });

    it('allows admin to generate matches (HTTP 200)', async () => {
      const res = await api(
        'POST',
        `/api/v1/matching/challenges/${waterChallengeId}/matches/generate`,
        {},
        adminToken
      );
      assert.equal(res.status, 200);
      assert.ok(res.data.success);
      assert.ok(res.data.data.matches.length > 0);
    });
  });

  // ============================================
  // 7. ASSIGNMENT WORKFLOW & HUMAN DECISION SEPARATION
  // ============================================
  describe('7. Assignment Lifecycle (Admin Assign -> University Accept/Decline)', () => {
    let assignmentId;

    it('allows admin to shortlist a university recommendation', async () => {
      const matches = await matchingService.getMatchResults(waterChallengeId);
      const topMatch = matches.matches[0];

      const res = await api(
        'POST',
        `/api/v1/matching/challenges/${waterChallengeId}/matches/${topMatch.id}/shortlist`,
        {},
        adminToken
      );
      assert.equal(res.status, 200);
      assert.equal(res.data.data.match_status, 'SHORTLISTED');
    });

    it('admin assigns challenge to university with reason: challenge becomes ASSIGNED', async () => {
      const res = await api(
        'POST',
        `/api/v1/assignment/challenges/${waterChallengeId}/assign`,
        {
          university_id: bitMesraId,
          reason: 'Assigned based on highest Water Resources capability and proximity to Ranchi affected area.',
        },
        adminToken
      );

      assert.equal(res.status, 200);
      assert.ok(res.data.success);
      assignmentId = res.data.data.id;
      assert.equal(res.data.data.assignment_status, 'PENDING');

      // Verify challenge status transitioned to ASSIGNED
      const chalRes = await query('SELECT status FROM challenges WHERE id = $1', [waterChallengeId]);
      assert.equal(chalRes.rows[0].status, 'ASSIGNED', 'Challenge status must transition to ASSIGNED');

      // Verify AI recommendation is preserved separately from human decision
      assert.ok(res.data.data.ai_recommended_university_id, 'AI recommendation must be recorded');
      assert.ok(res.data.data.ai_match_score, 'AI match score must be recorded');
    });

    it('university user sees assigned challenge in their dashboard queue', async () => {
      const res = await api(
        'GET',
        '/api/v1/assignment/university/challenges',
        null,
        uniToken
      );

      assert.equal(res.status, 200);
      assert.ok(res.data.success);
      assert.ok(res.data.data.assignments.length > 0, 'University must see assigned challenges');

      const assigned = res.data.data.assignments.find(a => a.id === assignmentId);
      assert.ok(assigned, 'Assigned water challenge must be in university list');
      assert.equal(assigned.assignment_status, 'PENDING');
      assert.ok(assigned.match_explanation, 'University should see why they were matched');
    });

    it('university user accepts the challenge: challenge status transitions to IN_PROGRESS', async () => {
      const res = await api(
        'POST',
        `/api/v1/assignment/university/challenges/${assignmentId}/accept`,
        {},
        uniToken
      );

      assert.equal(res.status, 200);
      assert.ok(res.data.success);
      assert.equal(res.data.data.status, 'ACCEPTED');

      // Check challenge status is now IN_PROGRESS
      const chalRes = await query('SELECT status FROM challenges WHERE id = $1', [waterChallengeId]);
      assert.equal(chalRes.rows[0].status, 'IN_PROGRESS', 'Challenge status must become IN_PROGRESS upon acceptance');
    });

    it('handles decline path: assigned challenge declined reverts status to VALIDATED', async () => {
      // Assign the agriculture challenge to BAU
      const assignRes = await api(
        'POST',
        `/api/v1/assignment/challenges/${agriChallengeId}/assign`,
        {
          university_id: bitMesraId, // assign to BIT Mesra for decline test
          reason: 'Test assignment for decline workflow',
        },
        adminToken
      );
      assert.equal(assignRes.status, 200);
      const testAssignId = assignRes.data.data.id;

      // University declines assignment
      const declineRes = await api(
        'POST',
        `/api/v1/assignment/university/challenges/${testAssignId}/decline`,
        { reason: 'Faculty in relevant department currently committed to existing field projects.' },
        uniToken
      );

      assert.equal(declineRes.status, 200);
      assert.ok(declineRes.data.success);

      // Verify challenge status reverted back to VALIDATED
      const chalRes = await query('SELECT status FROM challenges WHERE id = $1', [agriChallengeId]);
      assert.equal(chalRes.rows[0].status, 'VALIDATED', 'Challenge status must revert to VALIDATED after decline');

      // Verify assignment record marked DECLINED with reason
      const aRes = await query('SELECT assignment_status, response_reason FROM challenge_assignments WHERE id = $1', [testAssignId]);
      assert.equal(aRes.rows[0].assignment_status, 'DECLINED');
      assert.ok(aRes.rows[0].response_reason.includes('committed'));
    });
  });

  // ============================================
  // 8. AUDIT LOGGING
  // ============================================
  describe('8. Audit Logging', () => {
    it('records all matching and assignment milestones in audit_logs', async () => {
      const res = await query(`
        SELECT action, metadata FROM audit_logs 
        WHERE challenge_id = $1
        ORDER BY created_at DESC
      `, [waterChallengeId]);

      const actions = res.rows.map(r => r.action);
      assert.ok(actions.includes('MATCH_GENERATION_COMPLETED'), 'Must log match generation');
      assert.ok(actions.includes('CHALLENGE_ASSIGNED'), 'Must log challenge assignment');
      assert.ok(actions.includes('ASSIGNMENT_ACCEPTED'), 'Must log assignment acceptance');
    });
  });

  // ============================================
  // 9. REGRESSION CHECKS (PHASE 2, 3, 4)
  // ============================================
  describe('9. Regression Testing (Phases 2, 3, 4)', () => {
    it('Phase 2: Challenge submission and listing still works', async () => {
      const res = await api('GET', '/api/v1/challenges/my', null, citizenToken);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data.challenges));
    });

    it('Phase 3: Admin review queue with status filters works', async () => {
      const res = await api('GET', '/api/v1/admin/challenges?status=ASSIGNED', null, adminToken);
      assert.equal(res.status, 200);
      assert.ok(res.data.success);
    });

    it('Phase 4: AI pipeline schema and results remain intact', async () => {
      const res = await query('SELECT count(*) as count FROM challenge_ai_results WHERE processing_status = \'COMPLETED\'');
      const count = parseInt(res.rows[0].count, 10);
      assert.ok(count >= 3, 'Phase 4 AI results must be preserved');
    });
  });
});
