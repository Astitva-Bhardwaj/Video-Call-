const express = require('express');
const router = express.Router();
const { createMeeting, getMeeting } = require('../controllers/mettingController');
const auth = require('../middleware/auth');

router.post('/', auth, createMeeting);
router.get('/:meetingId', auth, getMeeting);

module.exports = router;