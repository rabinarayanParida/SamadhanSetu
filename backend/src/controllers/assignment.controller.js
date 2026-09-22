const { validationResult } = require('express-validator');
const assignmentService = require('../services/assignment.service');

async function assignChallenge(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }
    const { id } = req.params;
    const { university_id, department_id, reason } = req.body;
    const result = await assignmentService.assignChallenge(id, { university_id, department_id, reason }, req.user.id);
    res.json({ success: true, message: 'Challenge assigned to university.', data: result });
  } catch (err) {
    console.error('assignChallenge error:', err);
    const status = err.message.includes('not found') ? 404 : err.message.includes('must be') ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
}

async function getAssignment(req, res) {
  try {
    const assignment = await assignmentService.getAssignment(req.params.id);
    res.json({ success: true, data: assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAssignmentHistory(req, res) {
  try {
    const history = await assignmentService.getAssignmentHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// University-facing endpoints
async function getUniversityChallenges(req, res) {
  try {
    const universityId = req.user.university_id;
    if (!universityId) {
      return res.status(400).json({ success: false, message: 'Your account is not linked to a university. Contact administrator.' });
    }
    const result = await assignmentService.getUniversityChallenges(universityId, req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('getUniversityChallenges error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function acceptAssignment(req, res) {
  try {
    const result = await assignmentService.acceptAssignment(req.params.assignmentId, req.user.id);
    res.json({ success: true, message: 'Challenge accepted.', data: result });
  } catch (err) {
    console.error('acceptAssignment error:', err);
    const status = err.message.includes('not found') ? 404 : err.message.includes('not authorized') ? 403 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
}

async function declineAssignment(req, res) {
  try {
    const { reason } = req.body;
    const result = await assignmentService.declineAssignment(req.params.assignmentId, req.user.id, reason);
    res.json({ success: true, message: 'Challenge declined.', data: result });
  } catch (err) {
    console.error('declineAssignment error:', err);
    const status = err.message.includes('not found') ? 404 : err.message.includes('not authorized') ? 403 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
}

module.exports = { assignChallenge, getAssignment, getAssignmentHistory, getUniversityChallenges, acceptAssignment, declineAssignment };
