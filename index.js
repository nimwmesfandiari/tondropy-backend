// TON Dropy - Vercel Express entry point
// The full Express application remains in api/index.js.
// This root entry point lets Vercel detect the Express app
// without the previous rewrite workaround.

module.exports = require("./api/index.js");
