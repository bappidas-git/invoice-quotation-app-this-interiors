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
} from "@mui/material";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import { scopeOfWorkAPI } from "../../services/api";
import { formatDate } from "../../utils/helpers";
import styles from "./settings.module.css";

const ScopeOfWork = () => {
  const [scopes, setScopes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentScope, setCurrentScope] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchScopes();
  }, []);

  const fetchScopes = async () => {
    try {
      const response = await scopeOfWorkAPI.getAll();
      setScopes(response.data);
    } catch (error) {
      console.error("Error fetching scopes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (scope = null) => {
    if (scope) {
      setCurrentScope(scope);
      setEditMode(true);
    } else {
      setCurrentScope({
        name: "",
        description: "",
        isActive: true,
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentScope({
      name: "",
      description: "",
      isActive: true,
    });
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!currentScope.name.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Scope name is required",
      });
      return;
    }

    try {
      if (editMode) {
        await scopeOfWorkAPI.update(currentScope.id, {
          ...currentScope,
          updatedAt: new Date().toISOString(),
        });
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Scope updated successfully",
        });
      } else {
        await scopeOfWorkAPI.create({
          ...currentScope,
          createdAt: new Date().toISOString(),
        });
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Scope created successfully",
        });
      }
      fetchScopes();
      handleCloseDialog();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save scope",
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the scope of work permanently",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await scopeOfWorkAPI.delete(id);
        Swal.fire("Deleted!", "Scope has been deleted.", "success");
        fetchScopes();
      } catch (error) {
        Swal.fire("Error!", "Failed to delete scope.", "error");
      }
    }
  };

  const handleToggleActive = async (scope) => {
    try {
      await scopeOfWorkAPI.update(scope.id, {
        ...scope,
        isActive: !scope.isActive,
        updatedAt: new Date().toISOString(),
      });
      fetchScopes();
    } catch (error) {
      console.error("Error updating scope status:", error);
    }
  };

  const filteredScopes = scopes.filter((scope) =>
    scope.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box className={styles.settingsContainer}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h5">Scope of Work</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage scope of work categories for quotations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="mdi:plus" />}
          onClick={() => handleOpenDialog()}
        >
          Add New Scope
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              placeholder="Search scopes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <Icon icon="mdi:magnify" style={{ marginRight: 8 }} />
                ),
              }}
            />
          </Box>

          {loading ? (
            <Typography>Loading...</Typography>
          ) : filteredScopes.length === 0 ? (
            <Alert severity="info">No scopes found</Alert>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredScopes.map((scope) => (
                    <TableRow key={scope.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          {scope.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {scope.description || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={scope.isActive ? "Active" : "Inactive"}
                          size="small"
                          color={scope.isActive ? "success" : "default"}
                          onClick={() => handleToggleActive(scope)}
                        />
                      </TableCell>
                      <TableCell>{formatDate(scope.createdAt)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(scope)}
                        >
                          <Icon icon="mdi:pencil" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(scope.id)}
                        >
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

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editMode ? "Edit Scope of Work" : "Add New Scope of Work"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Scope Name"
              value={currentScope.name}
              onChange={(e) =>
                setCurrentScope({ ...currentScope, name: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={currentScope.description}
              onChange={(e) =>
                setCurrentScope({
                  ...currentScope,
                  description: e.target.value,
                })
              }
              fullWidth
              multiline
              rows={3}
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

export default ScopeOfWork;
