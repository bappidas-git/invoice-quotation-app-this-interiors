import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Grid,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { invoicesAPI, clientsAPI, quotationsAPI, bankAccountsAPI } from "../../services/api";
import { formatDate, formatCurrency, getOrgProfile } from "../../utils/helpers";
import PrintInvoice from "./PrintInvoice";
import styles from "./invoice.module.css";

const ViewInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [client, setClient] = useState(null);
  const [quotation, setQuotation] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [bankAccount, setBankAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const fetchInvoiceDetails = async () => {
    try {
      const [invoiceRes, org] = await Promise.all([
        invoicesAPI.getById(id),
        getOrgProfile(),
      ]);
      setInvoice(invoiceRes.data);
      setOrganization(org);

      if (invoiceRes.data.clientId) {
        const clientRes = await clientsAPI.getById(invoiceRes.data.clientId);
        setClient(clientRes.data);
      }

      if (invoiceRes.data.quotationId) {
        const quotationRes = await quotationsAPI.getById(
          invoiceRes.data.quotationId
        );
        setQuotation(quotationRes.data);
      }

      if (invoiceRes.data.bankAccountId) {
        try {
          const bankRes = await bankAccountsAPI.getById(invoiceRes.data.bankAccountId);
          setBankAccount(bankRes.data);
        } catch (e) {
          console.error("Error loading bank account:", e);
        }
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const printContent = PrintInvoice({ invoice, client, organization, bankAccount });

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box className={styles.errorContainer}>
        <Typography>Invoice not found</Typography>
      </Box>
    );
  }

  return (
    <Box className={styles.viewInvoice}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h4" className={styles.title}>
            View Invoice
          </Typography>
          <Typography variant="body2" className={styles.subtitle}>
            Invoice details and payment information
          </Typography>
        </Box>
        <Box className={styles.headerActions}>
          <Button
            variant="outlined"
            startIcon={<Icon icon="mdi:arrow-left" />}
            onClick={() => navigate("/invoices")}
          >
            Back to List
          </Button>
          <Button
            variant="contained"
            startIcon={<Icon icon="mdi:printer" />}
            onClick={handlePrint}
          >
            Print Invoice
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card className={styles.clientCard} sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bill To
              </Typography>
              {client && (
                <Box>
                  <Typography variant="body1" fontWeight="600" gutterBottom>
                    {client.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <Icon
                      icon="mdi:email"
                      style={{
                        verticalAlign: "middle",
                        marginRight: 8,
                      }}
                    />
                    {client.email}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <Icon
                      icon="mdi:phone"
                      style={{
                        verticalAlign: "middle",
                        marginRight: 8,
                      }}
                    />
                    {client.contact}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <Icon
                      icon="mdi:map-marker"
                      style={{
                        verticalAlign: "middle",
                        marginRight: 8,
                      }}
                    />
                    {client.address}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {client.state}, {client.pin}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {client.country}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className={styles.detailsCard} sx={{ height: "100%" }}>
            <CardContent>
              <Box className={styles.invoiceHeader}>
                <Typography variant="h6" gutterBottom>
                  Invoice Details
                </Typography>
                <Chip
                  label="PAID"
                  color="success"
                  icon={<Icon icon="mdi:check-circle" />}
                />
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Invoice Number
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {invoice.invoiceNumber}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Invoice Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(invoice.date)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Payment Method
                  </Typography>
                  <Typography variant="body1">
                    {invoice.paymentMethod}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Payment Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(invoice.paymentDate)}
                  </Typography>
                </Grid>
                {quotation && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      Related Performa
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">
                        {quotation.quotationNumber}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<Icon icon="mdi:eye" />}
                        onClick={() =>
                          navigate(`/quotations/view/${invoice.quotationId}`)
                        }
                      >
                        View
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Banking Information
              </Typography>
              {bankAccount ? (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Bank:</strong> {bankAccount.bankName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>A/C No:</strong> {bankAccount.accountNumber}
                  </Typography>
                  {bankAccount.accountHolderName && (
                    <Typography variant="body2" color="textSecondary">
                      <strong>A/C Holder:</strong> {bankAccount.accountHolderName}
                    </Typography>
                  )}
                  {bankAccount.branch && (
                    <Typography variant="body2" color="textSecondary">
                      <strong>Branch:</strong> {bankAccount.branch}
                    </Typography>
                  )}
                  {bankAccount.ifscSwift && (
                    <Typography variant="body2" color="textSecondary">
                      <strong>IFSC/SWIFT:</strong> {bankAccount.ifscSwift}
                    </Typography>
                  )}
                  {bankAccount.qrCodeUrl && (
                    <Box sx={{ mt: 1 }}>
                      <Box
                        component="img"
                        src={bankAccount.qrCodeUrl}
                        alt="Payment QR Code"
                        sx={{
                          maxWidth: 120,
                          maxHeight: 120,
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                        }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No bank account linked
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ bgcolor: "#e8f5e9" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">
                <Icon icon="mdi:check-circle" style={{ verticalAlign: "middle", marginRight: 8 }} />
                Payment Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" color="textSecondary">
                    Amount Paid
                  </Typography>
                  <Typography variant="body1" fontWeight="600" color="success.main">
                    {formatCurrency(invoice.paidAmount)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" color="textSecondary">
                    Payment Method
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {invoice.paymentMethod}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" color="textSecondary">
                    Payment Date
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {formatDate(invoice.paymentDate)}
                  </Typography>
                </Grid>
                {bankAccount && (
                  <Grid item xs={12} md={3}>
                    <Typography variant="caption" color="textSecondary">
                      Bank
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {bankAccount.bankName}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card className={styles.itemsCard}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Invoice Items
              </Typography>
              <TableContainer
                component={Paper}
                elevation={0}
                className={styles.itemsTable}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Scope of Work</TableCell>
                      <TableCell>Task Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">
                            {item.scopeOfWork}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {item.task}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="500">
                            {formatCurrency(item.amount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider className={styles.divider} />

              <Box className={styles.summary}>
                <Box className={styles.summaryRow}>
                  <Typography variant="body1">Subtotal</Typography>
                  <Typography variant="body1" fontWeight="600">
                    {formatCurrency(invoice.subtotal || invoice.totalAmount)}
                  </Typography>
                </Box>
                {invoice.taxAmount > 0 && (
                  <Box className={styles.summaryRow}>
                    <Typography variant="body1">
                      {invoice.taxLabel || "Tax"} ({invoice.taxPercent || 0}%)
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(invoice.taxAmount)}
                    </Typography>
                  </Box>
                )}
                {invoice.serviceTaxAmount > 0 && (
                  <Box className={styles.summaryRow}>
                    <Typography variant="body1">
                      Service Tax ({invoice.serviceTaxPercent || 0}%)
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(invoice.serviceTaxAmount)}
                    </Typography>
                  </Box>
                )}
                <Divider />
                <Box className={styles.summaryRow}>
                  <Typography variant="h6">Total Amount</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(invoice.totalAmount)}
                  </Typography>
                </Box>
                <Box className={styles.summaryRow}>
                  <Typography
                    variant="body1"
                    color="success.main"
                    fontWeight="600"
                  >
                    Amount Paid
                  </Typography>
                  <Typography
                    variant="body1"
                    color="success.main"
                    fontWeight="600"
                  >
                    {formatCurrency(invoice.paidAmount)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {invoice.notes && (
          <Grid item xs={12}>
            <Card className={styles.notesCard}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {invoice.notes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ViewInvoice;
