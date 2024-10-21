const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error registering user', details: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    console.log('Received login data:', req.body);
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Trim the username to remove any leading/trailing whitespace
    const trimmedUsername = username.trim();

    // Try to find the user, ignoring case
    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') } },
        { email: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') } }
      ]
    });

    if (!user) {
      console.log('User not found for username:', trimmedUsername);
      return res.status(400).json({ error: 'User not found' });
    }

    console.log('User found:', user.username);

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('Invalid password for user:', user.username);
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    console.log('Login successful for user:', user.username);
    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in', details: error.message });
  }
};