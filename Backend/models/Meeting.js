const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, unique: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Meeting', meetingSchema);