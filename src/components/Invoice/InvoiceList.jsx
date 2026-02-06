// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   TextField,
//   InputAdornment,
//   IconButton,
//   Chip,
//   Tooltip,
// } from "@mui/material";
// import { Icon } from "@iconify/react";
// import { useNavigate } from "react-router-dom";
// import DataTable from "../Common/DataTable";
// import DateRangeFilter from "../Common/DateRangeFilter";
// import { invoicesAPI, clientsAPI } from "../../services/api";
// import { formatDate, formatCurrency, getDateRange } from "../../utils/helpers";
// import styles from "./invoice.module.css";

// const InvoiceList = () => {
//   const navigate = useNavigate();
//   const [invoices, setInvoices] = useState([]);
//   const [clients, setClients] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [dateFilter, setDateFilter] = useState("Last Month");
//   const [customDateRange, setCustomDateRange] = useState(null);
//   const [statistics, setStatistics] = useState({
//     totalInvoices: 0,
//     totalAmount: 0,
//     averageMonthly: 0,
//   });

//   useEffect(() => {
//     fetchData();
//   }, [dateFilter, customDateRange]);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const [invoicesRes, clientsRes] = await Promise.all([
//         invoicesAPI.getAll(),
//         clientsAPI.getAll(),
//       ]);

//       const clientsMap = clientsRes.data.reduce((acc, client) => {
//         acc[client.id] = client;
//         return acc;
//       }, {});

//       setClients(clientsMap);

//       let filteredInvoices = invoicesRes.data;

//       // Date filtering
//       if (dateFilter !== "All") {
//         let dateRange;
//         if (customDateRange && dateFilter.includes("-")) {
//           dateRange = {
//             startDate: customDateRange.start,
//             endDate: customDateRange.end,
//           };
//         } else {
//           dateRange = getDateRange(dateFilter);
//         }

//         if (dateRange.startDate && dateRange.endDate) {
//           filteredInvoices = filteredInvoices.filter(
//             (i) =>
//               new Date(i.date) >= new Date(dateRange.startDate) &&
//               new Date(i.date) <= new Date(dateRange.endDate)
//           );
//         }
//       }

//       // Calculate statistics
//       const totalAmount = filteredInvoices.reduce(
//         (sum, invoice) => sum + invoice.totalAmount,
//         0
//       );

//       const months = new Set(
//         filteredInvoices.map((i) => {
//           const date = new Date(i.date);
//           return `${date.getFullYear()}-${date.getMonth()}`;
//         })
//       );

//       const averageMonthly = months.size > 0 ? totalAmount / months.size : 0;

//       setStatistics({
//         totalInvoices: filteredInvoices.length,
//         totalAmount,
//         averageMonthly,
//       });

//       setInvoices(filteredInvoices);
//     } catch (error) {
//       console.error("Error fetching invoices:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDateFilterChange = (filter, dateRange) => {
//     setDateFilter(filter);
//     setCustomDateRange(dateRange);
//   };

//   const filteredInvoices = invoices.filter((invoice) => {
//     const client = clients[invoice.clientId];
//     const searchLower = searchTerm.toLowerCase();
//     return (
//       invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
//       (client && client.name.toLowerCase().includes(searchLower))
//     );
//   });

//   const columns = [
//     {
//       field: "invoiceNumber",
//       label: "Invoice No.",
//       sortable: true,
//       render: (value) => (
//         <Typography variant="body2" fontWeight="600">
//           {value}
//         </Typography>
//       ),
//     },
//     {
//       field: "clientId",
//       label: "Client",
//       sortable: true,
//       render: (value) => clients[value]?.name || "Unknown",
//     },
//     {
//       field: "date",
//       label: "Date",
//       sortable: true,
//       render: (value) => formatDate(value),
//     },
//     {
//       field: "totalAmount",
//       label: "Amount",
//       sortable: true,
//       render: (value) => (
//         <Typography variant="body2" fontWeight="500">
//           {formatCurrency(value)}
//         </Typography>
//       ),
//     },
//     {
//       field: "status",
//       label: "Status",
//       sortable: false,
//       render: () => (
//         <Chip
//           label="Paid"
//           size="small"
//           color="success"
//           icon={<Icon icon="mdi:check-circle" />}
//         />
//       ),
//     },
//   ];

//   const renderActions = (row) => (
//     <>
//       <Tooltip title="View">
//         <IconButton
//           size="small"
//           onClick={() => navigate(`/invoices/view/${row.id}`)}
//         >
//           <Icon icon="mdi:eye" />
//         </IconButton>
//       </Tooltip>
//       <Tooltip title="Print">
//         <IconButton
//           size="small"
//           onClick={() => navigate(`/invoices/print/${row.id}`)}
//         >
//           <Icon icon="mdi:printer" />
//         </IconButton>
//       </Tooltip>
//     </>
//   );

//   const renderExpandedContent = (row) => (
//     <>
//       <Typography variant="subtitle2" gutterBottom>
//         Invoice Summary
//       </Typography>
//       <Box className={styles.summaryGrid}>
//         <Box>
//           <Typography variant="caption" color="textSecondary">
//             Items
//           </Typography>
//           <Typography variant="body2">
//             {row.items?.length || 0} items
//           </Typography>
//         </Box>
//         <Box>
//           <Typography variant="caption" color="textSecondary">
//             Payment Method
//           </Typography>
//           <Typography variant="body2">{row.paymentMethod || "N/A"}</Typography>
//         </Box>
//         <Box>
//           <Typography variant="caption" color="textSecondary">
//             Payment Date
//           </Typography>
//           <Typography variant="body2">
//             {row.paymentDate ? formatDate(row.paymentDate) : "N/A"}
//           </Typography>
//         </Box>
//         {row.quotationId && (
//           <Box>
//             <Typography variant="caption" color="textSecondary">
//               Related Quotation
//             </Typography>
//             <Typography
//               variant="body2"
//               color="primary"
//               style={{ cursor: "pointer" }}
//               onClick={() => navigate(`/quotations/view/${row.quotationId}`)}
//             >
//               View Quotation →
//             </Typography>
//           </Box>
//         )}
//       </Box>
//       {row.notes && (
//         <Box className={styles.notes}>
//           <Typography variant="caption" color="textSecondary">
//             Notes
//           </Typography>
//           <Typography variant="body2">{row.notes}</Typography>
//         </Box>
//       )}
//     </>
//   );

//   return (
//     <Box className={styles.invoiceList}>
//       <Box className={styles.header}>
//         <Box>
//           <Typography variant="h4" className={styles.title}>
//             Invoices
//           </Typography>
//           <Typography variant="body2" className={styles.subtitle}>
//             View and manage all generated invoices
//           </Typography>
//         </Box>
//       </Box>

//       <Box className={styles.statistics}>
//         <Card className={styles.statCard}>
//           <CardContent className={styles.statCardContent}>
//             <Box className={styles.statIcon}>
//               <Icon icon="mdi:receipt-text" width="24" height="24" />
//             </Box>
//             <Box>
//               <Typography variant="h5" className={styles.statValue}>
//                 {statistics.totalInvoices}
//               </Typography>
//               <Typography variant="body2" className={styles.statLabel}>
//                 Total Invoices
//               </Typography>
//             </Box>
//           </CardContent>
//         </Card>

//         <Card className={styles.statCard}>
//           <CardContent className={styles.statCardContent}>
//             <Box className={styles.statIcon}>
//               <Icon icon="mdi:cash-multiple" width="24" height="24" />
//             </Box>
//             <Box>
//               <Typography variant="h5" className={styles.statValue}>
//                 {formatCurrency(statistics.totalAmount)}
//               </Typography>
//               <Typography variant="body2" className={styles.statLabel}>
//                 Total Amount
//               </Typography>
//             </Box>
//           </CardContent>
//         </Card>

//         <Card className={styles.statCard}>
//           <CardContent className={styles.statCardContent}>
//             <Box className={styles.statIcon}>
//               <Icon icon="mdi:chart-line" width="24" height="24" />
//             </Box>
//             <Box>
//               <Typography variant="h5" className={styles.statValue}>
//                 {formatCurrency(statistics.averageMonthly)}
//               </Typography>
//               <Typography variant="body2" className={styles.statLabel}>
//                 Average Monthly
//               </Typography>
//             </Box>
//           </CardContent>
//         </Card>
//       </Box>

//       <Card className={styles.filterCard}>
//         <CardContent>
//           <Box className={styles.filterContainer}>
//             <TextField
//               placeholder="Search invoices..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className={styles.searchField}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <Icon icon="mdi:magnify" />
//                   </InputAdornment>
//                 ),
//               }}
//             />

//             <DateRangeFilter
//               value={dateFilter}
//               onChange={handleDateFilterChange}
//             />
//           </Box>
//         </CardContent>
//       </Card>

//       <DataTable
//         columns={columns}
//         data={filteredInvoices}
//         loading={loading}
//         expandable={true}
//         expandedContent={renderExpandedContent}
//         actions={renderActions}
//         emptyMessage="No invoices found"
//       />
//     </Box>
//   );
// };

// export default InvoiceList;

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   Button,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   IconButton,
//   Chip,
//   TextField,
//   InputAdornment,
//   Menu,
//   MenuItem,
//   Tooltip,
// } from "@mui/material";
// import { Icon } from "@iconify/react";
// import { motion } from "framer-motion";
// import Swal from "sweetalert2";
// import { invoicesAPI, clientsAPI } from "../../services/api";
// import {
//   formatDate,
//   formatCurrency,
//   getGeneralSettings,
// } from "../../utils/helpers";
// import styles from "./invoice.module.css";

// const InvoiceList = () => {
//   const navigate = useNavigate();
//   const [invoices, setInvoices] = useState([]);
//   const [clients, setClients] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [anchorEl, setAnchorEl] = useState(null);
//   const [selectedInvoice, setSelectedInvoice] = useState(null);
//   const [generalSettings, setGeneralSettings] = useState(null);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const [invoicesRes, clientsRes, settings] = await Promise.all([
//         invoicesAPI.getAll(),
//         clientsAPI.getAll(),
//         getGeneralSettings(),
//       ]);
//       setInvoices(invoicesRes.data || []);
//       setClients(clientsRes.data || []);
//       setGeneralSettings(settings);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       setInvoices([]);
//       setClients([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     const result = await Swal.fire({
//       title: "Are you sure?",
//       text: "This invoice will be permanently deleted!",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#d33",
//       cancelButtonColor: "#3085d6",
//       confirmButtonText: "Yes, delete it!",
//     });

//     if (result.isConfirmed) {
//       try {
//         await invoicesAPI.delete(id);
//         Swal.fire("Deleted!", "Invoice has been deleted.", "success");
//         fetchData();
//       } catch (error) {
//         Swal.fire("Error!", "Failed to delete invoice.", "error");
//       }
//     }
//   };

//   const handleMenuOpen = (event, invoice) => {
//     setAnchorEl(event.currentTarget);
//     setSelectedInvoice(invoice);
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//     setSelectedInvoice(null);
//   };

//   const handleView = () => {
//     if (selectedInvoice) {
//       navigate(`/invoices/view/${selectedInvoice.id}`);
//     }
//     handleMenuClose();
//   };

//   const handlePrint = () => {
//     if (selectedInvoice) {
//       window.open(`/invoices/print/${selectedInvoice.id}`, "_blank");
//     }
//     handleMenuClose();
//   };

//   const getClientName = (clientId) => {
//     const client = clients.find((c) => c.id === clientId);
//     return client ? client.name : "Unknown Client";
//   };

//   const getStatusColor = (invoice) => {
//     if (!invoice) return "default";

//     const isPaid = invoice.paidAmount >= invoice.totalAmount;
//     if (isPaid) return "success";

//     // Check if overdue
//     const dueDate = new Date(invoice.date);
//     dueDate.setDate(dueDate.getDate() + 30); // Assuming 30 days payment terms
//     if (new Date() > dueDate) return "error";

//     return "warning";
//   };

//   const getStatusLabel = (invoice) => {
//     if (!invoice) return "Unknown";

//     const isPaid = invoice.paidAmount >= invoice.totalAmount;
//     if (isPaid) return "Paid";

//     const dueDate = new Date(invoice.date);
//     dueDate.setDate(dueDate.getDate() + 30);
//     if (new Date() > dueDate) return "Overdue";

//     return "Pending";
//   };

//   const filteredInvoices = invoices.filter((invoice) => {
//     if (!searchTerm) return true;

//     const searchLower = searchTerm.toLowerCase();

//     // Safely check invoice number
//     const invoiceNumber = invoice.invoiceNumber || "";
//     if (
//       typeof invoiceNumber === "string" &&
//       invoiceNumber.toLowerCase().includes(searchLower)
//     ) {
//       return true;
//     }

//     // Check client name
//     const clientName = getClientName(invoice.clientId).toLowerCase();
//     if (clientName.includes(searchLower)) {
//       return true;
//     }

//     // Check amount
//     const amount = (invoice.totalAmount || 0).toString();
//     if (amount.includes(searchTerm)) {
//       return true;
//     }

//     return false;
//   });

//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: { staggerChildren: 0.1 },
//     },
//   };

//   const itemVariants = {
//     hidden: { y: 20, opacity: 0 },
//     visible: {
//       y: 0,
//       opacity: 1,
//       transition: { type: "spring", stiffness: 100 },
//     },
//   };

//   return (
//     <Box className={styles.invoiceList}>
//       <motion.div
//         initial="hidden"
//         animate="visible"
//         variants={containerVariants}
//       >
//         <Box className={styles.header}>
//           <Box>
//             <Typography variant="h4" className={styles.title}>
//               Invoices
//             </Typography>
//             <Typography variant="body2" className={styles.subtitle}>
//               Manage and track all your invoices
//             </Typography>
//           </Box>
//         </Box>

//         <Card className={styles.searchCard}>
//           <CardContent>
//             <TextField
//               placeholder="Search by invoice number, client, or amount..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               fullWidth
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <Icon icon="mdi:magnify" />
//                   </InputAdornment>
//                 ),
//               }}
//             />
//           </CardContent>
//         </Card>

//         <Card className={styles.tableCard}>
//           <CardContent>
//             {loading ? (
//               <Typography>Loading invoices...</Typography>
//             ) : filteredInvoices.length === 0 ? (
//               <Box className={styles.emptyState}>
//                 <Icon
//                   icon="mdi:receipt-text-outline"
//                   className={styles.emptyIcon}
//                 />
//                 <Typography variant="h6">No invoices found</Typography>
//                 <Typography variant="body2" color="textSecondary">
//                   {searchTerm
//                     ? "Try adjusting your search criteria"
//                     : "Invoices will appear here when created"}
//                 </Typography>
//               </Box>
//             ) : (
//               <TableContainer component={Paper} elevation={0}>
//                 <Table>
//                   <TableHead>
//                     <TableRow>
//                       <TableCell>Invoice No.</TableCell>
//                       <TableCell>Client</TableCell>
//                       <TableCell>Date</TableCell>
//                       <TableCell>Amount</TableCell>
//                       <TableCell>Paid</TableCell>
//                       <TableCell>Status</TableCell>
//                       <TableCell align="center">Actions</TableCell>
//                     </TableRow>
//                   </TableHead>
//                   <TableBody>
//                     {filteredInvoices.map((invoice, index) => (
//                       <TableRow key={invoice.id} hover>
//                         <TableCell>
//                           <Typography variant="body2" fontWeight="500">
//                             {invoice.invoiceNumber || "N/A"}
//                           </Typography>
//                         </TableCell>
//                         <TableCell>{getClientName(invoice.clientId)}</TableCell>
//                         <TableCell>{formatDate(invoice.date)}</TableCell>
//                         <TableCell>
//                           {formatCurrency(
//                             invoice.totalAmount || 0,
//                             invoice.currency ||
//                               generalSettings?.currency ||
//                               "AED"
//                           )}
//                         </TableCell>
//                         <TableCell>
//                           {formatCurrency(
//                             invoice.paidAmount || 0,
//                             invoice.currency ||
//                               generalSettings?.currency ||
//                               "AED"
//                           )}
//                         </TableCell>
//                         <TableCell>
//                           <Chip
//                             label={getStatusLabel(invoice)}
//                             size="small"
//                             color={getStatusColor(invoice)}
//                           />
//                         </TableCell>
//                         <TableCell align="center">
//                           <Tooltip title="View">
//                             <IconButton
//                               size="small"
//                               onClick={() =>
//                                 navigate(`/invoices/view/${invoice.id}`)
//                               }
//                             >
//                               <Icon icon="mdi:eye" />
//                             </IconButton>
//                           </Tooltip>
//                           <Tooltip title="Print">
//                             <IconButton
//                               size="small"
//                               onClick={() =>
//                                 window.open(
//                                   `/invoices/print/${invoice.id}`,
//                                   "_blank"
//                                 )
//                               }
//                             >
//                               <Icon icon="mdi:printer" />
//                             </IconButton>
//                           </Tooltip>
//                           <Tooltip title="More Options">
//                             <IconButton
//                               size="small"
//                               onClick={(e) => handleMenuOpen(e, invoice)}
//                             >
//                               <Icon icon="mdi:dots-vertical" />
//                             </IconButton>
//                           </Tooltip>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </TableContainer>
//             )}
//           </CardContent>
//         </Card>
//       </motion.div>

//       <Menu
//         anchorEl={anchorEl}
//         open={Boolean(anchorEl)}
//         onClose={handleMenuClose}
//       >
//         <MenuItem onClick={handleView}>
//           <Icon icon="mdi:eye" style={{ marginRight: 8 }} />
//           View Details
//         </MenuItem>
//         <MenuItem onClick={handlePrint}>
//           <Icon icon="mdi:printer" style={{ marginRight: 8 }} />
//           Print
//         </MenuItem>
//         <MenuItem
//           onClick={() => {
//             handleDelete(selectedInvoice?.id);
//             handleMenuClose();
//           }}
//           style={{ color: "#f44336" }}
//         >
//           <Icon icon="mdi:delete" style={{ marginRight: 8 }} />
//           Delete
//         </MenuItem>
//       </Menu>
//     </Box>
//   );
// };

// export default InvoiceList;

// src/InvoiceList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import DateRangeFilter from "../Common/DateRangeFilter";
import { invoicesAPI, clientsAPI } from "../../services/api";
import {
  formatDate,
  formatCurrency,
  getGeneralSettings,
  getDateRange,
  getOrgProfile,
} from "../../utils/helpers";
import PrintInvoice from "./PrintInvoice";
import styles from "./invoice.module.css";

/** ---------- helpers ---------- */
const getObjString = (v) =>
  typeof v === "object" && v !== null ? v.value ?? v.id ?? "" : v ?? "";

const getObjNumber = (v) =>
  Number(typeof v === "object" && v !== null ? v.value ?? 0 : v ?? 0);

const normalizeInvoice = (inv) => ({
  ...inv,
  invoiceNumber: getObjString(inv.invoiceNumber),
  date: getObjString(inv.date),
  clientId:
    typeof inv.clientId === "object" && inv.clientId !== null
      ? inv.clientId.value ?? inv.clientId.id ?? inv.clientId
      : inv.clientId,
  totalAmount: getObjNumber(inv.totalAmount),
  paidAmount: getObjNumber(inv.paidAmount),
  currency: getObjString(inv.currency),
});

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("Last Month");
  const [customDateRange, setCustomDateRange] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [generalSettings, setGeneralSettings] = useState(null);

  useEffect(() => {
    fetchData();
  }, [dateFilter, customDateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoicesRes, clientsRes, settings] = await Promise.all([
        invoicesAPI.getAll(),
        clientsAPI.getAll(),
        getGeneralSettings(),
      ]);

      let safeInvoices = (invoicesRes.data || []).map(normalizeInvoice);

      // Date filtering
      if (dateFilter !== "All") {
        let dateRange;
        if (customDateRange && dateFilter.includes("-")) {
          dateRange = {
            startDate: customDateRange.start,
            endDate: customDateRange.end,
          };
        } else {
          dateRange = getDateRange(dateFilter);
        }

        if (dateRange.startDate && dateRange.endDate) {
          safeInvoices = safeInvoices.filter(
            (i) =>
              new Date(i.date) >= new Date(dateRange.startDate) &&
              new Date(i.date) <= new Date(dateRange.endDate)
          );
        }
      }

      setInvoices(safeInvoices);
      setClients(clientsRes.data || []);
      setGeneralSettings(settings);
    } catch (error) {
      console.error("Error fetching data:", error);
      setInvoices([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This invoice will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await invoicesAPI.delete(id);
        Swal.fire("Deleted!", "Invoice has been deleted.", "success");
        fetchData();
      } catch (error) {
        Swal.fire("Error!", "Failed to delete invoice.", "error");
      }
    }
  };

  const handleMenuOpen = (event, invoice) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvoice(null);
  };

  const handleView = () => {
    if (selectedInvoice) navigate(`/invoices/view/${selectedInvoice.id}`);
    handleMenuClose();
  };

  const handlePrint = async () => {
    if (selectedInvoice) {
      await printInvoice(selectedInvoice);
    }
    handleMenuClose();
  };

  const printInvoice = async (invoice) => {
    try {
      const [org, clientRes] = await Promise.all([
        getOrgProfile(),
        invoice.clientId ? clientsAPI.getById(getObjString(invoice.clientId)) : Promise.resolve(null),
      ]);
      const client = clientRes?.data || null;
      const printWindow = window.open("", "_blank");
      const printContent = PrintInvoice({ invoice, client, organization: org });
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (error) {
      console.error("Error printing invoice:", error);
    }
  };

  const handleDateFilterChange = (filter, dateRange) => {
    setDateFilter(filter);
    setCustomDateRange(dateRange);
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : "Unknown Client";
  };

  const getStatusColor = (invoice) => {
    if (!invoice) return "default";
    const isPaid = (invoice.paidAmount || 0) >= (invoice.totalAmount || 0);
    if (isPaid) return "success";

    // overdue?
    const d = invoice.date ? new Date(invoice.date) : null;
    if (d && !isNaN(d)) {
      const due = new Date(d);
      due.setDate(due.getDate() + 30);
      if (new Date() > due) return "error";
    }
    return "warning";
  };

  const getStatusLabel = (invoice) => {
    if (!invoice) return "Unknown";
    const isPaid = (invoice.paidAmount || 0) >= (invoice.totalAmount || 0);
    if (isPaid) return "Paid";

    const d = invoice.date ? new Date(invoice.date) : null;
    if (d && !isNaN(d)) {
      const due = new Date(d);
      due.setDate(due.getDate() + 30);
      if (new Date() > due) return "Overdue";
    }
    return "Pending";
  };

  /** ---------- filtering ---------- */
  const filteredInvoices = invoices.filter((inv) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();

    if (
      typeof inv.invoiceNumber === "string" &&
      inv.invoiceNumber.toLowerCase().includes(q)
    ) {
      return true;
    }

    const clientName = getClientName(inv.clientId).toLowerCase();
    if (clientName.includes(q)) return true;

    const amt = (inv.totalAmount || 0).toString();
    if (amt.includes(searchTerm)) return true;

    return false;
  });

  /** ---------- animations ---------- */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  return (
    <Box className={styles.invoiceList}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Box className={styles.header}>
          <Box>
            <Typography variant="h4" className={styles.title}>
              Invoices
            </Typography>
            <Typography variant="body2" className={styles.subtitle}>
              Manage and track all your invoices
            </Typography>
          </Box>
        </Box>

        <Card className={styles.filterCard}>
          <CardContent>
            <Box className={styles.filterContainer}>
              <TextField
                placeholder="Search by invoice number, client, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchField}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon icon="mdi:magnify" />
                    </InputAdornment>
                  ),
                }}
              />

              <DateRangeFilter
                value={dateFilter}
                onChange={handleDateFilterChange}
              />
            </Box>
          </CardContent>
        </Card>

        <Card className={styles.tableCard}>
          <CardContent>
            {loading ? (
              <Typography>Loading invoices...</Typography>
            ) : filteredInvoices.length === 0 ? (
              <Box className={styles.emptyState}>
                <Icon
                  icon="mdi:receipt-text-outline"
                  className={styles.emptyIcon}
                />
                <Typography variant="h6">No invoices found</Typography>
                <Typography variant="body2" color="textSecondary">
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "Invoices will appear here when created"}
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice No.</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Paid</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">
                            {invoice.invoiceNumber || "N/A"}
                          </Typography>
                        </TableCell>

                        <TableCell>{getClientName(invoice.clientId)}</TableCell>

                        <TableCell>
                          {invoice.date ? formatDate(invoice.date) : "—"}
                        </TableCell>

                        <TableCell>
                          {formatCurrency(
                            invoice.totalAmount || 0,
                            invoice.currency ||
                              generalSettings?.currency ||
                              "AED"
                          )}
                        </TableCell>

                        <TableCell>
                          {formatCurrency(
                            invoice.paidAmount || 0,
                            invoice.currency ||
                              generalSettings?.currency ||
                              "AED"
                          )}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={getStatusLabel(invoice)}
                            size="small"
                            color={getStatusColor(invoice)}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              onClick={() =>
                                navigate(`/invoices/view/${invoice.id}`)
                              }
                            >
                              <Icon icon="mdi:eye" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Print">
                            <IconButton
                              size="small"
                              onClick={() => printInvoice(invoice)}
                            >
                              <Icon icon="mdi:printer" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="More Options">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, invoice)}
                            >
                              <Icon icon="mdi:dots-vertical" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* actions menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <Icon icon="mdi:eye" style={{ marginRight: 8 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handlePrint}>
          <Icon icon="mdi:printer" style={{ marginRight: 8 }} />
          Print
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDelete(selectedInvoice?.id);
            handleMenuClose();
          }}
          style={{ color: "#f44336" }}
        >
          <Icon icon="mdi:delete" style={{ marginRight: 8 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default InvoiceList;
