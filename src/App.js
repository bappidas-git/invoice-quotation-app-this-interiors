import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Layout from "./components/Layout/Layout";
import Dashboard from "./components/Dashboard/Dashboard";
import QuotationList from "./components/Quotation/QuotationList";
import CreateQuotation from "./components/Quotation/CreateQuotation";
import ViewQuotation from "./components/Quotation/ViewQuotation";
import PaymentUpdate from "./components/Quotation/PaymentUpdate";
import InvoiceList from "./components/Invoice/InvoiceList";
import ViewInvoice from "./components/Invoice/ViewInvoice";
import ClientList from "./components/Clients/ClientList";
import BOQList from "./components/BOQ/BOQList";
import CreateBOQ from "./components/BOQ/CreateBOQ";
import ViewBOQ from "./components/BOQ/ViewBOQ";
import BOQSettings from "./components/BOQ/BOQSettings";
import Reports from "./components/Reports/Reports";
import Settings from "./components/Settings/Settings";
import Login from "./components/Auth/Login";
import PrintQuotation from "./components/Quotation/PrintQuotation";
import PrintInvoice from "./components/Invoice/PrintInvoice";
import PrintBOQ from "./components/BOQ/PrintBOQ";
import authService from "./services/authService";
import "./App.css";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const theme = createTheme({
  palette: {
    primary: {
      main: "#C78A1E",
      dark: "#B87916",
      light: "#E6B65C",
    },
    secondary: {
      main: "#E6B65C",
    },
    error: {
      main: "#C0392B",
    },
    warning: {
      main: "#C78A1E",
    },
    success: {
      main: "#2E7D32",
    },
    info: {
      main: "#1F6FB2",
    },
    text: {
      primary: "#2F2F2F",
      secondary: "#6B6B6B",
      disabled: "#9A9A9A",
    },
    background: {
      default: "#FAFAFA",
      paper: "#FFFFFF",
    },
    divider: "#E5E5E5",
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Print routes - outside layout */}
          <Route path="/quotations/print/:id" element={<PrintQuotation />} />
          <Route path="/invoices/print/:id" element={<PrintInvoice />} />
          <Route path="/boq/print/:id" element={<PrintBOQ />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/quotations" element={<QuotationList />} />
                    <Route
                      path="/quotations/create"
                      element={<CreateQuotation />}
                    />
                    <Route
                      path="/quotations/edit/:id"
                      element={<CreateQuotation />}
                    />
                    <Route
                      path="/quotations/view/:id"
                      element={<ViewQuotation />}
                    />
                    <Route
                      path="/quotations/payment/:id"
                      element={<PaymentUpdate />}
                    />
                    <Route path="/invoices" element={<InvoiceList />} />
                    <Route
                      path="/invoices/view/:id"
                      element={<ViewInvoice />}
                    />
                    <Route path="/clients" element={<ClientList />} />
                    <Route path="/boq" element={<BOQList />} />
                    <Route path="/boq/create" element={<CreateBOQ />} />
                    <Route path="/boq/edit/:id" element={<CreateBOQ />} />
                    <Route path="/boq/view/:id" element={<ViewBOQ />} />
                    <Route path="/boq-settings" element={<BOQSettings />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
