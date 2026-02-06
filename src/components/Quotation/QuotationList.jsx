import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import DataTable from "../Common/DataTable";
import DateRangeFilter from "../Common/DateRangeFilter";
import { quotationsAPI, clientsAPI } from "../../services/api";
import { formatDate, formatCurrency, getDateRange, getOrgProfile } from "../../utils/helpers";
import { QUOTATION_STATUS } from "../../utils/constants";
import PrintQuotation from "./PrintQuotation";
import styles from "./quotation.module.css";

const QuotationList = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("Last Month");
  const [customDateRange, setCustomDateRange] = useState(null);
  const [statistics, setStatistics] = useState({
    total: { count: 0, amount: 0 },
    partial: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 },
  });

  useEffect(() => {
    fetchData();
  }, [dateFilter, statusFilter, customDateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quotationsRes, clientsRes] = await Promise.all([
        quotationsAPI.getAll(),
        clientsAPI.getAll(),
      ]);

      const clientsMap = clientsRes.data.reduce((acc, client) => {
        acc[client.id] = client;
        return acc;
      }, {});

      setClients(clientsMap);

      let filteredQuotations = quotationsRes.data;

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
        }
      }

      // Status filtering
      if (statusFilter !== "All") {
        filteredQuotations = filteredQuotations.filter(
          (q) => q.status === statusFilter
        );
      }

      // Calculate statistics
      const stats = filteredQuotations.reduce(
        (acc, q) => {
          acc.total.count++;
          acc.total.amount += q.totalAmount;

          if (q.status === QUOTATION_STATUS.PARTIALLY_PAID) {
            acc.partial.count++;
            acc.partial.amount += q.paidAmount || 0;
          } else if (q.status === QUOTATION_STATUS.FULLY_PAID) {
            acc.paid.count++;
            acc.paid.amount += q.totalAmount;
          }

          return acc;
        },
        {
          total: { count: 0, amount: 0 },
          partial: { count: 0, amount: 0 },
          paid: { count: 0, amount: 0 },
        }
      );

      setStatistics(stats);
      setQuotations(filteredQuotations);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quotation) => {
    if (
      quotation.status === QUOTATION_STATUS.PARTIALLY_PAID ||
      quotation.status === QUOTATION_STATUS.FULLY_PAID
    ) {
      Swal.fire({
        icon: "error",
        title: "Cannot Delete",
        text: "Cannot delete performa invoices with payment records",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await quotationsAPI.delete(quotation.id);
        Swal.fire("Deleted!", "Performa invoice has been deleted.", "success");
        fetchData();
      } catch (error) {
        Swal.fire("Error!", "Failed to delete performa invoice.", "error");
      }
    }
  };

  const handleEdit = (quotation) => {
    if (quotation.status === QUOTATION_STATUS.QUOTATION) {
      navigate(`/quotations/edit/${quotation.id}`);
    } else if (
      quotation.status === QUOTATION_STATUS.PARTIALLY_PAID ||
      quotation.status === QUOTATION_STATUS.FULLY_PAID
    ) {
      navigate(`/quotations/payment/${quotation.id}`);
    }
  };

  const printQuotation = async (quotation) => {
    try {
      const [org, clientRes] = await Promise.all([
        getOrgProfile(),
        quotation.clientId ? clientsAPI.getById(quotation.clientId) : Promise.resolve(null),
      ]);
      const client = clientRes?.data || null;
      const printWindow = window.open("", "_blank");
      const printContent = PrintQuotation({ quotation, client, organization: org });
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (error) {
      console.error("Error printing quotation:", error);
    }
  };

  const handleDateFilterChange = (filter, dateRange) => {
    setDateFilter(filter);
    setCustomDateRange(dateRange);
  };

  const filteredQuotations = quotations.filter((q) => {
    const client = clients[q.clientId];
    const searchLower = searchTerm.toLowerCase();
    return (
      q.quotationNumber.toLowerCase().includes(searchLower) ||
      (client && client.name.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      field: "quotationNumber",
      label: "Performa No.",
      sortable: true,
      render: (value) => (
        <Typography variant="body2" fontWeight="600">
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
      sortable: true,
      render: (value) => (
        <Chip
          label={value}
          size="small"
          color={
            value === QUOTATION_STATUS.FULLY_PAID
              ? "success"
              : value === QUOTATION_STATUS.PARTIALLY_PAID
              ? "warning"
              : "default"
          }
        />
      ),
    },
  ];

  const renderActions = (row) => (
    <>
      <Tooltip title="View">
        <IconButton
          size="small"
          onClick={() => navigate(`/quotations/view/${row.id}`)}
        >
          <Icon icon="mdi:eye" />
        </IconButton>
      </Tooltip>
      {(row.status === QUOTATION_STATUS.QUOTATION ||
        row.status === QUOTATION_STATUS.PARTIALLY_PAID) && (
        <Tooltip
          title={
            row.status === QUOTATION_STATUS.QUOTATION ? "Edit" : "Add Payment"
          }
        >
          <IconButton size="small" onClick={() => handleEdit(row)}>
            <Icon
              icon={
                row.status === QUOTATION_STATUS.QUOTATION
                  ? "mdi:pencil"
                  : "mdi:cash-plus"
              }
            />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Print">
        <IconButton
          size="small"
          onClick={() => printQuotation(row)}
        >
          <Icon icon="mdi:printer" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton
          size="small"
          onClick={() => handleDelete(row)}
          disabled={row.status !== QUOTATION_STATUS.QUOTATION}
        >
          <Icon icon="mdi:delete" />
        </IconButton>
      </Tooltip>
    </>
  );

  const renderExpandedContent = (row) => (
    <>
      <Typography variant="subtitle2" gutterBottom>
        Performa Summary
      </Typography>
      <Box className={styles.summaryGrid}>
        <Box>
          <Typography variant="caption" color="textSecondary">
            Items
          </Typography>
          <Typography variant="body2">
            {row.items?.length || 0} items
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="textSecondary">
            Total Amount
          </Typography>
          <Typography variant="body2">
            {formatCurrency(row.totalAmount)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="textSecondary">
            Paid Amount
          </Typography>
          <Typography variant="body2">
            {formatCurrency(row.paidAmount || 0)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="textSecondary">
            Balance
          </Typography>
          <Typography variant="body2">
            {formatCurrency(row.totalAmount - (row.paidAmount || 0))}
          </Typography>
        </Box>
      </Box>
      {row.notes && (
        <Box className={styles.notes}>
          <Typography variant="caption" color="textSecondary">
            Notes
          </Typography>
          <Typography variant="body2">{row.notes}</Typography>
        </Box>
      )}
    </>
  );

  return (
    <Box className={styles.quotationList}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h4" className={styles.title}>
            Performa
          </Typography>
          <Typography variant="body2" className={styles.subtitle}>
            Manage all your performa invoices and track payments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="mdi:plus" />}
          onClick={() => navigate("/quotations/create")}
          className={styles.createButton}
        >
          Create New Performa
        </Button>
      </Box>

      <Box className={styles.statistics}>
        <Card className={styles.statCard}>
          <CardContent>
            <Typography variant="h6">{statistics.total.count}</Typography>
            <Typography variant="body2">Total Performa</Typography>
            <Typography variant="caption" color="primary">
              {formatCurrency(statistics.total.amount)}
            </Typography>
          </CardContent>
        </Card>
        <Card className={styles.statCard}>
          <CardContent>
            <Typography variant="h6">{statistics.partial.count}</Typography>
            <Typography variant="body2">Partially Paid</Typography>
            <Typography variant="caption" color="warning.main">
              {formatCurrency(statistics.partial.amount)}
            </Typography>
          </CardContent>
        </Card>
        <Card className={styles.statCard}>
          <CardContent>
            <Typography variant="h6">{statistics.paid.count}</Typography>
            <Typography variant="body2">Fully Paid</Typography>
            <Typography variant="caption" color="success.main">
              {formatCurrency(statistics.paid.amount)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card className={styles.filterCard}>
        <CardContent>
          <Box className={styles.filterContainer}>
            <TextField
              placeholder="Search performa..."
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

            <FormControl className={styles.filterSelect}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value={QUOTATION_STATUS.QUOTATION}>
                  Performa
                </MenuItem>
                <MenuItem value={QUOTATION_STATUS.PARTIALLY_PAID}>
                  Partially Paid
                </MenuItem>
                <MenuItem value={QUOTATION_STATUS.FULLY_PAID}>
                  Fully Paid
                </MenuItem>
              </Select>
            </FormControl>

            <DateRangeFilter
              value={dateFilter}
              onChange={handleDateFilterChange}
            />
          </Box>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={filteredQuotations}
        loading={loading}
        expandable={true}
        expandedContent={renderExpandedContent}
        actions={renderActions}
        emptyMessage="No performa invoices found"
      />
    </Box>
  );
};

export default QuotationList;
