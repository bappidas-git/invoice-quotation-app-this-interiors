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
import { quotationsAPI, invoicesAPI, clientsAPI, boqsAPI } from "../../services/api";
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
    totalBoqs: 0,
    totalBoqAmount: 0,
    boqApproved: 0,
    boqPending: 0,
    recentQuotations: [],
    recentInvoices: [],
    recentBoqs: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter, customDateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [quotations, invoices, clients, boqs] = await Promise.all([
        quotationsAPI.getAll(),
        invoicesAPI.getAll(),
        clientsAPI.getAll(),
        boqsAPI.getAll(),
      ]);

      let filteredQuotations = quotations.data;
      let filteredInvoices = invoices.data;
      let filteredBoqs = boqs.data;

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

          filteredBoqs = filteredBoqs.filter(
            (b) =>
              new Date(b.date) >= new Date(dateRange.startDate) &&
              new Date(b.date) <= new Date(dateRange.endDate)
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

      const totalBoqAmount = filteredBoqs.reduce(
        (sum, b) => sum + (b.totalAmount || 0),
        0
      );

      const boqApproved = filteredBoqs.filter((b) => b.status === "Approved").length;
      const boqPending = filteredBoqs.filter((b) => b.status !== "Approved" && b.status !== "Rejected").length;

      const dueAmount = totalQuotationAmount - totalInvoiceAmount;

      // Sort by date descending (latest first) then take top 3
      const sortedQuotations = [...filteredQuotations].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      const sortedInvoices = [...filteredInvoices].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      const sortedBoqs = [...filteredBoqs].sort(
        (a, b) => new Date(b.date || b.updatedAt) - new Date(a.date || a.updatedAt)
      );

      setDashboardData({
        totalInvoices: filteredInvoices.length,
        totalInvoiceAmount,
        totalQuotations: filteredQuotations.length,
        totalQuotationAmount,
        partiallyPaidAmount: filteredQuotations
          .filter((q) => q.status === "Partially Paid")
          .reduce((sum, q) => sum + q.paidAmount, 0),
        dueAmount: dueAmount > 0 ? dueAmount : 0,
        totalClients: clients.data.length,
        totalBoqs: filteredBoqs.length,
        totalBoqAmount,
        boqApproved,
        boqPending,
        recentQuotations: sortedQuotations.slice(0, 3),
        recentInvoices: sortedInvoices.slice(0, 3),
        recentBoqs: sortedBoqs.slice(0, 3),
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
      color: "#C78A1E",
      bgGradient:
        "linear-gradient(135deg, rgba(199, 138, 30, 0.1) 0%, rgba(230, 182, 92, 0.1) 100%)",
    },
    {
      title: "Total Performa",
      value: dashboardData.totalQuotations,
      amount: formatCurrency(dashboardData.totalQuotationAmount),
      icon: "mdi:file-document-edit",
      color: "#E6B65C",
      bgGradient:
        "linear-gradient(135deg, rgba(230, 182, 92, 0.1) 0%, rgba(199, 138, 30, 0.1) 100%)",
    },
    {
      title: "Due Amount",
      value: formatCurrency(dashboardData.dueAmount),
      amount: null,
      icon: "mdi:cash-clock",
      color: "#C0392B",
      bgGradient:
        "linear-gradient(135deg, rgba(192, 57, 43, 0.1) 0%, rgba(192, 57, 43, 0.05) 100%)",
    },
    {
      title: "Total Clients",
      value: dashboardData.totalClients,
      amount: null,
      icon: "mdi:account-group",
      color: "#2E7D32",
      bgGradient:
        "linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(46, 125, 50, 0.05) 100%)",
    },
  ];

  const quickActions = [
    {
      title: "Create New Performa",
      icon: "mdi:file-document-plus",
      color: "#C78A1E",
      path: "/quotations/create",
    },
    {
      title: "View All Invoices",
      icon: "mdi:receipt-text-outline",
      color: "#E6B65C",
      path: "/invoices",
    },
    {
      title: "Manage Clients",
      icon: "mdi:account-edit",
      color: "#2E7D32",
      path: "/clients",
    },
    {
      title: "View Reports",
      icon: "mdi:chart-line",
      color: "#1F6FB2",
      path: "/reports",
    },
  ];

  const formatDateShort = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

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
              style={{ height: "100%" }}
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

      {/* Recent Activity - Full Width */}
      <Grid container spacing={3} className={styles.contentGrid}>
        <Grid item xs={12}>
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
                  <Box className={styles.activityColumns}>
                    <Box className={styles.activityColumn}>
                      <Typography
                        variant="subtitle2"
                        className={styles.activityHeader}
                      >
                        Recent Performa
                      </Typography>
                      {dashboardData.recentQuotations.length > 0 ? (
                        dashboardData.recentQuotations.map((q) => (
                          <Box
                            key={q.id}
                            className={styles.activityItem}
                            onClick={() => navigate(`/quotations/view/${q.id}`)}
                          >
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
                            <Typography variant="caption" color="textSecondary" className={styles.activityDate}>
                              {formatDateShort(q.date)}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); navigate(`/quotations/view/${q.id}`); }}
                            >
                              <Icon icon="mdi:arrow-right" />
                            </IconButton>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary" sx={{ py: 1, pl: 1 }}>
                          No performa in this period
                        </Typography>
                      )}
                    </Box>

                    <Box className={styles.activityColumn}>
                      <Typography
                        variant="subtitle2"
                        className={styles.activityHeader}
                      >
                        Recent Invoices
                      </Typography>
                      {dashboardData.recentInvoices.length > 0 ? (
                        dashboardData.recentInvoices.map((i) => (
                          <Box
                            key={i.id}
                            className={styles.activityItem}
                            onClick={() => navigate(`/invoices/view/${i.id}`)}
                          >
                            <Box className={`${styles.activityIcon} ${styles.activityIconInvoice}`}>
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
                            <Typography variant="caption" color="textSecondary" className={styles.activityDate}>
                              {formatDateShort(i.date)}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); navigate(`/invoices/view/${i.id}`); }}
                            >
                              <Icon icon="mdi:arrow-right" />
                            </IconButton>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary" sx={{ py: 1, pl: 1 }}>
                          No invoices in this period
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions & BOQ Overview - Below Recent Activity */}
      <Grid container spacing={3} className={styles.bottomGrid}>
        <Grid item xs={12} md={6}>
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

        <Grid item xs={12} md={6}>
          <Card className={styles.glassCard}>
            <CardContent>
              <Box className={styles.cardHeader}>
                <Typography variant="h6" className={styles.cardTitle}>
                  BOQ Overview
                </Typography>
                <IconButton size="small" onClick={() => navigate("/boq")}>
                  <Icon icon="mdi:arrow-right" />
                </IconButton>
              </Box>

              {loading ? (
                <Skeleton variant="rectangular" height={120} />
              ) : (
                <Box className={styles.boqSummary}>
                  <Box className={styles.boqStatRow}>
                    <Box className={styles.boqStat}>
                      <Box className={styles.boqStatIcon} style={{ background: "#C78A1E" }}>
                        <Icon icon="mdi:clipboard-list" width="20" height="20" />
                      </Box>
                      <Box>
                        <Typography variant="h5" className={styles.boqStatValue}>
                          {dashboardData.totalBoqs}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Total BOQs
                        </Typography>
                      </Box>
                    </Box>
                    <Box className={styles.boqStat}>
                      <Box className={styles.boqStatIcon} style={{ background: "#2E7D32" }}>
                        <Icon icon="mdi:check-circle" width="20" height="20" />
                      </Box>
                      <Box>
                        <Typography variant="h5" className={styles.boqStatValue}>
                          {dashboardData.boqApproved}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Approved
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box className={styles.boqAmountBar}>
                    <Typography variant="caption" color="textSecondary">
                      Total BOQ Value
                    </Typography>
                    <Typography variant="h6" className={styles.boqAmountValue}>
                      {formatCurrency(dashboardData.totalBoqAmount)}
                    </Typography>
                  </Box>

                  {dashboardData.boqPending > 0 && (
                    <Box className={styles.boqPendingBadge}>
                      <Icon icon="mdi:clock-outline" width="16" />
                      <Typography variant="caption">
                        {dashboardData.boqPending} pending approval
                      </Typography>
                    </Box>
                  )}

                  {dashboardData.recentBoqs.length > 0 && (
                    <Box className={styles.boqRecentList}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                        Latest BOQs
                      </Typography>
                      {dashboardData.recentBoqs.map((b) => (
                        <Box
                          key={b.id}
                          className={styles.boqRecentItem}
                          onClick={() => navigate(`/boq/view/${b.id}`)}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {b.boqNumber}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatCurrency(b.totalAmount)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                  <Button
                    size="small"
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate("/boq/create")}
                    sx={{
                      mt: 1.5,
                      borderColor: "#C78A1E",
                      color: "#C78A1E",
                      "&:hover": { borderColor: "#B87916", background: "rgba(199, 138, 30, 0.05)" },
                    }}
                    startIcon={<Icon icon="mdi:plus" />}
                  >
                    Create New BOQ
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
