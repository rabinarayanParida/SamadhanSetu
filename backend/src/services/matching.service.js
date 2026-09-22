/**
 * Matching Service — Phase 5
 * AI-assisted university matching engine.
 * Consumes Phase 4 outputs and university capability data
 * to generate ranked, explainable institutional recommendations.
 *
 * Scoring Weights:
 *   domain_expertise    25%
 *   faculty_expertise   20%
 *   research_match      15%
 *   lab_capability      15%
 *   previous_projects   10%
 *   innovation_cap       5%
 *   geographic_suit      5%
 *   capacity_avail       5%
 */

const crypto = require('crypto');
const { pool, query } = require('../config/db');
const universityService = require('./university.service');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const AI_SERVICE_SECRET = process.env.AI_SERVICE_SECRET || 'dev_sicp_ai_internal_token_2026';

const MATCHING_VERSION = 'v1.0';

const FACTOR_WEIGHTS = {
  domain_expertise: 0.25,
  faculty_expertise: 0.20,
  research_match: 0.15,
  lab_capability: 0.15,
  previous_projects: 0.10,
  innovation_capability: 0.05,
  geographic_suitability: 0.05,
  capacity_availability: 0.05,
};

// ============================================
// Main Entry: Generate Matches
// ============================================

async function generateMatches(challengeId, reviewerId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch challenge + Phase 4 AI data
    const challengeRes = await client.query(
      `SELECT c.id, c.challenge_id, c.title, c.description, c.severity,
              c.affected_population, c.existing_attempts, c.expected_outcome, c.status,
              cat.name AS citizen_category, cat.slug AS category_slug,
              loc.district AS challenge_district, loc.block, loc.village_city,
              ai.ai_category, ai.ai_subcategory, ai.routing_domain,
              ai.priority_score, ai.priority_level, ai.processing_status
       FROM challenges c
       LEFT JOIN challenge_categories cat ON cat.id = c.category_id
       LEFT JOIN challenge_locations loc ON loc.challenge_id = c.id
       LEFT JOIN challenge_ai_results ai ON ai.challenge_id = c.id
       WHERE c.id = $1`,
      [challengeId]
    );

    if (challengeRes.rows.length === 0) {
      throw new Error('Challenge not found.');
    }
    const challenge = challengeRes.rows[0];

    // 2. Eligibility checks
    if (!['VALIDATED', 'UNDER_REVIEW'].includes(challenge.status)) {
      throw new Error(`Challenge must be VALIDATED before matching. Current status: ${challenge.status}`);
    }
    if (!challenge.processing_status || challenge.processing_status !== 'COMPLETED') {
      throw new Error('Challenge must complete AI processing (Phase 4) before university matching can be generated.');
    }

    // 3. Read effective AI values (check for human overrides)
    const overridesRes = await client.query(
      `SELECT field_name, human_value FROM challenge_ai_overrides
       WHERE challenge_id = $1 ORDER BY created_at DESC`,
      [challengeId]
    );
    const overrides = {};
    for (const o of overridesRes.rows) {
      if (!overrides[o.field_name]) overrides[o.field_name] = o.human_value;
    }

    const effectiveCategory = overrides.category || challenge.ai_category || challenge.citizen_category || '';
    const effectiveSubcategory = overrides.subcategory || challenge.ai_subcategory || '';
    const effectiveRouting = overrides.routing_domain || challenge.routing_domain || '';

    // 4. Extract required capabilities
    const requiredCapabilities = extractCapabilities(effectiveCategory, effectiveSubcategory, effectiveRouting, challenge);

    // 5. Fetch challenge embedding (from Phase 4)
    const embRes = await client.query(
      'SELECT embedding FROM challenge_embeddings WHERE challenge_id = $1',
      [challengeId]
    );
    const challengeEmbedding = embRes.rows.length > 0
      ? (typeof embRes.rows[0].embedding === 'string' ? JSON.parse(embRes.rows[0].embedding) : embRes.rows[0].embedding)
      : null;

    // 6. Fetch all active universities
    const uniRes = await client.query(
      'SELECT id FROM universities WHERE is_active = true ORDER BY name'
    );

    if (uniRes.rows.length === 0) {
      throw new Error('No active universities found in the directory.');
    }

    // 7. Score each university
    const scoredUniversities = [];

    for (const uniRow of uniRes.rows) {
      const profile = await universityService.getUniversityProfile(uniRow.id);
      if (!profile) continue;

      const factors = calculateFactors(
        challenge, profile, requiredCapabilities,
        effectiveCategory, effectiveSubcategory, effectiveRouting,
        challengeEmbedding
      );

      // Calculate composite score
      let totalScore = 0;
      for (const [factorName, weight] of Object.entries(FACTOR_WEIGHTS)) {
        const factorScore = factors[factorName]?.score || 0;
        totalScore += factorScore * weight;
      }
      const compositeScore = Math.round(totalScore * 100 * 100) / 100; // 0-100

      // Find best matching department
      const bestDept = findBestDepartment(profile, requiredCapabilities, effectiveRouting);

      // Find relevant faculty
      const relevantFaculty = findRelevantFaculty(profile, requiredCapabilities);

      scoredUniversities.push({
        university_id: profile.id,
        university: profile,
        department_id: bestDept?.id || null,
        department: bestDept,
        match_score: compositeScore,
        factors,
        relevant_faculty: relevantFaculty.slice(0, 5),
      });
    }

    // 8. Rank by score descending
    scoredUniversities.sort((a, b) => b.match_score - a.match_score);

    // 9. Generate explanations for top results
    const topN = Math.min(scoredUniversities.length, 10);
    for (let i = 0; i < topN; i++) {
      scoredUniversities[i].rank = i + 1;
      scoredUniversities[i].explanation = generateExplanation(
        scoredUniversities[i], requiredCapabilities, effectiveCategory, effectiveRouting
      );
    }

    // 10. Clear old matches for this challenge+version
    await client.query(
      `DELETE FROM challenge_matches WHERE challenge_id = $1 AND matching_version = $2`,
      [challengeId, MATCHING_VERSION]
    );

    // 11. Persist top N matches with factors
    for (let i = 0; i < topN; i++) {
      const scored = scoredUniversities[i];

      const matchInsertRes = await client.query(
        `INSERT INTO challenge_matches 
         (challenge_id, university_id, department_id, match_score, rank, match_status, explanation, matching_version, model_version)
         VALUES ($1, $2, $3, $4, $5, 'RECOMMENDED', $6, $7, $8)
         RETURNING id`,
        [
          challengeId, scored.university_id, scored.department_id,
          scored.match_score, scored.rank, scored.explanation,
          MATCHING_VERSION, 'structured-scoring-v1'
        ]
      );
      const matchId = matchInsertRes.rows[0].id;

      // Persist factors
      for (const [factorName, factorData] of Object.entries(scored.factors)) {
        const weight = FACTOR_WEIGHTS[factorName] || 0;
        const fScore = Math.min(1, Math.max(0, Math.round((factorData.score || 0) * 1000) / 1000));
        const wScore = Math.min(1, Math.max(0, Math.round(fScore * weight * 1000) / 1000));
        await client.query(
          `INSERT INTO challenge_match_factors (match_id, factor_name, factor_score, weight, weighted_score, evidence)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [matchId, factorName, fScore, weight, wScore, factorData.evidence]
        );
      }

      // Persist faculty recommendations
      for (const fac of scored.relevant_faculty) {
        const relScore = Math.min(1, Math.max(0, Math.round((fac.relevance_score || 0) * 1000) / 1000));
        await client.query(
          `INSERT INTO challenge_match_faculty (match_id, faculty_id, relevance_score, relevance_reason)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (match_id, faculty_id) DO NOTHING`,
          [matchId, fac.id, relScore, fac.relevance_reason]
        );
      }
    }

    // 12. Audit log
    let validUserId = null;
    if (reviewerId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reviewerId);
      if (isUuid) {
        validUserId = reviewerId;
      } else {
        const uRes = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [reviewerId]);
        if (uRes.rows.length > 0) validUserId = uRes.rows[0].id;
      }
    }

    await client.query(
      `INSERT INTO audit_logs (user_id, action, challenge_id, metadata)
       VALUES ($1, 'MATCH_GENERATION_COMPLETED', $2, $3)`,
      [
        validUserId, challengeId,
        JSON.stringify({
          matching_version: MATCHING_VERSION,
          universities_scored: scoredUniversities.length,
          top_match_score: topN > 0 ? scoredUniversities[0].match_score : 0,
          required_capabilities: requiredCapabilities,
        })
      ]
    );

    await client.query('COMMIT');
    return await getMatchResults(challengeId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ============================================
// Factor Calculation
// ============================================

function calculateFactors(challenge, profile, requiredCapabilities, category, subcategory, routingDomain, challengeEmbedding) {
  const factors = {};

  // 1. Domain Expertise (0-1)
  factors.domain_expertise = scoreDomainExpertise(profile, requiredCapabilities, routingDomain, category);

  // 2. Faculty Expertise (0-1)
  factors.faculty_expertise = scoreFacultyExpertise(profile, requiredCapabilities);

  // 3. Research Match (0-1)
  factors.research_match = scoreResearchMatch(profile, requiredCapabilities, routingDomain, category);

  // 4. Lab Capability (0-1)
  factors.lab_capability = scoreLabCapability(profile, requiredCapabilities);

  // 5. Previous Projects (0-1)
  factors.previous_projects = scorePreviousProjects(profile, requiredCapabilities, category, routingDomain);

  // 6. Innovation Capability (0-1)
  factors.innovation_capability = scoreInnovationCapability(profile);

  // 7. Geographic Suitability (0-1)
  factors.geographic_suitability = scoreGeographicSuitability(challenge, profile);

  // 8. Capacity Availability (0-1)
  factors.capacity_availability = scoreCapacityAvailability(profile);

  return factors;
}

function scoreDomainExpertise(profile, requiredCapabilities, routingDomain, category) {
  const uniKeywords = new Set();

  // Collect all expertise keywords from faculty
  for (const fac of profile.faculty || []) {
    if (fac.expertise && Array.isArray(fac.expertise)) {
      for (const exp of fac.expertise) {
        if (exp.keywords && Array.isArray(exp.keywords)) {
          exp.keywords.forEach(k => uniKeywords.add(k.toLowerCase()));
        }
      }
    }
  }

  // Add research area names
  for (const ra of profile.research_areas || []) {
    ra.name.toLowerCase().split(/[\s&,]+/).forEach(w => {
      if (w.length > 2) uniKeywords.add(w);
    });
  }

  // Add department names
  for (const dept of profile.departments || []) {
    dept.name.toLowerCase().split(/[\s&,]+/).forEach(w => {
      if (w.length > 2) uniKeywords.add(w);
    });
  }

  const matchCount = requiredCapabilities.filter(cap =>
    [...uniKeywords].some(kw => kw.includes(cap.toLowerCase()) || cap.toLowerCase().includes(kw))
  ).length;

  const score = requiredCapabilities.length > 0 ? Math.min(1, matchCount / requiredCapabilities.length) : 0;
  const matchedList = requiredCapabilities.filter(cap =>
    [...uniKeywords].some(kw => kw.includes(cap.toLowerCase()) || cap.toLowerCase().includes(kw))
  );

  return {
    score,
    evidence: matchedList.length > 0
      ? `Matched ${matchedList.length}/${requiredCapabilities.length} required capabilities: ${matchedList.join(', ')}`
      : 'No direct domain keyword match found'
  };
}

function scoreFacultyExpertise(profile, requiredCapabilities) {
  let matchingFaculty = 0;
  const matchedNames = [];

  for (const fac of profile.faculty || []) {
    const facKeywords = new Set();
    if (fac.expertise && Array.isArray(fac.expertise)) {
      for (const exp of fac.expertise) {
        if (exp.keywords && Array.isArray(exp.keywords)) {
          exp.keywords.forEach(k => facKeywords.add(k.toLowerCase()));
        }
        if (exp.research_interests && Array.isArray(exp.research_interests)) {
          exp.research_interests.forEach(r => r.toLowerCase().split(/[\s,]+/).forEach(w => {
            if (w.length > 2) facKeywords.add(w);
          }));
        }
      }
    }
    if (fac.specialization) {
      fac.specialization.toLowerCase().split(/[\s&,]+/).forEach(w => {
        if (w.length > 2) facKeywords.add(w);
      });
    }

    const hasMatch = requiredCapabilities.some(cap =>
      [...facKeywords].some(kw => kw.includes(cap.toLowerCase()) || cap.toLowerCase().includes(kw))
    );

    if (hasMatch) {
      matchingFaculty++;
      matchedNames.push(fac.name);
    }
  }

  const totalFaculty = (profile.faculty || []).length;
  const score = totalFaculty > 0 ? Math.min(1, matchingFaculty / Math.max(2, Math.min(totalFaculty, 5))) : 0;

  return {
    score,
    evidence: matchingFaculty > 0
      ? `${matchingFaculty} faculty members with relevant expertise: ${matchedNames.slice(0, 3).join(', ')}${matchedNames.length > 3 ? '...' : ''}`
      : 'No faculty with matching expertise found'
  };
}

function scoreResearchMatch(profile, requiredCapabilities, routingDomain, category) {
  let matchCount = 0;
  let strongMatches = 0;
  const matchedAreas = [];

  for (const ra of profile.research_areas || []) {
    const raName = ra.name.toLowerCase();
    const isMatch = requiredCapabilities.some(cap =>
      raName.includes(cap.toLowerCase()) || cap.toLowerCase().split(/\s+/).some(w => w.length > 3 && raName.includes(w))
    ) || (routingDomain && raName.includes(routingDomain.toLowerCase().split(/\s+/)[0]))
      || (category && raName.includes(category.toLowerCase().split(/\s+/)[0]));

    if (isMatch) {
      matchCount++;
      if (ra.strength_level === 'LEADING' || ra.strength_level === 'STRONG') strongMatches++;
      matchedAreas.push(`${ra.name} (${ra.strength_level})`);
    }
  }

  const score = matchCount > 0 ? Math.min(1, (matchCount * 0.3 + strongMatches * 0.4)) : 0;

  return {
    score: Math.min(1, score),
    evidence: matchedAreas.length > 0
      ? `Matching research areas: ${matchedAreas.join(', ')}`
      : 'No matching research areas'
  };
}

function scoreLabCapability(profile, requiredCapabilities) {
  let matchingLabs = 0;
  const matchedLabNames = [];

  for (const lab of profile.labs || []) {
    const labKeywords = new Set();
    if (lab.capabilities && Array.isArray(lab.capabilities)) {
      lab.capabilities.forEach(c => c.toLowerCase().split(/[\s,]+/).forEach(w => {
        if (w.length > 2) labKeywords.add(w);
      }));
    }
    if (lab.technologies && Array.isArray(lab.technologies)) {
      lab.technologies.forEach(t => labKeywords.add(t.toLowerCase()));
    }
    lab.name.toLowerCase().split(/[\s&,]+/).forEach(w => {
      if (w.length > 2) labKeywords.add(w);
    });

    const isMatch = requiredCapabilities.some(cap =>
      [...labKeywords].some(kw => kw.includes(cap.toLowerCase()) || cap.toLowerCase().includes(kw))
    );

    if (isMatch) {
      matchingLabs++;
      matchedLabNames.push(lab.name);
    }
  }

  const totalLabs = (profile.labs || []).length;
  const score = totalLabs > 0 ? Math.min(1, matchingLabs / Math.max(1, Math.min(totalLabs, 3))) : 0;

  return {
    score,
    evidence: matchingLabs > 0
      ? `${matchingLabs} relevant lab(s): ${matchedLabNames.join(', ')}`
      : 'No labs with matching capabilities'
  };
}

function scorePreviousProjects(profile, requiredCapabilities, category, routingDomain) {
  let matchingProjects = 0;
  const matchedTitles = [];

  for (const proj of profile.projects || []) {
    const projText = `${proj.title} ${proj.description} ${proj.domain || ''} ${proj.challenge_category || ''}`.toLowerCase();
    const projTech = (proj.technologies && Array.isArray(proj.technologies)) ? proj.technologies.map(t => t.toLowerCase()) : [];

    const isMatch = requiredCapabilities.some(cap =>
      projText.includes(cap.toLowerCase()) || projTech.some(t => t.includes(cap.toLowerCase()) || cap.toLowerCase().includes(t))
    ) || (category && projText.includes(category.toLowerCase().split(/\s+/)[0]))
      || (routingDomain && projText.includes(routingDomain.toLowerCase().split(/\s+/)[0]));

    if (isMatch) {
      matchingProjects++;
      matchedTitles.push(proj.title);
    }
  }

  const score = Math.min(1, matchingProjects * 0.35);

  return {
    score,
    evidence: matchingProjects > 0
      ? `${matchingProjects} related previous project(s): ${matchedTitles.slice(0, 2).join('; ')}${matchedTitles.length > 2 ? '...' : ''}`
      : 'No previous projects in related domain'
  };
}

function scoreInnovationCapability(profile) {
  const centres = profile.innovation_centres || [];
  const score = centres.length > 0 ? Math.min(1, centres.length * 0.6) : 0;

  return {
    score,
    evidence: centres.length > 0
      ? `${centres.length} innovation/incubation centre(s): ${centres.map(c => c.name).join(', ')}`
      : 'No innovation/incubation centres'
  };
}

function scoreGeographicSuitability(challenge, profile) {
  const challengeDistrict = (challenge.challenge_district || '').toLowerCase().trim();
  const uniDistrict = (profile.district || '').toLowerCase().trim();
  const uniState = (profile.state || '').toLowerCase().trim();

  if (!challengeDistrict) {
    return { score: 0.5, evidence: 'Challenge district not specified — neutral geographic score' };
  }

  if (challengeDistrict === uniDistrict) {
    return { score: 1.0, evidence: `Same district (${profile.district})` };
  }

  if (uniState === 'jharkhand') {
    return { score: 0.6, evidence: `Same state (Jharkhand), different district (${profile.district})` };
  }

  return { score: 0.3, evidence: `Different state (${profile.state || 'unknown'})` };
}

function scoreCapacityAvailability(profile) {
  const status = profile.capacity_status || 'UNKNOWN';
  const activeCount = profile.active_assignment_count || 0;
  const maxConcurrent = profile.max_concurrent_projects || 10;

  if (status === 'UNAVAILABLE') {
    return { score: 0.1, evidence: 'University marked as UNAVAILABLE' };
  }
  if (status === 'LIMITED') {
    return { score: 0.4, evidence: `Limited capacity — ${activeCount} active assignment(s)` };
  }
  if (status === 'UNKNOWN') {
    return { score: 0.5, evidence: 'Capacity status unknown — neutral score' };
  }

  const utilization = activeCount / maxConcurrent;
  const score = Math.max(0.2, 1 - utilization);

  return {
    score,
    evidence: `Available — ${activeCount}/${maxConcurrent} project slots used`
  };
}

// ============================================
// Capability Extraction
// ============================================

function extractCapabilities(category, subcategory, routingDomain, challenge) {
  const caps = new Set();

  // From category
  if (category) {
    category.split(/[\s,/&]+/).forEach(w => {
      if (w.length > 2) caps.add(w.toLowerCase());
    });
    caps.add(category.toLowerCase());
  }

  // From subcategory
  if (subcategory) {
    subcategory.split(/[\s,/&]+/).forEach(w => {
      if (w.length > 2) caps.add(w.toLowerCase());
    });
  }

  // From routing domain
  if (routingDomain) {
    routingDomain.split(/[\s,/&]+/).forEach(w => {
      if (w.length > 2) caps.add(w.toLowerCase());
    });
    caps.add(routingDomain.toLowerCase());
  }

  // Domain-specific capability mapping
  const domainCaps = {
    'water': ['water resources', 'hydrology', 'water supply', 'water quality', 'civil engineering'],
    'agriculture': ['agriculture', 'crop science', 'soil science', 'farming', 'irrigation', 'horticulture'],
    'healthcare': ['public health', 'community health', 'medicine', 'health informatics', 'epidemiology'],
    'education': ['education', 'pedagogy', 'learning', 'literacy', 'teacher training'],
    'environment': ['environmental', 'ecology', 'pollution', 'conservation', 'waste management'],
    'energy': ['energy', 'solar', 'renewable', 'electrification', 'power systems'],
    'sanitation': ['sanitation', 'waste management', 'hygiene', 'sewage', 'waste disposal'],
    'urban': ['urban planning', 'infrastructure', 'smart city', 'construction', 'transportation'],
    'accessibility': ['accessibility', 'assistive', 'disability', 'inclusive', 'prosthetics'],
    'rural': ['rural development', 'livelihood', 'community', 'self-help', 'tribal'],
    'governance': ['governance', 'public policy', 'administration', 'e-governance', 'transparency'],
    'mining': ['mining', 'mineral', 'geology', 'mine safety'],
  };

  const allText = `${category} ${subcategory} ${routingDomain} ${challenge.title || ''} ${challenge.description || ''}`.toLowerCase();

  for (const [keyword, capList] of Object.entries(domainCaps)) {
    if (allText.includes(keyword)) {
      capList.forEach(c => caps.add(c));
    }
  }

  // Check for IoT / tech keywords in description
  const techKeywords = ['iot', 'sensor', 'smart', 'monitoring', 'gis', 'remote sensing', 'data', 'analytics', 'ai', 'machine learning', 'automation'];
  for (const tk of techKeywords) {
    if (allText.includes(tk)) caps.add(tk);
  }

  return [...caps].filter(c => c.length > 2);
}

// ============================================
// Department & Faculty Matching Helpers
// ============================================

function findBestDepartment(profile, requiredCapabilities, routingDomain) {
  let bestDept = null;
  let bestScore = 0;

  for (const dept of profile.departments || []) {
    const deptText = `${dept.name} ${dept.description || ''}`.toLowerCase();
    let score = 0;

    for (const cap of requiredCapabilities) {
      if (deptText.includes(cap.toLowerCase())) score += 1;
    }
    if (routingDomain && deptText.includes(routingDomain.toLowerCase().split(/\s+/)[0])) score += 2;

    if (score > bestScore) {
      bestScore = score;
      bestDept = dept;
    }
  }

  return bestDept;
}

function findRelevantFaculty(profile, requiredCapabilities) {
  const results = [];

  for (const fac of profile.faculty || []) {
    const facKeywords = new Set();
    if (fac.expertise && Array.isArray(fac.expertise)) {
      for (const exp of fac.expertise) {
        if (exp.keywords && Array.isArray(exp.keywords)) {
          exp.keywords.forEach(k => facKeywords.add(k.toLowerCase()));
        }
      }
    }
    if (fac.specialization) {
      fac.specialization.toLowerCase().split(/[\s&,]+/).forEach(w => {
        if (w.length > 2) facKeywords.add(w);
      });
    }

    const matchedCaps = requiredCapabilities.filter(cap =>
      [...facKeywords].some(kw => kw.includes(cap.toLowerCase()) || cap.toLowerCase().includes(kw))
    );

    if (matchedCaps.length > 0) {
      results.push({
        id: fac.id,
        name: fac.name,
        designation: fac.designation,
        specialization: fac.specialization,
        department_name: fac.department_name,
        relevance_score: Math.min(1, matchedCaps.length / Math.max(1, requiredCapabilities.length)),
        relevance_reason: `Expertise matches: ${matchedCaps.join(', ')}`,
      });
    }
  }

  results.sort((a, b) => b.relevance_score - a.relevance_score);
  return results;
}

// ============================================
// Explanation Generation
// ============================================

function generateExplanation(scored, requiredCapabilities, category, routingDomain) {
  const parts = [];
  const uni = scored.university;

  // Domain
  if (scored.factors.domain_expertise.score > 0.5) {
    parts.push(`Strong ${routingDomain || category || 'domain'} expertise`);
  }

  // Faculty
  const facEvidence = scored.factors.faculty_expertise.evidence;
  if (scored.factors.faculty_expertise.score > 0.3) {
    parts.push(facEvidence);
  }

  // Research
  if (scored.factors.research_match.score > 0.3) {
    parts.push(scored.factors.research_match.evidence);
  }

  // Labs
  if (scored.factors.lab_capability.score > 0.3) {
    parts.push(scored.factors.lab_capability.evidence);
  }

  // Projects
  if (scored.factors.previous_projects.score > 0.2) {
    parts.push(scored.factors.previous_projects.evidence);
  }

  // Innovation
  if (scored.factors.innovation_capability.score > 0.3) {
    parts.push(scored.factors.innovation_capability.evidence);
  }

  // Geographic
  if (scored.factors.geographic_suitability.score >= 0.8) {
    parts.push(scored.factors.geographic_suitability.evidence);
  }

  if (parts.length === 0) {
    parts.push('Limited capability match based on available data');
  }

  return parts.join('. ') + '.';
}

// ============================================
// Query Functions
// ============================================

async function getMatchResults(challengeId) {
  const matchesRes = await query(
    `SELECT cm.*, u.name AS university_name, u.code AS university_code, u.type AS university_type,
            u.district AS university_district, u.location AS university_location,
            u.capacity_status, u.website AS university_website,
            d.name AS department_name
     FROM challenge_matches cm
     JOIN universities u ON u.id = cm.university_id
     LEFT JOIN departments d ON d.id = cm.department_id
     WHERE cm.challenge_id = $1 AND cm.matching_version = $2
     ORDER BY cm.rank ASC`,
    [challengeId, MATCHING_VERSION]
  );

  const matches = [];
  for (const match of matchesRes.rows) {
    // Factors
    const factorsRes = await query(
      'SELECT * FROM challenge_match_factors WHERE match_id = $1 ORDER BY weight DESC',
      [match.id]
    );
    match.factors = factorsRes.rows;

    // Recommended faculty
    const facRes = await query(
      `SELECT cmf.relevance_score, cmf.relevance_reason,
              f.id AS faculty_id, f.name AS faculty_name, f.designation, f.specialization,
              d.name AS department_name
       FROM challenge_match_faculty cmf
       JOIN faculty f ON f.id = cmf.faculty_id
       LEFT JOIN departments d ON d.id = f.department_id
       WHERE cmf.match_id = $1
       ORDER BY cmf.relevance_score DESC`,
      [match.id]
    );
    match.recommended_faculty = facRes.rows;

    matches.push(match);
  }

  return {
    challenge_id: challengeId,
    matching_version: MATCHING_VERSION,
    match_count: matches.length,
    generated_at: matches.length > 0 ? matches[0].generated_at : null,
    matches,
  };
}

async function getMatchDetail(matchId) {
  const res = await query(
    `SELECT cm.*, u.name AS university_name, u.code AS university_code
     FROM challenge_matches cm
     JOIN universities u ON u.id = cm.university_id
     WHERE cm.id = $1`,
    [matchId]
  );

  if (res.rows.length === 0) return null;
  const match = res.rows[0];

  const factorsRes = await query(
    'SELECT * FROM challenge_match_factors WHERE match_id = $1 ORDER BY weight DESC',
    [match.id]
  );
  match.factors = factorsRes.rows;

  const facRes = await query(
    `SELECT cmf.*, f.name AS faculty_name, f.designation, f.specialization, d.name AS department_name
     FROM challenge_match_faculty cmf
     JOIN faculty f ON f.id = cmf.faculty_id
     LEFT JOIN departments d ON d.id = f.department_id
     WHERE cmf.match_id = $1
     ORDER BY cmf.relevance_score DESC`,
    [match.id]
  );
  match.recommended_faculty = facRes.rows;

  return match;
}

async function updateMatchStatus(matchId, status, reviewerId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const res = await client.query(
      `UPDATE challenge_matches SET match_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, matchId]
    );

    if (res.rows.length === 0) throw new Error('Match not found.');

    await client.query(
      `INSERT INTO audit_logs (user_id, action, challenge_id, metadata) VALUES ($1, $2, $3, $4)`,
      [reviewerId, `MATCH_${status}`, res.rows[0].challenge_id, JSON.stringify({ match_id: matchId, university_id: res.rows[0].university_id })]
    );

    await client.query('COMMIT');
    return res.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  generateMatches,
  getMatchResults,
  getMatchDetail,
  updateMatchStatus,
  extractCapabilities,
  MATCHING_VERSION,
  FACTOR_WEIGHTS,
};
