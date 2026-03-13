import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useNavigate, useParams } from "react-router-dom";
import { boqInvoicesAPI, clientsAPI, bankAccountsAPI } from "../../services/api";
import {
  formatDate,
  formatCurrency,
  getOrgProfile,
} from "../../utils/helpers";
import PrintBOQInvoice from "./PrintBOQInvoice";
import PrintBOQInvoiceInternal from "./PrintBOQInvoiceInternal";
import styles from "./boq.module.css";

const ViewBOQInvoice = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [client, setClient] = useState(null);
  const [bankAccount, setBankAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const invoiceRes = await boqInvoicesAPI.getById(id);
      setInvoice(invoiceRes.data);

      if (invoiceRes.data.clientId) {
        const clientRes = await clientsAPI.getById(invoiceRes.data.clientId);
        setClient(clientRes.data);
      }

      try {
        const allBanksRes = await bankAccountsAPI.getAll();
        const defaultBank = allBanksRes.data.find((b) => b.isDefault);
        setBankAccount(defaultBank || allBanksRes.data[0] || null);
      } catch (e) {
        console.error("Error loading bank account:", e);
      }
    } catch (error) {
      console.error("Error fetching BOQ invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintClient = async () => {
    try {
      const org = await getOrgProfile();
      const printWindow = window.open("", "_blank");
      const printContent = PrintBOQInvoice({
        invoice,
        client,
        organization: org,
        bankAccount,
        includesProcurement: false,
      });
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    } catch (error) {
      console.error("Error printing client invoice:", error);
    }
  };

  const handlePrintInternal = async () => {
    try {
      const org = await getOrgProfile();
      const printWindow = window.open("", "_blank");
      const printContent = PrintBOQInvoiceInternal({
        invoice,
        client,
        organization: org,
        bankAccount,
      });
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    } catch (error) {
      console.error("Error printing internal invoice:", error);
    }
  };

  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress />
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box className={styles.errorContainer}>
        <Typography>BOQ Invoice not found</Typography>
      </Box>
    );
  }

  return (
    <Box className={styles.viewBoq}>
      {/* Page Header */}
      <Box className={styles.header}>
        <Box>
          <Typography variant="h4" className={styles.title}>
            {invoice.boqInvoiceNumber}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
            <Typography variant="body2" className={styles.subtitle}>
              BOQ Invoice · BOQ Ref: {invoice.boqNumber}
            </Typography>
            <Chip label="Approved" size="small" color="success" />
          </Box>
        </Box>
        <Box className={styles.headerActions}>
          {/* Client Print */}
          <Button
            variant="outlined"
            startIcon={<Icon icon="mdi:printer" />}
            onClick={handlePrintClient}
            sx={{ borderColor: "#667eea", color: "#667eea" }}
          >
            Print Client Invoice
          </Button>
          {/* Internal Print */}
          <Button
            variant="contained"
            startIcon={<Icon icon="mdi:printer-settings" />}
            onClick={handlePrintInternal}
            sx={{
              background: "linear-gradient(135deg, #f57c00 0%, #e65100 100%)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(135deg, #ef6c00 0%, #e65100 100%)",
              },
            }}
          >
            Print Internal Copy
          </Button>
          <Button
            variant="outlined"
            startIcon={<Icon icon="mdi:arrow-left" />}
            onClick={() => navigate("/boq-invoices")}
          >
            Back
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3, borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: "1px solid #e0e0e0",
            "& .MuiTab-root": { textTransform: "none", fontWeight: 500 },
            "& .Mui-selected": { color: "#667eea" },
            "& .MuiTabs-indicator": { backgroundColor: "#667eea" },
          }}
        >
          <Tab
            label="Invoice Details"
            icon={<Icon icon="mdi:file-document-outline" width="18" />}
            iconPosition="start"
          />
          <Tab
            label="Procurement Details"
            icon={<Icon icon="mdi:store-outline" width="18" />}
            iconPosition="start"
          />
        </Tabs>

        {/* TAB 0: Invoice Details */}
        {activeTab === 0 && (
          <CardContent>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Invoice Info */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: "8px" }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                      Invoice Details
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {[
                        ["Invoice Number", invoice.boqInvoiceNumber],
                        ["BOQ Reference", invoice.boqNumber],
                        ["Date", formatDate(invoice.date)],
                        ["Currency", invoice.currency],
                        ["Total Items", invoice.items?.length || 0],
                      ].map(([label, value]) => (
                        <Box key={label} sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="body2" color="text.secondary">{label}</Typography>
                          <Typography variant="body2" fontWeight="500">{value}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Client Info */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: "8px" }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                      Client Details
                    </Typography>
                    {client ? (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        <Typography variant="body2" fontWeight="500">{client.name}</Typography>
                        {client.address && <Typography variant="body2" color="text.secondary">{client.address}</Typography>}
                        {client.state && <Typography variant="body2" color="text.secondary">{client.state}{client.pin ? ` - ${client.pin}` : ""}</Typography>}
                        {client.country && <Typography variant="body2" color="text.secondary">{client.country}</Typography>}
                        {client.email && <Typography variant="body2" color="text.secondary">Email: {client.email}</Typography>}
                        {client.contact && <Typography variant="body2" color="text.secondary">Phone: {client.contact}</Typography>}
                        {client.companyName && client.showCompanyInDocuments && (
                          <Typography variant="body2" color="text.secondary"><strong>Company:</strong> {client.companyName}</Typography>
                        )}
                        {client.taxNumber && client.showTaxInDocuments && (
                          <Typography variant="body2" color="text.secondary"><strong>TRN / Tax No:</strong> {client.taxNumber}</Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No client information</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Items Table — CLIENT VIEW (no procurementSource column) */}
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Line Items
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: "8px", mb: 3, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                    {["#", "Area", "Image", "Category", "Item", "Unit Price", "Qty", "Discount", "Total"].map((h) => (
                      <TableCell key={h} sx={{ color: "white", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}
                        align={["Unit Price", "Total"].includes(h) ? "right" : h === "Qty" || h === "Discount" ? "center" : "left"}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items?.map((item, index) => {
                    const lineTotal = (item.unitPrice || 0) * (item.quantity || 0);
                    const discountAmt = (item.discountType || "percent") === "flat"
                      ? item.discount || 0
                      : (lineTotal * (item.discount || 0)) / 100;
                    const finalTotal = lineTotal - discountAmt;

                    return (
                      <TableRow key={index} sx={{ "&:nth-of-type(even)": { background: "#f8f7ff" } }}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.area || "-"}</TableCell>
                        <TableCell>
                          {item.imageUrl
                            ? <img src={item.imageUrl} alt="Item" className={styles.imagePreview} onError={(e) => { e.target.style.display = "none"; }} />
                            : "-"}
                        </TableCell>
                        <TableCell>{item.category || "-"}</TableCell>
                        <TableCell>{item.itemName || "-"}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice, invoice.currency)}</TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="center">
                          {item.discount > 0
                            ? (item.discountType || "percent") === "flat"
                              ? formatCurrency(item.discount, invoice.currency)
                              : `${item.discount}%`
                            : "-"}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="500">{formatCurrency(finalTotal, invoice.currency)}</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Summary */}
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Box sx={{ width: { xs: "100%", sm: 350 } }}>
                {[
                  ["Subtotal:", formatCurrency(invoice.subtotal, invoice.currency), false],
                  invoice.totalDiscount > 0 && [`Total Discount:`, `-${formatCurrency(invoice.totalDiscount, invoice.currency)}`, true],
                  invoice.taxAmount > 0 && [`${invoice.taxLabel || "Tax"} (${invoice.taxPercent || 0}%):`, formatCurrency(invoice.taxAmount, invoice.currency), false],
                  invoice.serviceTaxAmount > 0 && [`Service Tax (${invoice.serviceTaxPercent || 0}%):`, formatCurrency(invoice.serviceTaxAmount, invoice.currency), false],
                ].filter(Boolean).map(([label, value, isDiscount]) => (
                  <Box key={label} sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
                    <Typography variant="body2">{label}</Typography>
                    <Typography variant="body2" fontWeight="500" color={isDiscount ? "error" : "inherit"}>{value}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
                  <Typography variant="h6">Total Amount:</Typography>
                  <Typography variant="h6" color="primary">{formatCurrency(invoice.totalAmount, invoice.currency)}</Typography>
                </Box>
              </Box>
            </Box>

            {invoice.notes && (
              <Box sx={{ mt: 2, p: 2, background: "#f3f0ff", borderRadius: "8px" }}>
                <Typography variant="caption" color="text.secondary">Notes</Typography>
                <Typography variant="body2">{invoice.notes}</Typography>
              </Box>
            )}
          </CardContent>
        )}

        {/* TAB 1: Procurement Details */}
        {activeTab === 1 && (
          <CardContent>
            <Alert
              severity="warning"
              icon={<Icon icon="mdi:lock-outline" />}
              sx={{ mb: 3, borderRadius: "8px" }}
            >
              <strong>Internal Use Only</strong> — Procurement details are confidential and must not be shared with clients. Use "Print Internal Copy" to print a version that includes this information.
            </Alert>

            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #ffe0b2", borderRadius: "8px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <Table sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow sx={{ background: "linear-gradient(135deg, #f57c00 0%, #e65100 100%)" }}>
                    {["#", "Area", "Category", "Item Name", "Vendor / Procurement Source"].map((h) => (
                      <TableCell key={h} sx={{ color: "white", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items?.map((item, index) => (
                    <TableRow key={index} sx={{ "&:nth-of-type(even)": { background: "#fff8f0" } }}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.area || "-"}</TableCell>
                      <TableCell>{item.category || "-"}</TableCell>
                      <TableCell><Typography fontWeight="500">{item.itemName || "-"}</Typography></TableCell>
                      <TableCell>
                        {item.procurementSource ? (
                          <Typography variant="body2" sx={{ color: "#e65100", fontWeight: 500 }}>
                            {item.procurementSource}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.disabled" fontStyle="italic">
                            Not specified
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, p: 2, background: "#fff8f0", border: "1px dashed #f57c00", borderRadius: "8px" }}>
              <Typography variant="caption" color="#e65100">
                <Icon icon="mdi:information-outline" style={{ verticalAlign: "middle", marginRight: 4 }} />
                {invoice.items?.filter(i => i.procurementSource).length || 0} of {invoice.items?.length || 0} items have procurement sources specified.
              </Typography>
            </Box>
          </CardContent>
        )}
      </Card>
    </Box>
  );
};

export default ViewBOQInvoice;
