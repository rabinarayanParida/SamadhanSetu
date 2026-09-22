/**
 * SICP Phase 4: AI Problem Intelligence Engine API Tests
 * Run with: node --test tests/ai.test.js
 *
 * Prerequisites:
 *   - Backend server running on PORT 5000
 *   - Python AI Microservice running on PORT 8000
 *   - PostgreSQL running with Phase 1, 2, 3, and 4 schemas initialized
 */

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

const timestamp = Date.now();

// Citizen User
const citizenUser = {
  full_name: 'Budhan Manjhi',
  email: `budhan_${timestamp}@jharkhand.in`,
  password: 'Password@123',
  role: 'citizen',
  district: 'Ranchi',
};

// Admin User
const adminUser = {
  full_name: 'Dr. Sunita Sharma',
  email: `sunita_${timestamp}@sicp.gov.in`,
  password: 'Password@123',
  role: 'admin',
  organization: 'Govt. of Jharkhand IT Department',
};

let citizenToken = '';
let adminToken = '';
let waterCategoryId = null;

let challengeAId = '';
let challengeBId = '';

async function api(method, endpoint, body = null, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, opts);
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

describe('SICP Phase 4: AI Problem Intelligence Suite', () => {
  before(async () => {
    // 1. Register and login citizen
    const cReg = await api('POST', '/api/auth/register', citizenUser);
    citizenToken = cReg.data?.data?.access_token;
    if (!citizenToken) {
      const cLog = await api('POST', '/api/auth/login', {
        email: citizenUser.email,
        password: citizenUser.password,
      });
      citizenToken = cLog.data?.data?.access_token;
    }
    assert.ok(citizenToken, 'Citizen token must exist');

    // 2. Register and login admin
    const aReg = await api('POST', '/api/auth/register', adminUser);
    adminToken = aReg.data?.data?.access_token;
    if (!adminToken) {
      const aLog = await api('POST', '/api/auth/login', {
        email: adminUser.email,
        password: adminUser.password,
      });
      adminToken = aLog.data?.data?.access_token;
    }
    assert.ok(adminToken, 'Admin token must exist');

    // 3. Get Water Resources category ID
    const catRes = await api('GET', '/api/challenges/categories', null, citizenToken);
    assert.equal(catRes.status, 200);
    const waterCat = catRes.data.data.find(
      (c) => c.name.toLowerCase().includes('water')
    );
    waterCategoryId = waterCat ? waterCat.id : catRes.data.data[0].id;
  });

  it('1. Citizen creates Challenge A (Drinking water crisis)', async () => {
    const res = await api(
      'POST',
      '/api/challenges',
      {
        title: 'Severe Drinking Water Shortage in Village Rampur',
        description:
          'Over 150 families in Rampur village have no access to potable drinking water. The only hand pump broke down 3 months ago, forcing women to walk 4 kilometers daily. Children are showing symptoms of waterborne diseases.',
        category_id: waterCategoryId,
        severity: 'high',
        affected_population: '800',
        existing_attempts: 'Complaint submitted to block office last month, no response.',
        expected_outcome: 'Installation of a deep borewell with solar water filtration system.',
        location: {
          district: 'Ranchi',
          block: 'Kanke',
          village_city: 'Rampur',
          address: 'Main Chowk, Rampur',
          pincode: '834006',
          latitude: 23.4123,
          longitude: 85.3124,
        },
      },
      citizenToken
    );

    assert.equal(res.status, 201);
    challengeAId = res.data.data.id;
    assert.ok(challengeAId);

    // Submit Challenge A so it reaches SUBMITTED status
    const subRes = await api('PUT', `/api/challenges/${challengeAId}/submit`, {}, citizenToken);
    assert.equal(subRes.status, 200);
  });

  it('2. Unauthorized non-admin citizen cannot trigger AI processing', async () => {
    const res = await api('POST', `/api/ai/challenges/${challengeAId}/process`, {}, citizenToken);
    assert.equal(res.status, 403);
  });

  it('3. Admin triggers AI Problem Intelligence processing on Challenge A', async () => {
    const res = await api('POST', `/api/ai/challenges/${challengeAId}/process`, {}, adminToken);
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);

    const ai = res.data.data.ai_results;
    assert.ok(ai);
    assert.equal(ai.processing_status, 'COMPLETED');

    // Classification verification
    assert.ok(ai.ai_category);
    assert.ok(ai.ai_subcategory);
    assert.ok(ai.classification_confidence > 0.5);

    // Validation verification
    assert.equal(ai.is_valid, true);
    assert.ok(ai.quality_score >= 50);
    assert.ok(Array.isArray(ai.missing_information));
    assert.ok(Array.isArray(ai.validation_warnings));

    // Priority scoring verification
    assert.ok(ai.priority_score >= 50);
    assert.ok(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(ai.priority_level));
    assert.ok(ai.priority_factors.population_impact >= 0);
    assert.ok(ai.priority_factors.severity >= 0);
    assert.ok(ai.priority_factors.urgency >= 0);
    assert.ok(ai.priority_factors.geographic_impact >= 0);
    assert.ok(ai.priority_factors.feasibility >= 0);

    // Routing recommendation verification
    assert.ok(ai.routing_domain);
    assert.ok(ai.routing_confidence > 0.5);

    // Versioning metadata verification
    assert.ok(ai.model_name);
    assert.ok(ai.prompt_version);
    assert.ok(ai.pipeline_version);
  });

  it('4. Admin retrieves AI Intelligence data via GET /api/ai/challenges/:id', async () => {
    const res = await api('GET', `/api/ai/challenges/${challengeAId}`, null, adminToken);
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.ai_results);
    assert.equal(res.data.data.ai_results.processing_status, 'COMPLETED');
  });

  it('5. Admin records a human override while preserving the original AI suggestion', async () => {
    const overrideRes = await api(
      'PATCH',
      `/api/ai/challenges/${challengeAId}/override`,
      {
        field_name: 'category',
        human_value: 'Public Administration',
        reason: 'The root cause is administrative neglect and failure of block maintenance contracts.',
      },
      adminToken
    );

    assert.equal(overrideRes.status, 200);
    assert.equal(overrideRes.data.success, true);

    const fullAI = overrideRes.data.data.ai;
    // Verify human override was saved
    assert.ok(fullAI.overrides.length > 0);
    const catOverride = fullAI.overrides.find((o) => o.field_name === 'category');
    assert.ok(catOverride);
    assert.equal(catOverride.human_value, 'Public Administration');

    // Verify AI suggestion was NOT overwritten
    assert.notEqual(fullAI.ai_results.ai_category, 'Public Administration');
  });

  it('6. Citizen creates Challenge B (Semantically similar water shortage)', async () => {
    const res = await api(
      'POST',
      '/api/challenges',
      {
        title: 'Potable Water Scarcity and Broken Pumps in Rampur Village',
        description:
          'Residents of Rampur are suffering from acute shortage of clean drinking water because the local hand pumps are dysfunctional. Families travel long distances daily for potable water.',
        category_id: waterCategoryId,
        severity: 'high',
        affected_population: '800',
        existing_attempts: 'Local complaints filed with Panchayat.',
        expected_outcome: 'Repairs of hand pumps and permanent water tanker supply.',
        location: {
          district: 'Ranchi',
          block: 'Kanke',
          village_city: 'Rampur',
          address: 'Rampur North Ward',
          pincode: '834006',
          latitude: 23.4125,
          longitude: 85.3129,
        },
      },
      citizenToken
    );

    assert.equal(res.status, 201);
    challengeBId = res.data.data.id;
    assert.ok(challengeBId);

    // Submit Challenge B
    await api('PUT', `/api/challenges/${challengeBId}/submit`, {}, citizenToken);
  });

  it('7. Admin runs AI on Challenge B and detects Challenge A as a semantic duplicate candidate', async () => {
    const res = await api('POST', `/api/ai/challenges/${challengeBId}/process`, {}, adminToken);
    assert.equal(res.status, 200);

    const candidates = res.data.data.duplicate_candidates;
    assert.ok(Array.isArray(candidates));
    assert.ok(candidates.length > 0, 'Expected semantic duplicate candidate to be found');

    const matchA = candidates.find((c) => c.candidate_id === challengeAId);
    assert.ok(matchA, 'Challenge A should appear as candidate duplicate for Challenge B');
    assert.ok(
      matchA.similarity_score >= 0.40,
      `Expected similarity >= 0.40, got ${matchA.similarity_score}`
    );
    assert.equal(matchA.review_status, 'PENDING');
  });

  it('8. Admin manually reviews duplicate candidate (Confirm Duplicate)', async () => {
    const res = await api(
      'PATCH',
      `/api/ai/challenges/${challengeBId}/duplicates/${challengeAId}`,
      {
        review_status: 'CONFIRMED_DUPLICATE',
        comment: 'Verified that both challenges describe the same hand pump crisis in Rampur village.',
      },
      adminToken
    );

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.duplicate.review_status, 'CONFIRMED_DUPLICATE');
  });

  it('9. Admin retries AI analysis via POST /api/ai/challenges/:id/retry', async () => {
    const res = await api('POST', `/api/ai/challenges/${challengeAId}/retry`, {}, adminToken);
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.ai_results.processing_status, 'COMPLETED');
  });

  it('10. Admin review detail API returns enriched AI intelligence data', async () => {
    const res = await api('GET', `/api/admin/challenges/${challengeAId}`, null, adminToken);
    assert.equal(res.status, 200);
    assert.ok(res.data.data.ai_intelligence);
    assert.ok(res.data.data.ai_intelligence.ai_results);
    assert.equal(res.data.data.ai_intelligence.ai_results.processing_status, 'COMPLETED');
  });
});
