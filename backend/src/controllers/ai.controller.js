const { validationResult } = require('express-validator');
const aiService = require('../services/ai.service');

async function processChallenge(req, res, next) {
  try {
    const { id } = req.params;
    const reviewerId = req.user.id;
    const result = await aiService.processChallenge(id, reviewerId);
    return res.status(200).json({
      success: true,
      message: 'AI Problem Intelligence processing completed successfully.',
      data: result,
    });
  } catch (err) {
    return res.status(err.message === 'Challenge not found.' ? 404 : 500).json({
      success: false,
      message: err.message,
    });
  }
}

async function getChallengeAI(req, res, next) {
  try {
    const { id } = req.params;
    const result = await aiService.getChallengeAI(id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

async function retryAIProcessing(req, res, next) {
  try {
    const { id } = req.params;
    const reviewerId = req.user.id;
    const result = await aiService.retryAIProcessing(id, reviewerId);
    return res.status(200).json({
      success: true,
      message: 'AI Problem Intelligence analysis retried successfully.',
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

async function overrideAIRecommendation(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const reviewerId = req.user.id;
    const { field_name, human_value, reason } = req.body;

    const override = await aiService.overrideAIRecommendation(id, reviewerId, {
      field_name,
      human_value,
      reason,
    });

    const fullAI = await aiService.getChallengeAI(id);

    return res.status(200).json({
      success: true,
      message: `Human override recorded for ${field_name}. AI suggestion preserved.`,
      data: {
        override,
        ai: fullAI,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

async function updateDuplicateStatus(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array(),
      });
    }

    const { id, candidateId } = req.params;
    const reviewerId = req.user.id;
    const { review_status, comment } = req.body;

    const result = await aiService.updateDuplicateStatus(id, candidateId, reviewerId, {
      review_status,
      comment,
    });

    const fullAI = await aiService.getChallengeAI(id);

    return res.status(200).json({
      success: true,
      message: `Duplicate candidate review status updated to ${review_status}.`,
      data: {
        duplicate: result,
        ai: fullAI,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

module.exports = {
  processChallenge,
  getChallengeAI,
  retryAIProcessing,
  overrideAIRecommendation,
  updateDuplicateStatus,
};
