import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Components
import Login from "./components/Auth/Login";
import Layout from "./components/Layout/Layout";
import Dashboard from "./components/Dashboard/Dashboard";
import QuotationList from "./components/Quotation/QuotationList";
import CreateQuotation from "./components/Quotation/CreateQuotation";
import ViewQuotation from "./components/Quotation/ViewQuotation";
import PaymentUpdate from "./components/Quotation/PaymentUpdate";
import InvoiceList from "./components/Invoice/InvoiceList";
import ViewInvoice from "./components/Invoice/ViewInvoice";
import Settings from "./components/Settings/Settings";
import Organizations from "./components/Settings/Organizations";
import TaxSettings from "./components/Settings/TaxSettings";
import GeneralSettings from "./components/Settings/GeneralSettings";
import ScopeOfWork from "./components/Settings/ScopeOfWork";
import Tasks from "./components/Settings/Tasks";

// Services
import authService from "./services/authService";

// Theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
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
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
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
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
