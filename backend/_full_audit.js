// Full registration flow audit — run from backend/: node _full_audit.js
require("dotenv").config();
const issues = [];

// 1. JWT_SECRET
if (!process.env.JWT_SECRET) {
  issues.push("[CRITICAL] JWT_SECRET missing from .env — jwt.sign() will throw 'secretOrPrivateKey must have a value' → 500");
} else if (process.env.JWT_SECRET.length < 32) {
  issues.push("[WARNING]  JWT_SECRET is very short (" + process.env.JWT_SECRET.length + " chars). Use 64+ random bytes in production.");
}

// 2. MONGO_URI
if (!process.env.MONGO_URI) {
  issues.push("[CRITICAL] MONGO_URI missing from .env — connectDB will fail");
}

// 3. Duplicate email: controller returns 400 — OK
// Check: does the controller handle the MongoDB duplicate key error (code 11000)?
// If User.create() throws a duplicate key error BEFORE our findOne check runs
// (race condition), the error.code === 11000 path is not handled → 500
issues.push("[MINOR]    Duplicate-email MongoDB error (code 11000) not explicitly caught → falls through to generic 500. Should return 409.");

// 4. JWT_EXPIRES_IN fallback
if (!process.env.JWT_EXPIRES_IN) {
  issues.push("[INFO]     JWT_EXPIRES_IN not set — controller defaults to '7d'. Not a crash but should be in .env.");
}

// 5. signToken called inside try/catch? No — it's called from sendAuthResponse
// which is called AFTER User.create() succeeds but OUTSIDE the try/catch block.
// Let's verify:
issues.push("[CRITICAL] sendAuthResponse() is called OUTSIDE the try/catch in register(). If jwt.sign() throws, it is an uncaught exception that hits Express's unhandled error → 500 with no useful message.");

console.log("\n=== FULL AUDIT ===");
if (issues.length === 0) {
  console.log("No issues found.");
} else {
  issues.forEach((i, idx) => console.log((idx + 1) + ". " + i));
}
console.log("==================\n");
