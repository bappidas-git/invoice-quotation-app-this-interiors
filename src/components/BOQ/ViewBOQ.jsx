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
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useNavigate, useParams } from "react-router-dom";
import { boqsAPI, clientsAPI, bankAccountsAPI } from "../../services/api";
import {
  formatDate,
  formatCurrency,
  getOrgProfile,
} from "../../utils/helpers";
import { BOQ_STATUS } from "../../utils/constants";
import PrintBOQ from "./PrintBOQ";
import styles from "./boq.module.css";

const ViewBOQ = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [boq, setBoq] = useState(null);
  const [client, setClient] = useState(null);
  const [bankAccount, setBankAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBOQ();
  }, [id]);

  const fetchBOQ = async () => {
    try {
      const boqRes = await boqsAPI.getById(id);
      setBoq(boqRes.data);

      if (boqRes.data.clientId) {
        const clientRes = await clientsAPI.getById(boqRes.data.clientId);
        setClient(clientRes.data);
      }

      // Fetch default bank account
      try {
        const allBanksRes = await bankAccountsAPI.getAll();
        const defaultBank = allBanksRes.data.find((b) => b.isDefault);
        if (defaultBank) {
          setBankAccount(defaultBank);
        } else if (allBanksRes.data.length > 0) {
          setBankAccount(allBanksRes.data[0]);
        }
      } catch (e) {
        console.error("Error loading bank account:", e);
      }
    } catch (error) {
      console.error("Error fetching BOQ:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      const org = await getOrgProfile();
      const printWindow = window.open("", "_blank");
      const printContent = PrintBOQ({ boq, client, organization: org, bankAccount });
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

  const getStatusColor = (status) => {
    switch (status) {
      case BOQ_STATUS.APPROVED:
        return "success";
      case BOQ_STATUS.SENT:
        return "warning";
      case BOQ_STATUS.REJECTED:
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress />
      </Box>
    );
  }

  if (!boq) {
    return (
      <Box className={styles.errorContainer}>
        <Typography>BOQ not found</Typography>
      </Box>
    );
  }

  return (
    <Box className={styles.viewBoq}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h4" className={styles.title}>
            {boq.boqNumber}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
            <Typography variant="body2" className={styles.subtitle}>
              Bill of Quantities
            </Typography>
            <Chip
              label={boq.status}
              size="small"
              color={getStatusColor(boq.status)}
            />
          </Box>
        </Box>
        <Box className={styles.headerActions}>
          {boq.status !== BOQ_STATUS.APPROVED && (
            <Button
              variant="outlined"
              startIcon={<Icon icon="mdi:pencil" />}
              onClick={() => navigate(`/boq/edit/${boq.id}`)}
            >
              Edit
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Icon icon="mdi:printer" />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            variant="outlined"
            startIcon={<Icon icon="mdi:arrow-left" />}
            onClick={() => navigate("/boq")}
          >
            Back
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* BOQ Details */}
        <Grid item xs={12} md={6}>
          <Card className={styles.detailsCard}>
            <CardContent>
              <Typography
                variant="subtitle1"
                fontWeight="600"
                gutterBottom
              >
                BOQ Details
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    BOQ Number
                  </Typography>
                  <Typography variant="body2" fontWeight="500">
                    {boq.boqNumber}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(boq.date)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Currency
                  </Typography>
                  <Typography variant="body2">{boq.currency}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Items
                  </Typography>
                  <Typography variant="body2">
                    {boq.items?.length || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Client Details */}
        <Grid item xs={12} md={6}>
          <Card className={styles.clientCard}>
            <CardContent>
              <Typography
                variant="subtitle1"
                fontWeight="600"
                gutterBottom
              >
                Client Details
              </Typography>
              {client ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Typography variant="body2" fontWeight="500">
                    {client.name}
                  </Typography>
                  {client.address && (
                    <Typography variant="body2" color="text.secondary">
                      {client.address}
                    </Typography>
                  )}
                  {client.state && (
                    <Typography variant="body2" color="text.secondary">
                      {client.state}
                      {client.pin ? ` - ${client.pin}` : ""}
                    </Typography>
                  )}
                  {client.country && (
                    <Typography variant="body2" color="text.secondary">
                      {client.country}
                    </Typography>
                  )}
                  {client.email && (
                    <Typography variant="body2" color="text.secondary">
                      Email: {client.email}
                    </Typography>
                  )}
                  {client.contact && (
                    <Typography variant="body2" color="text.secondary">
                      Phone: {client.contact}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No client information
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Items Table */}
      <Card className={styles.itemsCard} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            Line Items
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: "#f5f5f5" }}>
                  <TableCell>#</TableCell>
                  <TableCell>Area</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="center">Qty</TableCell>
                  <TableCell align="center">Disc %</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {boq.items?.map((item, index) => {
                  const lineTotal =
                    (item.unitPrice || 0) * (item.quantity || 0);
                  const discountAmt =
                    (lineTotal * (item.discount || 0)) / 100;
                  const finalTotal = lineTotal - discountAmt;

                  return (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.area || "-"}</TableCell>
                      <TableCell>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt="Item"
                            className={styles.imagePreview}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{item.category || "-"}</TableCell>
                      <TableCell>{item.itemName || "-"}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.unitPrice, boq.currency)}
                      </TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="center">
                        {item.discount > 0 ? `${item.discount}%` : "-"}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="500">
                          {formatCurrency(finalTotal, boq.currency)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Summary */}
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Box sx={{ width: 350 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  py: 1,
                }}
              >
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2" fontWeight="500">
                  {formatCurrency(boq.subtotal, boq.currency)}
                </Typography>
              </Box>
              {boq.totalDiscount > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 1,
                  }}
                >
                  <Typography variant="body2">Total Discount:</Typography>
                  <Typography variant="body2" fontWeight="500" color="error">
                    -{formatCurrency(boq.totalDiscount, boq.currency)}
                  </Typography>
                </Box>
              )}
              {boq.taxAmount > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 1,
                  }}
                >
                  <Typography variant="body2">
                    {boq.taxLabel || "Tax"} ({boq.taxPercent || 0}%):
                  </Typography>
                  <Typography variant="body2" fontWeight="500">
                    {formatCurrency(boq.taxAmount, boq.currency)}
                  </Typography>
                </Box>
              )}
              {boq.serviceTaxAmount > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 1,
                  }}
                >
                  <Typography variant="body2">
                    Service Tax ({boq.serviceTaxPercent || 0}%):
                  </Typography>
                  <Typography variant="body2" fontWeight="500">
                    {formatCurrency(boq.serviceTaxAmount, boq.currency)}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  py: 1,
                }}
              >
                <Typography variant="h6">Total Amount:</Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(boq.totalAmount, boq.currency)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Notes */}
      {boq.notes && (
        <Card className={styles.notesCard}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Notes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {boq.notes}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ViewBOQ;
