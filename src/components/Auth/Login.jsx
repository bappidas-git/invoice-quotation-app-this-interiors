import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import authService from "../../services/authService";
import styles from "./login.module.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = authService.login(formData.email, formData.password);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.message);
    }
  };

  return (
    <Box className={styles.loginContainer}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={styles.loginCard}>
          <CardContent className={styles.cardContent}>
            <Box className={styles.logoContainer}>
              <img
                src="https://thisinteriors.com/wp-content/uploads/2023/05/NEW-FINAL-THIS-Logo-1.png"
                alt="THIS Interiors Logo"
                className={styles.logo}
              />
            </Box>

            <Typography variant="h5" component="h1" className={styles.title}>
              Welcome Back
            </Typography>

            <Typography variant="body2" className={styles.subtitle}>
              Sign in to your account
            </Typography>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert severity="error" className={styles.alert}>
                  {error}
                </Alert>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                variant="outlined"
                className={styles.input}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon icon="mdi:email-outline" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                required
                variant="outlined"
                className={styles.input}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon icon="mdi:lock-outline" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        <Icon icon={showPassword ? "mdi:eye-off" : "mdi:eye"} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                className={styles.submitButton}
                startIcon={<Icon icon="mdi:login" />}
              >
                Sign In
              </Button>
            </form>

            <Box className={styles.footer}>
              <Typography variant="caption" color="textSecondary">
                Default credentials: invoice@thisinteriors.com / THIS@123###
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default Login;
