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
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  invoicesAPI,
  clientsAPI,
  quotationsAPI,
  organizationsAPI,
} from "../../services/api";
import { formatDate, formatCurrency, applyOrgTaxes } from "../../utils/helpers";
import styles from "./invoice.module.css";

const ViewInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [client, setClient] = useState(null);
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState(null);
  const [taxCalc, setTaxCalc] = useState(null);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  useEffect(() => {
    if (!invoice) return;
    const subtotal = invoice.totalAmount || 0; // your current subtotal
    const calc = applyOrgTaxes(subtotal, org);
    setTaxCalc(calc);
  }, [invoice, org]);

  const fetchInvoiceDetails = async () => {
    try {
      const orgProfile = await organizationsAPI.get();
      setOrg(orgProfile || null);

      const invoiceRes = await invoicesAPI.getById(id);
      setInvoice(invoiceRes.data);

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
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("THIS INTERIORS", 105, 20, { align: "center" });
    doc.setFontSize(16);
    doc.text("INVOICE", 105, 30, { align: "center" });

    // Invoice Details
    doc.setFontSize(10);
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 20, 50);
    doc.text(`Date: ${formatDate(invoice.date)}`, 20, 56);
    doc.text(`Payment Status: Paid`, 20, 62);

    if (quotation) {
      doc.text(`Related Quotation: ${quotation.quotationNumber}`, 20, 68);
    }

    // Client Details
    doc.text("Bill To:", 20, 80);
    doc.setFontSize(9);
    doc.text(client?.name || "", 20, 86);
    doc.text(client?.email || "", 20, 92);
    doc.text(client?.contact || "", 20, 98);
    doc.text(
      `${client?.address || ""}, ${client?.state || ""} ${client?.pin || ""}`,
      20,
      104
    );
    doc.text(client?.country || "", 20, 110);

    // Items Table
    const tableData = invoice.items.map((item, index) => [
      index + 1,
      item.scopeOfWork,
      item.task,
      formatCurrency(item.amount),
    ]);

    doc.autoTable({
      head: [["#", "Scope of Work", "Task", "Amount"]],
      body: tableData,
      startY: 120,
      theme: "grid",
      headStyles: { fillColor: [102, 126, 234] },
      footStyles: { fillColor: [245, 245, 245] },
      foot: [
        ["", "", "Total:", formatCurrency(invoice.totalAmount)],
        ["", "", "Paid:", formatCurrency(invoice.paidAmount)],
      ],
    });

    // Payment Details
    const finalY = doc.previousAutoTable.finalY;
    doc.text("Payment Details:", 20, finalY + 10);
    doc.setFontSize(9);
    doc.text(`Payment Method: ${invoice.paymentMethod}`, 20, finalY + 16);
    doc.text(
      `Payment Date: ${formatDate(invoice.paymentDate)}`,
      20,
      finalY + 22
    );

    // Notes
    if (invoice.notes) {
      doc.text("Notes:", 20, finalY + 32);
      doc.text(invoice.notes, 20, finalY + 38, { maxWidth: 170 });
    }

    // Footer
    doc.setFontSize(8);
    doc.text(
      `© ${
        org?.name || "Your Company"
      } - Invoice & Quotation Management System`,
      105,
      280,
      {
        align: "center",
      }
    );

    doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
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
          <Card className={styles.detailsCard}>
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
                      Related Quotation
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
          <Card className={styles.clientCard}>
            <CardContent>
              {org && (
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  {org.logoUrl && (
                    <Box
                      component="img"
                      src={org.logoUrl}
                      alt="logo"
                      sx={{ width: 56, height: 56, objectFit: "contain" }}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {org.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {org.address}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {org.email} {org.contact ? " • " + org.contact : ""}{" "}
                      {org.website ? " • " + org.website : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {org.taxLabel} ID: {org.taxId || "—"}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className={styles.clientCard}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Client Information
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
                    {invoice.items.map((item, index) => (
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
                    {formatCurrency(invoice.totalAmount)}
                  </Typography>
                </Box>

                {/* <Box className={styles.summaryRow}>
                  <Typography variant="body1">Tax (0%)</Typography>
                  <Typography variant="body1" fontWeight="600">
                    {formatCurrency(0)}
                  </Typography>
                </Box> */}
                {taxCalc && (
                  <>
                    <Box className={styles.summaryRow}>
                      <Typography variant="body1">
                        {taxCalc.taxLabel} ({taxCalc.taxPercent}%)
                      </Typography>
                      <Typography variant="body1" fontWeight="600">
                        {formatCurrency(taxCalc.taxAmount)}
                      </Typography>
                    </Box>
                    {taxCalc.serviceTaxPercent > 0 && (
                      <Box className={styles.summaryRow}>
                        <Typography variant="body1">
                          Service Tax ({taxCalc.serviceTaxPercent}%)
                        </Typography>
                        <Typography variant="body1" fontWeight="600">
                          {formatCurrency(taxCalc.serviceTaxAmount)}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}

                <Divider />
                <Box className={styles.summaryRow}>
                  <Typography variant="h6">Total Amount</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(
                      taxCalc ? taxCalc.total : invoice.totalAmount
                    )}
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
