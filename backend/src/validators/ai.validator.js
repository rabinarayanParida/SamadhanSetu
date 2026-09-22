const { body } = require('express-validator');

const overrideValidation = [
  body('field_name')
    .trim()
    .notEmpty().withMessage('Field name is required.')
    .isIn(['category', 'subcategory', 'priority_level', 'priority_score', 'routing_domain', 'validation'])
    .withMessage('Invalid override field name.'),

  body('human_value')
    .trim()
    .notEmpty().withMessage('Human decision value is required.')
    .isLength({ max: 255 }).withMessage('Human decision value must not exceed 255 characters.'),

  body('reason')
    .trim()
    .notEmpty().withMessage('An explanation/reason for the override is required.')
    .isLength({ min: 5, max: 1000 }).withMessage('Reason must be between 5 and 1000 characters.'),
];

const duplicateReviewValidation = [
  body('review_status')
    .trim()
    .notEmpty().withMessage('Review status is required.')
    .isIn(['CONFIRMED_DUPLICATE', 'NOT_DUPLICATE', 'PENDING'])
    .withMessage('Review status must be CONFIRMED_DUPLICATE, NOT_DUPLICATE, or PENDING.'),

  body('comment')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Review comment must not exceed 500 characters.'),
];

module.exports = {
  overrideValidation,
  duplicateReviewValidation,
};
