const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Get token from header
  const authHeader = req.header("Authorization");
  if (!authHeader) return res.status(401).json({ success: false, message: "Access denied. No token provided." });

  // Remove "Bearer " prefix if it exists
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "my_super_secret_key_123");
    
    // FIX: Extract just the ID string from the decoded token payload
    // The token payload looks like { teacher: { id: '6ab8ff34801dd3ac19a6c853' } }
    req.teacher = decoded.teacher.id || decoded.teacher;

    next();
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid token." });
  }
};