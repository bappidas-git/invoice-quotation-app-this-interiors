import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Tooltip,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  boqsAPI,
  boqAreasAPI,
  boqCategoriesAPI,
  clientsAPI,
} from "../../services/api";
import {
  formatCurrency,
  generateBoqNumber,
  getGeneralSettings,
  getTaxSettings,
  applyTaxCalculations,
} from "../../utils/helpers";
import { BOQ_STATUS } from "../../utils/constants";
import styles from "./boq.module.css";

const CreateBOQ = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [generalSettings, setGeneralSettings] = useState(null);
  const [taxSettings, setTaxSettings] = useState(null);

  const [formData, setFormData] = useState({
    boqNumber: "",
    clientId: "",
    date: new Date().toISOString().split("T")[0],
    status: BOQ_STATUS.DRAFT,
    notes: "",
    currency: "AED",
  });

  const [items, setItems] = useState([
    {
      area: "",
      imageUrl: "",
      category: "",
      itemName: "",
      unitPrice: "",
      quantity: 1,
      discount: 0,
    },
  ]);

  const [totals, setTotals] = useState({
    subtotal: 0,
    totalDiscount: 0,
    taxAmount: 0,
    taxPercent: 0,
    taxLabel: "Tax",
    totalAmount: 0,
  });

  // Dialog states for inline creation
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    pin: "",
    state: "",
    country: "",
  });
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [newArea, setNewArea] = useState({ name: "" });
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "" });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [items, taxSettings]);

  const loadInitialData = async () => {
    try {
      const [clientsRes, areasRes, categoriesRes, genSettings, taxSett] =
        await Promise.all([
          clientsAPI.getAll(),
          boqAreasAPI.getAll(),
          boqCategoriesAPI.getAll(),
          getGeneralSettings(),
          getTaxSettings(),
        ]);

      setClients(clientsRes.data);
      setAreas(areasRes.data.filter((a) => a.isActive));
      setCategories(categoriesRes.data.filter((c) => c.isActive));
      setGeneralSettings(genSettings);
      setTaxSettings(taxSett);

      if (isEditMode) {
        const boqRes = await boqsAPI.getById(id);
        const boq = boqRes.data;
        setFormData({
          boqNumber: boq.boqNumber,
          clientId: boq.clientId,
          date: boq.date ? boq.date.split("T")[0] : "",
          status: boq.status,
          notes: boq.notes || "",
          currency: boq.currency || "AED",
        });
        setItems(
          boq.items && boq.items.length > 0
            ? boq.items
            : [
                {
                  area: "",
                  imageUrl: "",
                  category: "",
                  itemName: "",
                  unitPrice: "",
                  quantity: 1,
                  discount: 0,
                },
              ]
        );
      } else {
        // Generate BOQ number
        const allBoqs = await boqsAPI.getAll();
        const lastNumber = allBoqs.data.length;
        const boqNumber = await generateBoqNumber(lastNumber);
        setFormData((prev) => ({
          ...prev,
          boqNumber,
          currency: genSettings?.currency || "AED",
        }));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;

    items.forEach((item) => {
      const lineTotal = (parseFloat(item.unitPrice) || 0) * (parseFloat(item.quantity) || 0);
      const discountAmount = (lineTotal * (parseFloat(item.discount) || 0)) / 100;
      subtotal += lineTotal;
      totalDiscount += discountAmount;
    });

    const afterDiscount = subtotal - totalDiscount;
    const taxCalc = applyTaxCalculations(afterDiscount, taxSettings);

    setTotals({
      subtotal,
      totalDiscount,
      taxAmount: taxCalc.taxAmount,
      taxPercent: taxCalc.taxPercent,
      taxLabel: taxCalc.taxLabel,
      serviceTaxAmount: taxCalc.serviceTaxAmount || 0,
      serviceTaxPercent: taxCalc.serviceTaxPercent || 0,
      totalAmount: taxCalc.total,
    });
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        area: "",
        imageUrl: "",
        category: "",
        itemName: "",
        unitPrice: "",
        quantity: 1,
        discount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSave = async () => {
    if (!formData.clientId) {
      Swal.fire({ icon: "error", title: "Validation Error", text: "Please select a client" });
      return;
    }

    const validItems = items.filter((item) => item.itemName && item.unitPrice);
    if (validItems.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please add at least one item with name and unit price",
      });
      return;
    }

    setLoading(true);
    try {
      const boqData = {
        boqNumber: formData.boqNumber,
        clientId: Number(formData.clientId),
        date: new Date(formData.date).toISOString(),
        status: formData.status,
        items: validItems.map((item) => ({
          area: item.area,
          imageUrl: item.imageUrl,
          category: item.category,
          itemName: item.itemName,
          unitPrice: parseFloat(item.unitPrice) || 0,
          quantity: parseFloat(item.quantity) || 1,
          discount: parseFloat(item.discount) || 0,
        })),
        subtotal: totals.subtotal,
        totalDiscount: totals.totalDiscount,
        taxAmount: totals.taxAmount,
        taxPercent: totals.taxPercent,
        taxLabel: totals.taxLabel,
        serviceTaxAmount: totals.serviceTaxAmount || 0,
        serviceTaxPercent: totals.serviceTaxPercent || 0,
        totalAmount: totals.totalAmount,
        currency: formData.currency,
        notes: formData.notes,
      };

      if (isEditMode) {
        await boqsAPI.update(id, {
          ...boqData,
          updatedAt: new Date().toISOString(),
        });
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "BOQ updated successfully",
        });
      } else {
        await boqsAPI.create({
          ...boqData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "BOQ created successfully",
        });
      }

      navigate("/boq");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to ${isEditMode ? "update" : "create"} BOQ`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Inline client creation
  const handleCreateClient = async () => {
    if (!newClient.name.trim()) {
      Swal.fire({ icon: "error", title: "Validation Error", text: "Client name is required" });
      return;
    }
    try {
      const response = await clientsAPI.create({
        ...newClient,
        createdAt: new Date().toISOString(),
      });
      setClients([...clients, response.data]);
      setFormData({ ...formData, clientId: response.data.id });
      setClientDialogOpen(false);
      setNewClient({ name: "", email: "", contact: "", address: "", pin: "", state: "", country: "" });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to create client" });
    }
  };

  // Inline area creation
  const handleCreateArea = async () => {
    if (!newArea.name.trim()) {
      Swal.fire({ icon: "error", title: "Validation Error", text: "Area name is required" });
      return;
    }
    try {
      const response = await boqAreasAPI.create({
        ...newArea,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      setAreas([...areas, response.data]);
      setAreaDialogOpen(false);
      setNewArea({ name: "" });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to create area" });
    }
  };

  // Inline category creation
  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      Swal.fire({ icon: "error", title: "Validation Error", text: "Category name is required" });
      return;
    }
    try {
      const response = await boqCategoriesAPI.create({
        ...newCategory,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      setCategories([...categories, response.data]);
      setCategoryDialogOpen(false);
      setNewCategory({ name: "" });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to create category" });
    }
  };

  return (
    <Box className={styles.createBoq}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h4" className={styles.title}>
            {isEditMode ? "Edit BOQ" : "Create New BOQ"}
          </Typography>
          <Typography variant="body2" className={styles.subtitle}>
            {isEditMode
              ? "Update the bill of quantities details"
              : "Create a new shopping budget / bill of quantities"}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Icon icon="mdi:arrow-left" />}
          onClick={() => navigate("/boq")}
        >
          Back to BOQs
        </Button>
      </Box>

      <Card className={styles.formCard}>
        <CardContent>
          {/* Basic Info Section */}
          <Box className={styles.formSection}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Box className={styles.formGrid}>
              <TextField
                label="BOQ Number"
                value={formData.boqNumber}
                disabled
                fullWidth
              />
              <Box className={styles.clientField}>
                <FormControl fullWidth>
                  <InputLabel>Client *</InputLabel>
                  <Select
                    value={formData.clientId}
                    onChange={(e) =>
                      setFormData({ ...formData, clientId: e.target.value })
                    }
                    label="Client *"
                  >
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title="Add New Client">
                  <IconButton onClick={() => setClientDialogOpen(true)}>
                    <Icon icon="mdi:plus-circle" />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  label="Status"
                >
                  <MenuItem value={BOQ_STATUS.DRAFT}>Draft</MenuItem>
                  <MenuItem value={BOQ_STATUS.SENT}>Sent</MenuItem>
                  <MenuItem value={BOQ_STATUS.APPROVED}>Approved</MenuItem>
                  <MenuItem value={BOQ_STATUS.REJECTED}>Rejected</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Line Items Section */}
          <Box className={styles.formSection}>
            <Box className={styles.sectionHeader}>
              <Typography variant="h6">Line Items</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Add New Area">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Icon icon="mdi:plus" />}
                    onClick={() => setAreaDialogOpen(true)}
                  >
                    Area
                  </Button>
                </Tooltip>
                <Tooltip title="Add New Category">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Icon icon="mdi:plus" />}
                    onClick={() => setCategoryDialogOpen(true)}
                  >
                    Category
                  </Button>
                </Tooltip>
              </Box>
            </Box>

            <Box className={styles.lineItemsList}>
              {items.map((item, index) => {
                const lineTotal =
                  (parseFloat(item.unitPrice) || 0) *
                  (parseFloat(item.quantity) || 0);
                const discountAmt =
                  (lineTotal * (parseFloat(item.discount) || 0)) / 100;
                const finalTotal = lineTotal - discountAmt;

                return (
                  <Paper key={index} className={styles.lineItemCard} variant="outlined">
                    <Box className={styles.lineItemHeader}>
                      <Typography variant="subtitle2" className={styles.lineItemNumber}>
                        Item {index + 1}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        className={styles.removeItemBtn}
                      >
                        <Icon icon="mdi:delete-outline" />
                      </IconButton>
                    </Box>

                    {/* Row 1: Item Name, Area, Category */}
                    <Box className={styles.lineItemRow}>
                      <TextField
                        label="Item Name *"
                        size="small"
                        placeholder="Enter item name"
                        value={item.itemName}
                        onChange={(e) =>
                          handleItemChange(index, "itemName", e.target.value)
                        }
                        fullWidth
                        required
                        className={styles.lineItemFieldLarge}
                      />
                      <FormControl size="small" className={styles.lineItemFieldMedium}>
                        <InputLabel>Area</InputLabel>
                        <Select
                          value={item.area}
                          onChange={(e) =>
                            handleItemChange(index, "area", e.target.value)
                          }
                          label="Area"
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {areas.map((a) => (
                            <MenuItem key={a.id} value={a.name}>
                              {a.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" className={styles.lineItemFieldMedium}>
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={item.category}
                          onChange={(e) =>
                            handleItemChange(index, "category", e.target.value)
                          }
                          label="Category"
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {categories.map((c) => (
                            <MenuItem key={c.id} value={c.name}>
                              {c.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    {/* Row 2: Image URL, Unit Price, Qty, Discount, Line Total */}
                    <Box className={styles.lineItemRow}>
                      <TextField
                        label="Image URL"
                        size="small"
                        placeholder="Paste image URL"
                        value={item.imageUrl}
                        onChange={(e) =>
                          handleItemChange(index, "imageUrl", e.target.value)
                        }
                        fullWidth
                        className={styles.lineItemFieldLarge}
                      />
                      <TextField
                        label="Unit Price *"
                        size="small"
                        type="number"
                        placeholder="0.00"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, "unitPrice", e.target.value)
                        }
                        className={styles.lineItemFieldSmall}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                      <TextField
                        label="Qty"
                        size="small"
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        className={styles.lineItemFieldXSmall}
                        inputProps={{ min: 1 }}
                      />
                      <TextField
                        label="Disc %"
                        size="small"
                        type="number"
                        value={item.discount}
                        onChange={(e) =>
                          handleItemChange(index, "discount", e.target.value)
                        }
                        className={styles.lineItemFieldXSmall}
                        inputProps={{ min: 0, max: 100 }}
                      />
                      <Box className={styles.lineTotalBox}>
                        <Typography variant="caption" color="text.secondary">
                          Line Total
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="600" color="primary">
                          {formatCurrency(finalTotal, formData.currency)}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>

            <Button
              variant="outlined"
              startIcon={<Icon icon="mdi:plus" />}
              onClick={handleAddItem}
              sx={{ mt: 2 }}
            >
              Add Item
            </Button>

            {/* Totals Section */}
            <Box className={styles.totalSection}>
              <Box className={styles.totalBreakdown}>
                <Box className={styles.totalRow}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2" fontWeight="500">
                    {formatCurrency(totals.subtotal, formData.currency)}
                  </Typography>
                </Box>
                {totals.totalDiscount > 0 && (
                  <Box className={styles.totalRow}>
                    <Typography variant="body2">Total Discount:</Typography>
                    <Typography
                      variant="body2"
                      fontWeight="500"
                      color="error"
                    >
                      -{formatCurrency(totals.totalDiscount, formData.currency)}
                    </Typography>
                  </Box>
                )}
                {totals.taxAmount > 0 && (
                  <Box className={styles.totalRow}>
                    <Typography variant="body2">
                      {totals.taxLabel} ({totals.taxPercent}%):
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {formatCurrency(totals.taxAmount, formData.currency)}
                    </Typography>
                  </Box>
                )}
                {totals.serviceTaxAmount > 0 && (
                  <Box className={styles.totalRow}>
                    <Typography variant="body2">
                      Service Tax ({totals.serviceTaxPercent}%):
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {formatCurrency(
                        totals.serviceTaxAmount,
                        formData.currency
                      )}
                    </Typography>
                  </Box>
                )}
                <Box className={styles.totalRow}>
                  <Typography variant="h6">Total Amount:</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(totals.totalAmount, formData.currency)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Notes Section */}
          <Box className={styles.formSection}>
            <Typography variant="h6" gutterBottom>
              Notes
            </Typography>
            <TextField
              placeholder="Add any notes or special instructions..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
            />
          </Box>

          {/* Action Buttons */}
          <Box className={styles.actionButtons}>
            <Button
              variant="outlined"
              onClick={() => navigate("/boq")}
            >
              Cancel
            </Button>
            <Box className={styles.saveButtons}>
              <Button
                variant="contained"
                startIcon={<Icon icon="mdi:content-save" />}
                onClick={handleSave}
                disabled={loading}
                className={styles.createButton}
              >
                {loading
                  ? "Saving..."
                  : isEditMode
                  ? "Update BOQ"
                  : "Create BOQ"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* New Client Dialog */}
      <Dialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Client</DialogTitle>
        <DialogContent>
          <Box className={styles.dialogForm}>
            <TextField
              label="Client Name *"
              value={newClient.name}
              onChange={(e) =>
                setNewClient({ ...newClient, name: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Email"
              value={newClient.email}
              onChange={(e) =>
                setNewClient({ ...newClient, email: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Contact"
              value={newClient.contact}
              onChange={(e) =>
                setNewClient({ ...newClient, contact: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Address"
              value={newClient.address}
              onChange={(e) =>
                setNewClient({ ...newClient, address: e.target.value })
              }
              fullWidth
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="State"
                value={newClient.state}
                onChange={(e) =>
                  setNewClient({ ...newClient, state: e.target.value })
                }
                fullWidth
              />
              <TextField
                label="Country"
                value={newClient.country}
                onChange={(e) =>
                  setNewClient({ ...newClient, country: e.target.value })
                }
                fullWidth
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClientDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateClient} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Area Dialog */}
      <Dialog
        open={areaDialogOpen}
        onClose={() => setAreaDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Area</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Area Name *"
              value={newArea.name}
              onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAreaDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateArea} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Category Dialog */}
      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Category Name *"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateCategory} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateBOQ;
