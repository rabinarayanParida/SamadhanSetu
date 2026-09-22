/**
 * Location Controller
 * Exposes endpoints for cascading administrative location hierarchy.
 */

const locationService = require('../services/location.service');

async function getStates(req, res) {
  try {
    const states = await locationService.getStates();
    res.json({ success: true, data: states });
  } catch (error) {
    console.error('getStates error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch states.' });
  }
}

async function getDistricts(req, res) {
  try {
    const stateIdentifier = req.params.stateId || req.query.state_id || req.query.state;
    if (!stateIdentifier) {
      return res.status(400).json({ success: false, message: 'State parameter is required.' });
    }
    const districts = await locationService.getDistricts(stateIdentifier);
    res.json({ success: true, data: districts });
  } catch (error) {
    console.error('getDistricts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch districts.' });
  }
}

async function getBlocks(req, res) {
  try {
    const districtIdentifier = req.params.districtId || req.query.district_id || req.query.district;
    if (!districtIdentifier) {
      return res.status(400).json({ success: false, message: 'District parameter is required.' });
    }
    const blocks = await locationService.getBlocks(districtIdentifier);
    res.json({ success: true, data: blocks });
  } catch (error) {
    console.error('getBlocks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blocks.' });
  }
}

async function getLocalities(req, res) {
  try {
    const blockIdentifier = req.params.blockId || req.query.block_id || req.query.block;
    if (!blockIdentifier) {
      return res.status(400).json({ success: false, message: 'Block parameter is required.' });
    }
    const localities = await locationService.getLocalities(blockIdentifier);
    res.json({ success: true, data: localities });
  } catch (error) {
    console.error('getLocalities error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch localities.' });
  }
}

module.exports = {
  getStates,
  getDistricts,
  getBlocks,
  getLocalities,
};
