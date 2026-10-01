const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "my_super_secret_key_123";

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    // Expected:
    // Authorization: Bearer eyJhbGciOi...
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format."
      });
    }

    const token = parts[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided."
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    // Validate payload
    if (
      !decoded ||
      !decoded.teacher ||
      !decoded.teacher.id
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid token."
      });
    }

    // Store teacher ID
    req.teacher = decoded.teacher.id;

    // Let Express continue
    return next();

  } catch (error) {
    console.error("AUTH ERROR:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
};

module.exports = auth;
