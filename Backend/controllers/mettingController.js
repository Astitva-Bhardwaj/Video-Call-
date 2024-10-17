const { v4: uuidv4 } = require('uuid');
const Meeting = require('../models/Meeting');

exports.createMeeting = async (req, res) => {
  try {
    const meetingId = uuidv4();
    const meeting = new Meeting({ meetingId, creator: req.user._id });
    await meeting.save();
    res.status(201).json({ meetingId });
  } catch (error) {
    res.status(500).json({ error: 'Error creating meeting' });
  }
};

exports.getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching meeting' });
  }
};  