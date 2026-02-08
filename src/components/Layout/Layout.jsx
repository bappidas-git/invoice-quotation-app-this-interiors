import React, { useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import styles from "./layout.module.css";

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box className={styles.root}>
      <Header onMenuClick={handleSidebarToggle} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        component="main"
        className={`${styles.content} ${
          !isMobile && sidebarOpen ? styles.contentShift : ""
        }`}
      >
        <div className={styles.toolbar} />
        {children}
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;
