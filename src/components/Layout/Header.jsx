import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Box,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import authService from "../../services/authService";
import styles from "./layout.module.css";

const Header = ({ onMenuClick, sidebarOpen }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  const handleNewQuotation = () => {
    navigate("/quotations/create");
  };

  return (
    <AppBar position="fixed" className={styles.header}>
      <Toolbar className={styles.toolbar}>
        <Box className={styles.headerLeft}>
          <motion.div
            animate={{ rotate: sidebarOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <IconButton
              edge="start"
              color="inherit"
              onClick={onMenuClick}
              className={styles.menuButton}
            >
              <Icon
                icon={sidebarOpen ? "mdi:close" : "mdi:menu"}
                width="24"
                height="24"
              />
            </IconButton>
          </motion.div>

          <Box className={styles.logoWrapper}>
            <img
              src="https://thisinteriors.com/wp-content/uploads/2023/05/NEW-FINAL-THIS-Logo-1.png"
              alt="THIS Interiors"
              className={styles.logo}
            />
          </Box>
        </Box>

        <Box className={styles.headerRight}>
          {isTablet ? (
            <>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Tooltip title="New Performa">
                  <IconButton
                    color="inherit"
                    onClick={handleNewQuotation}
                    className={styles.headerIconButton}
                  >
                    <Icon
                      icon="mdi:file-document-plus"
                      width="22"
                      height="22"
                    />
                  </IconButton>
                </Tooltip>
              </motion.div>

              <motion.div whileTap={{ scale: 0.95 }}>
                <Tooltip title="Logout">
                  <IconButton
                    color="inherit"
                    onClick={handleLogout}
                    className={styles.headerIconButton}
                  >
                    <Icon icon="mdi:logout" width="22" height="22" />
                  </IconButton>
                </Tooltip>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  startIcon={<Icon icon="mdi:file-document-plus" />}
                  onClick={handleNewQuotation}
                  className={styles.newQuotationBtn}
                >
                  New Performa
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outlined"
                  startIcon={<Icon icon="mdi:logout" />}
                  onClick={handleLogout}
                  className={styles.logoutBtn}
                >
                  Logout
                </Button>
              </motion.div>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
