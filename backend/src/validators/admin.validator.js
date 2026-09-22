const { body, param } = require('express-validator');

const updateStatusValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid challenge ID format.'),

  body('to_status')
    .trim()
    .notEmpty()
    .withMessage('to_status is required.')
    .isIn(['UNDER_REVIEW', 'VALIDATED', 'REJECTED', 'NEEDS_INFORMATION', 'POTENTIAL_DUPLICATE'])
    .withMessage('Invalid target status.'),

  body('comment')
    .optional({ nullable: true })
    .trim(),

  body('duplicate_of_id')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Invalid duplicate challenge ID format.'),
];

const reviewNoteValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid challenge ID format.'),

  body('note')
    .trim()
    .notEmpty()
    .withMessage('Note text is required.')
    .isLength({ min: 2, max: 3000 })
    .withMessage('Note must be between 2 and 3000 characters.'),
];

const updateMetadataValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid challenge ID format.'),

  body('category_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Invalid category ID.'),
];

module.exports = {
  updateStatusValidation,
  reviewNoteValidation,
  updateMetadataValidation,
};
