# THIS Interiors — Laravel Backend API Specification

**Document version:** 1.0
**Frontend stack:** React 18, Axios, JSON (camelCase)
**Backend stack:** Laravel 10+, MySQL 8.0+, Laravel Sanctum
**Prepared for:** Backend Developer

---

## 1. Critical Rules — Read First

### 1.1 All API responses MUST use camelCase field names

Your database uses snake_case (e.g. `company_name`, `client_id`). Your API responses MUST return camelCase (e.g. `companyName`, `clientId`). Map every field inside a Laravel API Resource class. The frontend will not work if responses use snake_case.

```php
// Example API Resource — maps DB snake_case to camelCase for the frontend
public function toArray($request): array
{
    return [
        'id'                     => $this->id,
        'companyName'            => $this->company_name,
        'showCompanyInDocuments' => (bool) $this->show_company_in_documents,
        'clientId'               => $this->client_id,
        'createdAt'              => $this->created_at?->toISOString(),
        'updatedAt'              => $this->updated_at?->toISOString(),
    ];
}
```

### 1.2 All list endpoints return plain JSON arrays

Return `[{...}, {...}]` — **NOT** `{"data": [...], "total": 10, "page": 1}`. No pagination wrapper. No `data` key. The frontend maps directly over the array.

### 1.3 All singleton settings endpoints return the object directly

Return `{...}` — **NOT** `{"data": {...}}`.

### 1.4 All timestamps in ISO 8601 format

```
"2026-03-13T10:30:00.000Z"
```

Use `->toISOString()` on Carbon instances or set `protected $casts = ['created_at' => 'datetime']` on models.

### 1.5 Boolean fields must be actual booleans, not 0/1

MySQL stores booleans as `tinyint(1)`. Cast them to `bool` in your API Resource so the frontend receives `true`/`false`, not `0`/`1`.

### 1.6 CORS configuration

Allow the following origins:

- `http://localhost:3000` (React dev server)
- Your production frontend domain

Set allowed methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
Set allowed headers: `Content-Type, Authorization, Accept`

### 1.7 All endpoints except `/auth/login` require Bearer token

```
Authorization: Bearer {token}
```

Return `401 Unauthorized` for missing/invalid tokens. The frontend's Axios interceptor catches any 401 and redirects to the login page automatically.

### 1.8 Error response format

All error responses must follow this shape:

```json
{ "message": "Human-readable error description" }
```

For validation errors, return **422**:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "fieldName": ["Error message for this field"]
  }
}
```

For not found, return **404**:

```json
{ "message": "Resource not found" }
```

---

## 2. Authentication

### POST `/auth/login`

No auth token required for this endpoint.

**Request body:**

```json
{
  "email": "invoice@thisinteriors.com",
  "password": "THIS@123###"
}
```

**Response 200:**

```json
{
  "token": "1|abc123xyz...",
  "user": {
    "id": 1,
    "name": "THIS Interiors Admin",
    "email": "invoice@thisinteriors.com"
  }
}
```

**Response 401:**

```json
{ "message": "Invalid credentials" }
```

**Laravel implementation notes:**

- Use `Laravel\Sanctum\HasApiTokens` on the User model
- Call `$user->createToken('app-token')->plainTextToken` to generate token
- Return the plain text token — the frontend stores it in `localStorage` as `auth_token`

### POST `/auth/logout`

**Headers:** `Authorization: Bearer {token}`

**Response 200:**

```json
{ "message": "Logged out successfully" }
```

**Laravel implementation notes:**

- Call `$request->user()->currentAccessToken()->delete()`

---

## 3. Clients

### Database table: `clients`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint unsigned, PK, AI | No | — | |
| name | varchar(255) | No | — | Required |
| email | varchar(255) | Yes | null | |
| contact | varchar(100) | Yes | null | Phone number |
| address | text | Yes | null | |
| pin | varchar(20) | Yes | null | Postal/ZIP code |
| state | varchar(100) | Yes | null | |
| country | varchar(100) | Yes | null | |
| company_name | varchar(255) | Yes | null | Trade/company name |
| tax_number | varchar(100) | Yes | null | TRN / VAT registration number |
| show_company_in_documents | tinyint(1) | No | 0 | Cast to bool |
| show_tax_in_documents | tinyint(1) | No | 0 | Cast to bool |
| created_at | timestamp | No | CURRENT_TIMESTAMP | |
| updated_at | timestamp | No | CURRENT_TIMESTAMP | |

### API Resource shape (camelCase):

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "contact": "+971501234567",
  "address": "123 Business Bay, Dubai",
  "pin": "12345",
  "state": "Dubai",
  "country": "UAE",
  "companyName": "Doe Enterprises LLC",
  "taxNumber": "100234567890123",
  "showCompanyInDocuments": true,
  "showTaxInDocuments": false,
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

### Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/clients` | Return all clients as plain array |
| GET | `/clients/{id}` | Return single client |
| POST | `/clients` | Create client |
| PUT | `/clients/{id}` | Full update |
| DELETE | `/clients/{id}` | Delete, return 204 No Content |

**POST/PUT accepted fields:** `name` (required), `email`, `contact`, `address`, `pin`, `state`, `country`, `companyName`, `taxNumber`, `showCompanyInDocuments`, `showTaxInDocuments`

---

## 4. Scope of Work

### Database table: `scope_of_work`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint unsigned, PK, AI | No | — | |
| name | varchar(255) | No | — | Required |
| description | text | Yes | null | |
| is_active | tinyint(1) | No | 1 | Cast to bool |
| created_at | timestamp | No | CURRENT_TIMESTAMP | |
| updated_at | timestamp | No | CURRENT_TIMESTAMP | |

### API Resource shape:

```json
{
  "id": 1,
  "name": "CAD Drawings",
  "description": "Detailed CAD drawings for the project",
  "isActive": true,
  "createdAt": "2026-01-10T10:00:00.000Z",
  "updatedAt": "2026-01-10T10:00:00.000Z"
}
```

### Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/scope-of-work` | Return all as plain array |
| GET | `/scope-of-work/{id}` | Return single |
| POST | `/scope-of-work` | Create |
| PUT | `/scope-of-work/{id}` | Full update |
| DELETE | `/scope-of-work/{id}` | Delete, return 204 No Content |

**POST/PUT accepted fields:** `name` (required), `description`, `isActive`

---

## 5. Tasks

### Database table: `tasks`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint unsigned, PK, AI | No | — | |
| scope_of_work_id | bigint unsigned, FK | No | — | References scope_of_work.id |
| description | text | No | — | Required. This is the task label shown in the UI |
| estimated_hours | decimal(6,2) | Yes | null | |
| is_active | tinyint(1) | No | 1 | Cast to bool |
| created_at | timestamp | No | CURRENT_TIMESTAMP | |
| updated_at | timestamp | No | CURRENT_TIMESTAMP | |

### API Resource shape:

```json
{
  "id": 1,
  "scopeOfWorkId": 1,
  "description": "Space Planning, Detailed Layouts, Concept Design",
  "estimatedHours": 8.0,
  "isActive": true,
  "createdAt": "2026-01-10T10:00:00.000Z",
  "updatedAt": "2026-01-10T10:00:00.000Z"
}
```

### Endpoints

| Method | URL | Query Params | Description |
|---|---|---|---|
| GET | `/tasks` | `?scopeOfWorkId={id}` (optional) | Return all tasks; if param present, filter by scope |
| GET | `/tasks/{id}` | — | Return single task |
| POST | `/tasks` | — | Create |
| PUT | `/tasks/{id}` | — | Full update |
| DELETE | `/tasks/{id}` | — | Delete, return 204 No Content |

**Query param spelling:** The frontend sends `?scopeOfWorkId=` (camelCase). Accept exactly this casing.

**POST/PUT accepted fields:** `scopeOfWorkId` (required), `description` (required), `estimatedHours`, `isActive`

---

## 6. Quotations

### Database table: `quotations`

Line items and payment history are stored as JSON columns. This avoids complex joins and exactly matches the frontend data model.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint unsigned, PK, AI | No | — | |
| quotation_number | varchar(50), unique | No | — | Format: PI-2026-0001 |
| client_id | bigint unsigned, FK | No | — | References clients.id |
| date | datetime | No | — | |
| items | json | No | '[]' | Array of item objects (see below) |
| subtotal | decimal(14,2) | No | 0.00 | |
| discount_type | varchar(20) | Yes | null | "percent" or "flat" |
| discount_value | decimal(10,2) | Yes | null | Input value (% number or flat amount) |
| discount_amount | decimal(14,2) | No | 0.00 | Computed discount in currency |
| tax_amount | decimal(14,2) | No | 0.00 | |
| service_tax_amount | decimal(14,2) | No | 0.00 | |
| total_amount | decimal(14,2) | No | 0.00 | |
| status | varchar(50) | No | 'Performa' | See status values below |
| paid_amount | decimal(14,2) | No | 0.00 | |
| payments | json | No | '[]' | Array of payment objects (see below) |
| currency | varchar(10) | No | 'AED' | |
| notes | text | Yes | null | |
| tax_percent | decimal(5,2) | No | 0.00 | |
| service_tax_percent | decimal(5,2) | No | 0.00 | |
| tax_label | varchar(50) | Yes | null | e.g. "VAT" |
| bank_account_id | bigint unsigned, FK | Yes | null | References bank_accounts.id |
| created_at | timestamp | No | CURRENT_TIMESTAMP | |
| updated_at | timestamp | No | CURRENT_TIMESTAMP | |

### Status values (store exactly as shown, these are case-sensitive strings):

- **"Draft"** — saved, not sent; excluded from all financial metrics and dashboard totals
- **"Performa"** — active quotation sent to client
- **"Partially Paid"** — one or more payments received, balance remaining
- **"Fully Paid"** — all payments received

### Item object shape (each element in the `items` JSON array):

```json
{
  "scopeOfWork": "CAD Drawings",
  "task": "Space Planning, Detailed Layouts, Concept Design",
  "amount": 5000.00
}
```

### Payment object shape (each element in the `payments` JSON array):

```json
{
  "amount": 2500.00,
  "paymentMethod": "Bank Transfer",
  "paymentDate": "2026-01-20T10:00:00.000Z",
  "date": "2026-01-20T10:00:00.000Z",
  "notes": "First installment"
}
```

### API Resource shape:

```json
{
  "id": 1,
  "quotationNumber": "PI-2026-0001",
  "clientId": 1,
  "date": "2026-01-15T00:00:00.000Z",
  "items": [
    { "scopeOfWork": "CAD Drawings", "task": "Space Planning", "amount": 5000.00 }
  ],
  "subtotal": 5000.00,
  "discountType": "percent",
  "discountValue": 10,
  "discountAmount": 500.00,
  "taxAmount": 225.00,
  "serviceTaxAmount": 0.00,
  "totalAmount": 4725.00,
  "status": "Performa",
  "paidAmount": 0.00,
  "payments": [],
  "currency": "AED",
  "notes": "",
  "taxPercent": 5.00,
  "serviceTaxPercent": 0.00,
  "taxLabel": "VAT",
  "bankAccountId": 1,
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-15T10:00:00.000Z"
}
```

### Endpoints

| Method | URL | Query Params | Description |
|---|---|---|---|
| GET | `/quotations` | `?status=Performa`, `?start_date=YYYY-MM-DD`, `?end_date=YYYY-MM-DD` | Return all; apply filters if params present |
| GET | `/quotations/{id}` | — | Return single quotation |
| POST | `/quotations` | — | Create |
| PUT | `/quotations/{id}` | — | Full update |
| DELETE | `/quotations/{id}` | — | Delete, return 204 No Content |

**Date filtering:** Filter on the `date` column. `start_date` is inclusive (>=), `end_date` is inclusive (<=). Both can be combined. **Status filtering:** Exact string match. URL-encoded as needed (e.g. `%22Partially%20Paid%22`).

---

## 7. Invoices

### Database table: `invoices`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint unsigned, PK, AI | No | — | |
| invoice_number | varchar(50), unique | No | — | Format: INV-2026-0001 |
| quotation_id | bigint unsigned, FK | Yes | null | References quotations.id |
| client_id | bigint unsigned, FK | No | — | References clients.id |
| date | datetime | No | — | |
| items | json | No | '[]' | Same item shape as quotations |
| subtotal | decimal(14,2) | No | 0.00 | |
| tax_amount | decimal(14,2) | No | 0.00 | |
| service_tax_amount | decimal(14,2) | No | 0.00 | |
| total_amount | decimal(14,2) | No | 0.00 | |
| paid_amount | decimal(14,2) | No | 0.00 | |
| payment_date | datetime | Yes | null | |
| payment_method | varchar(100) | Yes | null | |
| currency | varchar(10) | No | 'AED' | |
| tax_percent | decimal(5,2) | No | 0.00 | |
| service_tax_percent | decimal(5,2) | No | 0.00 | |
| tax_label | varchar(50) | Yes | null | |
| notes | text | Yes | null | |
| bank_account_id | bigint unsigned, FK | Yes | null | References bank_accounts.id |
| created_at | timestamp | No | CURRENT_TIMESTAMP | |
| updated_at | timestamp | No | CURRENT_TIMESTAMP | |

### API Resource shape:

```json
{
  "id": 1,
  "invoiceNumber": "INV-2026-0001",
  "quotationId": 1,
  "clientId": 1,
  "date": "2026-01-20T00:00:00.000Z",
  "items": [
    { "scopeOfWork": "CAD Drawings", "task": "Space Planning", "amount": 2500.00 }
  ],
  "subtotal": 2380.95,
  "taxAmount": 119.05,
  "serviceTaxAmount": 0.00,
  "totalAmount": 2500.00,
  "paidAmount": 2500.00,
  "paymentDate": "2026-01-20T10:00:00.000Z",
  "paymentMethod": "Bank Transfer",
  "currency": "AED",
  "taxPercent": 5.00,
  "serviceTaxPercent": 0.00,
  "taxLabel": "VAT",
  "notes": "First installment",
  "bankAccountId": 1,
  "createdAt": "2026-01-20T10:00:00.000Z",
  "updatedAt": "2026-01-20T10:00:00.000Z"
}
```

### Endpoints

| Method | URL | Query Params | Description |
|---|---|---|---|
| GET | `/invoices` | `?clientId={id}`, `?start_date=YYYY-MM-DD`, `?end_date=YYYY-MM-DD` | Return all; filter if params present |
| GET | `/invoices/{id}` | — | Return single invoice |
| POST | `/invoices` | — | Create |
| PUT | `/invoices/{id}` | — | Full update |
| DELETE | `/invoices/{id}` | — | Delete, return 204 No Content |

**Query param:** `?clientId=` is camelCase — accept exactly this casing.

---

## 8. Bank Accounts

### Database table: `bank_accounts`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint unsigned, PK, AI | No | — | |
| bank_name | varchar(255) | No | — | Required |
| account_number | varchar(100) | No | — | Required |
| account_holder_name | varchar(255) | Yes | null | |
| branch | varchar(255) | Yes | null | |
| ifsc_swift | varchar(100) | Yes | null | |
| qr_code_url | varchar(1000) | Yes | null | URL to payment QR code image |
| is_default | tinyint(1) | No | 0 | Cast to bool |
| created_at | timestamp | No | CURRENT_TIMESTAMP | |
| updated_at | timestamp | No | CURRENT_TIMESTAMP | |

### API Resource shape:

```json
{
  "id": 1,
  "bankName": "Standard Chartered",
  "accountNumber": "1234567890",
  "accountHolderName": "THIS INTERIORS LLC",
  "branch": "Dubai Main Branch",
  "ifscSwift": "SCBLAEADXXX",
  "qrCodeUrl": "",
  "isDefault": true,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/bank-accounts` | Return all as plain array |
| GET | `/bank-accounts/{id}` | Return single |
| POST | `/bank-accounts` | Create |
| PUT | `/bank-accounts/{id}` | Full update |
| DELETE | `/bank-accounts/{id}` | Delete, return 204 No Content |

**POST/PUT accepted fields:** `bankName` (required), `accountNumber` (required), `accountHolderName`, `branch`, `ifscSwift`, `qrCodeUrl`, `isDefault`

---

## 9. BOQ Areas

### Database table: `boq_areas`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint unsigned, PK, AI | No | — | |
| name | varchar(255) | No | — | Required |
| is_active | tinyint(1) | No | 1 | Cast to bool |
| created_at | timestamp | No | CURRENT_TIMESTAMP | |
| updated_at | timestamp | No | CURRENT_TIMESTAMP | |

### API Resource shape:

```json
{
  "id": 1,
  "name": "Living Room",
  "isActive": true,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/boq-areas` | Return all as plain array |
| GET | `/boq-areas/{id}` | Return single |
| POST | `/boq-areas` | Create |
| PUT | `/boq-areas/{id}` | Full update |
| DELETE | `/boq-areas/{id}` | Delete, return 204 No Content |

**POST/PUT accepted fields:** `name` (required), `isActive`

---

## 10. BOQ Categories

### Database table: `boq_categories`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint unsigned, PK, AI | No | — | |
| name | varchar(255) | No | — | Required |
| is_active | tinyint(1) | No | 1 | Cast to bool |
| created_at | timestamp | No | CURRENT_TIMESTAMP | |
| updated_at | timestamp | No | CURRENT_TIMESTAMP | |

### API Resource shape:

```json
{
  "id": 1,
  "name": "Furniture",
  "isActive": true,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### Endpoints — identical pattern to BOQ Areas, at `/boq-categories`

| Method | URL | Description |
|---|---|---|
| GET | `/boq-categories` | Return all as plain array |
| GET | `/boq-categories/{id}` | Return single |
| POST | `/boq-categories` | Create |
| PUT | `/boq-categories/{id}` | Full update |
| DELETE | `/boq-categories/{id}` | Delete, return 204 No Content |

**POST/PUT accepted fields:** `name` (required), `isActive`

---

## 11. BOQs (Bill of Quantities)

### Database table: `boqs`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint unsigned, PK, AI | No | — | |
| boq_number | varchar(50), unique | No | — | Format: BOQ-2026-0001 |
| client_id | bigint unsigned, FK | No | — | References clients.id |
| date | datetime | No | — | |
| status | varchar(50) | No | 'Draft' | See status values below |
| items | json | No | '[]' | Array of BOQ item objects (see below) |
| subtotal | decimal(14,2) | No | 0.00 | Sum of all line item amounts before tax |
| total_discount | decimal(14,2) | No | 0.00 | Sum of all per-item discount amounts |
| tax_amount | decimal(14,2) | No | 0.00 | |
| tax_percent | decimal(5,2) | No | 0.00 | |
| tax_label | varchar(50) | Yes | null | |
| service_tax_amount | decimal(14,2) | No | 0.00 | |
| service_tax_percent | decimal(5,2) | No | 0.00 | |
| total_amount | decimal(14,2) | No | 0.00 | |
| currency | varchar(10) | No | 'AED' | |
| notes | text | Yes | null | |
| created_at | timestamp | No | CURRENT_TIMESTAMP | |
| updated_at | timestamp | No | CURRENT_TIMESTAMP | |

### BOQ status values:

- **"Draft"** — work in progress
- **"Sent"** — submitted to client
- **"Approved"** — client approved; the React frontend auto-generates a BOQ Invoice on this transition
- **"Rejected"** — client rejected

### BOQ item object shape (each element in the `items` JSON array):

```json
{
  "area": "Living Room",
  "imageUrl": "",
  "category": "Furniture",
  "itemName": "L-shaped sofa set",
  "unitPrice": 12000.00,
  "quantity": 1,
  "discount": 10,
  "discountType": "percent",
  "procurementSource": "IKEA UAE – Article #123456"
}
```

`discountType` is `"percent"` or `"flat"`. `procurementSource` is an internal-only field. It is stored in the database but must **NEVER** appear in client-facing print documents. The internal print template shows it; the client print template hides it.

### API Resource shape:

```json
{
  "id": 1,
  "boqNumber": "BOQ-2026-0001",
  "clientId": 1,
  "date": "2026-01-10T00:00:00.000Z",
  "status": "Approved",
  "items": [
    {
      "area": "Living Room",
      "imageUrl": "",
      "category": "Furniture",
      "itemName": "L-shaped sofa set",
      "unitPrice": 12000.00,
      "quantity": 1,
      "discount": 10,
      "discountType": "percent",
      "procurementSource": "IKEA UAE"
    }
  ],
  "subtotal": 12000.00,
  "totalDiscount": 1200.00,
  "taxAmount": 540.00,
  "taxPercent": 5.00,
  "taxLabel": "VAT",
  "serviceTaxAmount": 0.00,
  "serviceTaxPercent": 0.00,
  "totalAmount": 11340.00,
  "currency": "AED",
  "notes": "",
  "createdAt": "2026-01-10T10:00:00.000Z",
  "updatedAt": "2026-01-10T10:00:00.000Z"
}
```

### Endpoints

| Method | URL | Query Params | Description |
|---|---|---|---|
| GET | `/boqs` | `?clientId={id}` (optional) | Return all; filter by client if param present |
| GET | `/boqs/{id}` | — | Return single BOQ |
| POST | `/boqs` | — | Create |
| PUT | `/boqs/{id}` | — | Full update |
| DELETE | `/boqs/{id}` | — | Delete, return 204 No Content |

**Query param:** `?clientId=` is camelCase — accept exactly this casing.

---

## 12. BOQ Invoices

BOQ Invoices are auto-generated by the React frontend when a BOQ status is set to "Approved". The frontend checks for an existing BOQ invoice first, then POSTs to create one if none exists. They are immutable by design — the normal UI has no edit or delete for BOQ invoices. The API supports PUT/DELETE only for admin use.

### Database table: `boq_invoices`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint unsigned, PK, AI | No | — | |
| boq_invoice_number | varchar(50), unique | No | — | Format: BOQINV-2026-0001 |
| boq_id | varchar(50) | No | — | Stored as string — see note below |
| boq_number | varchar(50) | No | — | Denormalized for quick display |
| client_id | bigint unsigned, FK | No | — | References clients.id |
| date | datetime | No | — | |
| items | json | No | '[]' | Same shape as BOQ items, includes procurementSource |
| subtotal | decimal(14,2) | No | 0.00 | |
| total_discount | decimal(14,2) | No | 0.00 | |
| tax_amount | decimal(14,2) | No | 0.00 | |
| tax_percent | decimal(5,2) | No | 0.00 | |
| tax_label | varchar(50) | Yes | null | |
| service_tax_amount | decimal(14,2) | No | 0.00 | |
| service_tax_percent | decimal(5,2) | No | 0.00 | |
| total_amount | decimal(14,2) | No | 0.00 | |
| currency | varchar(10) | No | 'AED' | |
| notes | text | Yes | null | |
| status | varchar(50) | No | 'Approved' | Always "Approved" — immutable |
| created_at | timestamp | No | CURRENT_TIMESTAMP | |
| updated_at | timestamp | No | CURRENT_TIMESTAMP | |

**Important — `boq_id` as string:** The frontend stores and queries `boqId` as a string (uses `String(id)` for type safety in its idempotency check). Store `boq_id` as `varchar(50)`, **NOT** as a foreign key integer. Do not add a foreign key constraint on this column.

### API Resource shape:

```json
{
  "id": 1,
  "boqInvoiceNumber": "BOQINV-2026-0001",
  "boqId": "1",
  "boqNumber": "BOQ-2026-0001",
  "clientId": 1,
  "date": "2026-03-13T10:00:00.000Z",
  "items": [
    {
      "area": "Living Room",
      "imageUrl": "",
      "category": "Furniture",
      "itemName": "L-shaped sofa set",
      "unitPrice": 12000.00,
      "quantity": 1,
      "discount": 10,
      "discountType": "percent",
      "procurementSource": "IKEA UAE – Article #123456"
    }
  ],
  "subtotal": 12000.00,
  "totalDiscount": 1200.00,
  "taxAmount": 540.00,
  "taxPercent": 5.00,
  "taxLabel": "VAT",
  "serviceTaxAmount": 0.00,
  "serviceTaxPercent": 0.00,
  "totalAmount": 11340.00,
  "currency": "AED",
  "notes": "",
  "status": "Approved",
  "createdAt": "2026-03-13T10:00:00.000Z",
  "updatedAt": "2026-03-13T10:00:00.000Z"
}
```

### Endpoints

| Method | URL | Query Params | Description |
|---|---|---|---|
| GET | `/boq-invoices` | `?boqId={id}`, `?clientId={id}` | Return all; filter if params present |
| GET | `/boq-invoices/{id}` | — | Return single BOQ invoice |
| POST | `/boq-invoices` | — | Create (called by frontend on BOQ approval) |
| PUT | `/boq-invoices/{id}` | — | Update (admin use only) |
| DELETE | `/boq-invoices/{id}` | — | Delete (admin use only), return 204 No Content |

**Query params:** `?boqId=` and `?clientId=` are camelCase — accept exactly these casings.

**Idempotency requirement:** `GET /boq-invoices?boqId={id}` MUST return an empty array `[]` (not null, not 404) when no BOQ invoice exists for that `boqId`. The frontend checks the array length before creating a new BOQ invoice to prevent duplicates.

---

## 13. Settings — Organization

This is a **singleton resource** — there is always exactly one record (seeded with id = 1).

### Database table: `organization_settings`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint unsigned, PK | No | 1 | Always 1 — seeded, never auto-incremented |
| name | varchar(255) | No | — | Required |
| logo_url | varchar(1000) | Yes | null | |
| email | varchar(255) | Yes | null | |
| contact | varchar(100) | Yes | null | |
| website | varchar(255) | Yes | null | |
| address | text | Yes | null | |
| city | varchar(100) | Yes | null | |
| state | varchar(100) | Yes | null | |
| country | varchar(100) | Yes | null | |
| postal_code | varchar(20) | Yes | null | |
| registration_number | varchar(100) | Yes | null | |
| created_at | timestamp | No | CURRENT_TIMESTAMP | |
| updated_at | timestamp | No | CURRENT_TIMESTAMP | |

### API Resource shape:

```json
{
  "id": 1,
  "name": "THIS INTERIORS",
  "logoUrl": "https://thisinteriors.com/logo.png",
  "email": "info@thisinteriors.com",
  "contact": "+971 58 944 7432",
  "website": "www.thisinteriors.com",
  "address": "Office 1009, Prism Tower - Business Bay",
  "city": "Dubai",
  "state": "",
  "country": "United Arab Emirates",
  "postalCode": "",
  "registrationNumber": "ABCDE12345"
}
```

### Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/settings/organization` | Return the singleton object (no wrapping key) |
| PUT | `/settings/organization` | Full update of the singleton |

---

## 14. Settings — Tax

**Singleton resource.** Always one record.

### Database table: `tax_settings`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint unsigned, PK | No | 1 | Always 1 — seeded |
| tax_label | varchar(50) | Yes | 'VAT' | e.g. "VAT", "GST" |
| tax_percent | decimal(5,2) | No | 0.00 | |
| tax_id | varchar(100) | Yes | null | TRN / tax registration number |
| service_tax_label | varchar(50) | Yes | 'Service Tax' | |
| service_tax_percent | decimal(5,2) | No | 0.00 | |
| service_tax_enabled | tinyint(1) | No | 0 | Cast to bool |
| additional_taxes | json | Yes | '[]' | Reserved for future multi-tax support; store as-is |
| tax_inclusive | tinyint(1) | No | 0 | Cast to bool |
| show_tax_breakdown | tinyint(1) | No | 1 | Cast to bool |
| created_at | timestamp | No | CURRENT_TIMESTAMP | |
| updated_at | timestamp | No | CURRENT_TIMESTAMP | |

### API Resource shape:

```json
{
  "id": 1,
  "taxLabel": "VAT",
  "taxPercent": 5.00,
  "taxId": "100234567890003",
  "serviceTaxLabel": "Service Tax",
  "serviceTaxPercent": 0.00,
  "serviceTaxEnabled": false,
  "additionalTaxes": [],
  "taxInclusive": false,
  "showTaxBreakdown": true
}
```

`additionalTaxes`: This is a JSON array stored and returned as-is. The frontend initializes it as `[]` and has no UI to edit it currently. Store it verbatim and return it verbatim. Do not attempt to parse or validate its contents.

### Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/settings/tax` | Return the singleton tax settings object |
| PUT | `/settings/tax` | Full update of the singleton |

---

## 15. Settings — General

**Singleton resource.** Always one record.

### Database table: `general_settings`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint unsigned, PK | No | 1 | Always 1 — seeded |
| currency | varchar(10) | No | 'AED' | |
| currency_symbol | varchar(10) | No | 'AED' | |
| quotation_prefix | varchar(20) | No | 'PI' | Prefix for quotation/performa numbers |
| invoice_prefix | varchar(20) | No | 'INV' | Prefix for invoice numbers |
| boq_prefix | varchar(20) | No | 'BOQ' | Prefix for BOQ numbers |
| boq_invoice_prefix | varchar(20) | No | 'BOQINV' | Prefix for BOQ invoice numbers |
| quotation_valid_days | int | No | 30 | |
| payment_terms | varchar(100) | Yes | 'Net 30' | |
| default_payment_method | varchar(100) | Yes | 'Bank Transfer' | |
| fiscal_year_start | varchar(10) | Yes | '01-01' | Format: MM-DD |
| date_format | varchar(20) | No | 'DD/MM/YYYY' | |
| time_zone | varchar(50) | Yes | 'Asia/Dubai' | |
| number_format | varchar(20) | Yes | '1,000.00' | |
| decimal_places | tinyint | No | 2 | |
| created_at | timestamp | No | CURRENT_TIMESTAMP | |
| updated_at | timestamp | No | CURRENT_TIMESTAMP | |

### API Resource shape:

```json
{
  "id": 1,
  "currency": "AED",
  "currencySymbol": "AED",
  "quotationPrefix": "PI",
  "invoicePrefix": "INV",
  "boqPrefix": "BOQ",
  "boqInvoicePrefix": "BOQINV",
  "quotationValidDays": 30,
  "paymentTerms": "Net 30",
  "defaultPaymentMethod": "Bank Transfer",
  "fiscalYearStart": "01-01",
  "dateFormat": "DD/MM/YYYY",
  "timeZone": "Asia/Dubai",
  "numberFormat": "1,000.00",
  "decimalPlaces": 2
}
```

### Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/settings/general` | Return the singleton general settings object |
| PUT | `/settings/general` | Full update of the singleton |

---

## 16. Laravel Route Registration

```php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ScopeOfWorkController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\QuotationController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\BankAccountController;
use App\Http\Controllers\Api\BoqAreaController;
use App\Http\Controllers\Api\BoqCategoryController;
use App\Http\Controllers\Api\BoqController;
use App\Http\Controllers\Api\BoqInvoiceController;
use App\Http\Controllers\Api\OrganizationSettingsController;
use App\Http\Controllers\Api\TaxSettingsController;
use App\Http\Controllers\Api\GeneralSettingsController;

// Public
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::apiResource('clients', ClientController::class);
    Route::apiResource('scope-of-work', ScopeOfWorkController::class);
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('quotations', QuotationController::class);
    Route::apiResource('invoices', InvoiceController::class);
    Route::apiResource('bank-accounts', BankAccountController::class);
    Route::apiResource('boq-areas', BoqAreaController::class);
    Route::apiResource('boq-categories', BoqCategoryController::class);
    Route::apiResource('boqs', BoqController::class);
    Route::apiResource('boq-invoices', BoqInvoiceController::class);

    // Singleton settings
    Route::get('/settings/organization', [OrganizationSettingsController::class, 'show']);
    Route::put('/settings/organization', [OrganizationSettingsController::class, 'update']);

    Route::get('/settings/tax', [TaxSettingsController::class, 'show']);
    Route::put('/settings/tax', [TaxSettingsController::class, 'update']);

    Route::get('/settings/general', [GeneralSettingsController::class, 'show']);
    Route::put('/settings/general', [GeneralSettingsController::class, 'update']);
});
```

---

## 17. Required Database Seeders

| Seeder | Purpose | Key data |
|---|---|---|
| UserSeeder | Create default admin user | email: `invoice@thisinteriors.com`, password: `THIS@123###` |
| OrganizationSettingsSeeder | Seed singleton org record with id = 1 | name: "THIS INTERIORS", all other fields empty |
| TaxSettingsSeeder | Seed singleton tax record with id = 1 | All values zero/false/disabled; additionalTaxes: `[]` |
| GeneralSettingsSeeder | Seed singleton general settings with id = 1 | All prefixes as shown in Section 15 |
| BoqAreaSeeder | Seed default areas | Entrance, Hallway, Living Room, Bedroom, Master Bedroom, Bathroom, Kitchen, Lobby, Terrace, Common Area |
| BoqCategorySeeder | Seed default categories | Furniture, Sofa, Coffee Table, Bed, Dining Table, Lights, Carpets, Wallpaper, Curtains, Accessories, Flooring, Artwork |

---

## 18. Switching from JSON Server to Laravel

The frontend developer's only task when the Laravel backend is ready:

1. Update `.env.production`:

```
REACT_APP_API_BASE_URL=https://your-domain.com/api
```

2. Run `npm run build`
3. Deploy the `build/` folder

No React component changes required. All API calls, field names, query parameters, and data shapes are already normalized to match this specification exactly. The `routes.json` file used by JSON Server is only needed in local development and is not deployed.

---

**End of specification — v1.0**
