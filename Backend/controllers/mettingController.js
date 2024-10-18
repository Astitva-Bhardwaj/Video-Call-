const { v4: uuidv4 } = require('uuid');
const Meeting = require('../models/Meeting');
const User = require('../models/User');

exports.createMeeting = async (req, res) => {
  try {
    const meetingId = uuidv4();
    const meeting = new Meeting({ 
      meetingId, 
      creator: req.user._id,
      participants: [req.user._id],
      status: 'waiting'
    });
    await meeting.save();

    // Update the user's meetings array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { meetings: meeting._id }
    });

    res.status(201).json({ meetingId, meeting });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Error creating meeting' });
  }
};

exports.getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId })
      .populate('creator', 'username email')
      .populate('participants', 'username email');
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: 'Error fetching meeting' });
  }
};

exports.joinMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    if (meeting.status === 'ended') {
      return res.status(400).json({ error: 'This meeting has ended' });
    }

    console.log(`User ${req.user._id} attempting to join meeting ${req.params.meetingId}. Current participants: ${meeting.participants.length}`);

    if (meeting.participants.length >= 10) {
      return res.status(400).json({ error: 'Meeting is full. The maximum number of participants is 10.' });
    }

    if (!meeting.participants.includes(req.user._id)) {
      meeting.participants.push(req.user._id);
      meeting.status = 'ongoing';
      await meeting.save();

      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { meetings: meeting._id }
      });
    }

    res.json({ message: 'Joined meeting successfully', meeting });
  } catch (error) {
    console.error('Error joining meeting:', error);
    res.status(500).json({ error: 'Error joining meeting' });
  }
};

exports.endMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    if (meeting.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the meeting creator can end the meeting' });
    }

    meeting.status = 'ended';
    await meeting.save();

    res.json({ message: 'Meeting ended successfully', meeting });
  } catch (error) {
    console.error('Error ending meeting:', error);
    res.status(500).json({ error: 'Error ending meeting' });
  }
};

exports.leaveMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    meeting.participants = meeting.participants.filter(
      participant => participant.toString() !== req.user._id.toString()
    );

    if (meeting.participants.length === 0) {
      meeting.status = 'ended';
    }

    await meeting.save();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { meetings: meeting._id }
    });

    res.json({ message: 'Left meeting successfully', meeting });
  } catch (error) {
    console.error('Error leaving meeting:', error);
    res.status(500).json({ error: 'Error leaving meeting' });
  }
};