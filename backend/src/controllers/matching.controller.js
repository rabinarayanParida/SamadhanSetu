const { validationResult } = require('express-validator');
const matchingService = require('../services/matching.service');

async function generateMatches(req, res) {
  try {
    const { id } = req.params;
    const reviewerId = req.user.id;
    const result = await matchingService.generateMatches(id, reviewerId);
    res.json({
      success: true,
      message: 'University recommendations generated successfully.',
      data: result,
    });
  } catch (err) {
    console.error('generateMatches error:', err);
    const status = err.message.includes('not found') ? 404 : err.message.includes('must be') ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
}

async function getMatches(req, res) {
  try {
    const result = await matchingService.getMatchResults(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('getMatches error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getMatchDetail(req, res) {
  try {
    const match = await matchingService.getMatchDetail(req.params.matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    res.json({ success: true, data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function shortlistMatch(req, res) {
  try {
    const result = await matchingService.updateMatchStatus(req.params.matchId, 'SHORTLISTED', req.user.id);
    res.json({ success: true, message: 'University shortlisted.', data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function rejectMatch(req, res) {
  try {
    const result = await matchingService.updateMatchStatus(req.params.matchId, 'REJECTED', req.user.id);
    res.json({ success: true, message: 'Recommendation rejected.', data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { generateMatches, getMatches, getMatchDetail, shortlistMatch, rejectMatch };
