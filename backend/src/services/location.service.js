/**
 * Location Service
 * Provides hierarchical administrative location master data
 * and validates cascading administrative boundaries.
 */

const { query } = require('../config/db');

/**
 * Get all active states
 */
async function getStates() {
  const res = await query(
    'SELECT id, name, code FROM states WHERE is_active = true ORDER BY (CASE WHEN name = \'Jharkhand\' THEN 0 ELSE 1 END), name ASC'
  );
  return res.rows;
}

/**
 * Get districts by state ID or state name
 */
async function getDistricts(stateIdentifier) {
  let res;
  if (!isNaN(Number(stateIdentifier))) {
    res = await query(
      'SELECT id, state_id, name FROM districts WHERE state_id = $1 AND is_active = true ORDER BY name ASC',
      [Number(stateIdentifier)]
    );
  } else {
    res = await query(
      `SELECT d.id, d.state_id, d.name 
       FROM districts d
       JOIN states s ON s.id = d.state_id
       WHERE LOWER(s.name) = LOWER($1) AND d.is_active = true
       ORDER BY d.name ASC`,
      [String(stateIdentifier).trim()]
    );
  }
  return res.rows;
}

/**
 * Get blocks by district ID or district name
 */
async function getBlocks(districtIdentifier) {
  let res;
  if (!isNaN(Number(districtIdentifier))) {
    res = await query(
      'SELECT id, district_id, name FROM blocks WHERE district_id = $1 AND is_active = true ORDER BY name ASC',
      [Number(districtIdentifier)]
    );
  } else {
    res = await query(
      `SELECT b.id, b.district_id, b.name 
       FROM blocks b
       JOIN districts d ON d.id = b.district_id
       WHERE LOWER(d.name) = LOWER($1) AND b.is_active = true
       ORDER BY b.name ASC`,
      [String(districtIdentifier).trim()]
    );
  }
  return res.rows;
}

/**
 * Get localities / villages by block ID or block name
 */
async function getLocalities(blockIdentifier) {
  let res;
  if (!isNaN(Number(blockIdentifier))) {
    res = await query(
      'SELECT id, block_id, name, pincode, latitude, longitude FROM localities WHERE block_id = $1 AND is_active = true ORDER BY name ASC',
      [Number(blockIdentifier)]
    );
  } else {
    res = await query(
      `SELECT l.id, l.block_id, l.name, l.pincode, l.latitude, l.longitude 
       FROM localities l
       JOIN blocks b ON b.id = l.block_id
       WHERE LOWER(b.name) = LOWER($1) AND l.is_active = true
       ORDER BY l.name ASC`,
      [String(blockIdentifier).trim()]
    );
  }
  return res.rows;
}

/**
 * Validate consistency of hierarchical location selection
 * Ensures that district belongs to state, and block belongs to district.
 */
async function validateHierarchy({ state, district, block, village_city }) {
  if (!district && !block) {
    return { valid: true };
  }

  // If district is provided with state, verify relationship
  if (state && district) {
    const res = await query(
      `SELECT d.id FROM districts d
       JOIN states s ON s.id = d.state_id
       WHERE LOWER(s.name) = LOWER($1) AND LOWER(d.name) = LOWER($2)`,
      [state.trim(), district.trim()]
    );
    if (res.rows.length === 0) {
      return {
        valid: false,
        message: `District '${district}' does not belong to State '${state}'.`,
      };
    }
  }

  // If block is provided with district, verify relationship
  if (district && block) {
    const res = await query(
      `SELECT b.id FROM blocks b
       JOIN districts d ON d.id = b.district_id
       WHERE LOWER(d.name) = LOWER($1) AND LOWER(b.name) = LOWER($2)`,
      [district.trim(), block.trim()]
    );
    if (res.rows.length === 0) {
      return {
        valid: false,
        message: `Block '${block}' does not belong to District '${district}'.`,
      };
    }
  }

  return { valid: true };
}

module.exports = {
  getStates,
  getDistricts,
  getBlocks,
  getLocalities,
  validateHierarchy,
};
