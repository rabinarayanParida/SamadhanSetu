const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const matchCtrl = require('../controllers/matching.controller');
const { uuidParamValidation } = require('../validators/challenge.validator');

// All matching endpoints require admin/government role
router.use(authenticate, authorize('admin', 'government'));

// Generate university recommendations for a challenge
router.post('/challenges/:id/matches/generate', uuidParamValidation, matchCtrl.generateMatches);

// Get ranked match results
router.get('/challenges/:id/matches', uuidParamValidation, matchCtrl.getMatches);

// Get detailed match
router.get('/challenges/:id/matches/:matchId', matchCtrl.getMatchDetail);

// Shortlist a university
router.post('/challenges/:id/matches/:matchId/shortlist', matchCtrl.shortlistMatch);

// Reject a recommendation
router.post('/challenges/:id/matches/:matchId/reject', matchCtrl.rejectMatch);

module.exports = router;
