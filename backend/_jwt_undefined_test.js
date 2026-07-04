// Demonstrates the exact crash: jwt.sign with undefined secret
const jwt = require("jsonwebtoken");
try {
  jwt.sign({ id: "abc" }, undefined, { expiresIn: "7d" });
} catch (e) {
  console.log("Error name:", e.name);
  console.log("Error message:", e.message);
  // This is what hits the 500 handler
}
