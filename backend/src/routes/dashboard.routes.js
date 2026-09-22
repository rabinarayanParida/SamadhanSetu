const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(authenticate);

/**
 * GET /api/dashboard/citizen
 * Citizen-specific dashboard data
 */
router.get('/citizen', authorize('citizen'), (req, res) => {
  res.json({
    success: true,
    data: {
      role: 'citizen',
      welcome: `Welcome, ${req.user.full_name}!`,
      message: 'Citizen Dashboard — Submit and track societal challenges in your community.',
      stats: {
        challenges_submitted: 0,
        challenges_in_progress: 0,
        challenges_resolved: 0,
      },
      features: [
        'Submit new societal challenges',
        'Upload photos, videos, and documents',
        'Track challenge status',
        'View solutions proposed by universities',
      ],
    },
  });
});

/**
 * GET /api/dashboard/university
 * University-specific dashboard data
 */
router.get('/university', authorize('university'), (req, res) => {
  res.json({
    success: true,
    data: {
      role: 'university',
      welcome: `Welcome, ${req.user.full_name}!`,
      organization: req.user.organization,
      message: 'University Dashboard — Review challenges and manage research projects.',
      stats: {
        assigned_challenges: 0,
        active_projects: 0,
        completed_solutions: 0,
        faculty_involved: 0,
      },
      features: [
        'Review assigned societal challenges',
        'Form multidisciplinary project teams',
        'Assign faculty mentors',
        'Submit solution proposals',
        'Collaborate with industry partners',
      ],
    },
  });
});

/**
 * GET /api/dashboard/industry
 * Industry-specific dashboard data
 */
router.get('/industry', authorize('industry'), (req, res) => {
  res.json({
    success: true,
    data: {
      role: 'industry',
      welcome: `Welcome, ${req.user.full_name}!`,
      organization: req.user.organization,
      message: 'Industry Dashboard — Partner with universities to develop and deploy solutions.',
      stats: {
        active_partnerships: 0,
        projects_funded: 0,
        prototypes_deployed: 0,
      },
      features: [
        'Browse available projects for collaboration',
        'Offer mentorship and funding',
        'Co-develop prototypes',
        'Facilitate technology transfer',
        'Track CSR impact',
      ],
    },
  });
});

/**
 * GET /api/dashboard/government
 * Government-specific dashboard data
 */
router.get('/government', authorize('government'), (req, res) => {
  res.json({
    success: true,
    data: {
      role: 'government',
      welcome: `Welcome, ${req.user.full_name}!`,
      organization: req.user.organization,
      message: 'Government Dashboard — Monitor the innovation ecosystem across Jharkhand.',
      stats: {
        total_challenges: 0,
        universities_participating: 0,
        industry_partners: 0,
        solutions_deployed: 0,
        districts_covered: 0,
      },
      features: [
        'Monitor challenge submissions across districts',
        'View domain-wise distribution analytics',
        'Track institutional participation',
        'Review project progress and outcomes',
        'Generate impact reports',
      ],
    },
  });
});

/**
 * GET /api/dashboard/admin
 * Admin-specific dashboard data
 */
router.get('/admin', authorize('admin'), (req, res) => {
  res.json({
    success: true,
    data: {
      role: 'admin',
      welcome: `Welcome, ${req.user.full_name}!`,
      message: 'Admin Dashboard — Full platform management and oversight.',
      stats: {
        total_users: 0,
        total_challenges: 0,
        total_projects: 0,
        pending_approvals: 0,
      },
      features: [
        'Manage user accounts and roles',
        'Moderate submitted challenges',
        'Configure AI classification rules',
        'Assign challenges to universities',
        'Platform analytics and reporting',
        'System configuration',
      ],
    },
  });
});

module.exports = router;
