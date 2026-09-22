/**
 * SICP Phase 3: Admin / Government Challenge Review & Validation API Tests
 * Run with: node --test tests/admin.test.js
 *
 * Prerequisites:
 *   - Backend server running on PORT 5000
 *   - PostgreSQL running with Phase 1, Phase 2, and Phase 3 schemas initialized
 */

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

// Citizen User
const citizenUser = {
  full_name: 'Anil Soren',
  email: `anil_${Date.now()}@jharkhand.in`,
  password: 'Password@123',
  role: 'citizen',
  phone: '9876543230',
  district: 'Khunti',
};

// Admin User
const adminUser = {
  full_name: 'Super Admin',
  email: `admin_${Date.now()}@sicp.gov.in`,
  password: 'Password@123',
  role: 'admin',
  organization: 'Govt. of Jharkhand IT Dept',
};

// Government Reviewer User
const govtUser = {
  full_name: 'Officer Rajesh Verma',
  email: `rajesh_${Date.now()}@jharkhand.gov.in`,
  password: 'Password@123',
  role: 'government',
  organization: 'Rural Development Dept',
  district: 'Ranchi',
};

let citizenToken = '';
let adminToken = '';
let govtToken = '';
let testChallengeId = '';
let duplicateTargetId = '';

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
  } catch (e) {
    data = null;
  }
  return { status: res.status, data };
}

describe('Phase 3 — Admin / Government Challenge Review Suite', () => {
  before(async () => {
    // 1. Register users
    const cRes = await api('POST', '/api/auth/register', citizenUser);
    citizenToken = cRes.data?.data?.access_token;

    const aRes = await api('POST', '/api/auth/register', adminUser);
    adminToken = aRes.data?.data?.access_token;

    const gRes = await api('POST', '/api/auth/register', govtUser);
    govtToken = gRes.data?.data?.access_token;

    // 2. Citizen creates a challenge and submits it (DRAFT → SUBMITTED)
    const chRes = await api('POST', '/api/challenges', {
      title: 'Broken Solar Microgrid In Village Torpa',
      description: 'The community solar microgrid has been completely dysfunctional for the last four months affecting 80 households.',
      category_id: 7, // Energy
      affected_population: 400,
      severity: 'high',
      location: {
        latitude: 23.0123,
        longitude: 85.1234,
        address: 'Torpa Main Road',
        district: 'Khunti',
        block: 'Torpa',
        village_city: 'Torpa',
        pincode: '835227',
      },
    }, citizenToken);

    testChallengeId = chRes.data?.data?.id;

    // Submit it so it enters the review queue
    await api('PUT', `/api/challenges/${testChallengeId}/submit`, null, citizenToken);

    // 3. Create a second challenge to use as duplicate reference
    const dupRes = await api('POST', '/api/challenges', {
      title: 'Prior Solar Grid Failure in Torpa Block',
      description: 'An existing challenge documenting solar power plant malfunction in Torpa for duplicate testing purposes.',
    }, citizenToken);
    duplicateTargetId = dupRes.data?.data?.id;
    await api('PUT', `/api/challenges/${duplicateTargetId}/submit`, null, citizenToken);
  });

  // 1. Access Control & Authorization
  describe('RBAC & Route Protection', () => {
    it('unauthenticated user cannot access admin queue (401)', async () => {
      const { status } = await api('GET', '/api/admin/challenges');
      assert.equal(status, 401);
    });

    it('citizen user cannot access admin queue (403)', async () => {
      const { status, data } = await api('GET', '/api/admin/challenges', null, citizenToken);
      assert.equal(status, 403);
      assert.equal(data.success, false);
    });

    it('citizen user cannot access admin dashboard stats (403)', async () => {
      const { status, data } = await api('GET', '/api/admin/dashboard/stats', null, citizenToken);
      assert.equal(status, 403);
      assert.equal(data.success, false);
    });

    it('citizen user cannot change challenge status via admin endpoint (403)', async () => {
      const { status, data } = await api('PATCH', `/api/admin/challenges/${testChallengeId}/status`, {
        to_status: 'VALIDATED',
      }, citizenToken);
      assert.equal(status, 403);
      assert.equal(data.success, false);
    });
  });

  // 2. Admin & Government Queue Inspection
  describe('GET /api/admin/challenges (Review Queue)', () => {
    it('admin can list challenges in review queue', async () => {
      const { status, data } = await api('GET', '/api/admin/challenges', null, adminToken);
      assert.equal(status, 200);
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.data.challenges));
      assert.ok(data.data.challenges.length >= 2);
      assert.ok(data.data.challenges.some((c) => c.id === testChallengeId));
    });

    it('government reviewer can list challenges in review queue', async () => {
      const { status, data } = await api('GET', '/api/admin/challenges', null, govtToken);
      assert.equal(status, 200);
      assert.equal(data.success, true);
      assert.ok(data.data.challenges.length >= 2);
    });

    it('review queue filters by district', async () => {
      const { status, data } = await api('GET', '/api/admin/challenges?district=Khunti', null, adminToken);
      assert.equal(status, 200);
      assert.ok(data.data.challenges.every((c) => c.loc_district === 'Khunti'));
    });

    it('review queue search by keyword matches title', async () => {
      const { status, data } = await api('GET', '/api/admin/challenges?search=Microgrid', null, adminToken);
      assert.equal(status, 200);
      assert.ok(data.data.challenges.length >= 1);
      assert.ok(data.data.challenges[0].title.includes('Microgrid'));
    });
  });

  // 3. Challenge Review Detail
  describe('GET /api/admin/challenges/:id', () => {
    it('admin can view complete challenge details with submitter info', async () => {
      const { status, data } = await api('GET', `/api/admin/challenges/${testChallengeId}`, null, adminToken);
      assert.equal(status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.id, testChallengeId);
      assert.equal(data.data.submitter_name, citizenUser.full_name);
      assert.ok(data.data.location);
      assert.equal(data.data.location.district, 'Khunti');
      assert.ok(Array.isArray(data.data.status_history));
      assert.ok(Array.isArray(data.data.review_notes));
    });
  });

  // 4. Status Transitions & Validation State Machine
  describe('PATCH /api/admin/challenges/:id/status (Workflow)', () => {
    it('rejects invalid direct transition (SUBMITTED → VALIDATED without review)', async () => {
      const { status, data } = await api('PATCH', `/api/admin/challenges/${testChallengeId}/status`, {
        to_status: 'VALIDATED',
      }, adminToken);
      assert.equal(status, 400);
      assert.equal(data.success, false);
      assert.ok(data.message.includes('Invalid status transition'));
    });

    it('reviewer moves challenge from SUBMITTED → UNDER_REVIEW', async () => {
      const { status, data } = await api('PATCH', `/api/admin/challenges/${testChallengeId}/status`, {
        to_status: 'UNDER_REVIEW',
        comment: 'Initial review initiated by administrator.',
      }, adminToken);
      assert.equal(status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.status, 'UNDER_REVIEW');
    });

    it('rejects REJECTED status if comment/reason is missing or too short', async () => {
      const { status, data } = await api('PATCH', `/api/admin/challenges/${testChallengeId}/status`, {
        to_status: 'REJECTED',
        comment: '',
      }, adminToken);
      assert.equal(status, 400);
      assert.equal(data.success, false);
    });

    it('rejects NEEDS_INFORMATION if reason is missing', async () => {
      const { status, data } = await api('PATCH', `/api/admin/challenges/${testChallengeId}/status`, {
        to_status: 'NEEDS_INFORMATION',
      }, adminToken);
      assert.equal(status, 400);
      assert.equal(data.success, false);
    });

    it('successfully requests information: UNDER_REVIEW → NEEDS_INFORMATION', async () => {
      const { status, data } = await api('PATCH', `/api/admin/challenges/${testChallengeId}/status`, {
        to_status: 'NEEDS_INFORMATION',
        comment: 'Please provide photographs of the solar inverter panel and battery room.',
      }, adminToken);
      assert.equal(status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.status, 'NEEDS_INFORMATION');
    });

    it('citizen updates and re-submits challenge in response to NEEDS_INFORMATION', async () => {
      // Citizen updates challenge description
      const updateRes = await api('PUT', `/api/challenges/${testChallengeId}`, {
        title: 'Broken Solar Microgrid In Village Torpa (Updated)',
        description: 'Updated with detailed inverter specifications: 10kW central inverter model S-2021 showing error code E04.',
      }, citizenToken);
      assert.equal(updateRes.status, 200);

      // Citizen re-submits
      const subRes = await api('PUT', `/api/challenges/${testChallengeId}/submit`, null, citizenToken);
      assert.equal(subRes.status, 200);
      assert.equal(subRes.data.data.status, 'SUBMITTED');
    });

    it('reviewer re-opens: SUBMITTED → UNDER_REVIEW', async () => {
      const { status, data } = await api('PATCH', `/api/admin/challenges/${testChallengeId}/status`, {
        to_status: 'UNDER_REVIEW',
        comment: 'Reviewing citizen updated specifications.',
      }, govtToken);
      assert.equal(status, 200);
      assert.equal(data.data.status, 'UNDER_REVIEW');
    });

    it('reviewer marks potential duplicate with duplicate reference', async () => {
      const { status, data } = await api('PATCH', `/api/admin/challenges/${testChallengeId}/status`, {
        to_status: 'POTENTIAL_DUPLICATE',
        comment: 'Appears to refer to the same power station failure reported in another submission.',
        duplicate_of_id: duplicateTargetId,
      }, adminToken);
      assert.equal(status, 200);
      assert.equal(data.data.status, 'POTENTIAL_DUPLICATE');
      assert.equal(data.data.duplicate_of_id, duplicateTargetId);
    });

    it('reviewer re-evaluates duplicate: POTENTIAL_DUPLICATE → UNDER_REVIEW', async () => {
      const { status, data } = await api('PATCH', `/api/admin/challenges/${testChallengeId}/status`, {
        to_status: 'UNDER_REVIEW',
        comment: 'Confirmed different hamlet unit, not a duplicate.',
      }, adminToken);
      assert.equal(status, 200);
      assert.equal(data.data.status, 'UNDER_REVIEW');
    });

    it('reviewer validates challenge: UNDER_REVIEW → VALIDATED', async () => {
      const { status, data } = await api('PATCH', `/api/admin/challenges/${testChallengeId}/status`, {
        to_status: 'VALIDATED',
        comment: 'Location and societal impact verified by district officer. Ready for university innovation matching.',
      }, govtToken);
      assert.equal(status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.status, 'VALIDATED');
    });
  });

  // 5. Internal Review Notes & Privacy Protection
  describe('Internal Review Notes Isolation', () => {
    it('reviewer can add an internal review note', async () => {
      const { status, data } = await api('POST', `/api/admin/challenges/${testChallengeId}/review-notes`, {
        note: 'Internal note: Discussed with Torpa BDO. Department has approved site inspection.',
      }, adminToken);
      assert.equal(status, 201);
      assert.equal(data.success, true);
      assert.ok(data.data.id);
      assert.equal(data.data.author_name, adminUser.full_name);
    });

    it('internal notes are NOT exposed to citizen in /api/challenges/:id', async () => {
      const { status, data } = await api('GET', `/api/challenges/${testChallengeId}`, null, citizenToken);
      assert.equal(status, 200);
      assert.equal(data.data.review_notes, undefined);
    });

    it('citizen sees updated VALIDATED status and status history', async () => {
      const { status, data } = await api('GET', `/api/challenges/${testChallengeId}`, null, citizenToken);
      assert.equal(status, 200);
      assert.equal(data.data.status, 'VALIDATED');
      assert.ok(data.data.status_history.length >= 4);
      const valHistory = data.data.status_history.find((h) => h.to_status === 'VALIDATED');
      assert.ok(valHistory);
      assert.ok(valHistory.comment.includes('Location and societal impact verified'));
    });
  });

  // 6. Metadata Corrections
  describe('PATCH /api/admin/challenges/:id/metadata', () => {
    it('reviewer can correct challenge category', async () => {
      const { status, data } = await api('PATCH', `/api/admin/challenges/${testChallengeId}/metadata`, {
        category_id: 9, // Rural Livelihoods
      }, adminToken);
      assert.equal(status, 200);
      assert.equal(data.data.category_id, 9);
    });
  });

  // 7. Dashboard Live Statistics
  describe('GET /api/admin/dashboard/stats', () => {
    it('returns aggregated counts across all statuses and districts', async () => {
      const { status, data } = await api('GET', '/api/admin/dashboard/stats', null, adminToken);
      assert.equal(status, 200);
      assert.equal(data.success, true);
      assert.ok(parseInt(data.data.overview.total_challenges, 10) >= 2);
      assert.ok(parseInt(data.data.overview.validated, 10) >= 1);
      assert.ok(Array.isArray(data.data.categories));
      assert.ok(Array.isArray(data.data.districts));
      assert.ok(Array.isArray(data.data.recent_activity));
    });
  });
});
