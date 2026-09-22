/**
 * University Service
 * CRUD operations and profile aggregation for universities, departments,
 * faculty, labs, research areas, projects, and innovation centres.
 */

const { query, pool } = require('../config/db');

/**
 * List all active universities
 */
async function listUniversities(filters = {}) {
  const { district, type, search, page = 1, limit = 20 } = filters;
  const conditions = ['u.is_active = true'];
  const params = [];

  if (district) {
    params.push(district);
    conditions.push(`u.district = $${params.length}`);
  }
  if (type) {
    params.push(type);
    conditions.push(`u.type = $${params.length}`);
  }
  if (search) {
    params.push(`%${search.trim()}%`);
    conditions.push(`(u.name ILIKE $${params.length} OR u.code ILIKE $${params.length} OR u.description ILIKE $${params.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const countRes = await query(`SELECT COUNT(*) as count FROM universities u ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const dataParams = [...params, limit, offset];
  const dataQuery = `
    SELECT u.*,
      (SELECT COUNT(*) FROM departments d WHERE d.university_id = u.id AND d.is_active = true) AS department_count,
      (SELECT COUNT(*) FROM faculty f WHERE f.university_id = u.id AND f.is_active = true) AS faculty_count,
      (SELECT COUNT(*) FROM university_labs l WHERE l.university_id = u.id AND l.is_active = true) AS lab_count,
      (SELECT COUNT(*) FROM challenge_assignments ca WHERE ca.university_id = u.id AND ca.assignment_status = 'ACCEPTED') AS active_assignments
    FROM universities u
    ${whereClause}
    ORDER BY u.name ASC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const dataRes = await query(dataQuery, dataParams);
  return {
    universities: dataRes.rows,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get full university profile
 */
async function getUniversityProfile(universityId) {
  const uniRes = await query('SELECT * FROM universities WHERE id = $1', [universityId]);
  if (uniRes.rows.length === 0) return null;
  const university = uniRes.rows[0];

  // Departments
  const deptsRes = await query(
    `SELECT d.*, 
       (SELECT COUNT(*) FROM faculty f WHERE f.department_id = d.id AND f.is_active = true) AS faculty_count
     FROM departments d 
     WHERE d.university_id = $1 AND d.is_active = true 
     ORDER BY d.name`,
    [universityId]
  );
  university.departments = deptsRes.rows;

  // Faculty with expertise
  const facRes = await query(
    `SELECT f.*, d.name AS department_name,
       COALESCE(
         (SELECT json_agg(json_build_object(
           'id', fe.id, 'expertise_area', fe.expertise_area,
           'keywords', fe.keywords, 'research_interests', fe.research_interests
         )) FROM faculty_expertise fe WHERE fe.faculty_id = f.id),
         '[]'::json
       ) AS expertise
     FROM faculty f
     LEFT JOIN departments d ON d.id = f.department_id
     WHERE f.university_id = $1 AND f.is_active = true
     ORDER BY f.name`,
    [universityId]
  );
  university.faculty = facRes.rows;

  // Research areas
  const raRes = await query(
    `SELECT ra.id, ra.name, ra.description, ura.strength_level
     FROM university_research_areas ura
     JOIN research_areas ra ON ra.id = ura.research_area_id
     WHERE ura.university_id = $1
     ORDER BY CASE ura.strength_level
       WHEN 'LEADING' THEN 1 WHEN 'STRONG' THEN 2 WHEN 'MODERATE' THEN 3 ELSE 4
     END`,
    [universityId]
  );
  university.research_areas = raRes.rows;

  // Labs
  const labsRes = await query(
    `SELECT l.*, d.name AS department_name
     FROM university_labs l
     LEFT JOIN departments d ON d.id = l.department_id
     WHERE l.university_id = $1 AND l.is_active = true
     ORDER BY l.name`,
    [universityId]
  );
  university.labs = labsRes.rows;

  // Innovation centres
  const icRes = await query(
    'SELECT * FROM university_innovation_centres WHERE university_id = $1 AND is_active = true ORDER BY name',
    [universityId]
  );
  university.innovation_centres = icRes.rows;

  // Previous projects
  const projRes = await query(
    `SELECT p.*, d.name AS department_name
     FROM university_projects p
     LEFT JOIN departments d ON d.id = p.department_id
     WHERE p.university_id = $1 AND p.is_active = true
     ORDER BY p.year DESC`,
    [universityId]
  );
  university.projects = projRes.rows;

  // Active assignment count
  const assignRes = await query(
    `SELECT COUNT(*) as count FROM challenge_assignments 
     WHERE university_id = $1 AND assignment_status IN ('PENDING', 'ACCEPTED')`,
    [universityId]
  );
  university.active_assignment_count = parseInt(assignRes.rows[0].count, 10);

  return university;
}

/**
 * Get departments for a university
 */
async function getDepartments(universityId) {
  const res = await query(
    `SELECT d.*, 
       (SELECT COUNT(*) FROM faculty f WHERE f.department_id = d.id AND f.is_active = true) AS faculty_count
     FROM departments d 
     WHERE d.university_id = $1 AND d.is_active = true 
     ORDER BY d.name`,
    [universityId]
  );
  return res.rows;
}

/**
 * Get faculty for a university
 */
async function getFaculty(universityId, departmentId = null) {
  const conditions = ['f.university_id = $1', 'f.is_active = true'];
  const params = [universityId];

  if (departmentId) {
    params.push(departmentId);
    conditions.push(`f.department_id = $${params.length}`);
  }

  const res = await query(
    `SELECT f.*, d.name AS department_name,
       COALESCE(
         (SELECT json_agg(json_build_object(
           'id', fe.id, 'expertise_area', fe.expertise_area,
           'keywords', fe.keywords, 'research_interests', fe.research_interests
         )) FROM faculty_expertise fe WHERE fe.faculty_id = f.id),
         '[]'::json
       ) AS expertise
     FROM faculty f
     LEFT JOIN departments d ON d.id = f.department_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY f.name`,
    params
  );
  return res.rows;
}

/**
 * Get labs for a university
 */
async function getLabs(universityId) {
  const res = await query(
    `SELECT l.*, d.name AS department_name
     FROM university_labs l
     LEFT JOIN departments d ON d.id = l.department_id
     WHERE l.university_id = $1 AND l.is_active = true
     ORDER BY l.name`,
    [universityId]
  );
  return res.rows;
}

/**
 * Get previous projects for a university
 */
async function getProjects(universityId) {
  const res = await query(
    `SELECT p.*, d.name AS department_name
     FROM university_projects p
     LEFT JOIN departments d ON d.id = p.department_id
     WHERE p.university_id = $1 AND p.is_active = true
     ORDER BY p.year DESC`,
    [universityId]
  );
  return res.rows;
}

/**
 * Get aggregated capability summary for a university
 * Used for capability embedding text generation
 */
async function getCapabilitySummary(universityId) {
  const profile = await getUniversityProfile(universityId);
  if (!profile) return null;

  // Build a text summary of all capabilities
  const parts = [];
  parts.push(`University: ${profile.name}`);
  parts.push(`Type: ${profile.type}`);
  if (profile.description) parts.push(profile.description.replace('[DEMO DATA] ', ''));

  // Research areas
  if (profile.research_areas.length > 0) {
    parts.push('Research Areas: ' + profile.research_areas.map(r => `${r.name} (${r.strength_level})`).join(', '));
  }

  // Department names
  if (profile.departments.length > 0) {
    parts.push('Departments: ' + profile.departments.map(d => d.name).join(', '));
  }

  // Faculty expertise keywords
  const allKeywords = [];
  for (const fac of profile.faculty) {
    if (fac.expertise && Array.isArray(fac.expertise)) {
      for (const exp of fac.expertise) {
        if (exp.keywords && Array.isArray(exp.keywords)) {
          allKeywords.push(...exp.keywords);
        }
        if (exp.research_interests && Array.isArray(exp.research_interests)) {
          allKeywords.push(...exp.research_interests);
        }
      }
    }
  }
  if (allKeywords.length > 0) {
    const unique = [...new Set(allKeywords)];
    parts.push('Expertise Keywords: ' + unique.join(', '));
  }

  // Lab capabilities
  const labCaps = [];
  for (const lab of profile.labs) {
    if (lab.capabilities && Array.isArray(lab.capabilities)) labCaps.push(...lab.capabilities);
    if (lab.technologies && Array.isArray(lab.technologies)) labCaps.push(...lab.technologies);
  }
  if (labCaps.length > 0) {
    parts.push('Lab Capabilities: ' + [...new Set(labCaps)].join(', '));
  }

  // Project domains
  if (profile.projects.length > 0) {
    const domains = [...new Set(profile.projects.map(p => p.domain).filter(Boolean))];
    parts.push('Previous Project Domains: ' + domains.join(', '));
  }

  return {
    university_id: universityId,
    text: parts.join('. '),
    profile,
  };
}

module.exports = {
  listUniversities,
  getUniversityProfile,
  getDepartments,
  getFaculty,
  getLabs,
  getProjects,
  getCapabilitySummary,
};
