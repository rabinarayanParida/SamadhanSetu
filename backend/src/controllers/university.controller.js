const universityService = require('../services/university.service');

async function listUniversities(req, res) {
  try {
    const result = await universityService.listUniversities(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('listUniversities error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getUniversity(req, res) {
  try {
    const profile = await universityService.getUniversityProfile(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'University not found.' });
    res.json({ success: true, data: profile });
  } catch (err) {
    console.error('getUniversity error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getDepartments(req, res) {
  try {
    const departments = await universityService.getDepartments(req.params.id);
    res.json({ success: true, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getFaculty(req, res) {
  try {
    const faculty = await universityService.getFaculty(req.params.id, req.query.department_id);
    res.json({ success: true, data: faculty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getLabs(req, res) {
  try {
    const labs = await universityService.getLabs(req.params.id);
    res.json({ success: true, data: labs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getProjects(req, res) {
  try {
    const projects = await universityService.getProjects(req.params.id);
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getCapabilities(req, res) {
  try {
    const summary = await universityService.getCapabilitySummary(req.params.id);
    if (!summary) return res.status(404).json({ success: false, message: 'University not found.' });
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { listUniversities, getUniversity, getDepartments, getFaculty, getLabs, getProjects, getCapabilities };
