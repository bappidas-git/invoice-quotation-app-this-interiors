// Base URL for all API requests.
//
// Controlled by environment variable REACT_APP_API_BASE_URL.
//
// Development (.env.development):
//   REACT_APP_API_BASE_URL=http://localhost:5000
//
// Production (.env.production):
//   REACT_APP_API_BASE_URL=https://your-domain.com/api
//
// To switch from JSON Server to Laravel:
//   1. Set REACT_APP_API_BASE_URL in .env.production to your Laravel API URL
//   2. Run: npm run build
//   3. Deploy the build/ folder
//   No code changes needed.

const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

export default BASE_URL;
