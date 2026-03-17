import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Tooltip,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import DataTable from "../Common/DataTable";
import DateRangeFilter from "../Common/DateRangeFilter";
import { boqInvoicesAPI, clientsAPI, bankAccountsAPI } from "../../services/api";
import {
  formatDate,
  formatCurrency,
  getDateRange,
  getOrgProfile,
} from "../../utils/helpers";
import PrintBOQInvoice from "./PrintBOQInvoice";
import styles from "./boq.module.css";

const BOQInvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("All");
  const [customDateRange, setCustomDateRange] = useState(null);
  const [statistics, setStatistics] = useState({
    total: { count: 0, amount: 0 },
  });

  useEffect(() => {
    fetchData();
  }, [dateFilter, customDateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoicesRes, clientsRes] = await Promise.all([
        boqInvoicesAPI.getAll(),
        clientsAPI.getAll(),
      ]);

      const clientsMap = clientsRes.data.reduce((acc, client) => {
        acc[client.id] = client;
        return acc;
      }, {});
      setClients(clientsMap);

      let filteredInvoices = invoicesRes.data;

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
          filteredInvoices = filteredInvoices.filter(
            (inv) =>
              new Date(inv.date) >= new Date(dateRange.startDate) &&
              new Date(inv.date) <= new Date(dateRange.endDate)
          );
        }
      }

      const stats = filteredInvoices.reduce(
        (acc, inv) => {
          acc.total.count++;
          acc.total.amount += inv.totalAmount || 0;
          return acc;
        },
        { total: { count: 0, amount: 0 } }
      );

      setStatistics(stats);
      setInvoices(filteredInvoices);
    } catch (error) {
      console.error("Error fetching BOQ invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (filter, dateRange) => {
    setDateFilter(filter);
    setCustomDateRange(dateRange);
  };

  const handlePrintClient = async (invoice) => {
    try {
      const [org, clientRes, allBanksRes] = await Promise.all([
        getOrgProfile(),
        invoice.clientId
          ? clientsAPI.getById(invoice.clientId)
          : Promise.resolve(null),
        bankAccountsAPI.getAll(),
      ]);
      const client = clientRes?.data || null;
      const banks = allBanksRes?.data || [];
      const bankAccount = banks.find((b) => b.isDefault) || banks[0] || null;
      const printWindow = window.open("", "_blank");
      const printContent = PrintBOQInvoice({ invoice, client, organization: org, bankAccount, includesProcurement: false });
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    } catch (error) {
      console.error("Error printing BOQ invoice:", error);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const client = clients[inv.clientId];
    const searchLower = searchTerm.toLowerCase();
    return (
      (inv.boqInvoiceNumber || "").toLowerCase().includes(searchLower) ||
      (inv.boqNumber || "").toLowerCase().includes(searchLower) ||
      (client && client.name.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      field: "boqInvoiceNumber",
      label: "Invoice No.",
      sortable: true,
      render: (value) => (
        <Typography variant="body2" fontWeight="600">
          {value}
        </Typography>
      ),
    },
    {
      field: "boqNumber",
      label: "BOQ No.",
      sortable: true,
      render: (value) => (
        <Typography variant="body2" color="text.secondary">
          {value}
        </Typography>
      ),
    },
    {
      field: "clientId",
      label: "Client",
      sortable: true,
      render: (value) => clients[value]?.name || "Unknown",
    },
    {
      field: "date",
      label: "Date",
      sortable: true,
      render: (value) => formatDate(value),
    },
    {
      field: "totalAmount",
      label: "Amount",
      sortable: true,
      render: (value) => (
        <Typography variant="body2" fontWeight="500">
          {formatCurrency(value)}
        </Typography>
      ),
    },
    {
      field: "status",
      label: "Status",
      sortable: false,
      render: () => (
        <Chip label="Approved" size="small" color="success" />
      ),
    },
  ];

  const renderActions = (row) => (
    <>
      <Tooltip title="View Invoice">
        <IconButton
          size="small"
          onClick={() => navigate(`/boq-invoices/view/${row.id}`)}
        >
          <Icon icon="mdi:eye" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Print Client Invoice">
        <IconButton size="small" onClick={() => handlePrintClient(row)}>
          <Icon icon="mdi:printer" />
        </IconButton>
      </Tooltip>
    </>
  );

  const renderExpandedContent = (row) => (
    <>
      <Typography variant="subtitle2" gutterBottom>
        BOQ Invoice Summary
      </Typography>
      <Box className={styles.summaryGrid}>
        <Box>
          <Typography variant="caption" color="textSecondary">Items</Typography>
          <Typography variant="body2">{row.items?.length || 0} items</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="textSecondary">Subtotal</Typography>
          <Typography variant="body2">{formatCurrency(row.subtotal)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="textSecondary">Discount</Typography>
          <Typography variant="body2">{formatCurrency(row.totalDiscount || 0)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="textSecondary">Total Amount</Typography>
          <Typography variant="body2">{formatCurrency(row.totalAmount)}</Typography>
        </Box>
      </Box>
      {row.notes && (
        <Box className={styles.notes}>
          <Typography variant="caption" color="textSecondary">Notes</Typography>
          <Typography variant="body2">{row.notes}</Typography>
        </Box>
      )}
    </>
  );

  return (
    <Box className={styles.boqList}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h4" className={styles.title}>
            BOQ Invoices
          </Typography>
          <Typography variant="body2" className={styles.subtitle}>
            Auto-generated invoices from approved BOQs
          </Typography>
        </Box>
        {/* No Create button — invoices are auto-generated only */}
      </Box>

      {/* Statistics */}
      <Box className={styles.statistics}>
        <Card className={styles.statCard}>
          <CardContent>
            <Typography variant="h6">{statistics.total.count}</Typography>
            <Typography variant="body2">Total BOQ Invoices</Typography>
            <Typography variant="caption" color="success.main">
              {formatCurrency(statistics.total.amount)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card className={styles.filterCard}>
        <CardContent>
          <Box className={styles.filterContainer}>
            <TextField
              placeholder="Search by invoice no., BOQ no., or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchField}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon icon="mdi:magnify" />
                  </InputAdornment>
                ),
              }}
            />
            <DateRangeFilter
              value={dateFilter}
              onChange={handleDateFilterChange}
            />
          </Box>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={filteredInvoices}
        loading={loading}
        expandable={true}
        expandedContent={renderExpandedContent}
        actions={renderActions}
        emptyMessage="No BOQ invoices found. BOQ invoices are automatically created when a BOQ is approved."
      />
    </Box>
  );
};

export default BOQInvoiceList;
