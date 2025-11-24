import React, { useState, useMemo } from "react";
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

const MotionTableRow = motion(TableRow);

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

  const handleChangePage = (event, newPage) => setPage(newPage);

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

  const sortedData = useMemo(() => {
    if (!orderBy) return data;
    return [...data].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      return order === "asc"
        ? aVal < bVal
          ? -1
          : aVal > bVal
          ? 1
          : 0
        : aVal > bVal
        ? -1
        : aVal < bVal
        ? 1
        : 0;
    });
  }, [data, orderBy, order]);

  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper className={styles.tableWrapper}>
      <TableContainer className={styles.tableContainer}>
        <Table stickyHeader className={styles.table}>
          <TableHead>
            <TableRow>
              {expandable && <TableCell width="50" />}
              {columns.map((col) => (
                <TableCell
                  key={col.field}
                  align={col.align || "left"}
                  style={{ width: col.width || "auto" }}
                >
                  {col.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === col.field}
                      direction={orderBy === col.field ? order : "asc"}
                      onClick={() => handleSort(col.field)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
              {actions && <TableCell align="center">Actions</TableCell>}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  align="center"
                >
                  <Typography>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  align="center"
                >
                  <Typography variant="body2" color="textSecondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {paginatedData.reverse().map((row, i) => (
                  <React.Fragment key={row.id || i}>
                    <MotionTableRow
                      hover
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={styles.tableRow}
                    >
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
                      {columns.map((col) => (
                        <TableCell key={col.field} align={col.align || "left"}>
                          {col.render
                            ? col.render(row[col.field], row)
                            : row[col.field]}
                        </TableCell>
                      ))}
                      {actions && (
                        <TableCell align="center">
                          <Box className={styles.actions}>{actions(row)}</Box>
                        </TableCell>
                      )}
                    </MotionTableRow>

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
        <FormControl size="small">
          <Select value={rowsPerPage} onChange={handleChangeRowsPerPage}>
            {[5, 10, 25, 50, 100].map((n) => (
              <MenuItem key={n} value={n}>
                {n} rows
              </MenuItem>
            ))}
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
