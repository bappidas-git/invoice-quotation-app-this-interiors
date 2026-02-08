import React, { useState, useEffect } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import styles from "./layout.module.css";

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box className={styles.layout}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      <Box
        className={styles.mainArea}
        style={{
          marginLeft: isMobile ? 0 : sidebarOpen ? "260px" : "0px",
        }}
      >
        <Header toggleSidebar={toggleSidebar} isMobile={isMobile} />
        <Box className={styles.content}>{children}</Box>
        <Footer />
      </Box>

      {isMobile && sidebarOpen && (
        <Box
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </Box>
  );
};

export default Layout;
