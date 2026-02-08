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
import { boqsAPI, clientsAPI } from "../../services/api";
import {
  formatDate,
  formatCurrency,
  getDateRange,
  getOrgProfile,
} from "../../utils/helpers";
import { BOQ_STATUS } from "../../utils/constants";
import PrintBOQ from "./PrintBOQ";
import styles from "./boq.module.css";

const BOQList = () => {
  const navigate = useNavigate();
  const [boqs, setBoqs] = useState([]);
  const [clients, setClients] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [customDateRange, setCustomDateRange] = useState(null);
  const [statistics, setStatistics] = useState({
    total: { count: 0, amount: 0 },
    draft: { count: 0, amount: 0 },
    sent: { count: 0, amount: 0 },
    approved: { count: 0, amount: 0 },
    rejected: { count: 0, amount: 0 },
  });

  useEffect(() => {
    fetchData();
  }, [dateFilter, statusFilter, customDateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [boqsRes, clientsRes] = await Promise.all([
        boqsAPI.getAll(),
        clientsAPI.getAll(),
      ]);

      const clientsMap = clientsRes.data.reduce((acc, client) => {
        acc[client.id] = client;
        return acc;
      }, {});
      setClients(clientsMap);

      let filteredBoqs = boqsRes.data;

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
          filteredBoqs = filteredBoqs.filter(
            (b) =>
              new Date(b.date) >= new Date(dateRange.startDate) &&
              new Date(b.date) <= new Date(dateRange.endDate)
          );
        }
      }

      // Status filtering
      if (statusFilter !== "All") {
        filteredBoqs = filteredBoqs.filter((b) => b.status === statusFilter);
      }

      // Calculate statistics
      const stats = filteredBoqs.reduce(
        (acc, b) => {
          acc.total.count++;
          acc.total.amount += b.totalAmount || 0;

          if (b.status === BOQ_STATUS.DRAFT) {
            acc.draft.count++;
            acc.draft.amount += b.totalAmount || 0;
          } else if (b.status === BOQ_STATUS.SENT) {
            acc.sent.count++;
            acc.sent.amount += b.totalAmount || 0;
          } else if (b.status === BOQ_STATUS.APPROVED) {
            acc.approved.count++;
            acc.approved.amount += b.totalAmount || 0;
          } else if (b.status === BOQ_STATUS.REJECTED) {
            acc.rejected.count++;
            acc.rejected.amount += b.totalAmount || 0;
          }

          return acc;
        },
        {
          total: { count: 0, amount: 0 },
          draft: { count: 0, amount: 0 },
          sent: { count: 0, amount: 0 },
          approved: { count: 0, amount: 0 },
          rejected: { count: 0, amount: 0 },
        }
      );

      setStatistics(stats);
      setBoqs(filteredBoqs);
    } catch (error) {
      console.error("Error fetching BOQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (boq) => {
    if (boq.status === BOQ_STATUS.APPROVED) {
      Swal.fire({
        icon: "error",
        title: "Cannot Delete",
        text: "Cannot delete approved BOQs",
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
        await boqsAPI.delete(boq.id);
        Swal.fire("Deleted!", "BOQ has been deleted.", "success");
        fetchData();
      } catch (error) {
        Swal.fire("Error!", "Failed to delete BOQ.", "error");
      }
    }
  };

  const printBoq = async (boq) => {
    try {
      const [org, clientRes] = await Promise.all([
        getOrgProfile(),
        boq.clientId
          ? clientsAPI.getById(boq.clientId)
          : Promise.resolve(null),
      ]);
      const client = clientRes?.data || null;
      const printWindow = window.open("", "_blank");
      const printContent = PrintBOQ({ boq, client, organization: org });
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (error) {
      console.error("Error printing BOQ:", error);
    }
  };

  const handleDateFilterChange = (filter, dateRange) => {
    setDateFilter(filter);
    setCustomDateRange(dateRange);
  };

  const filteredBoqs = boqs.filter((b) => {
    const client = clients[b.clientId];
    const searchLower = searchTerm.toLowerCase();
    return (
      (b.boqNumber || "").toLowerCase().includes(searchLower) ||
      (client && client.name.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      field: "boqNumber",
      label: "BOQ No.",
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
            value === BOQ_STATUS.APPROVED
              ? "success"
              : value === BOQ_STATUS.SENT
              ? "warning"
              : value === BOQ_STATUS.REJECTED
              ? "error"
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
          onClick={() => navigate(`/boq/view/${row.id}`)}
        >
          <Icon icon="mdi:eye" />
        </IconButton>
      </Tooltip>
      {row.status !== BOQ_STATUS.APPROVED && (
        <Tooltip title="Edit">
          <IconButton
            size="small"
            onClick={() => navigate(`/boq/edit/${row.id}`)}
          >
            <Icon icon="mdi:pencil" />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Print">
        <IconButton size="small" onClick={() => printBoq(row)}>
          <Icon icon="mdi:printer" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton
          size="small"
          onClick={() => handleDelete(row)}
          disabled={row.status === BOQ_STATUS.APPROVED}
        >
          <Icon icon="mdi:delete" />
        </IconButton>
      </Tooltip>
    </>
  );

  const renderExpandedContent = (row) => (
    <>
      <Typography variant="subtitle2" gutterBottom>
        BOQ Summary
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
            Subtotal
          </Typography>
          <Typography variant="body2">
            {formatCurrency(row.subtotal)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="textSecondary">
            Discount
          </Typography>
          <Typography variant="body2">
            {formatCurrency(row.totalDiscount || 0)}
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
    <Box className={styles.boqList}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h4" className={styles.title}>
            Bill of Quantities (BOQs)
          </Typography>
          <Typography variant="body2" className={styles.subtitle}>
            Manage all your shopping budgets and bill of quantities
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="mdi:plus" />}
          onClick={() => navigate("/boq/create")}
          className={styles.createButton}
        >
          Create New BOQ
        </Button>
      </Box>

      <Box className={styles.statistics}>
        <Card className={styles.statCard}>
          <CardContent>
            <Typography variant="h6">{statistics.total.count}</Typography>
            <Typography variant="body2">Total BOQs</Typography>
            <Typography variant="caption" color="primary">
              {formatCurrency(statistics.total.amount)}
            </Typography>
          </CardContent>
        </Card>
        <Card className={styles.statCard}>
          <CardContent>
            <Typography variant="h6">{statistics.draft.count}</Typography>
            <Typography variant="body2">Draft</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(statistics.draft.amount)}
            </Typography>
          </CardContent>
        </Card>
        <Card className={styles.statCard}>
          <CardContent>
            <Typography variant="h6">{statistics.sent.count}</Typography>
            <Typography variant="body2">Sent</Typography>
            <Typography variant="caption" color="warning.main">
              {formatCurrency(statistics.sent.amount)}
            </Typography>
          </CardContent>
        </Card>
        <Card className={styles.statCard}>
          <CardContent>
            <Typography variant="h6">{statistics.approved.count}</Typography>
            <Typography variant="body2">Approved</Typography>
            <Typography variant="caption" color="success.main">
              {formatCurrency(statistics.approved.amount)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card className={styles.filterCard}>
        <CardContent>
          <Box className={styles.filterContainer}>
            <TextField
              placeholder="Search BOQ..."
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
                <MenuItem value={BOQ_STATUS.DRAFT}>Draft</MenuItem>
                <MenuItem value={BOQ_STATUS.SENT}>Sent</MenuItem>
                <MenuItem value={BOQ_STATUS.APPROVED}>Approved</MenuItem>
                <MenuItem value={BOQ_STATUS.REJECTED}>Rejected</MenuItem>
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
        data={filteredBoqs}
        loading={loading}
        expandable={true}
        expandedContent={renderExpandedContent}
        actions={renderActions}
        emptyMessage="No BOQs found"
      />
    </Box>
  );
};

export default BOQList;
