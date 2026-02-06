// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Box,
//   Typography,
//   Button,
//   Tabs,
//   Tab,
//   Grid,
//   Card,
//   CardContent,
//   CircularProgress,
// } from "@mui/material";
// import { Icon } from "@iconify/react";
// import { motion } from "framer-motion";
// import MetricCard from "./MetricCard";
// import DateRangePopup from "../Common/DateRangePopup";
// import { quotationsAPI, invoicesAPI, clientsAPI } from "../../services/api";
// import { DATE_FILTERS } from "../../utils/constants";
// import {
//   getDateRange,
//   filterByDateRange,
//   formatCurrency,
// } from "../../utils/helpers";
// import styles from "./dashboard.module.css";

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [dateFilter, setDateFilter] = useState("Last Month");
//   const [dateRangeOpen, setDateRangeOpen] = useState(false);
//   const [customDateRange, setCustomDateRange] = useState(null);
//   const [metrics, setMetrics] = useState({
//     totalQuotations: 0,
//     quotationsAmount: 0,
//     totalInvoices: 0,
//     invoicesAmount: 0,
//     collectedAmount: 0,
//     dueAmount: 0,
//     totalClients: 0,
//     partiallyPaidQuotations: 0,
//   });

//   useEffect(() => {
//     fetchDashboardData();
//   }, [dateFilter, customDateRange]);

//   const fetchDashboardData = async () => {
//     try {
//       setLoading(true);
//       const [quotationsRes, invoicesRes, clientsRes] = await Promise.all([
//         quotationsAPI.getAll(),
//         invoicesAPI.getAll(),
//         clientsAPI.getAll(),
//       ]);

//       let quotations = quotationsRes.data;
//       let invoices = invoicesRes.data;

//       // Apply date filter
//       if (dateFilter !== DATE_FILTERS.CUSTOM) {
//         const { startDate, endDate } = getDateRange(dateFilter);
//         quotations = filterByDateRange(quotations, startDate, endDate, "date");
//         invoices = filterByDateRange(invoices, startDate, endDate, "date");
//       } else if (customDateRange) {
//         quotations = filterByDateRange(
//           quotations,
//           customDateRange.startDate,
//           customDateRange.endDate,
//           "date"
//         );
//         invoices = filterByDateRange(
//           invoices,
//           customDateRange.startDate,
//           customDateRange.endDate,
//           "date"
//         );
//       }

//       // Calculate metrics
//       const quotationsAmount = quotations.reduce(
//         (sum, q) => sum + q.totalAmount,
//         0
//       );
//       const invoicesAmount = invoices.reduce(
//         (sum, i) => sum + i.totalAmount,
//         0
//       );
//       const collectedAmount = invoices.reduce(
//         (sum, i) => sum + i.paidAmount,
//         0
//       );
//       const partiallyPaidQuotations = quotations.filter(
//         (q) => q.status === "Partially Paid"
//       ).length;
//       const dueAmount = quotationsAmount - collectedAmount;

//       setMetrics({
//         totalQuotations: quotations.length,
//         quotationsAmount,
//         totalInvoices: invoices.length,
//         invoicesAmount,
//         collectedAmount,
//         dueAmount: dueAmount > 0 ? dueAmount : 0,
//         totalClients: clientsRes.data.length,
//         partiallyPaidQuotations,
//       });
//     } catch (error) {
//       console.error("Error fetching dashboard data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDateFilterChange = (event, newValue) => {
//     setDateFilter(newValue);
//     if (newValue === DATE_FILTERS.CUSTOM) {
//       setDateRangeOpen(true);
//     } else {
//       setCustomDateRange(null);
//     }
//   };

//   const handleDateRangeApply = (range) => {
//     setCustomDateRange(range);
//     setDateFilter(DATE_FILTERS.CUSTOM);
//   };

//   if (loading) {
//     return (
//       <Box className={styles.loading}>
//         <CircularProgress />
//       </Box>
//     );
//   }

//   return (
//     <Box className={styles.dashboard}>
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//       >
//         {/* Header */}
//         <Box className={styles.header}>
//           <Box>
//             <Typography variant="h4" className={styles.title}>
//               Dashboard
//             </Typography>
//             <Typography variant="body2" color="textSecondary">
//               Welcome back! Here's what's happening with your business.
//             </Typography>
//           </Box>
//           <Box className={styles.headerActions}>
//             <Button
//               variant="contained"
//               color="primary"
//               startIcon={<Icon icon="mdi:file-document-outline" />}
//               onClick={() => navigate("/quotations/create")}
//               className={styles.actionButton}
//             >
//               New Quotation
//             </Button>
//             <Button
//               variant="outlined"
//               startIcon={<Icon icon="mdi:receipt" />}
//               onClick={() => navigate("/invoices")}
//             >
//               View Invoices
//             </Button>
//           </Box>
//         </Box>

//         {/* Date Filter Tabs */}
//         <Box className={styles.filterSection}>
//           <Tabs
//             value={dateFilter}
//             onChange={handleDateFilterChange}
//             className={styles.tabs}
//           >
//             <Tab label="Today" value="Today" />
//             <Tab label="Last Week" value="Last Week" />
//             <Tab label="Last Month" value="Last Month" />
//             <Tab label="Choose Date Range" value={DATE_FILTERS.CUSTOM} />
//           </Tabs>
//         </Box>

//         {/* Metrics Grid */}
//         <Grid container spacing={3} className={styles.metricsGrid}>
//           <Grid item xs={12} sm={6} md={3}>
//             <MetricCard
//               title="Total Quotations"
//               value={metrics.totalQuotations}
//               icon="mdi:file-document-multiple-outline"
//               color="#1976d2"
//               subtitle={formatCurrency(metrics.quotationsAmount)}
//             />
//           </Grid>
//           <Grid item xs={12} sm={6} md={3}>
//             <MetricCard
//               title="Total Invoices"
//               value={metrics.totalInvoices}
//               icon="mdi:receipt-text"
//               color="#4caf50"
//               subtitle={formatCurrency(metrics.invoicesAmount)}
//             />
//           </Grid>
//           <Grid item xs={12} sm={6} md={3}>
//             <MetricCard
//               title="Amount Collected"
//               value={formatCurrency(metrics.collectedAmount)}
//               icon="mdi:cash-multiple"
//               color="#2196f3"
//             />
//           </Grid>
//           <Grid item xs={12} sm={6} md={3}>
//             <MetricCard
//               title="Due Amount"
//               value={formatCurrency(metrics.dueAmount)}
//               icon="mdi:clock-alert-outline"
//               color="#ff9800"
//             />
//           </Grid>
//           <Grid item xs={12} sm={6} md={3}>
//             <MetricCard
//               title="Partially Paid"
//               value={metrics.partiallyPaidQuotations}
//               icon="mdi:progress-clock"
//               color="#f57c00"
//               subtitle="Quotations"
//             />
//           </Grid>
//           <Grid item xs={12} sm={6} md={3}>
//             <MetricCard
//               title="Total Clients"
//               value={metrics.totalClients}
//               icon="mdi:account-group"
//               color="#9c27b0"
//             />
//           </Grid>
//         </Grid>

//         {/* Quick Actions */}
//         <Box className={styles.quickActions}>
//           <Typography variant="h6" className={styles.sectionTitle}>
//             Quick Actions
//           </Typography>
//           <Grid container spacing={2}>
//             <Grid item xs={12} sm={6} md={3}>
//               <Card
//                 className={styles.actionCard}
//                 onClick={() => navigate("/quotations/create")}
//               >
//                 <CardContent className={styles.actionCardContent}>
//                   <Icon icon="mdi:plus-circle" width={40} color="#1976d2" />
//                   <Typography variant="h6">Create Quotation</Typography>
//                   <Typography variant="body2" color="textSecondary">
//                     Generate new quotation
//                   </Typography>
//                 </CardContent>
//               </Card>
//             </Grid>
//             <Grid item xs={12} sm={6} md={3}>
//               <Card
//                 className={styles.actionCard}
//                 onClick={() => navigate("/invoices")}
//               >
//                 <CardContent className={styles.actionCardContent}>
//                   <Icon icon="mdi:receipt" width={40} color="#4caf50" />
//                   <Typography variant="h6">View Invoices</Typography>
//                   <Typography variant="body2" color="textSecondary">
//                     Manage all invoices
//                   </Typography>
//                 </CardContent>
//               </Card>
//             </Grid>
//             <Grid item xs={12} sm={6} md={3}>
//               <Card
//                 className={styles.actionCard}
//                 onClick={() => navigate("/clients")}
//               >
//                 <CardContent className={styles.actionCardContent}>
//                   <Icon icon="mdi:account-plus" width={40} color="#9c27b0" />
//                   <Typography variant="h6">Add Client</Typography>
//                   <Typography variant="body2" color="textSecondary">
//                     Register new client
//                   </Typography>
//                 </CardContent>
//               </Card>
//             </Grid>
//             <Grid item xs={12} sm={6} md={3}>
//               <Card
//                 className={styles.actionCard}
//                 onClick={() => navigate("/reports")}
//               >
//                 <CardContent className={styles.actionCardContent}>
//                   <Icon icon="mdi:chart-bar" width={40} color="#f57c00" />
//                   <Typography variant="h6">View Reports</Typography>
//                   <Typography variant="body2" color="textSecondary">
//                     Analyze business data
//                   </Typography>
//                 </CardContent>
//               </Card>
//             </Grid>
//           </Grid>
//         </Box>
//       </motion.div>

//       <DateRangePopup
//         open={dateRangeOpen}
//         onClose={() => setDateRangeOpen(false)}
//         onApply={handleDateRangeApply}
//       />
//     </Box>
//   );
// };

// export default Dashboard;

import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  TextField,
  InputAdornment,
  IconButton,
  Skeleton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MetricCard from "../Common/MetricCard";
import { quotationsAPI, invoicesAPI, clientsAPI } from "../../services/api";
import { formatCurrency, getDateRange } from "../../utils/helpers";
import styles from "./dashboard.module.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("Last Month");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
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
    monthlyTrend: [],
  });

  const dateFilters = ["Today", "Last Week", "Last Month", "Choose Date Range"];

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter, startDate, endDate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const dateRange =
        dateFilter === "Choose Date Range"
          ? { startDate, endDate }
          : getDateRange(dateFilter);

      const [quotations, invoices, clients] = await Promise.all([
        quotationsAPI.getAll(),
        invoicesAPI.getAll(),
        clientsAPI.getAll(),
      ]);

      const filteredQuotations = quotations.data.filter(
        (q) =>
          new Date(q.date) >= dateRange.startDate &&
          new Date(q.date) <= dateRange.endDate
      );

      const filteredInvoices = invoices.data.filter(
        (i) =>
          new Date(i.date) >= dateRange.startDate &&
          new Date(i.date) <= dateRange.endDate
      );

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

  const handleDateFilterChange = (filter) => {
    if (filter === "Choose Date Range") {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(false);
      setDateFilter(filter);
    }
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

        <ButtonGroup variant="outlined" className={styles.dateFilterGroup}>
          {dateFilters.map((filter) => (
            <Button
              key={filter}
              onClick={() => handleDateFilterChange(filter)}
              className={dateFilter === filter ? styles.activeFilter : ""}
            >
              {filter}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {showDatePicker && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.datePickerContainer}
        >
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
            renderInput={(params) => <TextField {...params} />}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            renderInput={(params) => <TextField {...params} />}
          />
          <Button
            variant="contained"
            onClick={() => {
              setDateFilter("Choose Date Range");
              setShowDatePicker(false);
            }}
          >
            Apply
          </Button>
        </motion.div>
      )}

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
                  <IconButton size="small">
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
                            {formatCurrency(q.totalAmount)} • {q.status}
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
                            {formatCurrency(i.totalAmount)} • Paid
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
