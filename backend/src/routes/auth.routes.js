const express = require('express');
const router = express.Router();
const { register, login, refresh, getMe, logout } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const {
  registerValidation,
  loginValidation,
  refreshValidation,
} = require('../validators/auth.validator');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refreshValidation, refresh);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

module.exports = router;
