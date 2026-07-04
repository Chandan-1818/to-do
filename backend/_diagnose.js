// Temporary diagnostic script — run with: node _diagnose.js (from backend/)
require("dotenv").config();

const checks = [];

// 1. JWT_SECRET
if (!process.env.JWT_SECRET) {
  checks.push("FAIL: JWT_SECRET is missing from .env");
} else {
  checks.push("OK:   JWT_SECRET is set (" + process.env.JWT_SECRET.length + " chars)");
}

// 2. MONGO_URI
if (!process.env.MONGO_URI) {
  checks.push("FAIL: MONGO_URI is missing from .env");
} else {
  checks.push("OK:   MONGO_URI is set");
}

// 3. Required packages
const pkgs = ["express", "mongoose", "bcryptjs", "jsonwebtoken", "express-validator", "cors", "dotenv"];
for (const pkg of pkgs) {
  try {
    require(pkg);
    checks.push("OK:   " + pkg + " is installed");
  } catch {
    checks.push("FAIL: " + pkg + " is NOT installed");
  }
}

// 4. JWT sign test
try {
  const jwt = require("jsonwebtoken");
  const secret = process.env.JWT_SECRET || "test-secret-for-diag";
  const token = jwt.sign({ id: "test123" }, secret, { expiresIn: "1h" });
  const decoded = jwt.verify(token, secret);
  checks.push("OK:   JWT sign/verify works (id=" + decoded.id + ")");
} catch (e) {
  checks.push("FAIL: JWT sign/verify error: " + e.message);
}

// 5. bcrypt test
const testBcrypt = async () => {
  try {
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash("password123", 10);
    const match = await bcrypt.compare("password123", hash);
    checks.push("OK:   bcrypt hash/compare works (match=" + match + ")");
  } catch (e) {
    checks.push("FAIL: bcrypt error: " + e.message);
  }

  console.log("\n=== DIAGNOSTIC RESULTS ===");
  checks.forEach(c => console.log(c));
  console.log("==========================\n");
};

testBcrypt();
