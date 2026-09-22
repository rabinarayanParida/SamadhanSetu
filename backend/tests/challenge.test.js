/**
 * SICP Phase 2: Citizen Challenge Submission API Tests
 * Run with: node --test tests/challenge.test.js
 *
 * Prerequisites:
 *   - Backend server running on PORT 5000
 *   - PostgreSQL running with Phase 2 schema initialized
 */

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

// Citizen A
const citizenA = {
  full_name: 'Ramesh Kumar',
  email: `ramesh_${Date.now()}@jharkhand.in`,
  password: 'Password@123',
  role: 'citizen',
  phone: '9876543211',
  district: 'Ranchi',
};

// Citizen B (for ownership tests)
const citizenB = {
  full_name: 'Pooja Sharma',
  email: `pooja_${Date.now()}@jharkhand.in`,
  password: 'Password@123',
  role: 'citizen',
  phone: '9876543212',
  district: 'Dhanbad',
};

// University user (role authorization test)
const uniUser = {
  full_name: 'Dr. Anita Roy',
  email: `anita_${Date.now()}@bitmesra.ac.in`,
  password: 'Password@123',
  role: 'university',
  organization: 'BIT Mesra',
  district: 'Ranchi',
};

let tokenA = '';
let tokenB = '';
let tokenUni = '';
let createdChallengeId = '';
let createdChallengeCode = '';
let secondChallengeId = '';

async function api(method, endpoint, body = null, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const opts = { method, headers };
  if (body) {
    opts.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, opts);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, data };
}

describe('Phase 2 — Citizen Challenge Submission Suite', () => {
  // Setup: Register test users
  before(async () => {
    const resA = await api('POST', '/api/auth/register', citizenA);
    if (resA.data?.data?.access_token) tokenA = resA.data.data.access_token;

    const resB = await api('POST', '/api/auth/register', citizenB);
    if (resB.data?.data?.access_token) tokenB = resB.data.data.access_token;

    const resUni = await api('POST', '/api/auth/register', uniUser);
    if (resUni.data?.data?.access_token) tokenUni = resUni.data.data.access_token;

    // Create the test challenge in setup
    const chRes = await api('POST', '/api/challenges', {
      title: 'Severely contaminated drinking water in Kanke block',
      description: 'The main underground supply pipeline has fractured near Kanke chowk, allowing sewage seepage into drinking water for 500 households.',
      category_id: 4,
      affected_population: 2500,
      severity: 'high',
      existing_attempts: 'Local residents filed complaints with municipal board twice, but no action taken.',
      expected_outcome: 'Complete repair of pipeline and water quality testing by municipal authorities.',
      location: {
        latitude: 23.4356,
        longitude: 85.3245,
        address: 'Kanke Road near Block Office',
        district: 'Ranchi',
        block: 'Kanke',
        village_city: 'Kanke',
        pincode: '834006',
      },
    }, tokenA);

    createdChallengeId = chRes.data?.data?.id;
    createdChallengeCode = chRes.data?.data?.challenge_id;

    const secRes = await api('POST', '/api/challenges', {
      title: 'Temporary test challenge for draft deletion',
      description: 'This is a test draft created specifically to verify the delete/withdraw draft functionality.',
    }, tokenA);
    secondChallengeId = secRes.data?.data?.id;
  });

  // 1. Categories
  describe('GET /api/challenges/categories', () => {
    it('should return list of challenge categories', async () => {
      const { status, data } = await api('GET', '/api/challenges/categories', null, tokenA);
      assert.equal(status, 200);
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.data.length > 0);
      assert.ok(data.data.some((c) => c.slug === 'education' || c.slug === 'water-resources'));
    });
  });

  // 2. Authentication & Authorization
  describe('Authorization Checks', () => {
    it('should reject unauthenticated user (401)', async () => {
      const { status } = await api('POST', '/api/challenges', {
        title: 'Contaminated water supply in Kanke area',
        description: 'The drinking water pipeline has been damaged for over 3 weeks causing severe contamination.',
      });
      assert.equal(status, 401);
    });

    it('should reject non-citizen user from creating a challenge (403)', async () => {
      const { status, data } = await api('POST', '/api/challenges', {
        title: 'Contaminated water supply in Kanke area',
        description: 'The drinking water pipeline has been damaged for over 3 weeks causing severe contamination.',
      }, tokenUni);
      assert.equal(status, 403);
      assert.equal(data.success, false);
    });
  });

  // 3. Validation
  describe('Challenge Input Validation', () => {
    it('should reject challenge with short title (< 10 chars)', async () => {
      const { status, data } = await api('POST', '/api/challenges', {
        title: 'Short',
        description: 'This description is long enough to meet the fifty characters minimum requirement for challenge submission.',
      }, tokenA);
      assert.equal(status, 400);
      assert.equal(data.success, false);
    });

    it('should reject challenge with short description (< 50 chars)', async () => {
      const { status, data } = await api('POST', '/api/challenges', {
        title: 'Water contamination in Kanke block',
        description: 'Too short description.',
      }, tokenA);
      assert.equal(status, 400);
      assert.equal(data.success, false);
    });

    it('should reject negative affected population', async () => {
      const { status, data } = await api('POST', '/api/challenges', {
        title: 'Water contamination in Kanke block',
        description: 'The drinking water pipeline has been damaged for over 3 weeks causing severe illness in the area.',
        affected_population: -50,
      }, tokenA);
      assert.equal(status, 400);
      assert.equal(data.success, false);
    });
  });

  // 4. Create Challenge & Code Generation
  describe('POST /api/challenges (Create Draft)', () => {
    it('should successfully create a draft challenge with valid fields and location', async () => {
      const payload = {
        title: 'Severely contaminated drinking water in Kanke block',
        description: 'The main underground supply pipeline has fractured near Kanke chowk, allowing sewage seepage into drinking water for 500 households.',
        category_id: 4, // Water Resources
        affected_population: 2500,
        severity: 'high',
        existing_attempts: 'Local residents filed complaints with municipal board twice, but no action taken.',
        expected_outcome: 'Complete repair of pipeline and water quality testing by municipal authorities.',
        location: {
          latitude: 23.4356,
          longitude: 85.3245,
          address: 'Kanke Road near Block Office',
          district: 'Ranchi',
          block: 'Kanke',
          village_city: 'Kanke',
          pincode: '834006',
        },
      };

      const { status, data } = await api('POST', '/api/challenges', payload, tokenA);
      assert.equal(status, 201);
      assert.equal(data.success, true);
      assert.ok(data.data.id);
      assert.ok(data.data.challenge_id);
      assert.match(data.data.challenge_id, /^(JH-CH-[A-Z0-9]{8}|SICP-\d{4}-\d{5})$/);
      assert.equal(data.data.status, 'DRAFT');

      createdChallengeId = data.data.id;
      createdChallengeCode = data.data.challenge_id;
    });

    it('should create a second draft for deletion tests', async () => {
      const payload = {
        title: 'Temporary test challenge for draft deletion',
        description: 'This is a test draft created specifically to verify the delete/withdraw draft functionality.',
      };
      const { status, data } = await api('POST', '/api/challenges', payload, tokenA);
      assert.equal(status, 201);
      secondChallengeId = data.data.id;
    });
  });

  // 5. Read Challenges & Ownership Verification
  describe('GET /api/challenges & Ownership', () => {
    it('citizen should see their own challenges in /my', async () => {
      const { status, data } = await api('GET', '/api/challenges/my', null, tokenA);
      assert.equal(status, 200);
      assert.equal(data.success, true);
      assert.ok(data.data.challenges.length >= 2);
      assert.ok(data.data.challenges.some((c) => c.id === createdChallengeId));
    });

    it('citizen should see challenge details with location and history', async () => {
      const { status, data } = await api('GET', `/api/challenges/${createdChallengeId}`, null, tokenA);
      assert.equal(status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.id, createdChallengeId);
      assert.equal(data.data.title, 'Severely contaminated drinking water in Kanke block');
      assert.ok(data.data.location);
      assert.equal(data.data.location.district, 'Ranchi');
      assert.equal(data.data.location.pincode, '834006');
    });

    it('citizen B must NOT be able to view citizen A private draft (403)', async () => {
      const { status, data } = await api('GET', `/api/challenges/${createdChallengeId}`, null, tokenB);
      assert.equal(status, 403);
      assert.equal(data.success, false);
    });

    it('citizen B must NOT be able to edit citizen A challenge (403)', async () => {
      const { status, data } = await api('PUT', `/api/challenges/${createdChallengeId}`, {
        title: 'Malicious modification attempt by unauthorized user',
        description: 'This modification should be completely rejected with 403 forbidden status.',
      }, tokenB);
      assert.equal(status, 403);
      assert.equal(data.success, false);
    });

    it('citizen B must NOT be able to delete citizen A challenge (403)', async () => {
      const { status, data } = await api('DELETE', `/api/challenges/${createdChallengeId}`, null, tokenB);
      assert.equal(status, 403);
      assert.equal(data.success, false);
    });
  });

  // 6. Media Upload & Validation
  describe('Challenge Media Upload', () => {
    it('should reject invalid file types (.exe / .sh)', async () => {
      const formData = new FormData();
      const fakeExe = new Blob(['binary data'], { type: 'application/x-msdownload' });
      formData.append('file', fakeExe, 'test.exe');

      const res = await fetch(`${BASE_URL}/api/challenges/${createdChallengeId}/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: formData,
      });
      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.success, false);
    });

    it('should upload a valid image file to the challenge', async () => {
      const formData = new FormData();
      // 1x1 transparent PNG
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      const imageBlob = new Blob([pngBuffer], { type: 'image/png' });
      formData.append('file', imageBlob, 'evidence_water.png');

      const res = await fetch(`${BASE_URL}/api/challenges/${createdChallengeId}/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: formData,
      });
      const data = await res.json();
      assert.equal(res.status, 201);
      assert.equal(data.success, true);
      assert.equal(data.data.file_type, 'photo');
      assert.equal(data.data.mime_type, 'image/png');
    });

    it('citizen B cannot delete citizen A media (403)', async () => {
      const { status } = await api(
        'DELETE',
        `/api/challenges/${createdChallengeId}/media/00000000-0000-0000-0000-000000000000`,
        null,
        tokenB
      );
      assert.equal(status, 403);
    });
  });

  // 7. Submit Challenge & Status History
  describe('PUT /api/challenges/:id/submit (Submit Flow)', () => {
    it('should submit challenge and transition status from DRAFT to SUBMITTED', async () => {
      const { status, data } = await api('PUT', `/api/challenges/${createdChallengeId}/submit`, null, tokenA);
      assert.equal(status, 200);
      assert.equal(data.success, true);
      assert.equal(data.data.status, 'SUBMITTED');
      assert.ok(data.data.submitted_at);
    });

    it('challenge detail should now include status history record for SUBMITTED', async () => {
      const { status, data } = await api('GET', `/api/challenges/${createdChallengeId}`, null, tokenA);
      assert.equal(status, 200);
      assert.equal(data.data.status, 'SUBMITTED');
      assert.ok(data.data.status_history.length >= 1);
      const subRecord = data.data.status_history.find((h) => h.to_status === 'SUBMITTED');
      assert.ok(subRecord);
      assert.equal(subRecord.from_status, 'DRAFT');
    });

    it('should reject editing a challenge once SUBMITTED (400)', async () => {
      const { status, data } = await api('PUT', `/api/challenges/${createdChallengeId}`, {
        title: 'Attempted edit on submitted challenge',
        description: 'This update should be rejected because the challenge is already submitted and not a draft.',
      }, tokenA);
      assert.equal(status, 400);
      assert.equal(data.success, false);
    });

    it('should reject deleting a challenge once SUBMITTED (400)', async () => {
      const { status, data } = await api('DELETE', `/api/challenges/${createdChallengeId}`, null, tokenA);
      assert.equal(status, 400);
      assert.equal(data.success, false);
    });
  });

  // 8. Delete Draft
  describe('DELETE /api/challenges/:id (Draft deletion)', () => {
    it('should allow citizen to delete their DRAFT challenge', async () => {
      const { status, data } = await api('DELETE', `/api/challenges/${secondChallengeId}`, null, tokenA);
      assert.equal(status, 200);
      assert.equal(data.success, true);
    });

    it('deleted draft should no longer exist (404)', async () => {
      const { status } = await api('GET', `/api/challenges/${secondChallengeId}`, null, tokenA);
      assert.equal(status, 404);
    });
  });

  // 9. Stats endpoint
  describe('GET /api/challenges/stats', () => {
    it('should return citizen statistics with submitted and total counts', async () => {
      const { status, data } = await api('GET', '/api/challenges/stats', null, tokenA);
      assert.equal(status, 200);
      assert.equal(data.success, true);
      assert.ok(parseInt(data.data.total, 10) >= 1);
      assert.ok(parseInt(data.data.submitted, 10) >= 1);
    });
  });
});
