import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
  FormControl,
  Select,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import DateRangeFilter from "../Common/DateRangeFilter";
import { invoicesAPI, clientsAPI } from "../../services/api";
import {
  formatDate,
  formatCurrency,
  getGeneralSettings,
  getDateRange,
  getOrgProfile,
} from "../../utils/helpers";
import PrintInvoice from "./PrintInvoice";
import styles from "./invoice.module.css";

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("Last Month");
  const [customDateRange, setCustomDateRange] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [generalSettings, setGeneralSettings] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, [dateFilter, customDateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoicesRes, clientsRes, settings] = await Promise.all([
        invoicesAPI.getAll(),
        clientsAPI.getAll(),
        getGeneralSettings(),
      ]);

      let filteredInvoices = invoicesRes.data || [];

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
            (i) =>
              new Date(i.date) >= new Date(dateRange.startDate) &&
              new Date(i.date) <= new Date(dateRange.endDate),
          );
        }
      }

      setInvoices(filteredInvoices);
      setClients(clientsRes.data || []);
      setGeneralSettings(settings);
    } catch (error) {
      console.error("Error fetching data:", error);
      setInvoices([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This invoice will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await invoicesAPI.delete(id);
        Swal.fire("Deleted!", "Invoice has been deleted.", "success");
        fetchData();
      } catch (error) {
        Swal.fire("Error!", "Failed to delete invoice.", "error");
      }
    }
  };

  const handleMenuOpen = (event, invoice) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvoice(null);
  };

  const handleView = () => {
    if (selectedInvoice) navigate(`/invoices/view/${selectedInvoice.id}`);
    handleMenuClose();
  };

  const handlePrint = async () => {
    if (selectedInvoice) {
      await printInvoice(selectedInvoice);
    }
    handleMenuClose();
  };

  const printInvoice = async (invoice) => {
    try {
      const [org, clientRes] = await Promise.all([
        getOrgProfile(),
        invoice.clientId
          ? clientsAPI.getById(invoice.clientId)
          : Promise.resolve(null),
      ]);
      const client = clientRes?.data || null;
      const printWindow = window.open("", "_blank");
      const printContent = PrintInvoice({ invoice, client, organization: org });
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (error) {
      console.error("Error printing invoice:", error);
    }
  };

  const handleDateFilterChange = (filter, dateRange) => {
    setDateFilter(filter);
    setCustomDateRange(dateRange);
    setPage(0);
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : "Unknown Client";
  };

  const getStatusColor = (invoice) => {
    if (!invoice) return "default";
    const isPaid = (invoice.paidAmount || 0) >= (invoice.totalAmount || 0);
    if (isPaid) return "success";

    const d = invoice.date ? new Date(invoice.date) : null;
    if (d && !isNaN(d)) {
      const due = new Date(d);
      due.setDate(due.getDate() + 30);
      if (new Date() > due) return "error";
    }
    return "warning";
  };

  const getStatusLabel = (invoice) => {
    if (!invoice) return "Unknown";
    const isPaid = (invoice.paidAmount || 0) >= (invoice.totalAmount || 0);
    if (isPaid) return "Paid";

    const d = invoice.date ? new Date(invoice.date) : null;
    if (d && !isNaN(d)) {
      const due = new Date(d);
      due.setDate(due.getDate() + 30);
      if (new Date() > due) return "Overdue";
    }
    return "Pending";
  };

  const filteredInvoices = invoices
    .filter((inv) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();

      if (
        typeof inv.invoiceNumber === "string" &&
        inv.invoiceNumber.toLowerCase().includes(q)
      ) {
        return true;
      }

      const clientName = getClientName(inv.clientId).toLowerCase();
      if (clientName.includes(q)) return true;

      const amt = (inv.totalAmount || 0).toString();
      if (amt.includes(searchTerm)) return true;

      return false;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const paginatedInvoices = filteredInvoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  return (
    <Box className={styles.invoiceList}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Box className={styles.header}>
          <Box>
            <Typography variant="h4" className={styles.title}>
              Invoices
            </Typography>
            <Typography variant="body2" className={styles.subtitle}>
              Manage and track all your invoices
            </Typography>
          </Box>
        </Box>

        <Card className={styles.filterCard}>
          <CardContent>
            <Box className={styles.filterContainer}>
              <TextField
                placeholder="Search by invoice number, client, or amount..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
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

        <Card className={styles.tableCard}>
          <CardContent>
            {loading ? (
              <Typography>Loading invoices...</Typography>
            ) : filteredInvoices.length === 0 ? (
              <Box className={styles.emptyState}>
                <Icon
                  icon="mdi:receipt-text-outline"
                  className={styles.emptyIcon}
                />
                <Typography variant="h6">No invoices found</Typography>
                <Typography variant="body2" color="textSecondary">
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "Invoices will appear here when created"}
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Invoice No.</TableCell>
                        <TableCell>Client</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Paid</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedInvoices.map((invoice) => (
                        <TableRow key={invoice.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="500">
                              {invoice.invoiceNumber || "N/A"}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {getClientName(invoice.clientId)}
                          </TableCell>

                          <TableCell>
                            {invoice.date ? formatDate(invoice.date) : "-"}
                          </TableCell>

                          <TableCell>
                            {formatCurrency(
                              invoice.totalAmount || 0,
                              invoice.currency ||
                                generalSettings?.currency ||
                                "AED",
                            )}
                          </TableCell>

                          <TableCell>
                            {formatCurrency(
                              invoice.paidAmount || 0,
                              invoice.currency ||
                                generalSettings?.currency ||
                                "AED",
                            )}
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={getStatusLabel(invoice)}
                              size="small"
                              color={getStatusColor(invoice)}
                            />
                          </TableCell>

                          <TableCell align="center">
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  navigate(`/invoices/view/${invoice.id}`)
                                }
                              >
                                <Icon icon="mdi:eye" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Print">
                              <IconButton
                                size="small"
                                onClick={() => printInvoice(invoice)}
                              >
                                <Icon icon="mdi:printer" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="More Options">
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, invoice)}
                              >
                                <Icon icon="mdi:dots-vertical" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 2,
                  }}
                >
                  <FormControl size="small">
                    <Select
                      value={rowsPerPage}
                      onChange={handleChangeRowsPerPage}
                    >
                      {[5, 10, 25, 50, 100].map((n) => (
                        <MenuItem key={n} value={n}>
                          {n} rows
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TablePagination
                    component="div"
                    count={filteredInvoices.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[]}
                  />
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <Icon icon="mdi:eye" style={{ marginRight: 8 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handlePrint}>
          <Icon icon="mdi:printer" style={{ marginRight: 8 }} />
          Print
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDelete(selectedInvoice?.id);
            handleMenuClose();
          }}
          style={{ color: "#f44336" }}
        >
          <Icon icon="mdi:delete" style={{ marginRight: 8 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default InvoiceList;
