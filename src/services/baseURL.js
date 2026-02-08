// Base URL configuration for API requests
// For development with json-server: "http://localhost:5000"
// For production with Laravel: "https://your-domain.com/api"
//
// When going live with Laravel backend, simply change this URL
// to point to your Laravel API server.
export const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

export default BASE_URL;
