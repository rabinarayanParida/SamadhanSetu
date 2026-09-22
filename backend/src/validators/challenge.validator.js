const { body, param } = require('express-validator');

/**
 * Validation rules for creating/updating a challenge
 */
const challengeValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Challenge title is required.')
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters.'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Challenge description is required.')
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters.'),

  body('category_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Invalid category.'),

  body('affected_population')
    .optional({ nullable: true, checkFalsy: true })
    .custom((val) => {
      if (val === undefined || val === null || val === '') return true;
      const parsed = typeof val === 'string' ? parseInt(val.replace(/[^\d]/g, ''), 10) : Number(val);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error('Affected population must be a non-negative number.');
      }
      return true;
    }),

  body('severity')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Severity must be one of: low, medium, high, critical.'),

  body('existing_attempts')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Existing attempts must not exceed 2000 characters.'),

  body('expected_outcome')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Expected outcome must not exceed 2000 characters.'),

  // Location fields (optional during draft)
  body('location.latitude')
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90.'),

  body('location.longitude')
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180.'),

  body('location.address')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters.'),

  body('location.state')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),

  body('location.district')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),

  body('location.block')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),

  body('location.village_city')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),

  body('location.pincode')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be a 6-digit number.'),

  body('location').custom(async (loc) => {
    if (!loc) return true;
    try {
      const locationService = require('../services/location.service');
      const result = await locationService.validateHierarchy({
        state: loc.state,
        district: loc.district,
        block: loc.block,
        village_city: loc.village_city,
      });
      if (!result.valid) {
        throw new Error(result.message);
      }
    } catch (err) {
      throw err;
    }
    return true;
  }),
];

/**
 * Validation for submitting (transition from DRAFT to SUBMITTED)
 * Stricter — requires title, description, and location
 */
const submitValidation = [
  // Validated in the service layer — challenge must exist and be in DRAFT status
];

/**
 * Validation for UUID path parameter
 */
const uuidParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid challenge ID format.'),
];

module.exports = {
  challengeValidation,
  submitValidation,
  uuidParamValidation,
};
