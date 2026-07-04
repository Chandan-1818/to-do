// middleware/auth.js
// JWT authentication middleware.
// Attaches the decoded user payload to req.user so downstream
// controllers know who is making the request.

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // The client sends the token in the Authorization header as:
  //   Authorization: Bearer <token>
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorised — no token provided",
    });
  }

  try {
    // Verify the token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user document (minus the password) to the request
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorised — user no longer exists",
      });
    }

    next();
  } catch (error) {
    // Covers TokenExpiredError, JsonWebTokenError, etc.
    return res.status(401).json({
      success: false,
      message: "Not authorised — invalid or expired token",
    });
  }
};

module.exports = { protect };
