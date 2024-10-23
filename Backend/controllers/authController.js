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
    // Log incoming request data for debugging
    console.log('Received login data:', req.body);
    
    // Destructure username and password from the request body
    const { username, password } = req.body;

    // Validate input: check if both username and password are provided
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Trim the username to remove any extra whitespace
    const trimmedUsername = username.trim();

    // Search for the user by either username or email (case-insensitive)
    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') } },
        { email: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') } }
      ]
    });

    // If no user is found, return an error
    if (!user) {
      console.log('User not found for:', trimmedUsername);
      return res.status(400).json({ error: 'User not found' });
    }

    // Log the found user's username for debugging
    console.log('User found:', user.username);

    // Compare the provided password with the hashed password stored in the database
    const validPassword = await bcrypt.compare(password, user.password);
    
    // If the password is invalid, return an error
    if (!validPassword) {
      console.log('Invalid password for user:', user.username);
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Generate a JWT token with the user's ID as the payload
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set the token as an HTTP-only cookie to enhance security
    res.cookie('token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'Strict'  // Prevent CSRF attacks by only allowing same-site requests
    });

    // Log successful login
    console.log('Login successful for user:', user.username);

    // Send a successful response including the token and basic user info
    res.status(200).json({ 
      message: 'Login successful', 
      token, 
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    // Log the error and send a 500 response for internal server errors
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in', details: error.message });
  }
};