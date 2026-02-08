import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Grid,
  Typography,
  Button,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { generalSettingsAPI } from "../../services/api";
import { clearSettingsCache } from "../../utils/helpers";
import styles from "./settings.module.css";

const GeneralSettings = () => {
  const [settings, setSettings] = useState({
    currency: "AED",
    currencySymbol: "AED",
    quotationPrefix: "QT",
    invoicePrefix: "INV",
    quotationValidDays: 30,
    paymentTerms: "Net 30",
    defaultPaymentMethod: "Bank Transfer",
    fiscalYearStart: "01-01",
    dateFormat: "DD/MM/YYYY",
    timeZone: "Asia/Dubai",
    numberFormat: "1,000.00",
    decimalPlaces: 2,
  });
  const [msg, setMsg] = useState(null);

  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "AED", symbol: "AED", name: "UAE Dirham" },
    { code: "SAR", symbol: "SAR", name: "Saudi Riyal" },
    { code: "QAR", symbol: "QAR", name: "Qatari Riyal" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  ];

  const dateFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY"];

  const paymentTermsOptions = [
    "Due on Receipt",
    "Net 7",
    "Net 15",
    "Net 30",
    "Net 45",
    "Net 60",
    "Net 90",
  ];

  const paymentMethods = [
    "Cash",
    "Bank Transfer",
    "Credit Card",
    "Debit Card",
    "Cheque",
    "Online Payment",
    "PayPal",
    "Wire Transfer",
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await generalSettingsAPI.get();
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error("Error loading general settings:", error);
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setSettings((prev) => {
      const updated = { ...prev, [field]: value };

      // Update currency symbol when currency changes
      if (field === "currency") {
        const currency = currencies.find((c) => c.code === value);
        if (currency) {
          updated.currencySymbol = currency.symbol;
        }
      }

      return updated;
    });
    setMsg(null);
  };

  const handleSave = async () => {
    try {
      await generalSettingsAPI.update(settings);
      clearSettingsCache();
      setMsg({ type: "success", text: "General settings saved successfully." });

      // Reload the page to apply new settings
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMsg({ type: "error", text: "Failed to save general settings." });
    }
  };

  return (
    <Box className={styles.settingsContainer}>
      <Box className={styles.header}>
        <Typography variant="h5">General Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Configure system-wide preferences and defaults
        </Typography>
      </Box>

      {msg && (
        <Alert severity={msg.type} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Currency & Number Format
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={settings.currency}
                      onChange={handleChange("currency")}
                      label="Currency"
                    >
                      {currencies.map((curr) => (
                        <MenuItem key={curr.code} value={curr.code}>
                          {curr.name} ({curr.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label=""
                    value={settings.currencySymbol}
                    onChange={handleChange("currencySymbol")}
                    fullWidth
                    disabled
                    helperText="Auto-selected based on currency"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label=""
                    type="number"
                    value={settings.decimalPlaces}
                    onChange={handleChange("decimalPlaces")}
                    fullWidth
                    inputProps={{ min: 0, max: 4 }}
                    helperText="Decimal Places"
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Document Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Performa Prefix"
                    value={settings.quotationPrefix}
                    onChange={handleChange("quotationPrefix")}
                    fullWidth
                    helperText="e.g., PI, QT, PF"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Invoice Prefix"
                    value={settings.invoicePrefix}
                    onChange={handleChange("invoicePrefix")}
                    fullWidth
                    helperText="e.g., INV, INVOICE, I"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Performa Valid Days"
                    type="number"
                    value={settings.quotationValidDays}
                    onChange={handleChange("quotationValidDays")}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">days</InputAdornment>
                      ),
                    }}
                    inputProps={{ min: 1, max: 365 }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Terms</InputLabel>
                    <Select
                      value={settings.paymentTerms}
                      onChange={handleChange("paymentTerms")}
                      label="Payment Terms"
                    >
                      {paymentTermsOptions.map((term) => (
                        <MenuItem key={term} value={term}>
                          {term}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Payment & Date Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Default Payment Method</InputLabel>
                    <Select
                      value={settings.defaultPaymentMethod}
                      onChange={handleChange("defaultPaymentMethod")}
                      label="Default Payment Method"
                    >
                      {paymentMethods.map((method) => (
                        <MenuItem key={method} value={method}>
                          {method}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Date Format</InputLabel>
                    <Select
                      value={settings.dateFormat}
                      onChange={handleChange("dateFormat")}
                      label="Date Format"
                    >
                      {dateFormats.map((format) => (
                        <MenuItem key={format} value={format}>
                          {format}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Fiscal Year Start"
                    value={settings.fiscalYearStart}
                    onChange={handleChange("fiscalYearStart")}
                    fullWidth
                    placeholder="MM-DD"
                    helperText="Format: MM-DD (e.g., 01-01 for January 1st)"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  startIcon={<Icon icon="mdi:content-save" />}
                >
                  Save General Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GeneralSettings;
