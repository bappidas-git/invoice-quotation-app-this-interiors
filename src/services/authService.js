const AUTH_CREDENTIALS = {
  email: "invoice@thisinteriors.com",
  password: "THIS@123###",
};

const TOKEN_KEY = "auth_token";

export const authService = {
  login: (email, password) => {
    if (
      email === AUTH_CREDENTIALS.email &&
      password === AUTH_CREDENTIALS.password
    ) {
      const token = btoa(`${email}:${password}`);
      localStorage.setItem(TOKEN_KEY, token);
      return { success: true, token };
    }
    return { success: false, message: "Invalid credentials" };
  },

  logout: () => {
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
