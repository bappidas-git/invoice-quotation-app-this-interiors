import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import { quotationsAPI, invoicesAPI, clientsAPI } from "../../services/api";
import {
  formatDate,
  formatCurrency,
  generateInvoiceNumber,
} from "../../utils/helpers";
import { QUOTATION_STATUS, CURRENCY } from "../../utils/constants";
import styles from "./quotation.module.css";

const PaymentUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState({
    amount: 0,
    paymentMethod: "Bank Transfer",
    paymentDate: new Date(),
    notes: "",
  });

  useEffect(() => {
    fetchQuotationDetails();
  }, [id]);

  const fetchQuotationDetails = async () => {
    try {
      const quotationRes = await quotationsAPI.getById(id);
      setQuotation(quotationRes.data);

      if (quotationRes.data.clientId) {
        const clientRes = await clientsAPI.getById(quotationRes.data.clientId);
        setClient(clientRes.data);
      }
    } catch (error) {
      console.error("Error fetching quotation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    const remainingAmount = quotation.totalAmount - (quotation.paidAmount || 0);

    if (paymentDetails.amount <= 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid Amount",
        text: "Please enter a valid payment amount",
      });
      return;
    }

    if (paymentDetails.amount > remainingAmount) {
      Swal.fire({
        icon: "error",
        title: "Amount Exceeds Balance",
        text: `Payment amount cannot exceed the remaining balance of ${formatCurrency(
          remainingAmount
        )}`,
      });
      return;
    }

    // Calculate tax breakdown for confirmation
    const paymentRatio = paymentDetails.amount / quotation.totalAmount;
    const subtotalPortion =
      (quotation.subtotal || quotation.totalAmount) * paymentRatio;
    const taxPortion = (quotation.taxAmount || 0) * paymentRatio;
    const serviceTaxPortion = (quotation.serviceTaxAmount || 0) * paymentRatio;

    const result = await Swal.fire({
      title: "Confirm Payment",
      html: `
        <div style="text-align: left;">
          <p><strong>Payment Breakdown:</strong></p>
          <p>Subtotal: ${formatCurrency(subtotalPortion)}</p>
          ${
            quotation.taxAmount > 0
              ? `<p>${quotation.taxLabel || "Tax"} (${
                  quotation.taxPercent || 0
                }%): ${formatCurrency(taxPortion)}</p>`
              : ""
          }
          ${
            quotation.serviceTaxAmount > 0
              ? `<p>Service Tax (${
                  quotation.serviceTaxPercent || 0
                }%): ${formatCurrency(serviceTaxPortion)}</p>`
              : ""
          }
          <hr/>
          <p><strong>Total Payment Amount:</strong> ${formatCurrency(
            paymentDetails.amount
          )}</p>
          <p><strong>Payment Method:</strong> ${
            paymentDetails.paymentMethod
          }</p>
          <p><strong>Remaining Balance After Payment:</strong> ${formatCurrency(
            remainingAmount - paymentDetails.amount
          )}</p>
        </div>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Confirm Payment",
    });

    if (result.isConfirmed) {
      try {
        const newPaidAmount =
          (quotation.paidAmount || 0) + paymentDetails.amount;
        const isFullyPaid = newPaidAmount >= quotation.totalAmount;

        // Update quotation with payment
        const updatedQuotation = {
          ...quotation,
          paidAmount: newPaidAmount,
          status: isFullyPaid
            ? QUOTATION_STATUS.FULLY_PAID
            : QUOTATION_STATUS.PARTIALLY_PAID,
          payments: [
            ...(quotation.payments || []),
            {
              ...paymentDetails,
              date: new Date().toISOString(),
              paymentDate: paymentDetails.paymentDate.toISOString(),
            },
          ],
          updatedAt: new Date().toISOString(),
        };

        // Ensure dates are properly formatted
        if (
          updatedQuotation.date &&
          !(typeof updatedQuotation.date === "string")
        ) {
          updatedQuotation.date = new Date(updatedQuotation.date).toISOString();
        }

        await quotationsAPI.update(id, updatedQuotation);

        // Create invoice with tax breakdown
        const invoicesRes = await invoicesAPI.getAll();
        const lastNumber = invoicesRes.data.length;
        const invoiceNumber = await generateInvoiceNumber(lastNumber);

        // Calculate proportional amounts for invoice
        const invoicePaymentRatio =
          paymentDetails.amount / quotation.totalAmount;
        const invoiceSubtotal =
          (quotation.subtotal || quotation.totalAmount) * invoicePaymentRatio;
        const invoiceTaxAmount =
          (quotation.taxAmount || 0) * invoicePaymentRatio;
        const invoiceServiceTaxAmount =
          (quotation.serviceTaxAmount || 0) * invoicePaymentRatio;

        const invoice = {
          invoiceNumber,
          quotationId: parseInt(id),
          clientId: quotation.clientId,
          date: new Date().toISOString(),
          items: quotation.items.map((item) => ({
            ...item,
            amount: item.amount * invoicePaymentRatio,
          })),
          subtotal: invoiceSubtotal,
          taxAmount: invoiceTaxAmount,
          serviceTaxAmount: invoiceServiceTaxAmount,
          taxPercent: quotation.taxPercent || 0,
          serviceTaxPercent: quotation.serviceTaxPercent || 0,
          taxLabel: quotation.taxLabel || "Tax",
          totalAmount: paymentDetails.amount,
          paidAmount: paymentDetails.amount,
          paymentDate: paymentDetails.paymentDate.toISOString(),
          paymentMethod: paymentDetails.paymentMethod,
          currency: CURRENCY,
          notes:
            paymentDetails.notes ||
            `Payment for quotation ${quotation.quotationNumber}`,
          createdAt: new Date().toISOString(),
        };

        await invoicesAPI.create(invoice);

        Swal.fire({
          icon: "success",
          title: "Payment Recorded",
          text: `Payment of ${formatCurrency(
            paymentDetails.amount
          )} has been recorded and invoice generated`,
        });

        navigate("/quotations");
      } catch (error) {
        console.error("Error recording payment:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to record payment. Please try again.",
        });
      }
    }
  };

  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!quotation) {
    return (
      <Box className={styles.errorContainer}>
        <Typography>Quotation not found</Typography>
      </Box>
    );
  }

  const remainingAmount = quotation.totalAmount - (quotation.paidAmount || 0);

  return (
    <Box className={styles.paymentUpdate}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h4" className={styles.title}>
            Add Payment
          </Typography>
          <Typography variant="body2" className={styles.subtitle}>
            Record payment for quotation {quotation.quotationNumber}
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

      <Card className={styles.summaryCard}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quotation Summary
          </Typography>
          <Box className={styles.summaryGrid}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Quotation Number
              </Typography>
              <Typography variant="body1" fontWeight="600">
                {quotation.quotationNumber}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Client
              </Typography>
              <Typography variant="body1">{client?.name}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Subtotal
              </Typography>
              <Typography variant="body1">
                {formatCurrency(quotation.subtotal || quotation.totalAmount)}
              </Typography>
            </Box>
            {quotation.taxAmount > 0 && (
              <Box>
                <Typography variant="caption" color="textSecondary">
                  {quotation.taxLabel || "Tax"} ({quotation.taxPercent || 0}%)
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(quotation.taxAmount)}
                </Typography>
              </Box>
            )}
            {quotation.serviceTaxAmount > 0 && (
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Service Tax ({quotation.serviceTaxPercent || 0}%)
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(quotation.serviceTaxAmount)}
                </Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="textSecondary">
                Total Amount
              </Typography>
              <Typography variant="body1" fontWeight="600">
                {formatCurrency(quotation.totalAmount)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Paid Amount
              </Typography>
              <Typography variant="body1" color="success.main">
                {formatCurrency(quotation.paidAmount || 0)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Remaining Balance
              </Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(remainingAmount)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Status
              </Typography>
              <Chip
                label={quotation.status}
                color={
                  quotation.status === QUOTATION_STATUS.FULLY_PAID
                    ? "success"
                    : quotation.status === QUOTATION_STATUS.PARTIALLY_PAID
                    ? "warning"
                    : "default"
                }
                size="small"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {quotation.payments && quotation.payments.length > 0 && (
        <Card className={styles.historyCard}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Payment History
            </Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quotation.payments.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>{payment.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Card className={styles.paymentCard}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            New Payment Details
          </Typography>
          <Box className={styles.paymentForm}>
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
                  <InputAdornment position="start">{CURRENCY}</InputAdornment>
                ),
              }}
              helperText={`Maximum payable amount: ${formatCurrency(
                remainingAmount
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
              rows={3}
              fullWidth
            />

            {/* Show payment breakdown preview */}
            {paymentDetails.amount > 0 && (
              <Card variant="outlined" sx={{ mt: 2, p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Payment Breakdown Preview
                </Typography>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                >
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">
                      {formatCurrency(
                        (quotation.subtotal || quotation.totalAmount) *
                          (paymentDetails.amount / quotation.totalAmount)
                      )}
                    </Typography>
                  </Box>
                  {quotation.taxAmount > 0 && (
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2">
                        {quotation.taxLabel || "Tax"} (
                        {quotation.taxPercent || 0}%):
                      </Typography>
                      <Typography variant="body2">
                        {formatCurrency(
                          quotation.taxAmount *
                            (paymentDetails.amount / quotation.totalAmount)
                        )}
                      </Typography>
                    </Box>
                  )}
                  {quotation.serviceTaxAmount > 0 && (
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2">
                        Service Tax ({quotation.serviceTaxPercent || 0}%):
                      </Typography>
                      <Typography variant="body2">
                        {formatCurrency(
                          quotation.serviceTaxAmount *
                            (paymentDetails.amount / quotation.totalAmount)
                        )}
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" fontWeight="600">
                      Total Payment:
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {formatCurrency(paymentDetails.amount)}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            )}
          </Box>

          <Divider className={styles.divider} />

          <Box className={styles.actionButtons}>
            <Button variant="outlined" onClick={() => navigate("/quotations")}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<Icon icon="mdi:cash-check" />}
              onClick={handleAddPayment}
              disabled={
                paymentDetails.amount <= 0 ||
                paymentDetails.amount > remainingAmount
              }
            >
              Record Payment & Generate Invoice
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PaymentUpdate;
