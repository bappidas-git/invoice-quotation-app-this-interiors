import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Skeleton,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MetricCard from "../Common/MetricCard";
import DateRangeFilter from "../Common/DateRangeFilter";
import { quotationsAPI, invoicesAPI, clientsAPI } from "../../services/api";
import { formatCurrency, getDateRange } from "../../utils/helpers";
import styles from "./dashboard.module.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("Last Month");
  const [customDateRange, setCustomDateRange] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalInvoices: 0,
    totalInvoiceAmount: 0,
    totalQuotations: 0,
    totalQuotationAmount: 0,
    partiallyPaidAmount: 0,
    dueAmount: 0,
    totalClients: 0,
    recentQuotations: [],
    recentInvoices: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter, customDateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [quotations, invoices, clients] = await Promise.all([
        quotationsAPI.getAll(),
        invoicesAPI.getAll(),
        clientsAPI.getAll(),
      ]);

      let filteredQuotations = quotations.data;
      let filteredInvoices = invoices.data;

      // Date filtering
      if (dateFilter !== "All") {
        let dateRange;
        if (customDateRange && dateFilter.includes("-")) {
          dateRange = {
            startDate: customDateRange.start,
            endDate: customDateRange.end,
          };
        } else {
          dateRange = getDateRange(dateFilter);
        }

        if (dateRange.startDate && dateRange.endDate) {
          filteredQuotations = filteredQuotations.filter(
            (q) =>
              new Date(q.date) >= new Date(dateRange.startDate) &&
              new Date(q.date) <= new Date(dateRange.endDate)
          );

          filteredInvoices = filteredInvoices.filter(
            (i) =>
              new Date(i.date) >= new Date(dateRange.startDate) &&
              new Date(i.date) <= new Date(dateRange.endDate)
          );
        }
      }

      const totalQuotationAmount = filteredQuotations.reduce(
        (sum, q) => sum + q.totalAmount,
        0
      );

      const totalInvoiceAmount = filteredInvoices.reduce(
        (sum, i) => sum + i.totalAmount,
        0
      );

      const partiallyPaidAmount = filteredQuotations
        .filter((q) => q.status === "Partially Paid")
        .reduce((sum, q) => sum + q.paidAmount, 0);

      const dueAmount = totalQuotationAmount - totalInvoiceAmount;

      setDashboardData({
        totalInvoices: filteredInvoices.length,
        totalInvoiceAmount,
        totalQuotations: filteredQuotations.length,
        totalQuotationAmount,
        partiallyPaidAmount,
        dueAmount: dueAmount > 0 ? dueAmount : 0,
        totalClients: clients.data.length,
        recentQuotations: filteredQuotations.slice(0, 5),
        recentInvoices: filteredInvoices.slice(0, 5),
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (filter, dateRange) => {
    setDateFilter(filter);
    setCustomDateRange(dateRange);
  };

  const metrics = [
    {
      title: "Total Invoices",
      value: dashboardData.totalInvoices,
      amount: formatCurrency(dashboardData.totalInvoiceAmount),
      icon: "mdi:receipt-text",
      color: "#667eea",
      bgGradient:
        "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
    },
    {
      title: "Total Performa",
      value: dashboardData.totalQuotations,
      amount: formatCurrency(dashboardData.totalQuotationAmount),
      icon: "mdi:file-document-edit",
      color: "#764ba2",
      bgGradient:
        "linear-gradient(135deg, rgba(118, 75, 162, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%)",
    },
    {
      title: "Due Amount",
      value: formatCurrency(dashboardData.dueAmount),
      amount: null,
      icon: "mdi:cash-clock",
      color: "#f59e0b",
      bgGradient:
        "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 146, 60, 0.1) 100%)",
    },
    {
      title: "Total Clients",
      value: dashboardData.totalClients,
      amount: null,
      icon: "mdi:account-group",
      color: "#10b981",
      bgGradient:
        "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(34, 197, 94, 0.1) 100%)",
    },
  ];

  const quickActions = [
    {
      title: "Create New Performa",
      icon: "mdi:file-document-plus",
      color: "#667eea",
      path: "/quotations/create",
    },
    {
      title: "View All Invoices",
      icon: "mdi:receipt-text-outline",
      color: "#764ba2",
      path: "/invoices",
    },
    {
      title: "Manage Clients",
      icon: "mdi:account-edit",
      color: "#10b981",
      path: "/clients",
    },
    {
      title: "View Reports",
      icon: "mdi:chart-line",
      color: "#f59e0b",
      path: "/reports",
    },
  ];

  return (
    <Box className={styles.dashboard}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h4" className={styles.title}>
            Dashboard
          </Typography>
          <Typography variant="body2" className={styles.subtitle}>
            Welcome back! Here's an overview of your business
          </Typography>
        </Box>

        <DateRangeFilter
          value={dateFilter}
          onChange={handleDateFilterChange}
          className={styles.dateFilterGroup}
        />
      </Box>

      <Grid container spacing={3} className={styles.metricsGrid}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {loading ? (
                <Skeleton variant="rectangular" height={140} />
              ) : (
                <MetricCard {...metric} />
              )}
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} className={styles.contentGrid}>
        <Grid item xs={12} md={8}>
          <Card className={styles.glassCard}>
            <CardContent>
              <Box className={styles.cardHeader}>
                <Typography variant="h6" className={styles.cardTitle}>
                  Recent Activity
                </Typography>
                <Box className={styles.cardActions}>
                  <IconButton size="small" onClick={fetchDashboardData}>
                    <Icon icon="mdi:refresh" />
                  </IconButton>
                </Box>
              </Box>

              <Box className={styles.activityList}>
                {loading ? (
                  <>
                    <Skeleton variant="rectangular" height={60} />
                    <Skeleton variant="rectangular" height={60} />
                  </>
                ) : (
                  <>
                    <Typography
                      variant="subtitle2"
                      className={styles.activityHeader}
                    >
                      Recent Performa
                    </Typography>
                    {dashboardData.recentQuotations.map((q) => (
                      <Box key={q.id} className={styles.activityItem}>
                        <Box className={styles.activityIcon}>
                          <Icon icon="mdi:file-document" />
                        </Box>
                        <Box className={styles.activityDetails}>
                          <Typography variant="body2">
                            {q.quotationNumber}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatCurrency(q.totalAmount)} - {q.status}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/quotations/view/${q.id}`)}
                        >
                          <Icon icon="mdi:arrow-right" />
                        </IconButton>
                      </Box>
                    ))}

                    <Typography
                      variant="subtitle2"
                      className={styles.activityHeader}
                    >
                      Recent Invoices
                    </Typography>
                    {dashboardData.recentInvoices.map((i) => (
                      <Box key={i.id} className={styles.activityItem}>
                        <Box className={styles.activityIcon}>
                          <Icon icon="mdi:receipt" />
                        </Box>
                        <Box className={styles.activityDetails}>
                          <Typography variant="body2">
                            {i.invoiceNumber}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatCurrency(i.totalAmount)} - Paid
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/invoices/view/${i.id}`)}
                        >
                          <Icon icon="mdi:arrow-right" />
                        </IconButton>
                      </Box>
                    ))}
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className={styles.glassCard}>
            <CardContent>
              <Typography variant="h6" className={styles.cardTitle}>
                Quick Actions
              </Typography>
              <Box className={styles.quickActionsList}>
                {quickActions.map((action, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Box
                      className={styles.quickActionItem}
                      onClick={() => navigate(action.path)}
                      style={{ borderColor: action.color }}
                    >
                      <Box
                        className={styles.quickActionIcon}
                        style={{ background: action.color }}
                      >
                        <Icon icon={action.icon} />
                      </Box>
                      <Typography variant="body2">{action.title}</Typography>
                      <Icon icon="mdi:chevron-right" />
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
