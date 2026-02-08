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
import { quotationsAPI, clientsAPI, bankAccountsAPI, invoicesAPI } from "../../services/api";
import { formatDate, formatCurrency, getOrgProfile } from "../../utils/helpers";
import { QUOTATION_STATUS } from "../../utils/constants";
import PrintQuotation from "./PrintQuotation";
import styles from "./quotation.module.css";

const ViewQuotation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [client, setClient] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [bankAccount, setBankAccount] = useState(null);
  const [relatedInvoices, setRelatedInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotationDetails();
  }, [id]);

  const fetchQuotationDetails = async () => {
    try {
      const [quotationRes, org] = await Promise.all([
        quotationsAPI.getById(id),
        getOrgProfile(),
      ]);
      setQuotation(quotationRes.data);
      setOrganization(org);

      if (quotationRes.data.clientId) {
        const clientRes = await clientsAPI.getById(quotationRes.data.clientId);
        setClient(clientRes.data);
      }

      if (quotationRes.data.bankAccountId) {
        try {
          const bankRes = await bankAccountsAPI.getById(quotationRes.data.bankAccountId);
          setBankAccount(bankRes.data);
        } catch (e) {
          console.error("Error loading bank account:", e);
        }
      }

      // Fallback: fetch default bank account if none was loaded
      if (!quotationRes.data.bankAccountId) {
        try {
          const allBanksRes = await bankAccountsAPI.getAll();
          const defaultBank = allBanksRes.data.find((b) => b.isDefault);
          if (defaultBank) {
            setBankAccount(defaultBank);
          } else if (allBanksRes.data.length > 0) {
            setBankAccount(allBanksRes.data[0]);
          }
        } catch (e) {
          console.error("Error loading default bank account:", e);
        }
      }

      if (quotationRes.data.status === "Partially Paid" || quotationRes.data.status === "Fully Paid") {
        try {
          const invoicesRes = await invoicesAPI.getAll();
          const related = invoicesRes.data.filter(
            (inv) => inv.quotationId === parseInt(id)
          );
          setRelatedInvoices(related);
        } catch (e) {
          console.error("Error loading related invoices:", e);
        }
      }
    } catch (error) {
      console.error("Error fetching quotation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const printContent = PrintQuotation({ quotation, client, organization, bankAccount });

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

  if (!quotation) {
    return (
      <Box className={styles.errorContainer}>
        <Typography>Performa invoice not found</Typography>
      </Box>
    );
  }

  return (
    <Box className={styles.viewQuotation}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h4" className={styles.title}>
            View Performa Invoice
          </Typography>
          <Typography variant="body2" className={styles.subtitle}>
            Performa invoice details and summary
          </Typography>
        </Box>
        <Box className={styles.headerActions}>
          <Button
            variant="outlined"
            startIcon={<Icon icon="mdi:arrow-left" />}
            onClick={() => navigate("/quotations")}
          >
            Back to List
          </Button>
          <Button
            variant="contained"
            startIcon={<Icon icon="mdi:printer" />}
            onClick={handlePrint}
          >
            Print
          </Button>
          {quotation.status === QUOTATION_STATUS.QUOTATION && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Icon icon="mdi:pencil" />}
              onClick={() => navigate(`/quotations/edit/${id}`)}
            >
              Edit
            </Button>
          )}
          {(quotation.status === QUOTATION_STATUS.PARTIALLY_PAID ||
            quotation.status === QUOTATION_STATUS.QUOTATION) && (
            <Button
              variant="contained"
              color="success"
              startIcon={<Icon icon="mdi:cash-plus" />}
              onClick={() => navigate(`/quotations/payment/${id}`)}
            >
              Add Payment
            </Button>
          )}
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
                    {client.email}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {client.contact}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
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
              <Typography variant="h6" gutterBottom>
                Performa Invoice Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Performa Number
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {quotation.quotationNumber}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(quotation.date)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Status
                  </Typography>
                  <Box>
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
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Currency
                  </Typography>
                  <Typography variant="body1">{quotation.currency}</Typography>
                </Grid>
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
                  No bank account selected
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card className={styles.itemsCard}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Items
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Scope of Work</TableCell>
                      <TableCell>Task</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quotation.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.scopeOfWork}</TableCell>
                        <TableCell>{item.task}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.amount)}
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
                    {formatCurrency(
                      quotation.subtotal || quotation.totalAmount
                    )}
                  </Typography>
                </Box>
                {quotation.taxAmount > 0 && (
                  <Box className={styles.summaryRow}>
                    <Typography variant="body1">
                      {quotation.taxLabel || "Tax"} ({quotation.taxPercent || 0}
                      %)
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(quotation.taxAmount)}
                    </Typography>
                  </Box>
                )}
                {quotation.serviceTaxAmount > 0 && (
                  <Box className={styles.summaryRow}>
                    <Typography variant="body1">
                      Service Tax ({quotation.serviceTaxPercent || 0}%)
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(quotation.serviceTaxAmount)}
                    </Typography>
                  </Box>
                )}
                <Divider />
                <Box className={styles.summaryRow}>
                  <Typography variant="h6">Total Amount</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(quotation.totalAmount)}
                  </Typography>
                </Box>
                <Box className={styles.summaryRow}>
                  <Typography variant="body1">Paid Amount</Typography>
                  <Typography
                    variant="body1"
                    fontWeight="600"
                    color="success.main"
                  >
                    {formatCurrency(quotation.paidAmount || 0)}
                  </Typography>
                </Box>
                <Box className={styles.summaryRow}>
                  <Typography variant="h6">Balance Due</Typography>
                  <Typography variant="h6" color="error">
                    {formatCurrency(
                      quotation.totalAmount - (quotation.paidAmount || 0)
                    )}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {quotation.notes && (
          <Grid item xs={12}>
            <Card className={styles.notesCard}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {quotation.notes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {quotation.payments && quotation.payments.length > 0 && (
          <Grid item xs={12}>
            <Card className={styles.paymentsCard}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment History
                </Typography>
                <TableContainer>
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
                          <TableCell>
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>{payment.paymentMethod}</TableCell>
                          <TableCell>{payment.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {relatedInvoices.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Related Invoices
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Invoice Number</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Payment Method</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {relatedInvoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell>{inv.invoiceNumber}</TableCell>
                          <TableCell>{formatDate(inv.date)}</TableCell>
                          <TableCell>
                            {formatCurrency(inv.totalAmount)}
                          </TableCell>
                          <TableCell>{inv.paymentMethod}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              startIcon={<Icon icon="mdi:eye" />}
                              onClick={() =>
                                navigate(`/invoices/view/${inv.id}`)
                              }
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ViewQuotation;
