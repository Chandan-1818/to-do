// run from backend/ directory: node _dotenv_test.js
const r = require("dotenv").config();
console.log("dotenv error:", r.error ? r.error.message : "none");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "SET" : "MISSING");
console.log("MONGO_URI:",  process.env.MONGO_URI  ? "SET" : "MISSING");
console.log("cwd:", process.cwd());
console.log(".env path attempted:", require("path").resolve(".env"));
