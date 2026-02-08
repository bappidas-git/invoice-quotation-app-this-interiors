import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import styles from "./metricCard.module.css";

const MetricCard = ({ title, value, amount, icon, color, bgGradient }) => {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ height: "100%" }}>
      <Card className={styles.metricCard} style={{ background: bgGradient }}>
        <CardContent className={styles.cardContent}>
          <Box className={styles.cardHeader}>
            <Box className={styles.iconContainer} style={{ background: color }}>
              <Icon icon={icon} width="24" height="24" />
            </Box>
            <Icon
              icon="mdi:trending-up"
              className={styles.trendIcon}
              style={{ color }}
            />
          </Box>

          <Typography variant="h4" className={styles.value}>
            {value}
          </Typography>

          <Typography variant="body2" className={styles.amount}>
            {amount || "\u00A0"}
          </Typography>

          <Typography variant="caption" className={styles.title}>
            {title}
          </Typography>

          <Box className={styles.progressBar}>
            <Box
              className={styles.progressFill}
              style={{
                background: color,
                width: `${Math.random() * 40 + 60}%`,
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MetricCard;
