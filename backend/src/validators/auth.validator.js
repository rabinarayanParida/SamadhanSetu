const { body } = require('express-validator');

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters.'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter.')
    .matches(/\d/)
    .withMessage('Password must contain at least one number.')
    .matches(/[!@#$%^&*(),.?":{}|<>_+\-~=`[\]\\;/]/)
    .withMessage('Password must contain at least one special character.'),

  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required.')
    .isIn(['citizen', 'university', 'industry', 'government', 'admin'])
    .withMessage('Role must be one of: citizen, university, industry, government, admin.'),

  body('organization')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Organization name must not exceed 255 characters.'),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[+]?[\d\s-]{10,20}$/)
    .withMessage('Please provide a valid phone number.'),

  body('district')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('District name must not exceed 100 characters.'),
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required.'),

  body('login_type')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .toLowerCase()
    .isIn(['people', 'university', 'admin', 'industry'])
    .withMessage('Invalid user type. Must be one of: people, university, admin, industry.'),
];

/**
 * Validation rules for token refresh
 */
const refreshValidation = [
  body('refresh_token')
    .notEmpty()
    .withMessage('Refresh token is required.'),
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshValidation,
};
