/**
 * SICP Authentication API Tests
 * Run with: npm test (or node --test tests/auth.test.js)
 *
 * Prerequisites:
 *   - PostgreSQL running with sicp_portal database
 *   - Schema initialized (npm run db:init)
 *   - Backend server running on PORT 5000
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

// Test user data
const testUser = {
  full_name: 'Test Citizen',
  email: `test_citizen_${Date.now()}@example.com`,
  password: 'Test@1234',
  role: 'citizen',
  phone: '9876543210',
  district: 'Ranchi',
};

const testUniversityUser = {
  full_name: 'Prof. Test University',
  email: `test_uni_${Date.now()}@example.com`,
  password: 'UniTest@1234',
  role: 'university',
  organization: 'BIT Mesra',
  district: 'Ranchi',
};

let accessToken = '';
let refreshToken = '';
let uniAccessToken = '';

async function api(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

// ============================================
// Registration Tests
// ============================================

describe('POST /api/auth/register', () => {
  it('should register a new citizen user', async () => {
    const { status, data } = await api('POST', '/api/auth/register', testUser);
    assert.equal(status, 201);
    assert.equal(data.success, true);
    assert.equal(data.data.user.role, 'citizen');
    assert.equal(data.data.user.email, testUser.email);
    assert.ok(data.data.access_token);
    assert.ok(data.data.refresh_token);
    accessToken = data.data.access_token;
    refreshToken = data.data.refresh_token;
  });

  it('should register a university user', async () => {
    const { status, data } = await api('POST', '/api/auth/register', testUniversityUser);
    assert.equal(status, 201);
    assert.equal(data.data.user.role, 'university');
    uniAccessToken = data.data.access_token;
  });

  it('should reject duplicate email', async () => {
    const { status, data } = await api('POST', '/api/auth/register', testUser);
    assert.equal(status, 409);
    assert.equal(data.success, false);
  });

  it('should reject missing required fields', async () => {
    const { status, data } = await api('POST', '/api/auth/register', { email: 'test@test.com' });
    assert.equal(status, 400);
    assert.equal(data.success, false);
    assert.ok(data.errors.length > 0);
  });

  it('should reject weak passwords', async () => {
    const { status, data } = await api('POST', '/api/auth/register', {
      ...testUser,
      email: 'weak_pwd@test.com',
      password: '123',
    });
    assert.equal(status, 400);
    assert.equal(data.success, false);
  });

  it('should reject invalid role', async () => {
    const { status, data } = await api('POST', '/api/auth/register', {
      ...testUser,
      email: 'invalid_role@test.com',
      role: 'superuser',
    });
    assert.equal(status, 400);
    assert.equal(data.success, false);
  });
});

// ============================================
// Login Tests
// ============================================

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const { status, data } = await api('POST', '/api/auth/login', {
      email: testUser.email,
      password: testUser.password,
    });
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data.access_token);
    assert.ok(data.data.refresh_token);
    accessToken = data.data.access_token;
    refreshToken = data.data.refresh_token;
  });

  it('should reject wrong password', async () => {
    const { status, data } = await api('POST', '/api/auth/login', {
      email: testUser.email,
      password: 'WrongPassword@1',
    });
    assert.equal(status, 401);
    assert.equal(data.success, false);
  });

  it('should reject non-existent email', async () => {
    const { status, data } = await api('POST', '/api/auth/login', {
      email: 'nonexistent@example.com',
      password: 'Test@1234',
    });
    assert.equal(status, 401);
    assert.equal(data.success, false);
  });

  it('should reject missing fields', async () => {
    const { status, data } = await api('POST', '/api/auth/login', {});
    assert.equal(status, 400);
    assert.equal(data.success, false);
  });
});

// ============================================
// Protected Route Tests
// ============================================

describe('GET /api/auth/me', () => {
  it('should return user profile with valid token', async () => {
    const { status, data } = await api('GET', '/api/auth/me', null, accessToken);
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.user.email, testUser.email);
    assert.equal(data.data.user.role, 'citizen');
  });

  it('should reject request without token', async () => {
    const { status, data } = await api('GET', '/api/auth/me');
    assert.equal(status, 401);
    assert.equal(data.success, false);
  });

  it('should reject request with invalid token', async () => {
    const { status, data } = await api('GET', '/api/auth/me', null, 'invalid.token.here');
    assert.equal(status, 401);
    assert.equal(data.success, false);
  });
});

// ============================================
// Role-Based Access Control Tests
// ============================================

describe('Dashboard RBAC', () => {
  it('should allow citizen to access citizen dashboard', async () => {
    const { status, data } = await api('GET', '/api/dashboard/citizen', null, accessToken);
    assert.equal(status, 200);
    assert.equal(data.data.role, 'citizen');
  });

  it('should deny citizen from accessing university dashboard', async () => {
    const { status, data } = await api('GET', '/api/dashboard/university', null, accessToken);
    assert.equal(status, 403);
    assert.equal(data.success, false);
  });

  it('should deny citizen from accessing admin dashboard', async () => {
    const { status, data } = await api('GET', '/api/dashboard/admin', null, accessToken);
    assert.equal(status, 403);
  });

  it('should allow university to access university dashboard', async () => {
    const { status, data } = await api('GET', '/api/dashboard/university', null, uniAccessToken);
    assert.equal(status, 200);
    assert.equal(data.data.role, 'university');
  });

  it('should deny university from accessing citizen dashboard', async () => {
    const { status, data } = await api('GET', '/api/dashboard/citizen', null, uniAccessToken);
    assert.equal(status, 403);
  });

  it('should reject unauthenticated dashboard access', async () => {
    const { status } = await api('GET', '/api/dashboard/citizen');
    assert.equal(status, 401);
  });
});

// ============================================
// Token Refresh Tests
// ============================================

describe('POST /api/auth/refresh', () => {
  it('should refresh access token with valid refresh token', async () => {
    const { status, data } = await api('POST', '/api/auth/refresh', {
      refresh_token: refreshToken,
    });
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data.access_token);
    // Update access token for subsequent tests
    accessToken = data.data.access_token;
  });

  it('should reject invalid refresh token', async () => {
    const { status, data } = await api('POST', '/api/auth/refresh', {
      refresh_token: 'invalid.refresh.token',
    });
    assert.equal(status, 401);
    assert.equal(data.success, false);
  });

  it('should reject missing refresh token', async () => {
    const { status, data } = await api('POST', '/api/auth/refresh', {});
    assert.equal(status, 400);
  });
});

// ============================================
// Logout Tests
// ============================================

describe('POST /api/auth/logout', () => {
  it('should logout successfully', async () => {
    const { status, data } = await api('POST', '/api/auth/logout', { refresh_token: refreshToken }, accessToken);
    assert.equal(status, 200);
    assert.equal(data.success, true);
  });

  it('should reject logout without auth token', async () => {
    const { status } = await api('POST', '/api/auth/logout', {});
    assert.equal(status, 401);
  });
});

// ============================================
// Health Check
// ============================================

describe('GET /api/health', () => {
  it('should return health status', async () => {
    const { status, data } = await api('GET', '/api/health');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(data.message);
  });
});
