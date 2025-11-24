import React, { useState } from "react";
import { Box, Tabs, Tab, Paper } from "@mui/material";
import { Icon } from "@iconify/react";
import Organizations from "./Organizations";
import TaxSettings from "./TaxSettings";
import GeneralSettings from "./GeneralSettings";
import ScopeOfWork from "./ScopeOfWork";
import Tasks from "./Tasks";
import styles from "./settings.module.css";

const Settings = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    {
      label: "Organization",
      icon: "mdi:office-building",
      component: <Organizations />,
    },
    {
      label: "Tax Settings",
      icon: "mdi:calculator",
      component: <TaxSettings />,
    },
    { label: "General", icon: "mdi:cog", component: <GeneralSettings /> },
    {
      label: "Scope of Work",
      icon: "mdi:briefcase",
      component: <ScopeOfWork />,
    },
    { label: "Tasks", icon: "mdi:format-list-checks", component: <Tasks /> },
  ];

  return (
    <Box className={styles.settingsPage}>
      <Paper className={styles.tabsContainer}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={<Icon icon={tab.icon} />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      <Box className={styles.tabContent}>{tabs[activeTab].component}</Box>
    </Box>
  );
};

export default Settings;
