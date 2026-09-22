const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const uniCtrl = require('../controllers/university.controller');

// Public listing (authenticated users can see university directory)
router.use(authenticate);

router.get('/', uniCtrl.listUniversities);
router.get('/:id', uniCtrl.getUniversity);
router.get('/:id/departments', uniCtrl.getDepartments);
router.get('/:id/faculty', uniCtrl.getFaculty);
router.get('/:id/labs', uniCtrl.getLabs);
router.get('/:id/projects', uniCtrl.getProjects);
router.get('/:id/capabilities', uniCtrl.getCapabilities);

module.exports = router;
