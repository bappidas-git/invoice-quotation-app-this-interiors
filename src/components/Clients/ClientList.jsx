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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from "@mui/material";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import DataTable from "../Common/DataTable";
import {
  clientsAPI,
  quotationsAPI,
  invoicesAPI,
} from "../../services/api";
import { formatDate, formatCurrency } from "../../utils/helpers";
import styles from "./clients.module.css";

const emptyClient = {
  name: "",
  email: "",
  contact: "",
  address: "",
  pin: "",
  state: "",
  country: "",
};

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState(emptyClient);
  const [formErrors, setFormErrors] = useState({});
  const [statistics, setStatistics] = useState({
    total: 0,
    totalRevenue: 0,
    activeClients: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientsRes, quotationsRes, invoicesRes] = await Promise.all([
        clientsAPI.getAll(),
        quotationsAPI.getAll(),
        invoicesAPI.getAll(),
      ]);

      const clientsList = clientsRes.data;
      const quotationsList = quotationsRes.data;
      const invoicesList = invoicesRes.data;

      setClients(clientsList);
      setQuotations(quotationsList);
      setInvoices(invoicesList);

      const clientsWithQuotations = new Set(
        quotationsList.map((q) => q.clientId)
      );

      const totalRevenue = quotationsList.reduce(
        (sum, q) => sum + (q.paidAmount || 0),
        0
      );

      setStatistics({
        total: clientsList.length,
        totalRevenue,
        activeClients: clientsWithQuotations.size,
      });
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const getClientQuotations = (clientId) => {
    return quotations.filter((q) => q.clientId === clientId);
  };

  const getClientInvoices = (clientId) => {
    return invoices.filter((inv) => inv.clientId === clientId);
  };

  const getClientTotalAmount = (clientId) => {
    return getClientQuotations(clientId).reduce(
      (sum, q) => sum + (q.totalAmount || 0),
      0
    );
  };

  const getClientPaidAmount = (clientId) => {
    return getClientQuotations(clientId).reduce(
      (sum, q) => sum + (q.paidAmount || 0),
      0
    );
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.contact.trim()) errors.contact = "Contact is required";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name || "",
        email: client.email || "",
        contact: client.contact || "",
        address: client.address || "",
        pin: client.pin || "",
        state: client.state || "",
        country: client.country || "",
      });
    } else {
      setEditingClient(null);
      setFormData(emptyClient);
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClient(null);
    setFormData(emptyClient);
    setFormErrors({});
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (editingClient) {
        await clientsAPI.update(editingClient.id, {
          ...formData,
          createdAt: editingClient.createdAt,
        });
        Swal.fire("Updated!", "Client has been updated.", "success");
      } else {
        await clientsAPI.create({
          ...formData,
          createdAt: new Date().toISOString(),
        });
        Swal.fire("Created!", "New client has been added.", "success");
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error("Error saving client:", error);
      Swal.fire("Error!", "Failed to save client.", "error");
    }
  };

  const handleDelete = async (client) => {
    const clientQuotations = getClientQuotations(client.id);
    if (clientQuotations.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Cannot Delete",
        text: `This client has ${clientQuotations.length} performa invoice(s) associated. Remove them first before deleting the client.`,
      });
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#C0392B",
      cancelButtonColor: "#6B6B6B",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await clientsAPI.delete(client.id);
        Swal.fire("Deleted!", "Client has been deleted.", "success");
        fetchData();
      } catch (error) {
        console.error("Error deleting client:", error);
        Swal.fire("Error!", "Failed to delete client.", "error");
      }
    }
  };

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      (client.email && client.email.toLowerCase().includes(searchLower)) ||
      (client.contact && client.contact.toLowerCase().includes(searchLower)) ||
      (client.address && client.address.toLowerCase().includes(searchLower)) ||
      (client.state && client.state.toLowerCase().includes(searchLower)) ||
      (client.country && client.country.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      field: "name",
      label: "Client Name",
      sortable: true,
      render: (value) => (
        <Typography variant="body2" fontWeight="600">
          {value}
        </Typography>
      ),
    },
    {
      field: "email",
      label: "Email",
      sortable: true,
      render: (value) => (
        <Typography variant="body2" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
          {value || "-"}
        </Typography>
      ),
    },
    {
      field: "contact",
      label: "Contact",
      sortable: true,
      render: (value) => (
        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
          {value || "-"}
        </Typography>
      ),
    },
    {
      field: "state",
      label: "Location",
      sortable: true,
      render: (value, row) => {
        const parts = [value, row.country].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : "-";
      },
    },
  ];

  const renderActions = (row) => (
    <>
      <Tooltip title="Edit">
        <IconButton size="small" onClick={() => handleOpenDialog(row)}>
          <Icon icon="mdi:pencil" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton size="small" onClick={() => handleDelete(row)}>
          <Icon icon="mdi:delete" />
        </IconButton>
      </Tooltip>
    </>
  );

  const renderExpandedContent = (row) => {
    const clientQuotations = getClientQuotations(row.id);
    const clientInvoices = getClientInvoices(row.id);
    const totalAmount = getClientTotalAmount(row.id);
    const paidAmount = getClientPaidAmount(row.id);
    const balance = totalAmount - paidAmount;

    return (
      <>
        <Typography variant="subtitle2" gutterBottom>
          Client Details
        </Typography>
        <Box className={styles.summaryGrid}>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Address
            </Typography>
            <Typography variant="body2">
              {[row.address, row.pin].filter(Boolean).join(", ") || "-"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Added On
            </Typography>
            <Typography variant="body2">
              {formatDate(row.createdAt)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Performa Invoices
            </Typography>
            <Typography variant="body2">
              {clientQuotations.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Invoices
            </Typography>
            <Typography variant="body2">{clientInvoices.length}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Total Amount
            </Typography>
            <Typography variant="body2">
              {formatCurrency(totalAmount)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Paid Amount
            </Typography>
            <Typography variant="body2">
              {formatCurrency(paidAmount)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Balance
            </Typography>
            <Typography
              variant="body2"
              color={balance > 0 ? "error" : "success.main"}
              fontWeight="500"
            >
              {formatCurrency(balance)}
            </Typography>
          </Box>
        </Box>
      </>
    );
  };

  return (
    <Box className={styles.clientList}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h4" className={styles.title}>
            Clients
          </Typography>
          <Typography variant="body2" className={styles.subtitle}>
            Manage your clients and view their transaction history
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="mdi:plus" />}
          onClick={() => handleOpenDialog()}
          className={styles.createButton}
        >
          Add New Client
        </Button>
      </Box>

      <Box className={styles.statistics}>
        <Card className={styles.statCard}>
          <CardContent>
            <Typography variant="h6">{statistics.total}</Typography>
            <Typography variant="body2">Total Clients</Typography>
          </CardContent>
        </Card>
        <Card className={styles.statCard}>
          <CardContent>
            <Typography variant="h6">{statistics.activeClients}</Typography>
            <Typography variant="body2">Active Clients</Typography>
            <Typography variant="caption" sx={{ color: "#C78A1E" }}>
              With performa invoices
            </Typography>
          </CardContent>
        </Card>
        <Card className={styles.statCard}>
          <CardContent>
            <Typography variant="h6">
              {formatCurrency(statistics.totalRevenue)}
            </Typography>
            <Typography variant="body2">Total Revenue</Typography>
            <Typography variant="caption" sx={{ color: "#2E7D32" }}>
              From all clients
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card className={styles.filterCard}>
        <CardContent>
          <Box className={styles.filterContainer}>
            <TextField
              placeholder="Search clients by name, email, contact, location..."
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
          </Box>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={filteredClients}
        loading={loading}
        expandable={true}
        expandedContent={renderExpandedContent}
        actions={renderActions}
        emptyMessage="No clients found"
      />

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingClient ? "Edit Client" : "Add New Client"}
        </DialogTitle>
        <DialogContent>
          <Box className={styles.dialogForm}>
            <TextField
              label="Client Name"
              value={formData.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              error={!!formErrors.email}
              helperText={formErrors.email}
              fullWidth
            />
            <TextField
              label="Contact Number"
              value={formData.contact}
              onChange={(e) => handleFormChange("contact", e.target.value)}
              error={!!formErrors.contact}
              helperText={formErrors.contact}
              fullWidth
              required
            />
            <TextField
              label="Address"
              value={formData.address}
              onChange={(e) => handleFormChange("address", e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="PIN / Postal Code"
                  value={formData.pin}
                  onChange={(e) => handleFormChange("pin", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="State"
                  value={formData.state}
                  onChange={(e) => handleFormChange("state", e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              label="Country"
              value={formData.country}
              onChange={(e) => handleFormChange("country", e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: "16px 24px" }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={
              <Icon icon={editingClient ? "mdi:content-save" : "mdi:plus"} />
            }
            className={styles.createButton}
          >
            {editingClient ? "Update Client" : "Add Client"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientList;
