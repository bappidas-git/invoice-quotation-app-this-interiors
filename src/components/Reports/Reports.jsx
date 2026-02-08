import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, getMonth, getYear } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import DateRangeFilter from "../Common/DateRangeFilter";
import MetricCard from "../Common/MetricCard";
import {
  quotationsAPI,
  invoicesAPI,
  clientsAPI,
  scopeOfWorkAPI,
} from "../../services/api";
import {
  formatCurrency,
  formatDate,
  getDateRange,
  getGeneralSettings,
} from "../../utils/helpers";
import { PAYMENT_METHODS } from "../../utils/constants";
import styles from "./reports.module.css";

const REPORT_TABS = [
  { label: "Revenue", icon: "mdi:chart-line" },
  { label: "Clients", icon: "mdi:account-group" },
  { label: "Status", icon: "mdi:list-status" },
  { label: "Payments", icon: "mdi:cash-multiple" },
  { label: "Tax Summary", icon: "mdi:percent-box" },
  { label: "Services", icon: "mdi:briefcase-outline" },
  { label: "Outstanding", icon: "mdi:clock-alert-outline" },
];

const CHART_COLORS = [
  "#667eea", "#764ba2", "#f59e0b", "#10b981", "#ef4444",
  "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [dateFilter, setDateFilter] = useState("All");
  const [customDateRange, setCustomDateRange] = useState(null);
  const [settings, setSettings] = useState(null);

  // Raw data
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [scopeOfWork, setScopeOfWork] = useState([]);

  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("");
  const [order, setOrder] = useState("desc");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [qRes, iRes, cRes, sRes, genSettings] = await Promise.all([
        quotationsAPI.getAll(),
        invoicesAPI.getAll(),
        clientsAPI.getAll(),
        scopeOfWorkAPI.getAll(),
        getGeneralSettings(),
      ]);
      setQuotations(qRes.data);
      setInvoices(iRes.data);
      setClients(cRes.data);
      setScopeOfWork(sRes.data);
      setSettings(genSettings);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter data by date range
  const filteredData = useMemo(() => {
    let filteredQ = [...quotations];
    let filteredI = [...invoices];

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
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        filteredQ = filteredQ.filter((q) => {
          const d = new Date(q.date);
          return d >= start && d <= end;
        });
        filteredI = filteredI.filter((i) => {
          const d = new Date(i.date);
          return d >= start && d <= end;
        });
      }
    }

    return { quotations: filteredQ, invoices: filteredI };
  }, [quotations, invoices, dateFilter, customDateRange]);

  const handleDateFilterChange = (filter, range) => {
    setDateFilter(filter);
    setCustomDateRange(range);
  };

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setPage(0);
    setOrderBy("");
    setOrder("desc");
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortData = useCallback(
    (data) => {
      if (!orderBy) return data;
      return [...data].sort((a, b) => {
        const aVal = a[orderBy];
        const bVal = b[orderBy];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (order === "asc") return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      });
    },
    [orderBy, order]
  );

  // ───────────────────── CLIENT MAP ─────────────────────
  const clientMap = useMemo(() => {
    const map = {};
    clients.forEach((c) => (map[c.id] = c.name));
    return map;
  }, [clients]);

  // ───────────────────── REVENUE REPORT ─────────────────────
  const revenueData = useMemo(() => {
    const { quotations: fq, invoices: fi } = filteredData;

    const totalQuotationAmount = fq.reduce((s, q) => s + (q.totalAmount || 0), 0);
    const totalInvoiceAmount = fi.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const totalCollected = fi.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const totalOutstanding = totalQuotationAmount - totalCollected;

    // Monthly revenue breakdown
    const monthlyMap = {};
    fi.forEach((inv) => {
      const d = new Date(inv.date);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM yyyy");
      if (!monthlyMap[key]) monthlyMap[key] = { key, label, invoiced: 0, collected: 0 };
      monthlyMap[key].invoiced += inv.totalAmount || 0;
      monthlyMap[key].collected += inv.paidAmount || 0;
    });

    fq.forEach((q) => {
      const d = new Date(q.date);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM yyyy");
      if (!monthlyMap[key]) monthlyMap[key] = { key, label, invoiced: 0, collected: 0 };
    });

    const monthly = Object.values(monthlyMap).sort((a, b) => a.key.localeCompare(b.key));

    return {
      totalQuotationAmount,
      totalInvoiceAmount,
      totalCollected,
      totalOutstanding: totalOutstanding > 0 ? totalOutstanding : 0,
      monthly,
      quotationCount: fq.length,
      invoiceCount: fi.length,
    };
  }, [filteredData]);

  // ───────────────────── CLIENT REPORT ─────────────────────
  const clientReportData = useMemo(() => {
    const { quotations: fq, invoices: fi } = filteredData;
    const map = {};

    clients.forEach((c) => {
      map[c.id] = {
        id: c.id,
        name: c.name,
        email: c.email,
        quotations: 0,
        quotationAmount: 0,
        invoices: 0,
        invoiceAmount: 0,
        paidAmount: 0,
        outstanding: 0,
      };
    });

    fq.forEach((q) => {
      if (map[q.clientId]) {
        map[q.clientId].quotations += 1;
        map[q.clientId].quotationAmount += q.totalAmount || 0;
      }
    });

    fi.forEach((i) => {
      if (map[i.clientId]) {
        map[i.clientId].invoices += 1;
        map[i.clientId].invoiceAmount += i.totalAmount || 0;
        map[i.clientId].paidAmount += i.paidAmount || 0;
      }
    });

    Object.values(map).forEach((c) => {
      c.outstanding = c.quotationAmount - c.paidAmount;
      if (c.outstanding < 0) c.outstanding = 0;
    });

    return Object.values(map)
      .filter((c) => c.quotations > 0 || c.invoices > 0)
      .sort((a, b) => b.quotationAmount - a.quotationAmount);
  }, [filteredData, clients]);

  // ───────────────────── STATUS REPORT ─────────────────────
  const statusData = useMemo(() => {
    const { quotations: fq } = filteredData;

    const statusMap = { Performa: [], "Partially Paid": [], "Fully Paid": [], Quotation: [] };

    fq.forEach((q) => {
      const status = q.status || "Performa";
      if (!statusMap[status]) statusMap[status] = [];
      statusMap[status].push(q);
    });

    const breakdown = Object.entries(statusMap)
      .filter(([_, items]) => items.length > 0)
      .map(([status, items]) => ({
        status,
        count: items.length,
        totalAmount: items.reduce((s, q) => s + (q.totalAmount || 0), 0),
        paidAmount: items.reduce((s, q) => s + (q.paidAmount || 0), 0),
      }));

    const total = fq.length || 1;

    return { breakdown, total: fq.length, items: fq };
  }, [filteredData]);

  // ───────────────────── PAYMENT METHOD REPORT ─────────────────────
  const paymentData = useMemo(() => {
    const { quotations: fq, invoices: fi } = filteredData;

    // From invoices (payment method)
    const methodMap = {};
    fi.forEach((inv) => {
      const method = inv.paymentMethod || "Other";
      if (!methodMap[method]) methodMap[method] = { method, count: 0, amount: 0 };
      methodMap[method].count += 1;
      methodMap[method].amount += inv.paidAmount || 0;
    });

    // Also from quotation payments array
    fq.forEach((q) => {
      if (q.payments && q.payments.length > 0) {
        q.payments.forEach((p) => {
          const method = p.paymentMethod || "Other";
          // Only count if not already counted via invoices (avoid double counting)
          // We'll skip this since invoices already capture payment info
        });
      }
    });

    const methods = Object.values(methodMap).sort((a, b) => b.amount - a.amount);
    const totalCollected = methods.reduce((s, m) => s + m.amount, 0);

    return { methods, totalCollected, invoiceCount: fi.length };
  }, [filteredData]);

  // ───────────────────── TAX SUMMARY REPORT ─────────────────────
  const taxData = useMemo(() => {
    const { quotations: fq, invoices: fi } = filteredData;

    let totalTaxFromQuotations = 0;
    let totalServiceTaxFromQuotations = 0;
    let totalSubtotalQ = 0;

    fq.forEach((q) => {
      totalTaxFromQuotations += q.taxAmount || 0;
      totalServiceTaxFromQuotations += q.serviceTaxAmount || 0;
      totalSubtotalQ += q.subtotal || 0;
    });

    let totalTaxFromInvoices = 0;
    let totalServiceTaxFromInvoices = 0;
    let totalSubtotalI = 0;

    fi.forEach((i) => {
      totalTaxFromInvoices += i.taxAmount || 0;
      totalServiceTaxFromInvoices += i.serviceTaxAmount || 0;
      totalSubtotalI += i.subtotal || 0;
    });

    // Per-quotation breakdown for table
    const taxBreakdown = fq
      .filter((q) => (q.taxAmount || 0) > 0 || (q.serviceTaxAmount || 0) > 0)
      .map((q) => ({
        id: q.id,
        number: q.quotationNumber,
        client: clientMap[q.clientId] || "Unknown",
        date: q.date,
        subtotal: q.subtotal || 0,
        taxPercent: q.taxPercent || 0,
        taxAmount: q.taxAmount || 0,
        serviceTaxPercent: q.serviceTaxPercent || 0,
        serviceTaxAmount: q.serviceTaxAmount || 0,
        totalAmount: q.totalAmount || 0,
      }));

    return {
      totalTaxFromQuotations,
      totalServiceTaxFromQuotations,
      totalSubtotalQ,
      totalTaxFromInvoices,
      totalServiceTaxFromInvoices,
      totalSubtotalI,
      taxBreakdown,
      totalTax: totalTaxFromQuotations + totalServiceTaxFromQuotations,
    };
  }, [filteredData, clientMap]);

  // ───────────────────── SCOPE OF WORK / SERVICES REPORT ─────────────────────
  const servicesData = useMemo(() => {
    const { quotations: fq } = filteredData;

    const sowMap = {};
    fq.forEach((q) => {
      if (q.items) {
        q.items.forEach((item) => {
          const sow = item.scopeOfWork || "Other";
          if (!sowMap[sow]) sowMap[sow] = { name: sow, count: 0, amount: 0 };
          sowMap[sow].count += 1;
          sowMap[sow].amount += parseFloat(item.amount) || 0;
        });
      }
    });

    const services = Object.values(sowMap).sort((a, b) => b.amount - a.amount);
    const totalAmount = services.reduce((s, svc) => s + svc.amount, 0);

    return { services, totalAmount };
  }, [filteredData]);

  // ───────────────────── OUTSTANDING / AGING REPORT ─────────────────────
  const outstandingData = useMemo(() => {
    const { quotations: fq } = filteredData;

    const outstanding = fq
      .filter((q) => {
        const balance = (q.totalAmount || 0) - (q.paidAmount || 0);
        return balance > 0;
      })
      .map((q) => {
        const balance = (q.totalAmount || 0) - (q.paidAmount || 0);
        const daysOld = Math.floor(
          (new Date() - new Date(q.date)) / (1000 * 60 * 60 * 24)
        );

        let aging;
        if (daysOld <= 30) aging = "0-30 days";
        else if (daysOld <= 60) aging = "31-60 days";
        else if (daysOld <= 90) aging = "61-90 days";
        else aging = "90+ days";

        return {
          id: q.id,
          quotationNumber: q.quotationNumber,
          client: clientMap[q.clientId] || "Unknown",
          clientId: q.clientId,
          date: q.date,
          totalAmount: q.totalAmount || 0,
          paidAmount: q.paidAmount || 0,
          balance,
          daysOld,
          aging,
          status: q.status,
        };
      })
      .sort((a, b) => b.daysOld - a.daysOld);

    // Aging buckets
    const agingBuckets = {
      "0-30 days": { count: 0, amount: 0, color: "#10b981" },
      "31-60 days": { count: 0, amount: 0, color: "#f59e0b" },
      "61-90 days": { count: 0, amount: 0, color: "#f97316" },
      "90+ days": { count: 0, amount: 0, color: "#ef4444" },
    };

    outstanding.forEach((o) => {
      if (agingBuckets[o.aging]) {
        agingBuckets[o.aging].count += 1;
        agingBuckets[o.aging].amount += o.balance;
      }
    });

    const totalOutstanding = outstanding.reduce((s, o) => s + o.balance, 0);

    return { outstanding, agingBuckets, totalOutstanding };
  }, [filteredData, clientMap]);

  // ───────────────────── CSV EXPORT ─────────────────────
  const exportCSV = () => {
    let csvContent = "";
    let fileName = "";

    switch (activeTab) {
      case 0: {
        fileName = "revenue_report";
        csvContent = "Month,Invoiced Amount,Collected Amount\n";
        revenueData.monthly.forEach((m) => {
          csvContent += `${m.label},${m.invoiced.toFixed(2)},${m.collected.toFixed(2)}\n`;
        });
        break;
      }
      case 1: {
        fileName = "client_report";
        csvContent = "Client,Email,Quotations,Quotation Amount,Invoices,Invoice Amount,Paid Amount,Outstanding\n";
        clientReportData.forEach((c) => {
          csvContent += `"${c.name}","${c.email}",${c.quotations},${c.quotationAmount.toFixed(2)},${c.invoices},${c.invoiceAmount.toFixed(2)},${c.paidAmount.toFixed(2)},${c.outstanding.toFixed(2)}\n`;
        });
        break;
      }
      case 2: {
        fileName = "status_report";
        csvContent = "Status,Count,Total Amount,Paid Amount\n";
        statusData.breakdown.forEach((s) => {
          csvContent += `${s.status},${s.count},${s.totalAmount.toFixed(2)},${s.paidAmount.toFixed(2)}\n`;
        });
        break;
      }
      case 3: {
        fileName = "payment_method_report";
        csvContent = "Payment Method,Transactions,Amount\n";
        paymentData.methods.forEach((m) => {
          csvContent += `${m.method},${m.count},${m.amount.toFixed(2)}\n`;
        });
        break;
      }
      case 4: {
        fileName = "tax_summary_report";
        csvContent = "Number,Client,Date,Subtotal,Tax %,Tax Amount,Service Tax %,Service Tax Amount,Total\n";
        taxData.taxBreakdown.forEach((t) => {
          csvContent += `${t.number},"${t.client}",${formatDate(t.date)},${t.subtotal.toFixed(2)},${t.taxPercent},${t.taxAmount.toFixed(2)},${t.serviceTaxPercent},${t.serviceTaxAmount.toFixed(2)},${t.totalAmount.toFixed(2)}\n`;
        });
        break;
      }
      case 5: {
        fileName = "services_report";
        csvContent = "Service/Scope of Work,Times Used,Total Amount\n";
        servicesData.services.forEach((s) => {
          csvContent += `"${s.name}",${s.count},${s.amount.toFixed(2)}\n`;
        });
        break;
      }
      case 6: {
        fileName = "outstanding_report";
        csvContent = "Quotation #,Client,Date,Total,Paid,Balance,Days Old,Aging\n";
        outstandingData.outstanding.forEach((o) => {
          csvContent += `${o.quotationNumber},"${o.client}",${formatDate(o.date)},${o.totalAmount.toFixed(2)},${o.paidAmount.toFixed(2)},${o.balance.toFixed(2)},${o.daysOld},${o.aging}\n`;
        });
        break;
      }
      default:
        return;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ───────────────────── PDF EXPORT ─────────────────────
  const exportPDF = () => {
    const doc = new jsPDF();
    const tabName = REPORT_TABS[activeTab].label;
    doc.setFontSize(18);
    doc.text(`${tabName} Report`, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 30);
    doc.text(`Filter: ${dateFilter}`, 14, 36);

    let startY = 44;

    switch (activeTab) {
      case 0: {
        doc.autoTable({
          startY,
          head: [["Month", "Invoiced", "Collected"]],
          body: revenueData.monthly.map((m) => [
            m.label,
            formatCurrency(m.invoiced),
            formatCurrency(m.collected),
          ]),
          theme: "grid",
          headStyles: { fillColor: [102, 126, 234] },
        });
        break;
      }
      case 1: {
        doc.autoTable({
          startY,
          head: [["Client", "Quotations", "Qt. Amount", "Invoices", "Inv. Amount", "Paid", "Outstanding"]],
          body: clientReportData.map((c) => [
            c.name,
            c.quotations,
            formatCurrency(c.quotationAmount),
            c.invoices,
            formatCurrency(c.invoiceAmount),
            formatCurrency(c.paidAmount),
            formatCurrency(c.outstanding),
          ]),
          theme: "grid",
          headStyles: { fillColor: [102, 126, 234] },
        });
        break;
      }
      case 2: {
        doc.autoTable({
          startY,
          head: [["Status", "Count", "Total Amount", "Paid Amount"]],
          body: statusData.breakdown.map((s) => [
            s.status,
            s.count,
            formatCurrency(s.totalAmount),
            formatCurrency(s.paidAmount),
          ]),
          theme: "grid",
          headStyles: { fillColor: [102, 126, 234] },
        });
        break;
      }
      case 3: {
        doc.autoTable({
          startY,
          head: [["Payment Method", "Transactions", "Amount"]],
          body: paymentData.methods.map((m) => [
            m.method,
            m.count,
            formatCurrency(m.amount),
          ]),
          theme: "grid",
          headStyles: { fillColor: [102, 126, 234] },
        });
        break;
      }
      case 4: {
        doc.autoTable({
          startY,
          head: [["Number", "Client", "Subtotal", "Tax", "Service Tax", "Total"]],
          body: taxData.taxBreakdown.map((t) => [
            t.number,
            t.client,
            formatCurrency(t.subtotal),
            formatCurrency(t.taxAmount),
            formatCurrency(t.serviceTaxAmount),
            formatCurrency(t.totalAmount),
          ]),
          theme: "grid",
          headStyles: { fillColor: [102, 126, 234] },
        });
        break;
      }
      case 5: {
        doc.autoTable({
          startY,
          head: [["Service / Scope of Work", "Times Used", "Amount"]],
          body: servicesData.services.map((s) => [
            s.name,
            s.count,
            formatCurrency(s.amount),
          ]),
          theme: "grid",
          headStyles: { fillColor: [102, 126, 234] },
        });
        break;
      }
      case 6: {
        doc.autoTable({
          startY,
          head: [["Quotation #", "Client", "Date", "Total", "Paid", "Balance", "Aging"]],
          body: outstandingData.outstanding.map((o) => [
            o.quotationNumber,
            o.client,
            formatDate(o.date),
            formatCurrency(o.totalAmount),
            formatCurrency(o.paidAmount),
            formatCurrency(o.balance),
            o.aging,
          ]),
          theme: "grid",
          headStyles: { fillColor: [102, 126, 234] },
        });
        break;
      }
      default:
        break;
    }

    doc.save(`${REPORT_TABS[activeTab].label.toLowerCase()}_report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  // ───────────────────── RENDER HELPERS ─────────────────────
  const renderBarChart = (data, valueKey, labelKey, color = "#667eea") => {
    if (!data || data.length === 0) return renderEmpty("No data for chart");
    const maxVal = Math.max(...data.map((d) => d[valueKey])) || 1;
    return (
      <Box className={styles.barChart}>
        {data.map((item, i) => (
          <Box key={i} className={styles.barGroup}>
            <Typography className={styles.barValue}>
              {formatCurrency(item[valueKey])}
            </Typography>
            <Tooltip title={`${item[labelKey]}: ${formatCurrency(item[valueKey])}`}>
              <Box
                className={styles.bar}
                style={{
                  height: `${(item[valueKey] / maxVal) * 100}%`,
                  background: `linear-gradient(180deg, ${CHART_COLORS[i % CHART_COLORS.length]} 0%, ${CHART_COLORS[i % CHART_COLORS.length]}99 100%)`,
                }}
              />
            </Tooltip>
            <Typography className={styles.barLabel}>{item[labelKey]}</Typography>
          </Box>
        ))}
      </Box>
    );
  };

  const renderHorizontalBars = (data, nameKey, valueKey, maxValue) => {
    if (!data || data.length === 0) return renderEmpty("No data available");
    const max = maxValue || Math.max(...data.map((d) => d[valueKey])) || 1;
    return (
      <Box className={styles.horizontalBarChart}>
        {data.map((item, i) => (
          <Box key={i} className={styles.horizontalBarItem}>
            <Box className={styles.horizontalBarInfo}>
              <Typography className={styles.horizontalBarName}>
                {item[nameKey]}
              </Typography>
              <Typography className={styles.horizontalBarAmount}>
                {formatCurrency(item[valueKey])}
              </Typography>
            </Box>
            <Box className={styles.horizontalBarTrack}>
              <Box
                className={styles.horizontalBarFill}
                style={{
                  width: `${(item[valueKey] / max) * 100}%`,
                  background: CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  const renderDonutChart = (items, labelKey, valueKey, totalLabel) => {
    if (!items || items.length === 0) return renderEmpty("No data available");
    const total = items.reduce((s, item) => s + item[valueKey], 0) || 1;

    // Build SVG donut
    let cumulativePercent = 0;
    const segments = items.map((item, i) => {
      const percent = (item[valueKey] / total) * 100;
      const startAngle = (cumulativePercent / 100) * 360;
      const endAngle = ((cumulativePercent + percent) / 100) * 360;
      cumulativePercent += percent;
      return { ...item, percent, startAngle, endAngle, color: CHART_COLORS[i % CHART_COLORS.length] };
    });

    const createArcPath = (startAngle, endAngle, radius, cx, cy) => {
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;
      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);
      const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
      return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    };

    return (
      <Box className={styles.donutChart}>
        <Box className={styles.donutVisual}>
          <svg viewBox="0 0 160 160" width="100%" height="100%">
            {segments.map((seg, i) => (
              <path
                key={i}
                d={createArcPath(seg.startAngle, seg.endAngle === 360 ? 359.99 : seg.endAngle, 75, 80, 80)}
                fill={seg.color}
                stroke="white"
                strokeWidth="2"
              />
            ))}
            <circle cx="80" cy="80" r="40" fill="white" />
          </svg>
          <Box className={styles.donutCenter}>
            <Typography className={styles.donutCenterValue}>{items.length}</Typography>
            <Typography className={styles.donutCenterLabel}>{totalLabel}</Typography>
          </Box>
        </Box>
        <Box className={styles.donutLegend}>
          {segments.map((seg, i) => (
            <Box key={i} className={styles.legendItem}>
              <Box className={styles.legendDot} style={{ background: seg.color }} />
              <Box className={styles.legendInfo}>
                <Typography className={styles.legendLabel}>{seg[labelKey]}</Typography>
                <Typography className={styles.legendValue}>
                  {formatCurrency(seg[valueKey])}
                </Typography>
              </Box>
              <Typography className={styles.legendPercent}>
                {seg.percent.toFixed(1)}%
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderSummaryItem = (icon, color, value, label, bgColor) => (
    <Box className={styles.summaryItem} style={{ background: bgColor || "rgba(255,255,255,0.7)" }}>
      <Box className={styles.summaryIcon} style={{ background: color }}>
        <Icon icon={icon} width="24" height="24" />
      </Box>
      <Box className={styles.summaryInfo}>
        <Typography className={styles.summaryValue}>{value}</Typography>
        <Typography className={styles.summaryLabel}>{label}</Typography>
      </Box>
    </Box>
  );

  const renderEmpty = (message) => (
    <Box className={styles.emptyState}>
      <Icon icon="mdi:file-chart-outline" className={styles.emptyIcon} width="64" />
      <Typography variant="body2" color="textSecondary">
        {message}
      </Typography>
    </Box>
  );

  const getStatusClass = (status) => {
    switch (status) {
      case "Fully Paid": return styles.statusFullyPaid;
      case "Partially Paid": return styles.statusPartiallyPaid;
      case "Performa": return styles.statusPerforma;
      case "Quotation": return styles.statusQuotation;
      default: return styles.statusPerforma;
    }
  };

  // ───────────────────── RENDER TAB CONTENT ─────────────────────

  const renderRevenueReport = () => (
    <>
      <Box className={styles.summaryRow}>
        {renderSummaryItem("mdi:file-document-edit", "#764ba2", formatCurrency(revenueData.totalQuotationAmount), "Total Performa Value", "rgba(118,75,162,0.06)")}
        {renderSummaryItem("mdi:receipt-text", "#667eea", formatCurrency(revenueData.totalInvoiceAmount), "Total Invoiced", "rgba(102,126,234,0.06)")}
        {renderSummaryItem("mdi:cash-check", "#10b981", formatCurrency(revenueData.totalCollected), "Total Collected", "rgba(16,185,129,0.06)")}
        {renderSummaryItem("mdi:cash-clock", "#f59e0b", formatCurrency(revenueData.totalOutstanding), "Outstanding", "rgba(245,158,11,0.06)")}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card className={styles.glassCard}>
            <CardContent>
              <Box className={styles.cardHeader}>
                <Box>
                  <Typography variant="h6" className={styles.cardTitle}>
                    Monthly Revenue
                  </Typography>
                  <Typography className={styles.cardSubtitle}>
                    Invoice amounts collected per month
                  </Typography>
                </Box>
              </Box>
              {renderBarChart(revenueData.monthly, "collected", "label")}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );

  const renderClientReport = () => {
    const sorted = sortData(clientReportData);
    const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const maxAmount = Math.max(...clientReportData.map((c) => c.quotationAmount)) || 1;

    return (
      <>
        <Box className={styles.summaryRow}>
          {renderSummaryItem("mdi:account-group", "#667eea", clients.length, "Total Clients", "rgba(102,126,234,0.06)")}
          {renderSummaryItem("mdi:account-check", "#10b981", clientReportData.length, "Active Clients", "rgba(16,185,129,0.06)")}
          {renderSummaryItem("mdi:trophy", "#f59e0b", clientReportData.length > 0 ? clientReportData[0].name : "N/A", "Top Client", "rgba(245,158,11,0.06)")}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card className={styles.glassCard}>
              <CardContent>
                <Typography variant="h6" className={styles.cardTitle}>
                  Revenue by Client
                </Typography>
                {renderHorizontalBars(clientReportData.slice(0, 8), "name", "quotationAmount", maxAmount)}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <Card className={styles.glassCard}>
              <CardContent>
                <Typography variant="h6" className={styles.cardTitle}>
                  Client Details
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <TableSortLabel active={orderBy === "name"} direction={orderBy === "name" ? order : "asc"} onClick={() => handleSort("name")}>
                            Client
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                          <TableSortLabel active={orderBy === "quotations"} direction={orderBy === "quotations" ? order : "asc"} onClick={() => handleSort("quotations")}>
                            Performa
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                          <TableSortLabel active={orderBy === "quotationAmount"} direction={orderBy === "quotationAmount" ? order : "asc"} onClick={() => handleSort("quotationAmount")}>
                            Amount
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                          <TableSortLabel active={orderBy === "paidAmount"} direction={orderBy === "paidAmount" ? order : "asc"} onClick={() => handleSort("paidAmount")}>
                            Paid
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                          <TableSortLabel active={orderBy === "outstanding"} direction={orderBy === "outstanding" ? order : "asc"} onClick={() => handleSort("outstanding")}>
                            Outstanding
                          </TableSortLabel>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginated.map((c) => (
                        <TableRow key={c.id} hover>
                          <TableCell>{c.name}</TableCell>
                          <TableCell align="right">{c.quotations}</TableCell>
                          <TableCell align="right">{formatCurrency(c.quotationAmount)}</TableCell>
                          <TableCell align="right">{formatCurrency(c.paidAmount)}</TableCell>
                          <TableCell align="right">
                            <Typography style={{ color: c.outstanding > 0 ? "#ef4444" : "#10b981", fontWeight: 600, fontSize: "13px" }}>
                              {formatCurrency(c.outstanding)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      {paginated.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body2" color="textSecondary">No client data</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {clientReportData.length > rowsPerPage && (
                  <TablePagination
                    component="div"
                    count={clientReportData.length}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    rowsPerPageOptions={[5, 10, 25]}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    );
  };

  const renderStatusReport = () => {
    const statusColors = {
      Performa: "#667eea",
      "Partially Paid": "#f59e0b",
      "Fully Paid": "#10b981",
      Quotation: "#9ca3af",
    };

    const donutItems = statusData.breakdown.map((s) => ({
      ...s,
      color: statusColors[s.status] || "#999",
    }));

    const sorted = sortData(statusData.items);
    const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
      <>
        <Box className={styles.summaryRow}>
          {renderSummaryItem("mdi:file-document-multiple", "#667eea", statusData.total, "Total Performa", "rgba(102,126,234,0.06)")}
          {statusData.breakdown.map((s, i) =>
            renderSummaryItem(
              s.status === "Fully Paid" ? "mdi:check-circle" : s.status === "Partially Paid" ? "mdi:progress-clock" : "mdi:file-document-outline",
              statusColors[s.status] || "#999",
              s.count,
              s.status,
              `${statusColors[s.status] || "#999"}11`
            )
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card className={styles.glassCard}>
              <CardContent>
                <Typography variant="h6" className={styles.cardTitle}>
                  Status Distribution
                </Typography>
                {renderDonutChart(donutItems, "status", "totalAmount", "Statuses")}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <Card className={styles.glassCard}>
              <CardContent>
                <Typography variant="h6" className={styles.cardTitle}>
                  All Performa by Status
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <TableSortLabel active={orderBy === "quotationNumber"} direction={orderBy === "quotationNumber" ? order : "asc"} onClick={() => handleSort("quotationNumber")}>
                            Number
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Client</TableCell>
                        <TableCell>
                          <TableSortLabel active={orderBy === "date"} direction={orderBy === "date" ? order : "asc"} onClick={() => handleSort("date")}>
                            Date
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                          <TableSortLabel active={orderBy === "totalAmount"} direction={orderBy === "totalAmount" ? order : "asc"} onClick={() => handleSort("totalAmount")}>
                            Amount
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginated.map((q) => (
                        <TableRow key={q.id} hover>
                          <TableCell>{q.quotationNumber}</TableCell>
                          <TableCell>{clientMap[q.clientId] || "Unknown"}</TableCell>
                          <TableCell>{formatDate(q.date)}</TableCell>
                          <TableCell align="right">{formatCurrency(q.totalAmount)}</TableCell>
                          <TableCell align="center">
                            <span className={`${styles.statusChip} ${getStatusClass(q.status)}`}>
                              {q.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {paginated.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body2" color="textSecondary">No performa data</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {statusData.items.length > rowsPerPage && (
                  <TablePagination
                    component="div"
                    count={statusData.items.length}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    rowsPerPageOptions={[5, 10, 25]}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    );
  };

  const renderPaymentReport = () => {
    const maxAmount = Math.max(...paymentData.methods.map((m) => m.amount)) || 1;

    return (
      <>
        <Box className={styles.summaryRow}>
          {renderSummaryItem("mdi:cash-multiple", "#10b981", formatCurrency(paymentData.totalCollected), "Total Collected", "rgba(16,185,129,0.06)")}
          {renderSummaryItem("mdi:receipt-text-check", "#667eea", paymentData.invoiceCount, "Total Transactions", "rgba(102,126,234,0.06)")}
          {renderSummaryItem("mdi:credit-card", "#764ba2", paymentData.methods.length, "Payment Methods Used", "rgba(118,75,162,0.06)")}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card className={styles.glassCard}>
              <CardContent>
                <Typography variant="h6" className={styles.cardTitle}>
                  Payment Method Distribution
                </Typography>
                {renderDonutChart(paymentData.methods, "method", "amount", "Methods")}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card className={styles.glassCard}>
              <CardContent>
                <Typography variant="h6" className={styles.cardTitle}>
                  Amount by Payment Method
                </Typography>
                {renderHorizontalBars(paymentData.methods, "method", "amount", maxAmount)}
                <Box sx={{ mt: 3 }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Method</TableCell>
                          <TableCell align="right">Transactions</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="right">% of Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paymentData.methods.map((m, i) => (
                          <TableRow key={m.method} hover>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box style={{ width: 10, height: 10, borderRadius: "50%", background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                {m.method}
                              </Box>
                            </TableCell>
                            <TableCell align="right">{m.count}</TableCell>
                            <TableCell align="right">{formatCurrency(m.amount)}</TableCell>
                            <TableCell align="right">
                              {((m.amount / (paymentData.totalCollected || 1)) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    );
  };

  const renderTaxReport = () => (
    <>
      <Box className={styles.summaryRow}>
        {renderSummaryItem("mdi:calculator", "#667eea", formatCurrency(taxData.totalSubtotalQ), "Total Subtotal (Performa)", "rgba(102,126,234,0.06)")}
        {renderSummaryItem("mdi:percent-box", "#f59e0b", formatCurrency(taxData.totalTaxFromQuotations), "Tax Collected", "rgba(245,158,11,0.06)")}
        {renderSummaryItem("mdi:percent-circle", "#764ba2", formatCurrency(taxData.totalServiceTaxFromQuotations), "Service Tax", "rgba(118,75,162,0.06)")}
        {renderSummaryItem("mdi:sigma", "#10b981", formatCurrency(taxData.totalTax), "Total Tax Amount", "rgba(16,185,129,0.06)")}
      </Box>

      <Card className={styles.glassCard}>
        <CardContent>
          <Typography variant="h6" className={styles.cardTitle}>
            Tax Breakdown by Performa
          </Typography>
          {taxData.taxBreakdown.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Number</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell align="right">Tax %</TableCell>
                    <TableCell align="right">Tax Amount</TableCell>
                    <TableCell align="right">Service Tax %</TableCell>
                    <TableCell align="right">Service Tax</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {taxData.taxBreakdown.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell>{t.number}</TableCell>
                      <TableCell>{t.client}</TableCell>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell align="right">{formatCurrency(t.subtotal)}</TableCell>
                      <TableCell align="right">{t.taxPercent}%</TableCell>
                      <TableCell align="right">{formatCurrency(t.taxAmount)}</TableCell>
                      <TableCell align="right">{t.serviceTaxPercent}%</TableCell>
                      <TableCell align="right">{formatCurrency(t.serviceTaxAmount)}</TableCell>
                      <TableCell align="right" style={{ fontWeight: 600 }}>
                        {formatCurrency(t.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            renderEmpty("No performa with tax found in the selected period")
          )}
        </CardContent>
      </Card>
    </>
  );

  const renderServicesReport = () => {
    const maxAmount = Math.max(...(servicesData.services.map((s) => s.amount) || [0])) || 1;

    return (
      <>
        <Box className={styles.summaryRow}>
          {renderSummaryItem("mdi:briefcase-outline", "#667eea", servicesData.services.length, "Services Used", "rgba(102,126,234,0.06)")}
          {renderSummaryItem("mdi:currency-usd", "#10b981", formatCurrency(servicesData.totalAmount), "Total Service Value", "rgba(16,185,129,0.06)")}
          {renderSummaryItem("mdi:star", "#f59e0b", servicesData.services.length > 0 ? servicesData.services[0].name : "N/A", "Top Service", "rgba(245,158,11,0.06)")}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card className={styles.glassCard}>
              <CardContent>
                <Typography variant="h6" className={styles.cardTitle}>
                  Revenue by Service
                </Typography>
                {renderDonutChart(servicesData.services, "name", "amount", "Services")}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card className={styles.glassCard}>
              <CardContent>
                <Typography variant="h6" className={styles.cardTitle}>
                  Service Performance
                </Typography>
                {renderHorizontalBars(servicesData.services, "name", "amount", maxAmount)}
                <Box sx={{ mt: 3 }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Service / Scope of Work</TableCell>
                          <TableCell align="right">Times Used</TableCell>
                          <TableCell align="right">Total Amount</TableCell>
                          <TableCell align="right">% of Revenue</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {servicesData.services.map((s, i) => (
                          <TableRow key={s.name} hover>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box style={{ width: 10, height: 10, borderRadius: "50%", background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                <Typography variant="body2" sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {s.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">{s.count}</TableCell>
                            <TableCell align="right">{formatCurrency(s.amount)}</TableCell>
                            <TableCell align="right">
                              {((s.amount / (servicesData.totalAmount || 1)) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    );
  };

  const renderOutstandingReport = () => {
    const { outstanding, agingBuckets, totalOutstanding } = outstandingData;
    const agingEntries = Object.entries(agingBuckets);
    const sorted = sortData(outstanding);
    const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
      <>
        <Box className={styles.summaryRow}>
          {renderSummaryItem("mdi:cash-clock", "#ef4444", formatCurrency(totalOutstanding), "Total Outstanding", "rgba(239,68,68,0.06)")}
          {renderSummaryItem("mdi:file-alert", "#f59e0b", outstanding.length, "Pending Performa", "rgba(245,158,11,0.06)")}
          {agingEntries.map(([bucket, data]) =>
            data.count > 0 ? (
              <React.Fragment key={bucket}>
                {renderSummaryItem(
                  "mdi:clock-outline",
                  data.color,
                  `${data.count} (${formatCurrency(data.amount)})`,
                  bucket,
                  `${data.color}11`
                )}
              </React.Fragment>
            ) : null
          )}
        </Box>

        <Card className={styles.glassCard}>
          <CardContent>
            <Box className={styles.cardHeader}>
              <Box>
                <Typography variant="h6" className={styles.cardTitle}>
                  Outstanding Performa Details
                </Typography>
                <Typography className={styles.cardSubtitle}>
                  {outstanding.length} performa with pending balance
                </Typography>
              </Box>
            </Box>
            {outstanding.length > 0 ? (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <TableSortLabel active={orderBy === "quotationNumber"} direction={orderBy === "quotationNumber" ? order : "asc"} onClick={() => handleSort("quotationNumber")}>
                            Performa #
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Client</TableCell>
                        <TableCell>
                          <TableSortLabel active={orderBy === "date"} direction={orderBy === "date" ? order : "asc"} onClick={() => handleSort("date")}>
                            Date
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                          <TableSortLabel active={orderBy === "totalAmount"} direction={orderBy === "totalAmount" ? order : "asc"} onClick={() => handleSort("totalAmount")}>
                            Total
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">Paid</TableCell>
                        <TableCell align="right">
                          <TableSortLabel active={orderBy === "balance"} direction={orderBy === "balance" ? order : "asc"} onClick={() => handleSort("balance")}>
                            Balance
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                          <TableSortLabel active={orderBy === "daysOld"} direction={orderBy === "daysOld" ? order : "asc"} onClick={() => handleSort("daysOld")}>
                            Days
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="center">Aging</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginated.map((o) => {
                        const agingColor = agingBuckets[o.aging]?.color || "#999";
                        return (
                          <TableRow key={o.id} hover>
                            <TableCell>{o.quotationNumber}</TableCell>
                            <TableCell>{o.client}</TableCell>
                            <TableCell>{formatDate(o.date)}</TableCell>
                            <TableCell align="right">{formatCurrency(o.totalAmount)}</TableCell>
                            <TableCell align="right">{formatCurrency(o.paidAmount)}</TableCell>
                            <TableCell align="right" style={{ color: "#ef4444", fontWeight: 600 }}>
                              {formatCurrency(o.balance)}
                            </TableCell>
                            <TableCell align="right">{o.daysOld}</TableCell>
                            <TableCell align="center">
                              <Chip
                                label={o.aging}
                                size="small"
                                sx={{
                                  background: `${agingColor}18`,
                                  color: agingColor,
                                  fontWeight: 600,
                                  fontSize: "11px",
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <span className={`${styles.statusChip} ${getStatusClass(o.status)}`}>
                                {o.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                {outstanding.length > rowsPerPage && (
                  <TablePagination
                    component="div"
                    count={outstanding.length}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    rowsPerPageOptions={[5, 10, 25]}
                  />
                )}
              </>
            ) : (
              renderEmpty("No outstanding performa found - all payments are up to date!")
            )}
          </CardContent>
        </Card>
      </>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <Box>
          <Box className={styles.summaryRow}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" height={80} sx={{ flex: 1, borderRadius: 2 }} />
            ))}
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
          </Grid>
        </Box>
      );
    }

    switch (activeTab) {
      case 0: return renderRevenueReport();
      case 1: return renderClientReport();
      case 2: return renderStatusReport();
      case 3: return renderPaymentReport();
      case 4: return renderTaxReport();
      case 5: return renderServicesReport();
      case 6: return renderOutstandingReport();
      default: return renderRevenueReport();
    }
  };

  return (
    <Box className={styles.reports}>
      <Box className={styles.header}>
        <Box className={styles.headerLeft}>
          <Typography variant="h4" className={styles.title}>
            Reports
          </Typography>
          <Typography variant="body2" className={styles.subtitle}>
            Comprehensive business analytics and insights
          </Typography>
        </Box>

        <Box className={styles.headerActions}>
          <DateRangeFilter value={dateFilter} onChange={handleDateFilterChange} />
          <Button
            variant="outlined"
            startIcon={<Icon icon="mdi:file-delimited" />}
            onClick={exportCSV}
            className={styles.exportBtn}
            size="small"
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Icon icon="mdi:file-pdf-box" />}
            onClick={exportPDF}
            className={styles.exportBtn}
            size="small"
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      <Box className={styles.tabsContainer}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          className={styles.tabs}
          TabIndicatorProps={{
            style: {
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 4,
              height: 3,
            },
          }}
        >
          {REPORT_TABS.map((tab, i) => (
            <Tab
              key={i}
              className={styles.tab}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Icon icon={tab.icon} width="18" />
                  {tab.label}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderTabContent()}
      </motion.div>
    </Box>
  );
};

export default Reports;
