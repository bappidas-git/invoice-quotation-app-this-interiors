import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Grid,
  Typography,
  Button,
  InputAdornment,
  Alert,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { organizationsAPI } from "../../services/api";
import styles from "./settings.module.css";

const Organizations = () => {
  const [org, setOrg] = useState({
    name: "",
    logoUrl: "",
    email: "",
    contact: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    registrationNumber: "",
    bankName: "",
    bankAccount: "",
    bankBranch: "",
    bankIFSC: "",
  });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    const saved = await organizationsAPI.get();
    if (saved) {
      setOrg(saved);
    }
  };

  const handleChange = (field) => (e) => {
    setOrg((prev) => ({ ...prev, [field]: e.target.value }));
    setMsg(null);
  };

  const handleSave = async () => {
    if (!org.name || !org.email) {
      setMsg({
        type: "error",
        text: "Organization name and email are required.",
      });
      return;
    }

    try {
      await organizationsAPI.set(org);
      setMsg({
        type: "success",
        text: "Organization details saved successfully.",
      });
    } catch (error) {
      setMsg({ type: "error", text: "Failed to save organization details." });
    }
  };

  return (
    <Box className={styles.settingsContainer}>
      <Box className={styles.header}>
        <Typography variant="h5">Organization Details</Typography>
        <Typography variant="body2" color="text.secondary">
          Configure your organization's basic information and contact details
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
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Organization Name"
                    value={org.name}
                    onChange={handleChange("name")}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Logo URL"
                    value={org.logoUrl}
                    onChange={handleChange("logoUrl")}
                    fullWidth
                    placeholder="https://example.com/logo.png"
                    helperText="Enter the URL of your organization's logo"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email"
                    value={org.email}
                    onChange={handleChange("email")}
                    fullWidth
                    required
                    type="email"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon icon="mdi:email" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Contact Number"
                    value={org.contact}
                    onChange={handleChange("contact")}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon icon="mdi:phone" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Website"
                    value={org.website}
                    onChange={handleChange("website")}
                    fullWidth
                    placeholder="https://example.com"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Registration Number"
                    value={org.registrationNumber}
                    onChange={handleChange("registrationNumber")}
                    fullWidth
                    helperText="Company registration or license number"
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Address Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Address"
                    value={org.address}
                    onChange={handleChange("address")}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="City"
                    value={org.city}
                    onChange={handleChange("city")}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="State/Province"
                    value={org.state}
                    onChange={handleChange("state")}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Country"
                    value={org.country}
                    onChange={handleChange("country")}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Postal/ZIP Code"
                    value={org.postalCode}
                    onChange={handleChange("postalCode")}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Banking Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Bank Name"
                    value={org.bankName}
                    onChange={handleChange("bankName")}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Account Number"
                    value={org.bankAccount}
                    onChange={handleChange("bankAccount")}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Branch"
                    value={org.bankBranch}
                    onChange={handleChange("bankBranch")}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="IFSC/SWIFT Code"
                    value={org.bankIFSC}
                    onChange={handleChange("bankIFSC")}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  startIcon={<Icon icon="mdi:content-save" />}
                >
                  Save Organization Details
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <Box className={styles.previewSection}>
                {org.logoUrl ? (
                  <Box
                    component="img"
                    src={org.logoUrl}
                    alt="Organization Logo"
                    sx={{
                      maxWidth: "100%",
                      height: "auto",
                      maxHeight: 100,
                      mb: 2,
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: "grey.100",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2,
                    }}
                  >
                    <Icon icon="mdi:image-off" fontSize={40} />
                  </Box>
                )}

                <Typography variant="h6" fontWeight="600">
                  {org.name || "Your Organization"}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  {org.address && (
                    <Typography variant="body2" color="text.secondary">
                      <Icon icon="mdi:map-marker" /> {org.address}
                    </Typography>
                  )}
                  {org.city && (
                    <Typography variant="body2" color="text.secondary">
                      {org.city}, {org.state} {org.postalCode}
                    </Typography>
                  )}
                  {org.country && (
                    <Typography variant="body2" color="text.secondary">
                      {org.country}
                    </Typography>
                  )}
                  {org.email && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      <Icon icon="mdi:email" /> {org.email}
                    </Typography>
                  )}
                  {org.contact && (
                    <Typography variant="body2" color="text.secondary">
                      <Icon icon="mdi:phone" /> {org.contact}
                    </Typography>
                  )}
                  {org.website && (
                    <Typography variant="body2" color="text.secondary">
                      <Icon icon="mdi:web" /> {org.website}
                    </Typography>
                  )}
                  {org.registrationNumber && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Reg. No: {org.registrationNumber}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Organizations;
