const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
};

exports.login = async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
      if (!user) return res.status(400).json({ error: 'User not found' });
  
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: 'Invalid password' });
  
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
      
      // Set the token in a cookie
      res.cookie('token', token, { httpOnly: false }); // Set httpOnly to true for security
      res.json({ message: 'Login successful' }); // You can choose to send a message or the token back
    } catch (error) {
      res.status(500).json({ error: 'Error logging in' });
    }
  };
  