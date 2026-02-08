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
  InputAdornment,
  Switch,
  FormControlLabel,
  Divider,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { taxSettingsAPI } from "../../services/api";
import { formatCurrency, clearSettingsCache } from "../../utils/helpers";
import styles from "./settings.module.css";

const TaxSettings = () => {
  const [taxSettings, setTaxSettings] = useState({
    taxLabel: "VAT",
    taxPercent: 0,
    taxId: "",
    serviceTaxLabel: "Service Tax",
    serviceTaxPercent: 0,
    serviceTaxEnabled: false,
    additionalTaxes: [],
    taxInclusive: false,
    showTaxBreakdown: true,
  });
  const [msg, setMsg] = useState(null);
  const [previewAmount] = useState(1000);

  useEffect(() => {
    loadTaxSettings();
  }, []);

  const loadTaxSettings = async () => {
    try {
      const response = await taxSettingsAPI.get();
      if (response.data) {
        setTaxSettings(response.data);
      }
    } catch (error) {
      console.error("Error loading tax settings:", error);
    }
  };

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setTaxSettings((prev) => ({ ...prev, [field]: value }));
    setMsg(null);
  };

  const calculateTaxAmount = (amount, percentage) => {
    return (amount * percentage) / 100;
  };

  const getTotalWithTax = () => {
    const taxAmount = calculateTaxAmount(
      previewAmount,
      taxSettings.taxPercent || 0
    );
    const serviceTaxAmount = taxSettings.serviceTaxEnabled
      ? calculateTaxAmount(previewAmount, taxSettings.serviceTaxPercent || 0)
      : 0;
    return previewAmount + taxAmount + serviceTaxAmount;
  };

  const handleSave = async () => {
    try {
      await taxSettingsAPI.update({
        ...taxSettings,
        taxPercent: Number(taxSettings.taxPercent) || 0,
        serviceTaxPercent: Number(taxSettings.serviceTaxPercent) || 0,
      });
      clearSettingsCache();
      setMsg({ type: "success", text: "Tax settings saved successfully." });
    } catch (error) {
      setMsg({ type: "error", text: "Failed to save tax settings." });
    }
  };

  return (
    <Box className={styles.settingsContainer}>
      <Box className={styles.header}>
        <Typography variant="h5">Tax Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Configure tax rates and settings for performa invoices and invoices
        </Typography>
      </Box>

      {msg && (
        <Alert severity={msg.type} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Primary Tax Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Tax Label"
                    value={taxSettings.taxLabel}
                    onChange={handleChange("taxLabel")}
                    fullWidth
                    helperText='e.g., "VAT", "GST", "Sales Tax"'
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Tax Rate"
                    type="number"
                    value={taxSettings.taxPercent}
                    onChange={handleChange("taxPercent")}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">%</InputAdornment>
                      ),
                    }}
                    inputProps={{
                      min: 0,
                      max: 100,
                      step: 0.01,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Tax ID/Number"
                    value={taxSettings.taxId}
                    onChange={handleChange("taxId")}
                    fullWidth
                    helperText="GST/VAT/TRN Number"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Service Tax Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={taxSettings.serviceTaxEnabled}
                        onChange={handleChange("serviceTaxEnabled")}
                      />
                    }
                    label="Enable Service Tax"
                  />
                </Grid>
                {taxSettings.serviceTaxEnabled && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Service Tax Label"
                        value={taxSettings.serviceTaxLabel}
                        onChange={handleChange("serviceTaxLabel")}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Service Tax Rate"
                        type="number"
                        value={taxSettings.serviceTaxPercent}
                        onChange={handleChange("serviceTaxPercent")}
                        fullWidth
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">%</InputAdornment>
                          ),
                        }}
                        inputProps={{
                          min: 0,
                          max: 100,
                          step: 0.01,
                        }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Display Options
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={taxSettings.taxInclusive}
                        onChange={handleChange("taxInclusive")}
                      />
                    }
                    label="Prices are tax inclusive"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={taxSettings.showTaxBreakdown}
                        onChange={handleChange("showTaxBreakdown")}
                      />
                    }
                    label="Show tax breakdown on documents"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  startIcon={<Icon icon="mdi:content-save" />}
                >
                  Save Tax Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tax Calculation Preview
              </Typography>
              <Box className={styles.previewSection}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Sample calculation for {formatCurrency(previewAmount)}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Box className={styles.calculationRow}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2" fontWeight="500">
                      {formatCurrency(previewAmount)}
                    </Typography>
                  </Box>

                  {taxSettings.taxPercent > 0 && (
                    <Box className={styles.calculationRow}>
                      <Typography variant="body2">
                        {taxSettings.taxLabel} ({taxSettings.taxPercent}%):
                      </Typography>
                      <Typography variant="body2">
                        {formatCurrency(
                          calculateTaxAmount(
                            previewAmount,
                            taxSettings.taxPercent
                          )
                        )}
                      </Typography>
                    </Box>
                  )}

                  {taxSettings.serviceTaxEnabled &&
                    taxSettings.serviceTaxPercent > 0 && (
                      <Box className={styles.calculationRow}>
                        <Typography variant="body2">
                          {taxSettings.serviceTaxLabel} (
                          {taxSettings.serviceTaxPercent}%):
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(
                            calculateTaxAmount(
                              previewAmount,
                              taxSettings.serviceTaxPercent
                            )
                          )}
                        </Typography>
                      </Box>
                    )}

                  <Divider sx={{ my: 1 }} />

                  <Box className={styles.calculationRow}>
                    <Typography variant="body1" fontWeight="600">
                      Total:
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="600"
                      color="primary"
                    >
                      {formatCurrency(getTotalWithTax())}
                    </Typography>
                  </Box>
                </Box>

                {taxSettings.taxId && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Tax ID: {taxSettings.taxId}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaxSettings;
