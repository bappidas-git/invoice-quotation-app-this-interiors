import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  useMediaQuery,
  useTheme,
  Divider,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./layout.module.css";

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [settingsOpen, setSettingsOpen] = useState(false);

  const menuItems = [
    {
      title: "Dashboard",
      icon: "mdi:view-dashboard",
      path: "/",
    },
    {
      title: "Performa",
      icon: "mdi:file-document-edit",
      path: "/quotations",
    },
    {
      title: "Invoices",
      icon: "mdi:receipt-text",
      path: "/invoices",
    },
    {
      title: "BOQ",
      icon: "mdi:clipboard-list",
      path: "/boq",
    },
    {
      title: "Clients",
      icon: "mdi:account-group",
      path: "/clients",
    },
    {
      title: "Reports",
      icon: "mdi:chart-box",
      path: "/reports",
    },
    {
      title: "Settings",
      icon: "mdi:cog",
      path: "/settings",
    },
    {
      title: "BOQ Settings",
      icon: "mdi:cog-box",
      path: "/boq-settings",
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const sidebarContent = (
    <Box className={styles.sidebarContent}>
      <List className={styles.navList}>
        <AnimatePresence>
          {menuItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {item.subItems ? (
                <>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => setSettingsOpen(!settingsOpen)}
                      className={`${styles.navItem} ${
                        location.pathname.includes(item.path)
                          ? styles.activeNavItem
                          : ""
                      }`}
                    >
                      <ListItemIcon className={styles.navIcon}>
                        <Icon icon={item.icon} width="22" height="22" />
                      </ListItemIcon>
                      <ListItemText primary={item.title} />
                      <Icon
                        icon={
                          settingsOpen ? "mdi:chevron-up" : "mdi:chevron-down"
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.subItems.map((subItem) => (
                        <ListItem key={subItem.title} disablePadding>
                          <ListItemButton
                            onClick={() => handleNavigation(subItem.path)}
                            className={`${styles.navSubItem} ${
                              isActive(subItem.path) ? styles.activeNavItem : ""
                            }`}
                          >
                            <ListItemIcon className={styles.navSubIcon}>
                              <Icon
                                icon={subItem.icon}
                                width="20"
                                height="20"
                              />
                            </ListItemIcon>
                            <ListItemText primary={subItem.title} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </>
              ) : (
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    className={`${styles.navItem} ${
                      isActive(item.path) ? styles.activeNavItem : ""
                    }`}
                  >
                    <ListItemIcon className={styles.navIcon}>
                      <Icon icon={item.icon} width="22" height="22" />
                    </ListItemIcon>
                    <ListItemText primary={item.title} />
                  </ListItemButton>
                </ListItem>
              )}
              {index < menuItems.length - 1 && (
                <Divider className={styles.divider} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? "temporary" : "persistent"}
      open={open}
      onClose={onClose}
      className={styles.drawer}
      classes={{
        paper: styles.drawerPaper,
      }}
      ModalProps={{
        keepMounted: true,
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default Sidebar;
