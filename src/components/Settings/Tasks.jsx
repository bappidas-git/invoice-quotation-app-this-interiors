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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import { tasksAPI, scopeOfWorkAPI } from "../../services/api";
import { formatDate } from "../../utils/helpers";
import styles from "./settings.module.css";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [scopes, setScopes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTask, setCurrentTask] = useState({
    scopeOfWorkId: "",
    description: "",
    estimatedHours: 0,
    isActive: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterScope, setFilterScope] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, scopesRes] = await Promise.all([
        tasksAPI.getAll(),
        scopeOfWorkAPI.getAll(),
      ]);
      setTasks(tasksRes.data);
      setScopes(scopesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (task = null) => {
    if (task) {
      setCurrentTask(task);
      setEditMode(true);
    } else {
      setCurrentTask({
        scopeOfWorkId: "",
        description: "",
        estimatedHours: 0,
        isActive: true,
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentTask({
      scopeOfWorkId: "",
      description: "",
      estimatedHours: 0,
      isActive: true,
    });
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!currentTask.description.trim() || !currentTask.scopeOfWorkId) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Task description and scope are required",
      });
      return;
    }

    try {
      if (editMode) {
        await tasksAPI.update(currentTask.id, {
          ...currentTask,
          updatedAt: new Date().toISOString(),
        });
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Task updated successfully",
        });
      } else {
        await tasksAPI.create({
          ...currentTask,
          createdAt: new Date().toISOString(),
        });
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Task created successfully",
        });
      }
      fetchData();
      handleCloseDialog();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save task",
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the task permanently",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await tasksAPI.delete(id);
        Swal.fire("Deleted!", "Task has been deleted.", "success");
        fetchData();
      } catch (error) {
        Swal.fire("Error!", "Failed to delete task.", "error");
      }
    }
  };

  const handleToggleActive = async (task) => {
    try {
      await tasksAPI.update(task.id, {
        ...task,
        isActive: !task.isActive,
        updatedAt: new Date().toISOString(),
      });
      fetchData();
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const getScopeName = (scopeId) => {
    const scope = scopes.find((s) => s.id === scopeId);
    return scope ? scope.name : "-";
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesScope =
      filterScope === "all" || task.scopeOfWorkId === parseInt(filterScope);
    return matchesSearch && matchesScope;
  });

  return (
    <Box className={styles.settingsContainer}>
      <Box className={styles.header}>
        <Box>
          <Typography variant="h5">Tasks</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage tasks for different scopes of work
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="mdi:plus" />}
          onClick={() => handleOpenDialog()}
        >
          Add New Task
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <Icon icon="mdi:magnify" style={{ marginRight: 8 }} />
                ),
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Scope</InputLabel>
              <Select
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value)}
                label="Filter by Scope"
              >
                <MenuItem value="all">All Scopes</MenuItem>
                {scopes.map((scope) => (
                  <MenuItem key={scope.id} value={scope.id}>
                    {scope.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {loading ? (
            <Typography>Loading...</Typography>
          ) : filteredTasks.length === 0 ? (
            <Alert severity="info">No tasks found</Alert>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Task Description</TableCell>
                    <TableCell>Scope of Work</TableCell>
                    <TableCell>Est. Hours</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          {task.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getScopeName(task.scopeOfWorkId)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {task.estimatedHours
                          ? `${task.estimatedHours} hrs`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.isActive ? "Active" : "Inactive"}
                          size="small"
                          color={task.isActive ? "success" : "default"}
                          onClick={() => handleToggleActive(task)}
                        />
                      </TableCell>
                      <TableCell>{formatDate(task.createdAt)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(task)}
                        >
                          <Icon icon="mdi:pencil" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(task.id)}
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
        <DialogTitle>{editMode ? "Edit Task" : "Add New Task"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Scope of Work</InputLabel>
              <Select
                value={currentTask.scopeOfWorkId}
                onChange={(e) =>
                  setCurrentTask({
                    ...currentTask,
                    scopeOfWorkId: e.target.value,
                  })
                }
                label="Scope of Work"
              >
                {scopes.map((scope) => (
                  <MenuItem key={scope.id} value={scope.id}>
                    {scope.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Task Description"
              value={currentTask.description}
              onChange={(e) =>
                setCurrentTask({ ...currentTask, description: e.target.value })
              }
              fullWidth
              required
              multiline
              rows={3}
            />
            <TextField
              label="Estimated Hours"
              type="number"
              value={currentTask.estimatedHours}
              onChange={(e) =>
                setCurrentTask({
                  ...currentTask,
                  estimatedHours: parseFloat(e.target.value) || 0,
                })
              }
              fullWidth
              inputProps={{ min: 0, step: 0.5 }}
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

export default Tasks;
