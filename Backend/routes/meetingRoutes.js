const express = require('express');
const router = express.Router();
const { createMeeting, getMeeting, joinMeeting, endMeeting, leaveMeeting } = require('../controllers/mettingController');
const auth = require('../middleware/auth');

router.post('/', auth, createMeeting);
router.get('/:meetingId', auth, getMeeting);
router.post('/:meetingId/join', auth, joinMeeting);
router.post('/:meetingId/end', auth, endMeeting);
router.post('/:meetingId/leave', auth, leaveMeeting);

module.exports = router;