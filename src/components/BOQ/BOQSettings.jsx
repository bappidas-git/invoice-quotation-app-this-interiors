import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import { boqAreasAPI, boqCategoriesAPI } from "../../services/api";
import { formatDate } from "../../utils/helpers";
import styles from "./boq.module.css";

const BOQSettings = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      label: "Areas",
      icon: "mdi:floor-plan",
      component: <AreasManagement />,
    },
    {
      label: "Categories",
      icon: "mdi:tag-multiple",
      component: <CategoriesManagement />,
    },
  ];

  return (
    <Box className={styles.settingsPage}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h4" className={styles.title}>
            BOQ Settings
          </Typography>
          <Typography variant="body2" className={styles.subtitle}>
            Manage areas and categories for Bill of Quantities
          </Typography>
        </Box>
      </Box>

      <Paper className={styles.tabsContainer}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={<Icon icon={tab.icon} />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      <Box className={styles.tabContent}>{tabs[activeTab].component}</Box>
    </Box>
  );
};

const AreasManagement = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentArea, setCurrentArea] = useState({ name: "", isActive: true });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const response = await boqAreasAPI.getAll();
      setAreas(response.data);
    } catch (error) {
      console.error("Error fetching areas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (area = null) => {
    if (area) {
      setCurrentArea(area);
      setEditMode(true);
    } else {
      setCurrentArea({ name: "", isActive: true });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentArea({ name: "", isActive: true });
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!currentArea.name.trim()) {
      Swal.fire({ icon: "error", title: "Validation Error", text: "Area name is required" });
      return;
    }

    try {
      if (editMode) {
        await boqAreasAPI.update(currentArea.id, {
          ...currentArea,
          updatedAt: new Date().toISOString(),
        });
        Swal.fire({ icon: "success", title: "Success", text: "Area updated successfully" });
      } else {
        await boqAreasAPI.create({
          ...currentArea,
          createdAt: new Date().toISOString(),
        });
        Swal.fire({ icon: "success", title: "Success", text: "Area created successfully" });
      }
      fetchAreas();
      handleCloseDialog();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to save area" });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the area permanently",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await boqAreasAPI.delete(id);
        Swal.fire("Deleted!", "Area has been deleted.", "success");
        fetchAreas();
      } catch (error) {
        Swal.fire("Error!", "Failed to delete area.", "error");
      }
    }
  };

  const handleToggleActive = async (area) => {
    try {
      await boqAreasAPI.update(area.id, {
        ...area,
        isActive: !area.isActive,
        updatedAt: new Date().toISOString(),
      });
      fetchAreas();
    } catch (error) {
      console.error("Error updating area status:", error);
    }
  };

  const filteredAreas = areas.filter((area) =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box className={styles.settingsContainer}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h5">Areas</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage area definitions for BOQs (e.g., Living Room, Kitchen)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="mdi:plus" />}
          onClick={() => handleOpenDialog()}
        >
          Add New Area
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              placeholder="Search areas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <Icon icon="mdi:magnify" style={{ marginRight: 8 }} />,
              }}
            />
          </Box>

          {loading ? (
            <Typography>Loading...</Typography>
          ) : filteredAreas.length === 0 ? (
            <Alert severity="info">No areas found</Alert>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAreas.map((area) => (
                    <TableRow key={area.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          {area.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={area.isActive ? "Active" : "Inactive"}
                          size="small"
                          color={area.isActive ? "success" : "default"}
                          onClick={() => handleToggleActive(area)}
                        />
                      </TableCell>
                      <TableCell>{formatDate(area.createdAt)}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleOpenDialog(area)}>
                          <Icon icon="mdi:pencil" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(area.id)}>
                          <Icon icon="mdi:delete" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? "Edit Area" : "Add New Area"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Area Name"
              value={currentArea.name}
              onChange={(e) => setCurrentArea({ ...currentArea, name: e.target.value })}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editMode ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ name: "", isActive: true });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await boqCategoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setCurrentCategory(category);
      setEditMode(true);
    } else {
      setCurrentCategory({ name: "", isActive: true });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCategory({ name: "", isActive: true });
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!currentCategory.name.trim()) {
      Swal.fire({ icon: "error", title: "Validation Error", text: "Category name is required" });
      return;
    }

    try {
      if (editMode) {
        await boqCategoriesAPI.update(currentCategory.id, {
          ...currentCategory,
          updatedAt: new Date().toISOString(),
        });
        Swal.fire({ icon: "success", title: "Success", text: "Category updated successfully" });
      } else {
        await boqCategoriesAPI.create({
          ...currentCategory,
          createdAt: new Date().toISOString(),
        });
        Swal.fire({ icon: "success", title: "Success", text: "Category created successfully" });
      }
      fetchCategories();
      handleCloseDialog();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to save category" });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the category permanently",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await boqCategoriesAPI.delete(id);
        Swal.fire("Deleted!", "Category has been deleted.", "success");
        fetchCategories();
      } catch (error) {
        Swal.fire("Error!", "Failed to delete category.", "error");
      }
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await boqCategoriesAPI.update(category.id, {
        ...category,
        isActive: !category.isActive,
        updatedAt: new Date().toISOString(),
      });
      fetchCategories();
    } catch (error) {
      console.error("Error updating category status:", error);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box className={styles.settingsContainer}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h5">Categories</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage item categories for BOQs (e.g., Furniture, Lights and Lamps)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="mdi:plus" />}
          onClick={() => handleOpenDialog()}
        >
          Add New Category
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <Icon icon="mdi:magnify" style={{ marginRight: 8 }} />,
              }}
            />
          </Box>

          {loading ? (
            <Typography>Loading...</Typography>
          ) : filteredCategories.length === 0 ? (
            <Alert severity="info">No categories found</Alert>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          {category.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={category.isActive ? "Active" : "Inactive"}
                          size="small"
                          color={category.isActive ? "success" : "default"}
                          onClick={() => handleToggleActive(category)}
                        />
                      </TableCell>
                      <TableCell>{formatDate(category.createdAt)}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleOpenDialog(category)}>
                          <Icon icon="mdi:pencil" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(category.id)}>
                          <Icon icon="mdi:delete" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? "Edit Category" : "Add New Category"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Category Name"
              value={currentCategory.name}
              onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editMode ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BOQSettings;
