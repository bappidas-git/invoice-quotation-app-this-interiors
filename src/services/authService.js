import { authAPI } from "./api";

const TOKEN_KEY = "auth_token";

// Fallback credentials for json-server development (no auth endpoint)
const DEV_CREDENTIALS = {
  email: "invoice@thisinteriors.com",
  password: "THIS@123###",
};

export const authService = {
  login: async (email, password) => {
    try {
      // Try API login first (for Laravel backend)
      const response = await authAPI.login({ email, password });
      const { token } = response.data;
      localStorage.setItem(TOKEN_KEY, token);
      return { success: true, token };
    } catch (error) {
      // Fallback for json-server dev mode (no /auth/login endpoint)
      if (
        email === DEV_CREDENTIALS.email &&
        password === DEV_CREDENTIALS.password
      ) {
        const token = btoa(`${email}:${Date.now()}`);
        localStorage.setItem(TOKEN_KEY, token);
        return { success: true, token };
      }
      const message =
        error.response?.data?.message || "Invalid credentials";
      return { success: false, message };
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore logout API errors (json-server won't have this endpoint)
    }
    localStorage.removeItem(TOKEN_KEY);
  },

  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },
};

export default authService;
