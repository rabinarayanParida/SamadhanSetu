const express = require('express');
const router = express.Router();
const locationCtrl = require('../controllers/location.controller');

// States
router.get('/states', locationCtrl.getStates);

// Districts
router.get('/states/:stateId/districts', locationCtrl.getDistricts);
router.get('/districts', locationCtrl.getDistricts);

// Blocks / Subdivisions
router.get('/districts/:districtId/blocks', locationCtrl.getBlocks);
router.get('/blocks', locationCtrl.getBlocks);

// Localities / Villages
router.get('/blocks/:blockId/localities', locationCtrl.getLocalities);
router.get('/localities', locationCtrl.getLocalities);

module.exports = router;
