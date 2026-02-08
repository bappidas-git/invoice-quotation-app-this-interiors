import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Grid,
  Typography,
  Button,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Chip,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { bankAccountsAPI } from "../../services/api";
import { clearSettingsCache } from "../../utils/helpers";
import styles from "./settings.module.css";

const emptyBank = {
  bankName: "",
  accountNumber: "",
  branch: "",
  ifscSwift: "",
  accountHolderName: "",
  qrCodeUrl: "",
  isDefault: false,
};

const BankingSettings = () => {
  const [banks, setBanks] = useState([]);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [formData, setFormData] = useState({ ...emptyBank });

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      const response = await bankAccountsAPI.getAll();
      setBanks(response.data);
    } catch (error) {
      console.error("Error loading bank accounts:", error);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setMsg(null);
  };

  const handleSave = async () => {
    if (!formData.bankName || !formData.accountNumber) {
      setMsg({ type: "error", text: "Bank name and account number are required." });
      return;
    }

    setLoading(true);
    try {
      if (editingBank) {
        await bankAccountsAPI.update(editingBank.id, {
          ...formData,
          id: editingBank.id,
          createdAt: editingBank.createdAt,
        });
      } else {
        const isFirst = banks.length === 0;
        await bankAccountsAPI.create({
          ...formData,
          isDefault: isFirst ? true : formData.isDefault,
          createdAt: new Date().toISOString(),
        });
      }

      clearSettingsCache();
      await loadBanks();
      setFormData({ ...emptyBank });
      setEditingBank(null);
      setMsg({
        type: "success",
        text: editingBank
          ? "Bank account updated successfully."
          : "Bank account added successfully.",
      });
    } catch (error) {
      setMsg({ type: "error", text: "Failed to save bank account." });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bank) => {
    setEditingBank(bank);
    setFormData({
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      branch: bank.branch,
      ifscSwift: bank.ifscSwift,
      accountHolderName: bank.accountHolderName || "",
      qrCodeUrl: bank.qrCodeUrl || "",
      isDefault: bank.isDefault,
    });
  };

  const handleCancelEdit = () => {
    setEditingBank(null);
    setFormData({ ...emptyBank });
  };

  const handleDelete = async (bankId) => {
    const bank = banks.find((b) => b.id === bankId);
    if (bank?.isDefault && banks.length > 1) {
      setMsg({
        type: "error",
        text: "Cannot delete the default bank. Set another bank as default first.",
      });
      return;
    }

    try {
      await bankAccountsAPI.delete(bankId);
      clearSettingsCache();
      await loadBanks();
      setMsg({ type: "success", text: "Bank account deleted." });
    } catch (error) {
      setMsg({ type: "error", text: "Failed to delete bank account." });
    }
  };

  const handleSetDefault = async (bankId) => {
    try {
      for (const bank of banks) {
        if (bank.isDefault && bank.id !== bankId) {
          await bankAccountsAPI.update(bank.id, {
            ...bank,
            isDefault: false,
          });
        }
      }

      const targetBank = banks.find((b) => b.id === bankId);
      if (targetBank) {
        await bankAccountsAPI.update(bankId, {
          ...targetBank,
          isDefault: true,
        });
      }

      clearSettingsCache();
      await loadBanks();
      setMsg({ type: "success", text: "Default bank updated." });
    } catch (error) {
      setMsg({ type: "error", text: "Failed to update default bank." });
    }
  };

  return (
    <Box className={styles.settingsContainer}>
      <Box className={styles.header}>
        <Typography variant="h5">Banking & Payment</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your bank accounts for invoices and payments
        </Typography>
      </Box>

      {msg && (
        <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2 }}>
          {msg.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {editingBank ? "Edit Bank Account" : "Add Bank Account"}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Bank Name"
                    value={formData.bankName}
                    onChange={handleChange("bankName")}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Account Number"
                    value={formData.accountNumber}
                    onChange={handleChange("accountNumber")}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Account Holder Name"
                    value={formData.accountHolderName}
                    onChange={handleChange("accountHolderName")}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Branch"
                    value={formData.branch}
                    onChange={handleChange("branch")}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="IFSC/SWIFT Code"
                    value={formData.ifscSwift}
                    onChange={handleChange("ifscSwift")}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="QR Code Image URL"
                    value={formData.qrCodeUrl}
                    onChange={handleChange("qrCodeUrl")}
                    fullWidth
                    placeholder="https://example.com/qr-code.png"
                    helperText="Paste the URL of the QR code image for this bank"
                  />
                </Grid>
                {formData.qrCodeUrl && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      QR Code Preview
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Box
                        component="img"
                        src={formData.qrCodeUrl}
                        alt="QR Code Preview"
                        sx={{
                          maxWidth: 150,
                          maxHeight: 150,
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </Box>
                  </Grid>
                )}
              </Grid>
              <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={loading}
                  startIcon={
                    <Icon
                      icon={editingBank ? "mdi:content-save" : "mdi:plus"}
                    />
                  }
                >
                  {editingBank ? "Update Bank" : "Add Bank"}
                </Button>
                {editingBank && (
                  <Button variant="outlined" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Saved Bank Accounts
              </Typography>
              {banks.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No bank accounts added yet.
                </Typography>
              ) : (
                banks.map((bank) => (
                  <Box key={bank.id} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        p: 2,
                        border: "1px solid",
                        borderColor: bank.isDefault
                          ? "primary.main"
                          : "grey.300",
                        borderRadius: 1,
                        bgcolor: bank.isDefault
                          ? "primary.50"
                          : "transparent",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight="600">
                              {bank.bankName}
                            </Typography>
                            {bank.isDefault && (
                              <Chip
                                label="Default"
                                size="small"
                                color="primary"
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            A/C: {bank.accountNumber}
                          </Typography>
                          {bank.accountHolderName && (
                            <Typography variant="body2" color="text.secondary">
                              Holder: {bank.accountHolderName}
                            </Typography>
                          )}
                          {bank.branch && (
                            <Typography variant="body2" color="text.secondary">
                              Branch: {bank.branch}
                            </Typography>
                          )}
                          {bank.ifscSwift && (
                            <Typography variant="body2" color="text.secondary">
                              IFSC/SWIFT: {bank.ifscSwift}
                            </Typography>
                          )}
                          {bank.qrCodeUrl && (
                            <Box sx={{ mt: 1 }}>
                              <Box
                                component="img"
                                src={bank.qrCodeUrl}
                                alt="QR Code"
                                sx={{
                                  width: 60,
                                  height: 60,
                                  border: "1px solid #e0e0e0",
                                  borderRadius: 0.5,
                                }}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(bank)}
                          >
                            <Icon icon="mdi:pencil" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(bank.id)}
                          >
                            <Icon icon="mdi:delete" />
                          </IconButton>
                        </Box>
                      </Box>
                      {!bank.isDefault && (
                        <Box sx={{ mt: 1 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={false}
                                onChange={() => handleSetDefault(bank.id)}
                              />
                            }
                            label={
                              <Typography variant="caption">
                                Set as Default
                              </Typography>
                            }
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BankingSettings;
