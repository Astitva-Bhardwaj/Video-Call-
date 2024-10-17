const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // Fetch the token from cookies
  const token = req.cookies.token; // Make sure your token is stored in a cookie named 'token'
  console.log("Token:", token); // Log the token for debugging purposes
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Store the verified user info in the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("JWT Verification Error:", error.message); // Log the error message
    res.status(400).json({ error: "Invalid token" });
  }
};
