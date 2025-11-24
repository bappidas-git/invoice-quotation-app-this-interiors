import React, { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  IconButton,
  Collapse,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./dataTable.module.css";

const DataTable = ({
  columns,
  data,
  expandable = false,
  expandedContent,
  actions,
  loading = false,
  emptyMessage = "No data found",
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("");
  const [order, setOrder] = useState("asc");
  const [expandedRows, setExpandedRows] = useState([]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExpandRow = (rowId) => {
    setExpandedRows((prev) =>
      prev.includes(rowId)
        ? prev.filter((id) => id !== rowId)
        : [...prev, rowId]
    );
  };

  const sortedData = React.useMemo(() => {
    if (!orderBy) return data;

    return [...data].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (order === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [data, orderBy, order]);

  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper className={styles.tableWrapper}>
      <TableContainer className={styles.tableContainer}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {expandable && <TableCell width="50" />}
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || "left"}
                  style={{
                    minWidth: column.minWidth,
                    width: column.width,
                  }}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.field}
                      direction={orderBy === column.field ? order : "asc"}
                      onClick={() => handleSort(column.field)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {actions && (
                <TableCell align="center" width="150">
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length + (expandable ? 1 : 0) + (actions ? 1 : 0)
                  }
                  align="center"
                >
                  <Typography>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length + (expandable ? 1 : 0) + (actions ? 1 : 0)
                  }
                  align="center"
                >
                  <Typography variant="body2" color="textSecondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {paginatedData.map((row, rowIndex) => (
                  <React.Fragment key={row.id || rowIndex}>
                    <motion.tr
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: rowIndex * 0.05 }}
                    >
                      <TableRow hover className={styles.tableRow}>
                        {expandable && (
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleExpandRow(row.id)}
                            >
                              <Icon
                                icon={
                                  expandedRows.includes(row.id)
                                    ? "mdi:chevron-up"
                                    : "mdi:chevron-down"
                                }
                              />
                            </IconButton>
                          </TableCell>
                        )}
                        {columns.map((column) => (
                          <TableCell
                            key={column.field}
                            align={column.align || "left"}
                          >
                            {column.render
                              ? column.render(row[column.field], row)
                              : row[column.field]}
                          </TableCell>
                        ))}
                        {actions && (
                          <TableCell align="center">
                            <Box className={styles.actions}>{actions(row)}</Box>
                          </TableCell>
                        )}
                      </TableRow>
                    </motion.tr>
                    {expandable && expandedContent && (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length + 1 + (actions ? 1 : 0)}
                          className={styles.expandCell}
                        >
                          <Collapse in={expandedRows.includes(row.id)}>
                            <Box className={styles.expandedContent}>
                              {expandedContent(row)}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box className={styles.tableFooter}>
        <FormControl size="small" variant="outlined">
          <Select
            value={rowsPerPage}
            onChange={handleChangeRowsPerPage}
            className={styles.rowsSelect}
          >
            <MenuItem value={5}>5 rows</MenuItem>
            <MenuItem value={10}>10 rows</MenuItem>
            <MenuItem value={25}>25 rows</MenuItem>
            <MenuItem value={50}>50 rows</MenuItem>
            <MenuItem value={100}>100 rows</MenuItem>
          </Select>
        </FormControl>
        <TablePagination
          component="div"
          count={data.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[]}
          className={styles.pagination}
        />
      </Box>
    </Paper>
  );
};

export default DataTable;
