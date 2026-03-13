# THIS Interiors - Invoice & Quotation Management System

A comprehensive invoice, quotation, and Bill of Quantities (BOQ) management application built for **THIS Interiors**, an interior design firm. The application streamlines the entire workflow from creating client quotations to tracking payments and generating invoices, with full support for BOQ management, reporting, and tax configuration.

---

## Table of Contents

- [Features Overview](#features-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
  - [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Application Modules](#application-modules)
  - [Dashboard](#dashboard)
  - [Quotation Management](#quotation-management)
  - [Invoice Management](#invoice-management)
  - [BOQ (Bill of Quantities)](#boq-bill-of-quantities)
  - [BOQ Invoices](#boq-invoices)
  - [Procurement Details](#procurement-details)
  - [Client Management](#client-management)
  - [Reports & Analytics](#reports--analytics)
  - [Settings](#settings)
- [API Reference](#api-reference)
  - [Authentication API](#authentication-api)
  - [Clients API](#clients-api)
  - [Scope of Work API](#scope-of-work-api)
  - [Tasks API](#tasks-api)
  - [Quotations API](#quotations-api)
  - [Invoices API](#invoices-api)
  - [BOQ API](#boq-api)
  - [BOQ Invoices API](#boq-invoices-api)
  - [BOQ Configuration API](#boq-configuration-api)
  - [Bank Accounts API](#bank-accounts-api)
  - [Settings API](#settings-api)
- [Database Schema](#database-schema)
- [Routing](#routing)
- [Utility Functions](#utility-functions)
- [PDF & Print Support](#pdf--print-support)
- [Production Deployment](#production-deployment)
- [Backend Migration (Laravel)](#backend-migration-laravel)

---

## Features Overview

- **Quotation (Performa Invoice) Management** - Create, edit, view, and print quotations with dynamic line items, scope of work, and tax calculations
- **Draft Performa Status** - Save quotations as Draft before sending; Draft quotations are fully editable/deletable and excluded from all financial metrics (Dashboard totals, Reports revenue, tax sums, outstanding balances)
- **Document-Level Discounts on Quotations** - Apply a percentage or flat discount at the document level before tax calculation
- **Payment Tracking** - Record partial and full payments against quotations with automatic status updates
- **Invoice Generation** - Auto-generate invoices from quotation payments with unique numbering
- **Bill of Quantities (BOQ)** - Create detailed BOQs with areas, categories, item images, and per-item discounts (percentage or flat)
- **Vendor / Procurement Source** - Internal-only field per BOQ item for tracking vendor names, supplier links, or product references — never shown on client-facing prints
- **BOQ Invoices** - Auto-generated when a BOQ is approved; immutable records with their own numbering sequence, list page, and detail view
- **Procurement Details** - Internal tab in BOQ Invoice view showing vendor/procurement sources with a separate internal print output
- **Two BOQ Invoice Print Outputs** - Client-facing invoice (no procurement data) and internal copy with confidential banner and Vendor/Source column
- **Client Management** - Full CRUD operations for managing clients with contact details, company name, tax number, and document display toggles
- **Dashboard Analytics** - Real-time metrics, recent activity feed, quick actions, and BOQ overview
- **Comprehensive Reports** - 8 report types covering revenue, clients, status, payments, tax, services, outstanding amounts, and BOQ analysis
- **Configurable Settings** - Organization profile, tax rates, bank accounts, currency, date formats, and document number prefixes
- **Scope of Work & Task Library** - Reusable service categories and tasks for quick quotation creation
- **THIS Interiors Brand-Themed Print Templates** - All print templates use the THIS Interiors brand palette (charcoal #1a1a1a + gold #c17f24) with A4 page optimization, repeating table headers, and page-break control
- **Responsive Design** - Mobile-friendly interface with Material-UI components

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 18.2.0 |
| **Routing** | React Router DOM 6.20.0 |
| **UI Library** | Material-UI (MUI) 5.14.18 |
| **Icons** | Iconify (Material Design Icons) |
| **Animations** | Framer Motion 10.16.16 |
| **HTTP Client** | Axios 1.6.2 |
| **Date Handling** | date-fns 2.30.0, MUI X Date Pickers 6.18.3 |
| **PDF Generation** | jsPDF 2.5.1, jspdf-autotable 3.8.2 |
| **Alerts/Dialogs** | SweetAlert2 11.10.1 |
| **Dev API Server** | JSON Server 0.17.4 |
| **Build Tool** | Create React App (react-scripts 5.0.1) |
| **Styling** | CSS Modules + MUI Theme + CSS Variables |

---

## Project Structure

```
invoice-quotation-app-this-interiors/
├── public/
│   ├── index.html                    # HTML entry point
│   └── robots.txt
├── req-doc/
│   ├── api-guideline.md              # Laravel backend API specification
│   └── BOQ-Sample.pdf                # Sample BOQ document
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   └── Login.jsx             # Login page
│   │   ├── BOQ/
│   │   │   ├── BOQInvoiceList.jsx    # BOQ invoices list (auto-generated, read-only)
│   │   │   ├── BOQList.jsx           # BOQ listing with filters
│   │   │   ├── BOQSettings.jsx       # BOQ areas & categories config
│   │   │   ├── CreateBOQ.jsx         # Create/Edit BOQ form
│   │   │   ├── PrintBOQ.jsx          # BOQ print template
│   │   │   ├── PrintBOQInvoice.jsx   # BOQ invoice print template (client-facing)
│   │   │   ├── PrintBOQInvoiceInternal.jsx  # BOQ invoice print template (internal with procurement)
│   │   │   ├── ViewBOQ.jsx           # BOQ detail view
│   │   │   └── ViewBOQInvoice.jsx    # BOQ invoice view with Invoice + Procurement tabs
│   │   ├── Clients/
│   │   │   └── ClientList.jsx        # Client CRUD with statistics
│   │   ├── Common/
│   │   │   ├── DataTable.jsx         # Reusable data grid with pagination
│   │   │   ├── DateRangeFilter.jsx   # Date range selection component
│   │   │   ├── DateRangePopup.jsx    # Calendar picker popup
│   │   │   └── MetricCard.jsx        # Dashboard KPI card
│   │   ├── Dashboard/
│   │   │   └── Dashboard.jsx         # Main dashboard with metrics
│   │   ├── Invoice/
│   │   │   ├── InvoiceList.jsx       # Invoice listing with filters
│   │   │   ├── PrintInvoice.jsx      # Invoice print template
│   │   │   └── ViewInvoice.jsx       # Invoice detail view
│   │   ├── Layout/
│   │   │   ├── Footer.jsx            # Application footer
│   │   │   ├── Header.jsx            # Top navigation bar
│   │   │   ├── Layout.jsx            # Main layout wrapper
│   │   │   └── Sidebar.jsx           # Side navigation menu
│   │   ├── Quotation/
│   │   │   ├── CreateQuotation.jsx   # Create/Edit quotation form
│   │   │   ├── PaymentUpdate.jsx     # Record payment against quotation
│   │   │   ├── PrintQuotation.jsx    # Quotation print template
│   │   │   ├── QuotationList.jsx     # Quotation listing with filters
│   │   │   └── ViewQuotation.jsx     # Quotation detail view
│   │   ├── Reports/
│   │   │   └── Reports.jsx           # 8-tab reports dashboard
│   │   └── Settings/
│   │       ├── BankingSettings.jsx   # Bank account management
│   │       ├── GeneralSettings.jsx   # Currency, formats, prefixes
│   │       ├── Organizations.jsx     # Organization profile
│   │       ├── ScopeOfWork.jsx       # Scope of work library
│   │       ├── Settings.jsx          # Settings hub (tab container)
│   │       ├── Tasks.jsx             # Task management
│   │       └── TaxSettings.jsx       # Tax rate configuration
│   ├── services/
│   │   ├── api.js                    # Axios instance & all API endpoints
│   │   ├── authService.js            # Authentication logic
│   │   └── baseURL.js                # API base URL configuration
│   ├── utils/
│   │   ├── constants.js              # Enums, status values, defaults
│   │   └── helpers.js                # Formatting, calculations, caching
│   ├── App.css                       # Global styles & CSS variables
│   ├── App.js                        # Main app with routing & theme
│   └── index.js                      # React DOM entry point
├── db.json                           # JSON Server mock database
├── package.json                      # Dependencies & scripts
└── README.md                         # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 14.x
- **npm** >= 6.x

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd invoice-quotation-app-this-interiors

# Install dependencies
npm install
```

### Running the Application

The application requires two processes running simultaneously: the React dev server and the JSON Server mock API.

```bash
# Terminal 1: Start the mock API server (port 5000)
npm run server

# Terminal 2: Start the React development server (port 3000)
npm start
```

The application will be available at `http://localhost:3000`.

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `react-scripts start` | Start React dev server on port 3000 |
| `npm run server` | `json-server --watch db.json --port 5000` | Start mock API on port 5000 |
| `npm run build` | `react-scripts build` | Build optimized production bundle |
| `npm test` | `react-scripts test` | Run test suite |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_BASE_URL` | `http://localhost:5000` | Backend API base URL |

Create a `.env` file in the project root to override:

```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

---

## Authentication

The application uses token-based authentication with Bearer tokens.

### Development Mode

When running with JSON Server (which has no auth endpoint), the app falls back to hardcoded development credentials:

| Field | Value |
|-------|-------|
| **Email** | `invoice@thisinteriors.com` |
| **Password** | `THIS@123###` |

### Authentication Flow

1. User submits credentials on the login page (`/login`)
2. `authService.login()` sends a `POST /auth/login` request
3. If the API is unavailable (dev mode), credentials are validated against fallback values
4. On success, a token is stored in `localStorage` as `auth_token`
5. All subsequent API requests include the token via an Axios request interceptor: `Authorization: Bearer <token>`
6. A response interceptor catches `401` responses, clears the token, and redirects to `/login`
7. The `ProtectedRoute` component guards all authenticated routes

### Production Mode

For production with a Laravel backend, authentication uses Laravel Sanctum for token generation. The API returns a structured token: `{ token: "1|abc123..." }`.

---

## Application Modules

### Dashboard

The main landing page after login, providing an at-a-glance overview of business activity.

**Features:**
- **4 Metric Cards** - Total Invoices (amount), Total Performa (amount), Due Amount (outstanding), Total Clients (count)
- **Date Range Filtering** - Filter metrics by Today, Last Week, Last Month, Custom Range, or All Time
- **Recent Activity** - Quick links to the 3 most recent quotations and invoices
- **Quick Actions** - One-click buttons to create quotations, BOQs, manage clients, and view reports
- **BOQ Overview** - Total BOQ count, approved count, pending approval alerts, and recent BOQ entries

> **Note:** Draft quotations are excluded from all Dashboard financial totals and metric calculations.

### Quotation Management

Full lifecycle management for quotations (Performa Invoices).

**Quotation Lifecycle:**
1. **Create** - Select client, choose scope of work/tasks, add line items with descriptions, quantities, and unit prices
2. **Discount** - Optionally apply a document-level discount (percentage or flat amount) before tax
3. **Tax Calculation** - Automatic tax and service tax computation based on tax settings, applied after discount
4. **Save** - Save as `Draft` (editable, not sent) or save with status `Performa` with auto-generated number (format: `PI-YYYY-NNNN`)
5. **Payment** - Record partial or full payments; status updates to `Partially Paid` or `Fully Paid`
6. **Invoice Generation** - Each payment automatically generates a corresponding invoice
7. **Print/PDF** - Generate printable quotation document with organization branding

**Quotation Statuses:**
| Status | Description |
|--------|-------------|
| `Draft` | Saved but not yet sent — fully editable and deletable, excluded from all financial metrics |
| `Performa` | Active quotation sent to client, no payment received |
| `Partially Paid` | Some payment received, balance outstanding |
| `Fully Paid` | All payments received |

> **Note:** A "Save as Draft" button is available in the quotation creation form. Draft quotations contribute zero to Dashboard totals, Reports revenue, client amounts, tax sums, and outstanding balances. Payment recording is blocked for Draft quotations.

**Discount Support:**
- Document-level discount applied before tax calculation
- Discount type: percentage (`%`) or flat currency amount
- Calculation flow: subtotal → apply discount → apply tax on discounted amount → total

**List View Features:**
- Search by quotation number, client name
- Filter by status (Draft, Performa, Partially Paid, Fully Paid)
- Filter by date range
- Statistics panel with counts and amounts per status

### Invoice Management

Invoices are generated automatically when payments are recorded against quotations.

**Features:**
- Auto-generated invoice numbers (format: `INV-YYYY-NNNN`)
- View invoice details including client info, line items, tax breakdown, and bank account details
- Filter by date range or client
- Print/PDF generation with organization branding

**Invoice Statuses:**
| Status | Description |
|--------|-------------|
| `Pending` | Invoice generated, awaiting payment |
| `Paid` | Payment confirmed |
| `Overdue` | Past due date |
| `Cancelled` | Invoice cancelled |

### BOQ (Bill of Quantities)

Detailed quantity surveying documents for interior design projects.

**Features:**
- Create BOQs with configurable **areas** (e.g., Living Room, Bedroom, Kitchen) and **categories** (e.g., Furniture, Lights, Curtains)
- Add line items with description, area, category, unit, quantity, unit price, and optional **per-item discount** (percentage or flat amount via a discount type toggle)
- **Vendor / Procurement Source** field per item — an internal-only field for recording vendor names, supplier links, or product references; displayed in the Create/Edit form as an amber-styled "Internal use only" row but never shown on client-facing prints
- Support for item images (thumbnail display in print view)
- Tax calculation on the final subtotal
- Auto-generated BOQ numbers (format: `BOQ-YYYY-NNNN`)
- Print/PDF with detailed item breakdown

**BOQ Item Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `area` | string | Room or area (e.g., Living Room) |
| `category` | string | Product category (e.g., Furniture) |
| `itemName` | string | Item description |
| `imageUrl` | string | Optional item image URL |
| `unitPrice` | number | Price per unit |
| `quantity` | number | Quantity |
| `discount` | number | Discount value (% or flat amount) |
| `discountType` | string | `"percent"` or `"flat"` (defaults to `"percent"` for backwards compatibility) |
| `procurementSource` | string | Vendor name, supplier link, or product reference (internal only) |

**BOQ Statuses:**
| Status | Description |
|--------|-------------|
| `Draft` | Work in progress |
| `Sent` | Sent to client |
| `Approved` | Client approved — triggers auto-generation of a BOQ Invoice |
| `Rejected` | Client rejected |

**BOQ Settings:**
- Manage area list (add, edit, delete areas like Entrance, Living Room, Bedroom, etc.)
- Manage category list (add, edit, delete categories like Furniture, Sofa, Lights, Wallpaper, etc.)

### BOQ Invoices

BOQ Invoices are auto-generated when a BOQ status is set to **Approved**. They serve as immutable invoice records for approved BOQs.

**Key Characteristics:**
- **Auto-generated** — created automatically on BOQ approval with an idempotency check (no duplicates)
- **Immutable** — no edit or delete is permitted once created
- **Auto-generated number format:** `BOQINV-YYYY-NNNN`
- Accessible via the sidebar "BOQ Invoices" item → `/boq-invoices`

**List Page (`BOQInvoiceList.jsx`):**
- Lists all auto-generated BOQ invoices
- Columns: Invoice No., BOQ No., Client, Date, Amount, Status (always "Approved" chip)
- Search by invoice number, BOQ number, or client name
- Date range filter
- Statistics card showing total count and total amount
- Actions: View (eye icon), Print Client Invoice (printer icon)
- No Create, Edit, or Delete actions — invoices are auto-generated and immutable
- Empty state explains that BOQ invoices are automatically created when a BOQ is approved

**View Page (`ViewBOQInvoice.jsx`):**

Two-tab layout:

| Tab | Name | Description |
|-----|------|-------------|
| 0 | Invoice Details | Invoice and BOQ reference info, client details card, full itemized table (client-safe — no procurement data), financial summary (subtotal, discount, tax, total), and notes |
| 1 | Procurement Details | Amber/orange-themed table with confidential banner showing area, category, item name, and Vendor / Procurement Source per item (internal only) |

**Header Actions on View Page:**
- **Print Client Invoice** — blue outlined button → `PrintBOQInvoice.jsx` (no procurement data)
- **Print Internal Copy** — orange gradient button → `PrintBOQInvoiceInternal.jsx` (includes Vendor/Source column + confidential banner)
- **Back** — returns to `/boq-invoices`

**ViewBOQ Integration:**
- ViewBOQ checks for an existing BOQ invoice on load for Approved BOQs
- If BOQ invoice exists → **View BOQ Invoice** button (green, navigates to `/boq-invoices/view/:id`)
- If BOQ is Approved but no invoice yet → **Generate BOQ Invoice** button (orange, creates invoice on demand as a one-time recovery action)

### Procurement Details

The Procurement Details feature provides an internal-only view of vendor and supplier information associated with BOQ line items.

**Key Points:**
- The `procurementSource` field on each BOQ item stores vendor names, supplier links, or product references
- In `CreateBOQ.jsx`, the field is displayed as an amber-styled "Internal use only" row (Row 3 in each item card)
- **Never printed** on client-facing documents (`PrintBOQ.jsx`, `PrintBOQInvoice.jsx`)
- Visible in the **Procurement Details** tab of `ViewBOQInvoice.jsx`
- Visible in the internal print output (`PrintBOQInvoiceInternal.jsx`) which includes a "Vendor / Source" column and a confidential banner
- A counter shows how many items have procurement sources filled
- Warning alert: "Internal Use Only — not to be shared with clients"

### Client Management

Central management of all client/customer records.

**Features:**
- Create, edit, and delete clients
- Client statistics: total count, revenue per client
- Client selection integrated into quotation and BOQ creation forms (with inline quick-add)

**Client Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Client name |
| `email` | string | Email address |
| `phone` | string | Phone number |
| `address` | string | Mailing address |
| `companyName` | string | Company or trade name (optional, shown on documents if toggled) |
| `taxNumber` | string | TRN or tax registration number (optional, shown on documents if toggled) |
| `showCompanyInDocuments` | boolean | Whether to show company name on printed documents |
| `showTaxInDocuments` | boolean | Whether to show tax number on printed documents |

### Reports & Analytics

Comprehensive reporting across 8 categories, accessible via a tabbed interface.

| Report Tab | Description |
|------------|-------------|
| **Revenue** | Monthly and annual revenue breakdown with PDF export via jsPDF |
| **Clients** | Client-wise revenue analysis and client count |
| **Status** | Quotation and invoice status distribution |
| **Payments** | Payment method distribution (Cash, Bank Transfer, Credit Card, etc.) |
| **Tax Summary** | Tax collected breakdown by period |
| **Services** | Revenue analysis by scope of work / service category |
| **Outstanding** | Outstanding (due) amounts grouped by client |
| **BOQ** | BOQ status distribution and total value analysis |

### Settings

Centralized configuration hub with 6 tabs.

#### Organization Settings
- Company name, address, phone, email
- Logo URL for branding on printed documents
- Registration/license number
- TRN (Tax Registration Number)

#### Banking & Payment Settings
- Manage multiple bank accounts
- Fields: Bank name, account name, account number, IBAN, SWIFT code, branch
- QR code URL for payment
- Set default bank account (displayed on printed invoices)

#### Tax Settings
- **Tax (VAT)**: Enable/disable, set label and percentage
- **Service Tax**: Enable/disable, set label and percentage
- **Tax-inclusive pricing**: Toggle whether prices include tax

#### General Settings
- **Currency**: Symbol and code (default: AED)
- **Document Prefixes**: Customize prefixes for quotation, invoice, and BOQ numbers
- **Quotation Validity**: Number of days a quotation remains valid (default: 30)
- **Payment Terms**: Default payment terms text
- **Date Format**: Configure display format (default: DD/MM/YYYY)
- **Number Format**: Configure number display format

#### Scope of Work
- Library of reusable service categories (e.g., CAD Drawings, Design Concepts, 3D Renderings, BOQ Preparation)
- Each scope item has a name and description

#### Tasks
- Tasks linked to scope of work items
- Fields: Task name, description, estimated hours, linked scope of work
- Selectable during quotation creation for quick item population

---

## API Reference

All endpoints use the base URL configured via `REACT_APP_API_BASE_URL` (default: `http://localhost:5000`). Authenticated endpoints require a Bearer token in the `Authorization` header.

### Authentication API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Authenticate user, returns Bearer token |
| `POST` | `/auth/logout` | Revoke current session token |

**Login Request Body:**
```json
{
  "email": "invoice@thisinteriors.com",
  "password": "THIS@123###"
}
```

**Login Response:**
```json
{
  "token": "1|abc123...",
  "user": { "id": 1, "email": "invoice@thisinteriors.com" }
}
```

### Clients API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/clients` | List all clients |
| `GET` | `/clients/:id` | Get a single client |
| `POST` | `/clients` | Create a new client |
| `PUT` | `/clients/:id` | Update a client |
| `DELETE` | `/clients/:id` | Delete a client |

**Client Object:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+971501234567",
  "address": "Dubai, UAE",
  "companyName": "Doe Enterprises",
  "taxNumber": "100234567890003",
  "showCompanyInDocuments": true,
  "showTaxInDocuments": true
}
```

### Scope of Work API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/scopeOfWork` | List all scopes |
| `GET` | `/scopeOfWork/:id` | Get a single scope |
| `POST` | `/scopeOfWork` | Create a scope |
| `PUT` | `/scopeOfWork/:id` | Update a scope |
| `DELETE` | `/scopeOfWork/:id` | Delete a scope |

**Scope of Work Object:**
```json
{
  "id": 1,
  "name": "CAD Drawing",
  "description": "Detailed CAD drawings for the project"
}
```

### Tasks API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tasks` | List all tasks |
| `GET` | `/tasks/:id` | Get a single task |
| `GET` | `/tasks?scopeOfWorkId=:id` | Filter tasks by scope of work |
| `POST` | `/tasks` | Create a task |
| `PUT` | `/tasks/:id` | Update a task |
| `DELETE` | `/tasks/:id` | Delete a task |

**Task Object:**
```json
{
  "id": 1,
  "scopeOfWorkId": 1,
  "name": "Floor Plan Drawing",
  "description": "Create detailed floor plan",
  "estimatedHours": 8
}
```

### Quotations API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/quotations` | List all quotations |
| `GET` | `/quotations/:id` | Get quotation with nested items & payments |
| `GET` | `/quotations?status=:status` | Filter by status |
| `GET` | `/quotations?date_gte=:date&date_lte=:date` | Filter by date range |
| `POST` | `/quotations` | Create a quotation |
| `PUT` | `/quotations/:id` | Update a quotation |
| `DELETE` | `/quotations/:id` | Delete a quotation |

**Quotation Object:**
```json
{
  "id": 1,
  "quotationNumber": "PI-2026-0001",
  "clientId": 1,
  "clientName": "John Doe",
  "date": "2026-01-15",
  "validUntil": "2026-02-14",
  "status": "Partially Paid",
  "discountType": "percent",
  "discountValue": 10,
  "discountAmount": 500,
  "items": [
    {
      "description": "Interior Design Consultation",
      "scopeOfWork": "Design Concepts",
      "quantity": 1,
      "unitPrice": 5000,
      "amount": 5000
    }
  ],
  "subtotal": 5000,
  "taxPercent": 5,
  "taxAmount": 225,
  "totalAmount": 4725,
  "paidAmount": 2362.5,
  "balanceAmount": 2362.5,
  "payments": [
    {
      "amount": 2362.5,
      "paymentMethod": "Bank Transfer",
      "paymentDate": "2026-01-20",
      "notes": "First installment"
    }
  ],
  "notes": "Thank you for your business"
}
```

### Invoices API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/invoices` | List all invoices |
| `GET` | `/invoices/:id` | Get invoice with nested items |
| `GET` | `/invoices?clientId=:id` | Filter by client |
| `GET` | `/invoices?date_gte=:date&date_lte=:date` | Filter by date range |
| `POST` | `/invoices` | Create an invoice |
| `PUT` | `/invoices/:id` | Update an invoice |
| `DELETE` | `/invoices/:id` | Delete an invoice |

**Invoice Object:**
```json
{
  "id": 1,
  "invoiceNumber": "INV-2026-0001",
  "quotationId": 1,
  "quotationNumber": "PI-2026-0001",
  "clientId": 1,
  "clientName": "John Doe",
  "date": "2026-01-20",
  "items": [
    {
      "description": "Interior Design Consultation",
      "quantity": 1,
      "unitPrice": 5000,
      "amount": 5000
    }
  ],
  "subtotal": 5000,
  "taxPercent": 5,
  "taxAmount": 250,
  "totalAmount": 5250,
  "status": "Paid",
  "bankAccountId": 1
}
```

### BOQ API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/boqs` | List all BOQs |
| `GET` | `/boqs/:id` | Get BOQ with nested items |
| `GET` | `/boqs?clientId=:id` | Filter by client |
| `POST` | `/boqs` | Create a BOQ |
| `PUT` | `/boqs/:id` | Update a BOQ |
| `DELETE` | `/boqs/:id` | Delete a BOQ |

**BOQ Object:**
```json
{
  "id": 1,
  "boqNumber": "BOQ-2026-0001",
  "clientId": 1,
  "clientName": "John Doe",
  "date": "2026-01-10",
  "status": "Approved",
  "items": [
    {
      "area": "Living Room",
      "category": "Furniture",
      "itemName": "L-shaped sofa set",
      "imageUrl": "",
      "unitPrice": 12000,
      "quantity": 1,
      "discount": 10,
      "discountType": "percent",
      "procurementSource": "IKEA UAE – Article #123456",
      "amount": 10800
    }
  ],
  "subtotal": 10800,
  "totalDiscount": 1200,
  "taxPercent": 5,
  "taxAmount": 540,
  "totalAmount": 11340,
  "notes": ""
}
```

### BOQ Invoices API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/boqInvoices` | List all BOQ invoices |
| `GET` | `/boqInvoices/:id` | Get a single BOQ invoice |
| `GET` | `/boqInvoices?boqId=:id` | Get BOQ invoice for a specific BOQ (idempotency check) |
| `GET` | `/boqInvoices?clientId=:id` | Filter BOQ invoices by client |
| `POST` | `/boqInvoices` | Create a BOQ invoice (auto-called on BOQ approval) |
| `PUT` | `/boqInvoices/:id` | Update a BOQ invoice |
| `DELETE` | `/boqInvoices/:id` | Delete a BOQ invoice |

**BOQ Invoice Object:**
```json
{
  "id": 1,
  "boqInvoiceNumber": "BOQINV-2026-0001",
  "boqId": "1",
  "boqNumber": "BOQ-2026-0001",
  "clientId": 1,
  "date": "2026-03-13T00:00:00.000Z",
  "items": [
    {
      "area": "Living Room",
      "category": "Furniture",
      "itemName": "L-shaped sofa",
      "unitPrice": 12000,
      "quantity": 1,
      "discount": 10,
      "discountType": "percent",
      "procurementSource": "IKEA UAE – Article #123456"
    }
  ],
  "subtotal": 12000,
  "totalDiscount": 1200,
  "taxAmount": 540,
  "taxPercent": 5,
  "taxLabel": "VAT",
  "serviceTaxAmount": 0,
  "serviceTaxPercent": 0,
  "totalAmount": 11340,
  "currency": "AED",
  "notes": "",
  "status": "Approved",
  "createdAt": "2026-03-13T00:00:00.000Z"
}
```

> **Note:** BOQ invoices are auto-generated and immutable. The `POST`, `PUT`, and `DELETE` endpoints exist in the API layer but creation is only triggered programmatically on BOQ approval. Edit and delete are not exposed in the UI.

### BOQ Configuration API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/boqAreas` | List all BOQ areas |
| `POST` | `/boqAreas` | Create an area |
| `PUT` | `/boqAreas/:id` | Update an area |
| `DELETE` | `/boqAreas/:id` | Delete an area |
| `GET` | `/boqCategories` | List all BOQ categories |
| `POST` | `/boqCategories` | Create a category |
| `PUT` | `/boqCategories/:id` | Update a category |
| `DELETE` | `/boqCategories/:id` | Delete a category |

**Preconfigured Areas:** Entrance, Hallway, Living Room, Bedroom, Bathroom, Kitchen, Lobby, Terrace

**Preconfigured Categories:** Furniture, Sofa, Coffee Table, Bed, Lights, Carpets, Wallpaper, Curtains, Accessories, and more

### Bank Accounts API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/bankAccounts` | List all bank accounts |
| `GET` | `/bankAccounts/:id` | Get a single bank account |
| `POST` | `/bankAccounts` | Create a bank account |
| `PUT` | `/bankAccounts/:id` | Update a bank account |
| `DELETE` | `/bankAccounts/:id` | Delete a bank account |

**Bank Account Object:**
```json
{
  "id": 1,
  "bankName": "Standard Chartered",
  "accountName": "THIS INTERIORS LLC",
  "accountNumber": "1234567890",
  "iban": "AE12345678901234567890",
  "swiftCode": "SCBLAEADXXX",
  "branch": "Dubai Main Branch",
  "isDefault": true,
  "qrCodeUrl": ""
}
```

### Settings API

All settings endpoints are singletons (always `id=1`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/organizationSettings/1` | Get organization profile |
| `PUT` | `/organizationSettings/1` | Update organization profile |
| `GET` | `/taxSettings/1` | Get tax configuration |
| `PUT` | `/taxSettings/1` | Update tax configuration |
| `GET` | `/generalSettings/1` | Get general settings |
| `PUT` | `/generalSettings/1` | Update general settings |

**Organization Settings Object:**
```json
{
  "id": 1,
  "name": "THIS INTERIORS",
  "address": "Dubai, UAE",
  "phone": "+971-XX-XXXXXXX",
  "email": "info@thisinteriors.com",
  "website": "www.thisinteriors.com",
  "logoUrl": "",
  "registrationNumber": "",
  "trn": ""
}
```

**Tax Settings Object:**
```json
{
  "id": 1,
  "taxEnabled": true,
  "taxLabel": "VAT",
  "taxPercent": 5,
  "serviceTaxEnabled": false,
  "serviceTaxLabel": "Service Tax",
  "serviceTaxPercent": 0,
  "taxInclusive": false
}
```

**General Settings Object:**
```json
{
  "id": 1,
  "currency": "AED",
  "currencySymbol": "AED",
  "quotationPrefix": "PI",
  "invoicePrefix": "INV",
  "boqPrefix": "BOQ",
  "boqInvoicePrefix": "BOQINV",
  "quotationValidity": 30,
  "paymentTerms": "Payment is due within 30 days",
  "dateFormat": "DD/MM/YYYY",
  "numberFormat": "#,##0.00"
}
```

---

## Database Schema

The application manages the following entities:

### Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `clients` | Customer records | name, email, phone, address, companyName, taxNumber, showCompanyInDocuments, showTaxInDocuments |
| `scopeOfWork` | Service categories | name, description |
| `tasks` | Tasks within scopes | scopeOfWorkId, name, description, estimatedHours |
| `quotations` | Quotation documents | quotationNumber, clientId, date, status, items, payments, totals, discountType, discountValue, discountAmount |
| `quotation_items` | Quotation line items | quotationId, description, quantity, unitPrice, amount |
| `quotation_payments` | Payment records | quotationId, amount, paymentMethod, paymentDate |
| `invoices` | Invoice documents | invoiceNumber, quotationId, clientId, date, status, items, totals |
| `invoice_items` | Invoice line items | invoiceId, description, quantity, unitPrice, amount |
| `boqs` | Bill of Quantities | boqNumber, clientId, date, status, items, totals |
| `boq_items` | BOQ line items | boqId, area, category, description, unit, quantity, unitPrice, discount, discountType, procurementSource |
| `boqInvoices` | BOQ invoice documents | boqInvoiceNumber, boqId, clientId, date, status, items, totals |
| `bankAccounts` | Bank account details | bankName, accountNumber, iban, swiftCode, isDefault |

### Configuration Entities (Singletons)

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `organizationSettings` | Company profile | name, address, phone, email, logoUrl, trn |
| `taxSettings` | Tax configuration | taxEnabled, taxPercent, serviceTaxEnabled, serviceTaxPercent |
| `generalSettings` | System preferences | currency, prefixes (including boqInvoicePrefix), quotationValidity, dateFormat |

### BOQ Configuration

| Entity | Description |
|--------|-------------|
| `boqAreas` | Available areas/rooms (e.g., Living Room, Bedroom, Kitchen) |
| `boqCategories` | Product categories (e.g., Furniture, Lights, Curtains, Wallpaper) |

---

## Routing

### Public Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | `Login` | User authentication page |

### Protected Routes (Require Authentication)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Dashboard` | Main dashboard with metrics and activity |
| `/quotations` | `QuotationList` | List all quotations with filters |
| `/quotations/create` | `CreateQuotation` | Create a new quotation |
| `/quotations/edit/:id` | `CreateQuotation` | Edit an existing quotation |
| `/quotations/view/:id` | `ViewQuotation` | View quotation details |
| `/quotations/payment/:id` | `PaymentUpdate` | Record payment against quotation |
| `/invoices` | `InvoiceList` | List all invoices with filters |
| `/invoices/view/:id` | `ViewInvoice` | View invoice details |
| `/boq` | `BOQList` | List all BOQs with filters |
| `/boq/create` | `CreateBOQ` | Create a new BOQ |
| `/boq/edit/:id` | `CreateBOQ` | Edit an existing BOQ |
| `/boq/view/:id` | `ViewBOQ` | View BOQ details |
| `/boq-settings` | `BOQSettings` | Manage BOQ areas and categories |
| `/boq-invoices` | `BOQInvoiceList` | List all BOQ invoices (auto-generated) |
| `/boq-invoices/view/:id` | `ViewBOQInvoice` | View BOQ invoice with Invoice Details + Procurement Details tabs |
| `/clients` | `ClientList` | Client management |
| `/reports` | `Reports` | Reports and analytics (8 tabs) |
| `/settings` | `Settings` | Settings hub (6 tabs) |

---

## Utility Functions

### Settings Cache (`src/utils/helpers.js`)

Settings are cached in memory for 5 minutes to reduce API calls:

- `getOrgProfile()` - Fetch and cache organization settings
- `getTaxSettings()` - Fetch and cache tax configuration
- `getGeneralSettings()` - Fetch and cache general settings
- `clearSettingsCache()` - Manually clear all cached settings (called on settings update)

### Tax Calculations

- `applyTaxCalculations(subtotal, taxSettings)` - Compute tax amount, service tax amount, and total from subtotal
- `applyOrgTaxes(subtotal, orgProfile)` - Apply tax based on organization profile settings

### Formatting

- `formatDate(date, customFormat)` - Format dates using date-fns (respects configured date format)
- `formatDateTime(date)` - Format date with time component
- `formatCurrency(amount, currency)` - Format numbers as currency strings

### Document Number Generation

- `generateQuotationNumber(lastNumber)` - Generate next quotation number: `{prefix}-YYYY-NNNN`
- `generateInvoiceNumber(lastNumber)` - Generate next invoice number: `INV-YYYY-NNNN`
- `generateBoqNumber(lastNumber)` - Generate next BOQ number: `BOQ-YYYY-NNNN`
- `generateBoqInvoiceNumber(lastNumber)` - Generate next BOQ invoice number: `{boqInvoicePrefix}-YYYY-NNNN` (default prefix: `BOQINV`)

### Date & Calculation Helpers

- `calculateTotal(items)` - Sum line item amounts
- `calculateBalance(totalAmount, paidAmount)` - Compute outstanding balance
- `getDateRange(filter)` - Get start/end dates for preset filters (Today, Last Week, Last Month)
- `filterByDateRange(items, startDate, endDate, dateField)` - Filter arrays by date range
- `getQuotationValidUntil(quotationDate)` - Calculate expiry date based on configured validity days

### Constants (`src/utils/constants.js`)

- **Quotation Statuses:** `Draft`, `Performa`, `Partially Paid`, `Fully Paid`
- **Invoice Statuses:** `Pending`, `Paid`, `Overdue`, `Cancelled`
- **BOQ Statuses:** `Draft`, `Sent`, `Approved`, `Rejected`
- **BOQ Invoice Status:** `Approved`
- **Payment Methods:** `Cash`, `Bank Transfer`, `Credit Card`, `Debit Card`, `Cheque`, `Online Payment`
- **Default Currency:** `AED`
- **Default Date Format:** `DD/MM/YYYY`

---

## PDF & Print Support

All print templates use the **THIS Interiors brand palette** and are optimized for A4 printing.

### Brand Theme

| Token | Value | Usage |
|-------|-------|-------|
| Charcoal | `#1a1a1a` | Table headers (client prints), document title, header rule |
| Gold | `#c17f24` | Section labels, borders, total row, accent elements |
| Gold Dark | `#a0652a` | Gradient end, vendor text in internal print |
| Gold Gradient | `linear-gradient(135deg, #c17f24 0%, #a0652a 100%)` | Internal print table header, PAID stamp |
| Cream | `#fdf6ec` | Alternating rows, info box backgrounds, notes background |
| Cream Border | `#e8d5b0` | Info box borders, table row dividers |

### A4 Print Optimizations (All Templates)

| Setting | Value |
|---------|-------|
| `@page` declaration | `@page { size: A4 portrait; margin: 12mm 14mm; }` |
| Container max-width | `100%` — full A4 printable width |
| Base font size | `10px` |
| Table cell padding | `6px 8px` |
| Table header repeat | `thead { display: table-header-group; }` — repeats on every page |
| Page break control | `page-break-inside: avoid` on summary, notes, footer, info sections |

### Quotation Print (`PrintQuotation.jsx`)
- Organization header with logo and contact details
- Client information block (includes company name and tax number if toggled on)
- Quotation number, date, and validity
- Itemized table with scope, description, quantity, unit price, and amount
- Discount line (if applicable) showing discount type and amount
- Tax breakdown (VAT, Service Tax if enabled)
- Payment terms and notes
- Bank account details

### Invoice Print (`PrintInvoice.jsx`)
- Organization header with logo
- Client and quotation reference (includes company name and tax number if toggled on)
- Invoice number and date
- Itemized table with line items
- Tax breakdown
- Bank account details for payment

### BOQ Print (`PrintBOQ.jsx`)
- Organization header
- Client information (includes company name and tax number if toggled on)
- BOQ number, date, and status
- Itemized table with area, category, description, item images (60x60 thumbnails), unit, quantity, unit price, discount (with type), and amount
- Tax breakdown
- Notes section
- **No procurement source data** — client-facing only

### BOQ Invoice Print — Client (`PrintBOQInvoice.jsx`)
- Organization header with THIS Interiors branding
- Client and BOQ reference information
- BOQ invoice number and date
- Itemized table with area, category, item name, unit price, quantity, discount, and amount
- Financial summary (subtotal, total discount, tax, total)
- Notes section
- **No procurement source data** — client-facing only

### BOQ Invoice Print — Internal (`PrintBOQInvoiceInternal.jsx`)
- Organization header with THIS Interiors branding
- **Gold-gradient table headers** (instead of charcoal) to visually distinguish from client prints
- **Charcoal-with-gold-text confidential banner**: "CONFIDENTIAL — INTERNAL USE ONLY"
- Includes **Vendor / Source** column showing `procurementSource` for each item
- Full financial summary
- Notes section

### Print Implementation
- Print templates generate HTML strings with embedded CSS
- Documents open in a new browser tab via `window.open()`
- jsPDF and jspdf-autotable are available for programmatic PDF generation (used in Reports for PDF export)
- A global `.no-print` CSS class hides UI elements during browser print

---

## Production Deployment

### Building for Production

```bash
# Set production API URL
REACT_APP_API_BASE_URL=https://your-api-domain.com/api npm run build
```

This creates an optimized production build in the `build/` folder, ready to be deployed to any static hosting service (Nginx, Apache, Vercel, Netlify, S3, etc.).

### Deployment Checklist

- [ ] Set `REACT_APP_API_BASE_URL` to the production API URL
- [ ] Configure CORS on the backend to allow the frontend domain
- [ ] Set up HTTPS for both frontend and backend
- [ ] Configure proper authentication with Laravel Sanctum
- [ ] Set up database migrations and seeders
- [ ] Configure file storage for logos and BOQ item images
- [ ] Set up email service for notifications (optional)

---

## Backend Migration (Laravel)

The application is designed for migration to a Laravel 10+ backend with MySQL 8.0+. A complete API specification is available in `req-doc/api-guideline.md`.

### Key Requirements

- **Authentication:** Laravel Sanctum for API token management
- **Database:** MySQL 8.0+ with Laravel migrations for all entities
- **API Resources:** Eloquent API Resources for consistent camelCase JSON responses
- **Validation:** Form Request classes for input validation
- **File Storage:** Laravel Storage for logo and image uploads
- **CORS:** Configured via Laravel CORS middleware

### Database Seeders Needed

| Seeder | Purpose |
|--------|---------|
| `UserSeeder` | Default user account (`invoice@thisinteriors.com`) |
| `OrganizationSeeder` | Default organization settings |
| `TaxSeeder` | Default tax configuration (5% VAT) |
| `GeneralSettingsSeeder` | Default currency (AED), prefixes (including `boqInvoicePrefix: "BOQINV"`), formats |
| `BOQAreaSeeder` | Predefined areas (Living Room, Bedroom, etc.) |
| `BOQCategorySeeder` | Predefined categories (Furniture, Lights, etc.) |
| `BOQInvoiceSeeder` | Seed BOQ invoice records (if pre-populating data) |

### Migration Notes

The `boqInvoices` resource follows the same API contract as all other resources. Migrating to Laravel requires only updating `BASE_URL` in `baseURL.js` — all API calls are already structured for real REST endpoints.

---

## License

This project is proprietary software developed for THIS Interiors.
