import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Autocomplete,
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import {
  quotationsAPI,
  clientsAPI,
  scopeOfWorkAPI,
  tasksAPI,
  invoicesAPI,
} from "../../services/api";
import {
  generateQuotationNumber,
  generateInvoiceNumber,
  formatCurrency,
  getTaxSettings,
  getGeneralSettings,
  applyTaxCalculations,
} from "../../utils/helpers";
import { QUOTATION_STATUS } from "../../utils/constants";
import styles from "./quotation.module.css";

const CreateQuotation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [scopeOfWork, setScopeOfWork] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taxSettings, setTaxSettings] = useState(null);
  const [generalSettings, setGeneralSettings] = useState(null);
  const [quotation, setQuotation] = useState({
    quotationNumber: "",
    clientId: null,
    date: new Date(),
    items: [],
    subtotal: 0,
    taxAmount: 0,
    serviceTaxAmount: 0,
    totalAmount: 0,
    status: QUOTATION_STATUS.QUOTATION,
    paidAmount: 0,
    payments: [],
    currency: "AED",
    notes: "",
    taxPercent: 0,
    serviceTaxPercent: 0,
    taxLabel: "Tax",
  });

  const [openClientDialog, setOpenClientDialog] = useState(false);
  const [openScopeDialog, setOpenScopeDialog] = useState(false);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    pin: "",
    state: "",
    country: "",
  });
  const [newScope, setNewScope] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [newTask, setNewTask] = useState({
    scopeOfWorkId: "",
    description: "",
    estimatedHours: 0,
    isActive: true,
  });
  const [paymentDetails, setPaymentDetails] = useState({
    amount: 0,
    paymentMethod: "Bank Transfer",
    paymentDate: new Date(),
    notes: "",
  });

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const [clientsRes, scopeRes, tasksRes, quotationsRes, taxSet, genSet] =
        await Promise.all([
          clientsAPI.getAll(),
          scopeOfWorkAPI.getAll(),
          tasksAPI.getAll(),
          quotationsAPI.getAll(),
          getTaxSettings(),
          getGeneralSettings(),
        ]);

      setClients(clientsRes.data);
      setScopeOfWork(scopeRes.data);
      setTasks(tasksRes.data);
      setTaxSettings(taxSet);
      setGeneralSettings(genSet);

      if (isEdit) {
        const existingQuotation = quotationsRes.data.find(
          (q) => q.id === parseInt(id)
        );
        if (existingQuotation) {
          setQuotation({
            ...existingQuotation,
            date: existingQuotation.date
              ? new Date(existingQuotation.date)
              : new Date(),
            payments:
              existingQuotation.payments?.map((payment) => ({
                ...payment,
                date: payment.date ? new Date(payment.date) : new Date(),
                paymentDate: payment.paymentDate
                  ? new Date(payment.paymentDate)
                  : new Date(),
              })) || [],
          });
        }
      } else {
        const lastNumber = quotationsRes.data.length;
        const quotationNumber = await generateQuotationNumber(lastNumber);
        setQuotation((prev) => ({
          ...prev,
          quotationNumber,
          taxPercent: taxSet?.taxPercent || 0,
          serviceTaxPercent: taxSet?.serviceTaxPercent || 0,
          taxLabel: taxSet?.taxLabel || "Tax",
          currency: genSet?.currency || "AED",
        }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const calculateTotals = (items) => {
    const subtotal = items.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );
    const taxCalc = applyTaxCalculations(subtotal, taxSettings);
    return {
      subtotal,
      taxAmount: taxCalc.taxAmount,
      serviceTaxAmount: taxCalc.serviceTaxAmount,
      totalAmount: taxCalc.total,
      taxPercent: taxCalc.taxPercent,
      serviceTaxPercent: taxCalc.serviceTaxPercent,
      taxLabel: taxCalc.taxLabel,
    };
  };

  const handleAddItem = () => {
    setQuotation((prev) => ({
      ...prev,
      items: [...prev.items, { scopeOfWork: "", task: "", amount: 0 }],
    }));
  };

  const handleRemoveItem = (index) => {
    setQuotation((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const totals = calculateTotals(newItems);
      return { ...prev, items: newItems, ...totals };
    });
  };

  const handleItemChange = (index, field, value) => {
    setQuotation((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: field === "amount" ? parseFloat(value) || 0 : value,
      };
      const totals = calculateTotals(newItems);
      return { ...prev, items: newItems, ...totals };
    });
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === QUOTATION_STATUS.PARTIALLY_PAID) {
      setOpenPaymentDialog(true);
    } else if (newStatus === QUOTATION_STATUS.FULLY_PAID) {
      const result = await Swal.fire({
        title: "Payment Confirmation",
        html: `
          <div style="text-align: left;">
            <p><strong>Subtotal:</strong> ${formatCurrency(
              quotation.subtotal || quotation.totalAmount,
              quotation.currency
            )}</p>
            ${
              quotation.taxAmount > 0
                ? `<p><strong>${quotation.taxLabel} (${
                    quotation.taxPercent
                  }%):</strong> ${formatCurrency(
                    quotation.taxAmount,
                    quotation.currency
                  )}</p>`
                : ""
            }
            ${
              quotation.serviceTaxAmount > 0
                ? `<p><strong>Service Tax (${
                    quotation.serviceTaxPercent
                  }%):</strong> ${formatCurrency(
                    quotation.serviceTaxAmount,
                    quotation.currency
                  )}</p>`
                : ""
            }
            <p><strong>Total Payable:</strong> ${formatCurrency(
              quotation.totalAmount,
              quotation.currency
            )}</p>
            <p><strong>Already Paid:</strong> ${formatCurrency(
              quotation.paidAmount,
              quotation.currency
            )}</p>
            <p><strong>Balance:</strong> ${formatCurrency(
              quotation.totalAmount - quotation.paidAmount,
              quotation.currency
            )}</p>
          </div>
        `,
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Confirm Full Payment",
      });

      if (result.isConfirmed) {
        await handleFullPayment();
      }
    } else {
      setQuotation((prev) => ({ ...prev, status: newStatus }));
    }
  };

  const handleFullPayment = async () => {
    setLoading(true);
    try {
      const remainingAmount =
        quotation.totalAmount - (quotation.paidAmount || 0);

      const newPayment = {
        amount: remainingAmount,
        paymentMethod: generalSettings?.defaultPaymentMethod || "Bank Transfer",
        paymentDate: new Date(),
        date: new Date(),
        notes: "Full payment",
      };

      const updatedQuotation = {
        ...quotation,
        status: QUOTATION_STATUS.FULLY_PAID,
        paidAmount: quotation.totalAmount,
        payments: [...(quotation.payments || []), newPayment],
      };

      const quotationData = {
        ...updatedQuotation,
        date: updatedQuotation.date.toISOString(),
        payments: updatedQuotation.payments.map((payment) => ({
          ...payment,
          date:
            payment.date instanceof Date
              ? payment.date.toISOString()
              : payment.date,
          paymentDate:
            payment.paymentDate instanceof Date
              ? payment.paymentDate.toISOString()
              : payment.paymentDate,
        })),
        updatedAt: new Date().toISOString(),
      };

      await quotationsAPI.update(id, quotationData);
      await createInvoice(remainingAmount, updatedQuotation);

      Swal.fire({
        icon: "success",
        title: "Payment Recorded",
        text: `Full payment of ${formatCurrency(
          remainingAmount,
          quotation.currency
        )} has been recorded and invoice generated`,
      });

      navigate("/quotations");
    } catch (error) {
      console.error("Error processing full payment:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to process payment. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (paymentDetails.amount <= 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid Amount",
        text: "Please enter a valid payment amount",
      });
      return;
    }

    const remainingAmount = quotation.totalAmount - (quotation.paidAmount || 0);

    if (remainingAmount <= 0) {
      await Swal.fire({
        icon: "info",
        title: "Nothing to pay",
        text: "This quotation is already fully paid.",
      });
      return;
    }

    if (paymentDetails.amount > remainingAmount) {
      Swal.fire({
        icon: "error",
        title: "Amount Exceeds Balance",
        text: `Payment amount cannot exceed the remaining balance of ${formatCurrency(
          remainingAmount,
          quotation.currency
        )}`,
      });
      return;
    }

    setLoading(true);
    setOpenPaymentDialog(false);

    try {
      const newPayment = {
        ...paymentDetails,
        date: new Date(),
      };

      const newPaidAmount = (quotation.paidAmount || 0) + paymentDetails.amount;
      const isFullyPaid = newPaidAmount >= quotation.totalAmount;

      const updatedQuotation = {
        ...quotation,
        status: isFullyPaid
          ? QUOTATION_STATUS.FULLY_PAID
          : QUOTATION_STATUS.PARTIALLY_PAID,
        paidAmount: newPaidAmount,
        payments: [...(quotation.payments || []), newPayment],
      };

      const quotationData = {
        ...updatedQuotation,
        date: updatedQuotation.date.toISOString(),
        payments: updatedQuotation.payments.map((payment) => ({
          ...payment,
          date:
            payment.date instanceof Date
              ? payment.date.toISOString()
              : payment.date,
          paymentDate:
            payment.paymentDate instanceof Date
              ? payment.paymentDate.toISOString()
              : payment.paymentDate,
        })),
        createdAt: quotation.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEdit) {
        await quotationsAPI.update(id, quotationData);
      } else {
        const response = await quotationsAPI.create(quotationData);
        updatedQuotation.id = response.data.id;
      }

      await createInvoice(paymentDetails.amount, updatedQuotation);

      Swal.fire({
        icon: "success",
        title: "Payment Recorded",
        text: `Payment of ${formatCurrency(
          paymentDetails.amount,
          quotation.currency
        )} has been recorded and invoice generated`,
      });

      navigate("/quotations");
    } catch (error) {
      console.error("Error processing payment:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to process payment. Please try again.",
      });
      setOpenPaymentDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async (amount, quotationData) => {
    try {
      const invoicesRes = await invoicesAPI.getAll();
      const lastNumber = invoicesRes.data.length;
      const invoiceNumber = await generateInvoiceNumber(lastNumber);

      const currentQuotation = quotationData || quotation;

      const paymentRatio = amount / currentQuotation.totalAmount;
      const invoiceSubtotal =
        (currentQuotation.subtotal || currentQuotation.totalAmount) *
        paymentRatio;
      const invoiceTaxAmount = (currentQuotation.taxAmount || 0) * paymentRatio;
      const invoiceServiceTaxAmount =
        (currentQuotation.serviceTaxAmount || 0) * paymentRatio;

      const invoice = {
        invoiceNumber,
        quotationId: currentQuotation.id || parseInt(id),
        clientId: currentQuotation.clientId,
        date: new Date().toISOString(),
        items: currentQuotation.items.map((item) => ({
          ...item,
          amount: item.amount * paymentRatio,
        })),
        subtotal: invoiceSubtotal,
        taxAmount: invoiceTaxAmount,
        serviceTaxAmount: invoiceServiceTaxAmount,
        totalAmount: amount,
        paidAmount: amount,
        paymentDate: paymentDetails.paymentDate
          ? paymentDetails.paymentDate.toISOString()
          : new Date().toISOString(),
        paymentMethod:
          paymentDetails.paymentMethod ||
          generalSettings?.defaultPaymentMethod ||
          "Bank Transfer",
        currency:
          currentQuotation.currency || generalSettings?.currency || "AED",
        taxPercent: currentQuotation.taxPercent,
        serviceTaxPercent: currentQuotation.serviceTaxPercent,
        taxLabel: currentQuotation.taxLabel,
        notes:
          paymentDetails.notes ||
          `Invoice for ${
            currentQuotation.status === QUOTATION_STATUS.FULLY_PAID
              ? "full"
              : "partial"
          } payment`,
        createdAt: new Date().toISOString(),
      };

      await invoicesAPI.create(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  };

  const handleSave = async (shouldPrint = false) => {
    if (!quotation.clientId || quotation.items.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please select a client and add at least one item",
      });
      return;
    }

    setLoading(true);
    try {
      const quotationData = {
        ...quotation,
        date: quotation.date.toISOString(),
        payments:
          quotation.payments?.map((payment) => ({
            ...payment,
            date:
              payment.date instanceof Date
                ? payment.date.toISOString()
                : payment.date,
            paymentDate:
              payment.paymentDate instanceof Date
                ? payment.paymentDate.toISOString()
                : payment.paymentDate,
          })) || [],
        createdAt: isEdit ? quotation.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let savedQuotation;
      if (isEdit) {
        await quotationsAPI.update(id, quotationData);
        savedQuotation = { ...quotationData, id };
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Quotation updated successfully",
        });
      } else {
        const response = await quotationsAPI.create(quotationData);
        savedQuotation = response.data;
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Quotation created successfully",
        });
      }

      if (shouldPrint) {
        window.open(`/quotations/print/${savedQuotation.id}`, "_blank");
      }
      navigate("/quotations");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save quotation",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    try {
      const response = await clientsAPI.create({
        ...newClient,
        createdAt: new Date().toISOString(),
      });
      setClients((prev) => [...prev, response.data]);
      setQuotation((prev) => ({ ...prev, clientId: response.data.id }));
      setOpenClientDialog(false);
      setNewClient({
        name: "",
        email: "",
        contact: "",
        address: "",
        pin: "",
        state: "",
        country: "",
      });
    } catch (error) {
      console.error("Error adding client:", error);
    }
  };

  const handleAddScope = async () => {
    try {
      const response = await scopeOfWorkAPI.create({
        ...newScope,
        createdAt: new Date().toISOString(),
      });
      setScopeOfWork((prev) => [...prev, response.data]);
      setOpenScopeDialog(false);
      setNewScope({ name: "", description: "", isActive: true });
    } catch (error) {
      console.error("Error adding scope:", error);
    }
  };

  const handleAddTask = async () => {
    try {
      const response = await tasksAPI.create({
        ...newTask,
        createdAt: new Date().toISOString(),
      });
      setTasks((prev) => [...prev, response.data]);
      setOpenTaskDialog(false);
      setNewTask({
        scopeOfWorkId: "",
        description: "",
        estimatedHours: 0,
        isActive: true,
      });
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  return (
    <Box className={styles.createQuotation}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h4" className={styles.title}>
            {isEdit ? "Edit Quotation" : "Create New Quotation"}
          </Typography>
          <Typography variant="body2" className={styles.subtitle}>
            {isEdit
              ? "Update quotation details"
              : "Generate a new quotation for your client"}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Icon icon="mdi:arrow-left" />}
          onClick={() => navigate("/quotations")}
        >
          Back to List
        </Button>
      </Box>

      <Card className={styles.formCard}>
        <CardContent>
          <Box className={styles.formSection}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Box className={styles.formGrid}>
              <TextField
                label="Quotation Number"
                value={quotation.quotationNumber}
                disabled
                fullWidth
              />
              <DatePicker
                label="Date"
                value={quotation.date}
                onChange={(date) =>
                  setQuotation((prev) => ({
                    ...prev,
                    date: date || new Date(),
                  }))
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
              <Box className={styles.clientField}>
                <Autocomplete
                  options={clients}
                  getOptionLabel={(option) => option.name || ""}
                  value={
                    clients.find((c) => c.id === quotation.clientId) || null
                  }
                  onChange={(e, value) =>
                    setQuotation((prev) => ({
                      ...prev,
                      clientId: value?.id || null,
                    }))
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Select Client" fullWidth />
                  )}
                  fullWidth
                />
                <IconButton onClick={() => setOpenClientDialog(true)}>
                  <Icon icon="mdi:plus" />
                </IconButton>
              </Box>
            </Box>
          </Box>

          <Divider className={styles.divider} />

          <Box className={styles.formSection}>
            <Box className={styles.sectionHeader}>
              <Typography variant="h6">Items</Typography>
              <Button
                startIcon={<Icon icon="mdi:plus" />}
                onClick={handleAddItem}
                variant="contained"
                size="small"
              >
                Add Item
              </Button>
            </Box>

            <TableContainer component={Paper} className={styles.itemsTable}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Scope of Work</TableCell>
                    <TableCell>Task</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell width="50">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quotation.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box className={styles.tableField}>
                          <Autocomplete
                            options={scopeOfWork.filter(
                              (s) => s.isActive !== false
                            )}
                            getOptionLabel={(option) => option?.name || ""}
                            value={
                              scopeOfWork.find(
                                (s) => s.name === item.scopeOfWork
                              ) || null
                            }
                            onChange={(e, value) =>
                              handleItemChange(
                                index,
                                "scopeOfWork",
                                value?.name || ""
                              )
                            }
                            renderInput={(params) => (
                              <TextField {...params} size="small" fullWidth />
                            )}
                            fullWidth
                          />
                          <IconButton
                            size="small"
                            onClick={() => setOpenScopeDialog(true)}
                          >
                            <Icon icon="mdi:plus" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box className={styles.tableField}>
                          <Autocomplete
                            options={tasks.filter((t) => t.isActive !== false)}
                            getOptionLabel={(option) =>
                              option?.description || ""
                            }
                            value={
                              tasks.find((t) => t.description === item.task) ||
                              null
                            }
                            onChange={(e, value) =>
                              handleItemChange(
                                index,
                                "task",
                                value?.description || ""
                              )
                            }
                            renderInput={(params) => (
                              <TextField {...params} size="small" fullWidth />
                            )}
                            fullWidth
                          />
                          <IconButton
                            size="small"
                            onClick={() => setOpenTaskDialog(true)}
                          >
                            <Icon icon="mdi:plus" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={item.amount}
                          onChange={(e) =>
                            handleItemChange(index, "amount", e.target.value)
                          }
                          size="small"
                          fullWidth
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                {generalSettings?.currency || "AED"}
                              </InputAdornment>
                            ),
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Icon icon="mdi:delete" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box className={styles.totalSection}>
              <Box className={styles.totalBreakdown}>
                <Box className={styles.totalRow}>
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1">
                    {formatCurrency(quotation.subtotal, quotation.currency)}
                  </Typography>
                </Box>
                {quotation.taxAmount > 0 && (
                  <Box className={styles.totalRow}>
                    <Typography variant="body2">
                      {quotation.taxLabel} ({quotation.taxPercent}%):
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(quotation.taxAmount, quotation.currency)}
                    </Typography>
                  </Box>
                )}
                {quotation.serviceTaxAmount > 0 && (
                  <Box className={styles.totalRow}>
                    <Typography variant="body2">
                      Service Tax ({quotation.serviceTaxPercent}%):
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(
                        quotation.serviceTaxAmount,
                        quotation.currency
                      )}
                    </Typography>
                  </Box>
                )}
                <Divider />
                <Box className={styles.totalRow}>
                  <Typography variant="h6">Total Amount:</Typography>
                  <Typography variant="h6">
                    {formatCurrency(quotation.totalAmount, quotation.currency)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Divider className={styles.divider} />

          <Box className={styles.formSection}>
            <Typography variant="h6" gutterBottom>
              Additional Details
            </Typography>
            <TextField
              label="Notes"
              value={quotation.notes}
              onChange={(e) =>
                setQuotation((prev) => ({ ...prev, notes: e.target.value }))
              }
              multiline
              rows={3}
              fullWidth
            />
          </Box>

          <Box className={styles.actionButtons}>
            <FormControl className={styles.statusSelect}>
              <InputLabel>Status</InputLabel>
              <Select
                value={quotation.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                label="Status"
                disabled={
                  isEdit &&
                  (quotation.status === QUOTATION_STATUS.PARTIALLY_PAID ||
                    quotation.status === QUOTATION_STATUS.FULLY_PAID)
                }
              >
                <MenuItem value={QUOTATION_STATUS.QUOTATION}>
                  Quotation
                </MenuItem>
                <MenuItem value={QUOTATION_STATUS.PARTIALLY_PAID}>
                  Partially Paid
                </MenuItem>
                <MenuItem value={QUOTATION_STATUS.FULLY_PAID}>
                  Fully Paid
                </MenuItem>
              </Select>
            </FormControl>

            <Box className={styles.saveButtons}>
              <Button
                variant="contained"
                startIcon={<Icon icon="mdi:content-save" />}
                onClick={() => handleSave(false)}
                disabled={loading}
              >
                Save
              </Button>
              <Button
                variant="contained"
                startIcon={<Icon icon="mdi:printer" />}
                onClick={() => handleSave(true)}
                disabled={loading}
              >
                Save & Print
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Add Client Dialog */}
      <Dialog
        open={openClientDialog}
        onClose={() => setOpenClientDialog(false)}
      >
        <DialogTitle>Add New Client</DialogTitle>
        <DialogContent>
          <Box className={styles.dialogForm}>
            <TextField
              label="Name"
              value={newClient.name}
              onChange={(e) =>
                setNewClient({ ...newClient, name: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={newClient.email}
              onChange={(e) =>
                setNewClient({ ...newClient, email: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Contact"
              value={newClient.contact}
              onChange={(e) =>
                setNewClient({ ...newClient, contact: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Address"
              value={newClient.address}
              onChange={(e) =>
                setNewClient({ ...newClient, address: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="PIN"
              value={newClient.pin}
              onChange={(e) =>
                setNewClient({ ...newClient, pin: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="State"
              value={newClient.state}
              onChange={(e) =>
                setNewClient({ ...newClient, state: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Country"
              value={newClient.country}
              onChange={(e) =>
                setNewClient({ ...newClient, country: e.target.value })
              }
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClientDialog(false)}>Cancel</Button>
          <Button onClick={handleAddClient} variant="contained">
            Add Client
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Scope Dialog */}
      <Dialog open={openScopeDialog} onClose={() => setOpenScopeDialog(false)}>
        <DialogTitle>Add New Scope of Work</DialogTitle>
        <DialogContent>
          <TextField
            label="Scope Name"
            value={newScope.name}
            onChange={(e) => setNewScope({ ...newScope, name: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            value={newScope.description}
            onChange={(e) =>
              setNewScope({ ...newScope, description: e.target.value })
            }
            fullWidth
            multiline
            rows={2}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenScopeDialog(false)}>Cancel</Button>
          <Button onClick={handleAddScope} variant="contained">
            Add Scope
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)}>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <Box className={styles.dialogForm}>
            <FormControl fullWidth>
              <InputLabel>Scope of Work</InputLabel>
              <Select
                value={newTask.scopeOfWorkId}
                onChange={(e) =>
                  setNewTask({ ...newTask, scopeOfWorkId: e.target.value })
                }
                label="Scope of Work"
              >
                {scopeOfWork
                  .filter((s) => s.isActive !== false)
                  .map((scope) => (
                    <MenuItem key={scope.id} value={scope.id}>
                      {scope.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <TextField
              label="Task Description"
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTaskDialog(false)}>Cancel</Button>
          <Button onClick={handleAddTask} variant="contained">
            Add Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog
        open={openPaymentDialog}
        onClose={() => setOpenPaymentDialog(false)}
      >
        <DialogTitle>Add Payment Details</DialogTitle>
        <DialogContent>
          <Box className={styles.dialogForm}>
            <Typography variant="body2" gutterBottom>
              <strong>Subtotal:</strong>{" "}
              {formatCurrency(
                quotation.subtotal || quotation.totalAmount,
                quotation.currency
              )}
            </Typography>
            {quotation.taxAmount > 0 && (
              <Typography variant="body2" gutterBottom>
                <strong>
                  {quotation.taxLabel} ({quotation.taxPercent}%):
                </strong>{" "}
                {formatCurrency(quotation.taxAmount, quotation.currency)}
              </Typography>
            )}
            {quotation.serviceTaxAmount > 0 && (
              <Typography variant="body2" gutterBottom>
                <strong>Service Tax ({quotation.serviceTaxPercent}%):</strong>{" "}
                {formatCurrency(quotation.serviceTaxAmount, quotation.currency)}
              </Typography>
            )}
            <Typography variant="body2" gutterBottom>
              <strong>Total Payable:</strong>{" "}
              {formatCurrency(quotation.totalAmount, quotation.currency)}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Already Paid:</strong>{" "}
              {formatCurrency(quotation.paidAmount || 0, quotation.currency)}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Balance:</strong>{" "}
              {formatCurrency(
                quotation.totalAmount - (quotation.paidAmount || 0),
                quotation.currency
              )}
            </Typography>
            <Divider className={styles.divider} />
            <TextField
              label="Payment Amount"
              type="number"
              value={paymentDetails.amount}
              onChange={(e) =>
                setPaymentDetails({
                  ...paymentDetails,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {generalSettings?.currency || "AED"}
                  </InputAdornment>
                ),
              }}
              helperText={`Maximum payable amount: ${formatCurrency(
                quotation.totalAmount - (quotation.paidAmount || 0),
                quotation.currency
              )}`}
            />
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentDetails.paymentMethod}
                onChange={(e) =>
                  setPaymentDetails({
                    ...paymentDetails,
                    paymentMethod: e.target.value,
                  })
                }
                label="Payment Method"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                <MenuItem value="Credit Card">Credit Card</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
                <MenuItem value="Online Payment">Online Payment</MenuItem>
              </Select>
            </FormControl>
            <DatePicker
              label="Payment Date"
              value={paymentDetails.paymentDate}
              onChange={(date) =>
                setPaymentDetails({
                  ...paymentDetails,
                  paymentDate: date || new Date(),
                })
              }
              slotProps={{ textField: { fullWidth: true } }}
            />
            <TextField
              label="Payment Notes"
              value={paymentDetails.notes}
              onChange={(e) =>
                setPaymentDetails({ ...paymentDetails, notes: e.target.value })
              }
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenPaymentDialog(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePaymentSubmit}
            variant="contained"
            disabled={loading || paymentDetails.amount <= 0}
          >
            Confirm Payment & Generate Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateQuotation;
