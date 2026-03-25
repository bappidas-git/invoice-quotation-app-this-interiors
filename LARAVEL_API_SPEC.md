# THIS Interiors — Laravel Backend API Specification

**Document version:** 2.2 (Post code audit — server-side filter notes, PaymentUpdate bug fixes)
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

### 1.9 ⚠️ IMPORTANT — Ignore `createdAt`, `updatedAt`, and `id` in POST/PUT request bodies

The React frontend sends `createdAt` and `updatedAt` ISO timestamp strings in the body of **every** POST and PUT request, for all resources (quotations, invoices, clients, tasks, BOQs, BOQ invoices, boq-areas, boq-categories, etc.). Some PUT requests also send the record `id` in the body (in addition to the URL parameter).

**You MUST ignore all three of these client-sent fields.** Use server-side timestamps via Eloquent's automatic timestamp management. Never use `createdAt`/`updatedAt` from the request body; never overwrite the record's primary key from the body.

**Recommended implementation pattern:**

```php
// In every controller's store() and update() method:
$data = $request->except(['createdAt', 'updatedAt', 'id']);

// OR rely on $fillable not including timestamps:
protected $fillable = [
    'name', 'email', /* ... all actual fields ... */
    // Do NOT include 'created_at', 'updated_at', or 'id' in $fillable
];
```

This rule applies to **all** resources without exception.

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

| Column                    | Type                    | Nullable | Default           | Notes                         |
| ------------------------- | ----------------------- | -------- | ----------------- | ----------------------------- |
| id                        | bigint unsigned, PK, AI | No       | —                 |                               |
| name                      | varchar(255)            | No       | —                 | Required                      |
| email                     | varchar(255)            | Yes      | null              |                               |
| contact                   | varchar(100)            | Yes      | null              | Phone number                  |
| address                   | text                    | Yes      | null              |                               |
| pin                       | varchar(20)             | Yes      | null              | Postal/ZIP code               |
| state                     | varchar(100)            | Yes      | null              |                               |
| country                   | varchar(100)            | Yes      | null              |                               |
| company_name              | varchar(255)            | Yes      | null              | Trade/company name            |
| tax_number                | varchar(100)            | Yes      | null              | TRN / VAT registration number |
| show_company_in_documents | tinyint(1)              | No       | 0                 | Cast to bool                  |
| show_tax_in_documents     | tinyint(1)              | No       | 0                 | Cast to bool                  |
| created_at                | timestamp               | No       | CURRENT_TIMESTAMP |                               |
| updated_at                | timestamp               | No       | CURRENT_TIMESTAMP |                               |

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

| Method | URL             | Description                       |
| ------ | --------------- | --------------------------------- |
| GET    | `/clients`      | Return all clients as plain array |
| GET    | `/clients/{id}` | Return single client              |
| POST   | `/clients`      | Create client                     |
| PUT    | `/clients/{id}` | Full update                       |
| DELETE | `/clients/{id}` | Delete, return 204 No Content     |

**POST/PUT accepted fields:** `name` (required), `email`, `contact`, `address`, `pin`, `state`, `country`, `companyName`, `taxNumber`, `showCompanyInDocuments`, `showTaxInDocuments`

**Note:** The frontend also sends `createdAt` in POST bodies. Ignore it per Rule 1.9.

---

## 4. Scope of Work

### Database table: `scope_of_work`

| Column      | Type                    | Nullable | Default           | Notes        |
| ----------- | ----------------------- | -------- | ----------------- | ------------ |
| id          | bigint unsigned, PK, AI | No       | —                 |              |
| name        | varchar(255)            | No       | —                 | Required     |
| description | text                    | Yes      | null              |              |
| is_active   | tinyint(1)              | No       | 1                 | Cast to bool |
| created_at  | timestamp               | No       | CURRENT_TIMESTAMP |              |
| updated_at  | timestamp               | No       | CURRENT_TIMESTAMP |              |

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

| Method | URL                   | Description                   |
| ------ | --------------------- | ----------------------------- |
| GET    | `/scope-of-work`      | Return all as plain array     |
| GET    | `/scope-of-work/{id}` | Return single                 |
| POST   | `/scope-of-work`      | Create                        |
| PUT    | `/scope-of-work/{id}` | Full update                   |
| DELETE | `/scope-of-work/{id}` | Delete, return 204 No Content |

**POST/PUT accepted fields:** `name` (required), `description`, `isActive`

---

## 5. Tasks

### Database table: `tasks`

| Column           | Type                    | Nullable | Default           | Notes                                            |
| ---------------- | ----------------------- | -------- | ----------------- | ------------------------------------------------ |
| id               | bigint unsigned, PK, AI | No       | —                 |                                                  |
| scope_of_work_id | bigint unsigned, FK     | No       | —                 | References scope_of_work.id                      |
| description      | text                    | No       | —                 | Required. This is the task label shown in the UI |
| estimated_hours  | decimal(6,2)            | Yes      | null              |                                                  |
| is_active        | tinyint(1)              | No       | 1                 | Cast to bool                                     |
| created_at       | timestamp               | No       | CURRENT_TIMESTAMP |                                                  |
| updated_at       | timestamp               | No       | CURRENT_TIMESTAMP |                                                  |

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

| Method | URL           | Query Params                     | Description                                         |
| ------ | ------------- | -------------------------------- | --------------------------------------------------- |
| GET    | `/tasks`      | `?scopeOfWorkId={id}` (optional) | Return all tasks; if param present, filter by scope |
| GET    | `/tasks/{id}` | —                                | Return single task                                  |
| POST   | `/tasks`      | —                                | Create                                              |
| PUT    | `/tasks/{id}` | —                                | Full update                                         |
| DELETE | `/tasks/{id}` | —                                | Delete, return 204 No Content                       |

**Query param spelling:** The frontend sends `?scopeOfWorkId=` (camelCase). Accept exactly this casing.

**POST/PUT accepted fields:** `scopeOfWorkId` (required), `description` (required), `estimatedHours`, `isActive`

---

## 6. Quotations

### Database table: `quotations`

Line items and payment history are stored as JSON columns. This avoids complex joins and exactly matches the frontend data model.

| Column              | Type                    | Nullable | Default           | Notes                                 |
| ------------------- | ----------------------- | -------- | ----------------- | ------------------------------------- |
| id                  | bigint unsigned, PK, AI | No       | —                 |                                       |
| quotation_number    | varchar(50), unique     | No       | —                 | Format: PI-2026-0001                  |
| client_id           | bigint unsigned, FK     | No       | —                 | References clients.id                 |
| date                | datetime                | No       | —                 |                                       |
| items               | json                    | No       | '[]'              | Array of item objects (see below)     |
| subtotal            | decimal(14,2)           | No       | 0.00              |                                       |
| discount_type       | varchar(20)             | Yes      | null              | "percent" or "flat"                   |
| discount_value      | decimal(10,2)           | Yes      | null              | Input value (% number or flat amount) |
| discount_amount     | decimal(14,2)           | No       | 0.00              | Computed discount in currency         |
| tax_amount          | decimal(14,2)           | No       | 0.00              |                                       |
| service_tax_amount  | decimal(14,2)           | No       | 0.00              |                                       |
| total_amount        | decimal(14,2)           | No       | 0.00              |                                       |
| status              | varchar(50)             | No       | 'Performa'        | See status values below               |
| paid_amount         | decimal(14,2)           | No       | 0.00              |                                       |
| payments            | json                    | No       | '[]'              | Array of payment objects (see below)  |
| currency            | varchar(10)             | No       | 'AED'             |                                       |
| notes               | text                    | Yes      | null              |                                       |
| tax_percent         | decimal(5,2)            | No       | 0.00              |                                       |
| service_tax_percent | decimal(5,2)            | No       | 0.00              |                                       |
| tax_label           | varchar(50)             | Yes      | null              | e.g. "VAT"                            |
| bank_account_id     | bigint unsigned, FK     | Yes      | null              | References bank_accounts.id           |
| created_at          | timestamp               | No       | CURRENT_TIMESTAMP |                                       |
| updated_at          | timestamp               | No       | CURRENT_TIMESTAMP |                                       |

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
  "amount": 5000.0
}
```

### Payment object shape (each element in the `payments` JSON array):

```json
{
  "amount": 2500.0,
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
    {
      "scopeOfWork": "CAD Drawings",
      "task": "Space Planning",
      "amount": 5000.0
    }
  ],
  "subtotal": 5000.0,
  "discountType": "percent",
  "discountValue": 10,
  "discountAmount": 500.0,
  "taxAmount": 225.0,
  "serviceTaxAmount": 0.0,
  "totalAmount": 4725.0,
  "status": "Performa",
  "paidAmount": 0.0,
  "payments": [],
  "currency": "AED",
  "notes": "",
  "taxPercent": 5.0,
  "serviceTaxPercent": 0.0,
  "taxLabel": "VAT",
  "bankAccountId": 1,
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-15T10:00:00.000Z"
}
```

### Endpoints

| Method | URL                | Query Params                                                         | Description                                 |
| ------ | ------------------ | -------------------------------------------------------------------- | ------------------------------------------- |
| GET    | `/quotations`      | `?status=Performa`, `?start_date=YYYY-MM-DD`, `?end_date=YYYY-MM-DD` | Return all; apply filters if params present |
| GET    | `/quotations/{id}` | —                                                                    | Return single quotation                     |
| POST   | `/quotations`      | —                                                                    | Create                                      |
| PUT    | `/quotations/{id}` | —                                                                    | Full update                                 |
| DELETE | `/quotations/{id}` | —                                                                    | Delete, return 204 No Content               |

**Date filtering:** Filter on the `date` column. `start_date` is inclusive (>=), `end_date` is inclusive (<=). Both can be combined.

**Status filtering:** Exact string match. URL-encoded as needed (e.g. `Partially%20Paid`).

> **Implementation note:** The `?status=`, `?start_date=`, and `?end_date=` query parameters are defined in the frontend API service (`api.js`) and MUST be supported by the Laravel backend. However, the current React components fetch all records via `GET /quotations` and filter client-side. The server-side filters exist for performance optimization — the frontend may switch to using them in a future release without any backend changes needed.

---

## 7. Invoices

### Database table: `invoices`

| Column              | Type                    | Nullable | Default           | Notes                         |
| ------------------- | ----------------------- | -------- | ----------------- | ----------------------------- |
| id                  | bigint unsigned, PK, AI | No       | —                 |                               |
| invoice_number      | varchar(50), unique     | No       | —                 | Format: INV-2026-0001         |
| quotation_id        | bigint unsigned, FK     | Yes      | null              | References quotations.id      |
| client_id           | bigint unsigned, FK     | No       | —                 | References clients.id         |
| date                | datetime                | No       | —                 |                               |
| items               | json                    | No       | '[]'              | Same item shape as quotations |
| subtotal            | decimal(14,2)           | No       | 0.00              |                               |
| tax_amount          | decimal(14,2)           | No       | 0.00              |                               |
| service_tax_amount  | decimal(14,2)           | No       | 0.00              |                               |
| total_amount        | decimal(14,2)           | No       | 0.00              |                               |
| paid_amount         | decimal(14,2)           | No       | 0.00              |                               |
| payment_date        | datetime                | Yes      | null              |                               |
| payment_method      | varchar(100)            | Yes      | null              |                               |
| currency            | varchar(10)             | No       | 'AED'             |                               |
| tax_percent         | decimal(5,2)            | No       | 0.00              |                               |
| service_tax_percent | decimal(5,2)            | No       | 0.00              |                               |
| tax_label           | varchar(50)             | Yes      | null              |                               |
| notes               | text                    | Yes      | null              |                               |
| bank_account_id     | bigint unsigned, FK     | Yes      | null              | References bank_accounts.id   |
| created_at          | timestamp               | No       | CURRENT_TIMESTAMP |                               |
| updated_at          | timestamp               | No       | CURRENT_TIMESTAMP |                               |

### API Resource shape:

```json
{
  "id": 1,
  "invoiceNumber": "INV-2026-0001",
  "quotationId": 1,
  "clientId": 1,
  "date": "2026-01-20T00:00:00.000Z",
  "items": [
    {
      "scopeOfWork": "CAD Drawings",
      "task": "Space Planning",
      "amount": 2500.0
    }
  ],
  "subtotal": 2380.95,
  "taxAmount": 119.05,
  "serviceTaxAmount": 0.0,
  "totalAmount": 2500.0,
  "paidAmount": 2500.0,
  "paymentDate": "2026-01-20T10:00:00.000Z",
  "paymentMethod": "Bank Transfer",
  "currency": "AED",
  "taxPercent": 5.0,
  "serviceTaxPercent": 0.0,
  "taxLabel": "VAT",
  "notes": "First installment",
  "bankAccountId": 1,
  "createdAt": "2026-01-20T10:00:00.000Z",
  "updatedAt": "2026-01-20T10:00:00.000Z"
}
```

### Endpoints

| Method | URL              | Query Params                                                                            | Description                          |
| ------ | ---------------- | --------------------------------------------------------------------------------------- | ------------------------------------ |
| GET    | `/invoices`      | `?clientId={id}`, `?quotationId={id}`, `?start_date=YYYY-MM-DD`, `?end_date=YYYY-MM-DD` | Return all; filter if params present |
| GET    | `/invoices/{id}` | —                                                                                       | Return single invoice                |
| POST   | `/invoices`      | —                                                                                       | Create                               |
| PUT    | `/invoices/{id}` | —                                                                                       | Full update                          |
| DELETE | `/invoices/{id}` | —                                                                                       | Delete, return 204 No Content        |

**Query params — all camelCase, accept exactly these casings:**

- `?clientId=` — filter invoices by client
- `?quotationId=` — filter invoices belonging to a specific quotation. The ViewQuotation screen uses `invoicesAPI.getAll()` and filters client-side today, but implementing this server-side filter is recommended for performance.
- `?start_date=` / `?end_date=` — filter on the `date` column, both inclusive

> **Implementation note:** Same as quotations — `?clientId=`, `?start_date=`, and `?end_date=` are defined in the frontend API service and MUST be supported. The current React components fetch all invoices and filter client-side. `?quotationId=` is recommended but not yet used by the frontend.

---

## 8. Bank Accounts

### Database table: `bank_accounts`

| Column              | Type                    | Nullable | Default           | Notes                        |
| ------------------- | ----------------------- | -------- | ----------------- | ---------------------------- |
| id                  | bigint unsigned, PK, AI | No       | —                 |                              |
| bank_name           | varchar(255)            | No       | —                 | Required                     |
| account_number      | varchar(100)            | No       | —                 | Required                     |
| account_holder_name | varchar(255)            | Yes      | null              |                              |
| branch              | varchar(255)            | Yes      | null              |                              |
| iban                | varchar(100)            | Yes      | null              |                              |
| qr_code_url         | varchar(1000)           | Yes      | null              | URL to payment QR code image |
| is_default          | tinyint(1)              | No       | 0                 | Cast to bool                 |
| created_at          | timestamp               | No       | CURRENT_TIMESTAMP |                              |
| updated_at          | timestamp               | No       | CURRENT_TIMESTAMP |                              |

### API Resource shape:

```json
{
  "id": 1,
  "bankName": "Standard Chartered",
  "accountNumber": "1234567890",
  "accountHolderName": "THIS INTERIORS LLC",
  "branch": "Dubai Main Branch",
  "iban": "SCBLAEADXXX",
  "qrCodeUrl": "",
  "isDefault": true,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### Endpoints

| Method | URL                   | Description                   |
| ------ | --------------------- | ----------------------------- |
| GET    | `/bank-accounts`      | Return all as plain array     |
| GET    | `/bank-accounts/{id}` | Return single                 |
| POST   | `/bank-accounts`      | Create                        |
| PUT    | `/bank-accounts/{id}` | Full update                   |
| DELETE | `/bank-accounts/{id}` | Delete, return 204 No Content |

**POST/PUT accepted fields:** `bankName` (required), `accountNumber` (required), `accountHolderName`, `branch`, `iban`, `qrCodeUrl`, `isDefault`

---

## 9. BOQ Areas

### Database table: `boq_areas`

| Column     | Type                    | Nullable | Default           | Notes        |
| ---------- | ----------------------- | -------- | ----------------- | ------------ |
| id         | bigint unsigned, PK, AI | No       | —                 |              |
| name       | varchar(255)            | No       | —                 | Required     |
| is_active  | tinyint(1)              | No       | 1                 | Cast to bool |
| created_at | timestamp               | No       | CURRENT_TIMESTAMP |              |
| updated_at | timestamp               | No       | CURRENT_TIMESTAMP |              |

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

| Method | URL               | Description                   |
| ------ | ----------------- | ----------------------------- |
| GET    | `/boq-areas`      | Return all as plain array     |
| GET    | `/boq-areas/{id}` | Return single                 |
| POST   | `/boq-areas`      | Create                        |
| PUT    | `/boq-areas/{id}` | Full update                   |
| DELETE | `/boq-areas/{id}` | Delete, return 204 No Content |

**POST/PUT accepted fields:** `name` (required), `isActive`

**Note:** The PUT body from the frontend spreads the full area object, which means it also sends `id`, `createdAt`, and `updatedAt`. Ignore all three per Rule 1.9. Only use `name` and `isActive` from the request body.

---

## 10. BOQ Categories

### Database table: `boq_categories`

| Column     | Type                    | Nullable | Default           | Notes        |
| ---------- | ----------------------- | -------- | ----------------- | ------------ |
| id         | bigint unsigned, PK, AI | No       | —                 |              |
| name       | varchar(255)            | No       | —                 | Required     |
| is_active  | tinyint(1)              | No       | 1                 | Cast to bool |
| created_at | timestamp               | No       | CURRENT_TIMESTAMP |              |
| updated_at | timestamp               | No       | CURRENT_TIMESTAMP |              |

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

### Endpoints

| Method | URL                    | Description                   |
| ------ | ---------------------- | ----------------------------- |
| GET    | `/boq-categories`      | Return all as plain array     |
| GET    | `/boq-categories/{id}` | Return single                 |
| POST   | `/boq-categories`      | Create                        |
| PUT    | `/boq-categories/{id}` | Full update                   |
| DELETE | `/boq-categories/{id}` | Delete, return 204 No Content |

**POST/PUT accepted fields:** `name` (required), `isActive`

**Note:** Same as BOQ Areas — the PUT body also sends `id`, `createdAt`, `updatedAt`. Ignore all three per Rule 1.9.

---

## 11. BOQs (Bill of Quantities)

### Database table: `boqs`

| Column              | Type                    | Nullable | Default           | Notes                                   |
| ------------------- | ----------------------- | -------- | ----------------- | --------------------------------------- |
| id                  | bigint unsigned, PK, AI | No       | —                 |                                         |
| boq_number          | varchar(50), unique     | No       | —                 | Format: BOQ-2026-0001                   |
| client_id           | bigint unsigned, FK     | No       | —                 | References clients.id                   |
| date                | datetime                | No       | —                 |                                         |
| status              | varchar(50)             | No       | 'Draft'           | See status values below                 |
| items               | json                    | No       | '[]'              | Array of BOQ item objects (see below)   |
| subtotal            | decimal(14,2)           | No       | 0.00              | Sum of all line item amounts before tax |
| total_discount      | decimal(14,2)           | No       | 0.00              | Sum of all per-item discount amounts    |
| tax_amount          | decimal(14,2)           | No       | 0.00              |                                         |
| tax_percent         | decimal(5,2)            | No       | 0.00              |                                         |
| tax_label           | varchar(50)             | Yes      | null              |                                         |
| service_tax_amount  | decimal(14,2)           | No       | 0.00              |                                         |
| service_tax_percent | decimal(5,2)            | No       | 0.00              |                                         |
| total_amount        | decimal(14,2)           | No       | 0.00              |                                         |
| currency            | varchar(10)             | No       | 'AED'             |                                         |
| notes               | text                    | Yes      | null              |                                         |
| created_at          | timestamp               | No       | CURRENT_TIMESTAMP |                                         |
| updated_at          | timestamp               | No       | CURRENT_TIMESTAMP |                                         |

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
  "unitPrice": 12000.0,
  "quantity": 1,
  "discount": 10,
  "discountType": "percent",
  "procurementSource": "IKEA UAE – Article #123456"
}
```

`discountType` is `"percent"` or `"flat"`. `procurementSource` is an internal-only field. It is stored in the database and included in all API responses, but must **NEVER** appear in client-facing print documents. The internal print template shows it; the client print template hides it.

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
      "unitPrice": 12000.0,
      "quantity": 1,
      "discount": 10,
      "discountType": "percent",
      "procurementSource": "IKEA UAE"
    }
  ],
  "subtotal": 12000.0,
  "totalDiscount": 1200.0,
  "taxAmount": 540.0,
  "taxPercent": 5.0,
  "taxLabel": "VAT",
  "serviceTaxAmount": 0.0,
  "serviceTaxPercent": 0.0,
  "totalAmount": 11340.0,
  "currency": "AED",
  "notes": "",
  "createdAt": "2026-01-10T10:00:00.000Z",
  "updatedAt": "2026-01-10T10:00:00.000Z"
}
```

### Endpoints

| Method | URL          | Query Params                | Description                                   |
| ------ | ------------ | --------------------------- | --------------------------------------------- |
| GET    | `/boqs`      | `?clientId={id}` (optional) | Return all; filter by client if param present |
| GET    | `/boqs/{id}` | —                           | Return single BOQ                             |
| POST   | `/boqs`      | —                           | Create                                        |
| PUT    | `/boqs/{id}` | —                           | Full update                                   |
| DELETE | `/boqs/{id}` | —                           | Delete, return 204 No Content                 |

**Query param:** `?clientId=` is camelCase — accept exactly this casing.

---

## 12. BOQ Invoices

BOQ Invoices are auto-generated by the React frontend when a BOQ status is set to "Approved". This happens in two places: `CreateBOQ.jsx` (on save with Approved status) and `ViewBOQ.jsx` (via a manual "Generate Invoice" button). Both use the same idempotency check before creating. They are immutable by design — the normal UI has no edit or delete for BOQ invoices.

### Frontend auto-generation flow (for context):

1. Frontend calls `GET /boq-invoices?boqId={id}`
2. If response is `[]`, frontend calls `GET /boq-invoices` (to get count for number generation), then `POST /boq-invoices` to create
3. If response has records, frontend skips creation (idempotency)

### Database table: `boq_invoices`

| Column              | Type                    | Nullable | Default           | Notes                                               |
| ------------------- | ----------------------- | -------- | ----------------- | --------------------------------------------------- |
| id                  | bigint unsigned, PK, AI | No       | —                 |                                                     |
| boq_invoice_number  | varchar(50), unique     | No       | —                 | Format: BOQINV-2026-0001                            |
| boq_id              | varchar(50)             | No       | —                 | Stored as string — see note below                   |
| boq_number          | varchar(50)             | No       | —                 | Denormalized for quick display                      |
| client_id           | bigint unsigned, FK     | No       | —                 | References clients.id                               |
| date                | datetime                | No       | —                 |                                                     |
| items               | json                    | No       | '[]'              | Same shape as BOQ items, includes procurementSource |
| subtotal            | decimal(14,2)           | No       | 0.00              |                                                     |
| total_discount      | decimal(14,2)           | No       | 0.00              |                                                     |
| tax_amount          | decimal(14,2)           | No       | 0.00              |                                                     |
| tax_percent         | decimal(5,2)            | No       | 0.00              |                                                     |
| tax_label           | varchar(50)             | Yes      | null              |                                                     |
| service_tax_amount  | decimal(14,2)           | No       | 0.00              |                                                     |
| service_tax_percent | decimal(5,2)            | No       | 0.00              |                                                     |
| total_amount        | decimal(14,2)           | No       | 0.00              |                                                     |
| currency            | varchar(10)             | No       | 'AED'             |                                                     |
| notes               | text                    | Yes      | null              |                                                     |
| status              | varchar(50)             | No       | 'Approved'        | Always "Approved" — immutable                       |
| created_at          | timestamp               | No       | CURRENT_TIMESTAMP |                                                     |
| updated_at          | timestamp               | No       | CURRENT_TIMESTAMP |                                                     |

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
      "unitPrice": 12000.0,
      "quantity": 1,
      "discount": 10,
      "discountType": "percent",
      "procurementSource": "IKEA UAE – Article #123456"
    }
  ],
  "subtotal": 12000.0,
  "totalDiscount": 1200.0,
  "taxAmount": 540.0,
  "taxPercent": 5.0,
  "taxLabel": "VAT",
  "serviceTaxAmount": 0.0,
  "serviceTaxPercent": 0.0,
  "totalAmount": 11340.0,
  "currency": "AED",
  "notes": "",
  "status": "Approved",
  "createdAt": "2026-03-13T10:00:00.000Z",
  "updatedAt": "2026-03-13T10:00:00.000Z"
}
```

### Endpoints

| Method | URL                  | Query Params                    | Description                                    |
| ------ | -------------------- | ------------------------------- | ---------------------------------------------- |
| GET    | `/boq-invoices`      | `?boqId={id}`, `?clientId={id}` | Return all; filter if params present           |
| GET    | `/boq-invoices/{id}` | —                               | Return single BOQ invoice                      |
| POST   | `/boq-invoices`      | —                               | Create (called by frontend on BOQ approval)    |
| PUT    | `/boq-invoices/{id}` | —                               | Update (admin use only)                        |
| DELETE | `/boq-invoices/{id}` | —                               | Delete (admin use only), return 204 No Content |

**Query params:** `?boqId=` and `?clientId=` are camelCase — accept exactly these casings.

**Idempotency requirement:** `GET /boq-invoices?boqId={id}` MUST return an empty array `[]` (not null, not 404) when no BOQ invoice exists for that `boqId`. The frontend checks `response.data.length` before creating to prevent duplicates.

---

## 13. Settings — Organization

This is a **singleton resource** — there is always exactly one record (seeded with id = 1).

### Database table: `organization_settings`

| Column              | Type                | Nullable | Default           | Notes                                             |
| ------------------- | ------------------- | -------- | ----------------- | ------------------------------------------------- |
| id                  | bigint unsigned, PK | No       | 1                 | Always 1 — seeded, never auto-incremented         |
| name                | varchar(255)        | No       | —                 | Required                                          |
| logo_url            | varchar(1000)       | Yes      | null              |                                                   |
| email               | varchar(255)        | Yes      | null              |                                                   |
| contact             | varchar(100)        | Yes      | null              |                                                   |
| website             | varchar(255)        | Yes      | null              |                                                   |
| address             | text                | Yes      | null              |                                                   |
| city                | varchar(100)        | Yes      | null              |                                                   |
| state               | varchar(100)        | Yes      | null              |                                                   |
| country             | varchar(100)        | Yes      | null              |                                                   |
| postal_code         | varchar(20)         | Yes      | null              |                                                   |
| registration_number | varchar(100)        | Yes      | null              |                                                   |
| bank_name           | varchar(255)        | Yes      | null              | ⚠️ Legacy field — include for data migration only |
| bank_account        | varchar(100)        | Yes      | null              | ⚠️ Legacy field — include for data migration only |
| bank_branch         | varchar(255)        | Yes      | null              | ⚠️ Legacy field — include for data migration only |
| bank_iban           | varchar(100)        | Yes      | null              | ⚠️ Legacy field — include for data migration only |
| created_at          | timestamp           | No       | CURRENT_TIMESTAMP |                                                   |
| updated_at          | timestamp           | No       | CURRENT_TIMESTAMP |                                                   |

> **⚠️ Legacy bank fields — important migration note:**
>
> The current JSON Server `db.json` (`organizationSettings` record) contains four legacy banking fields: `bankName`, `bankAccount`, `bankBranch`, `bankIBAN`. These were added before the dedicated `bank_accounts` table existed and are **no longer used by any frontend component**. All banking information is now managed exclusively through the `bank_accounts` resource (Section 8), and quotations/invoices reference banking via `bankAccountId`.
>
> You MUST include these four columns in the `organization_settings` table **for data migration completeness** — to avoid data loss when migrating from JSON Server. However, **do NOT expose them in the API response** (`GET /settings/organization` and `PUT /settings/organization`). They should exist in the DB but remain invisible to the frontend.
>
> The `PUT /settings/organization` handler must use `$request->except(['bankName', 'bankAccount', 'bankBranch', 'bankIBAN', 'createdAt', 'updatedAt', 'id'])` so that even if these fields are somehow passed, they are never written through the API.

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

| Method | URL                      | Description                                   |
| ------ | ------------------------ | --------------------------------------------- |
| GET    | `/settings/organization` | Return the singleton object (no wrapping key) |
| PUT    | `/settings/organization` | Full update of the singleton                  |

**Implementation:** Use `updateOrCreate(['id' => 1], $data)` or simply `OrganizationSettings::find(1)->update($data)`.

---

## 14. Settings — Tax

**Singleton resource.** Always one record.

### Database table: `tax_settings`

| Column              | Type                | Nullable | Default           | Notes                                              |
| ------------------- | ------------------- | -------- | ----------------- | -------------------------------------------------- |
| id                  | bigint unsigned, PK | No       | 1                 | Always 1 — seeded                                  |
| tax_label           | varchar(50)         | Yes      | 'VAT'             | e.g. "VAT", "GST"                                  |
| tax_percent         | decimal(5,2)        | No       | 0.00              |                                                    |
| tax_id              | varchar(100)        | Yes      | null              | TRN / tax registration number                      |
| service_tax_label   | varchar(50)         | Yes      | 'Service Tax'     |                                                    |
| service_tax_percent | decimal(5,2)        | No       | 0.00              |                                                    |
| service_tax_enabled | tinyint(1)          | No       | 0                 | Cast to bool                                       |
| additional_taxes    | json                | Yes      | '[]'              | Reserved for future multi-tax support; store as-is |
| tax_inclusive       | tinyint(1)          | No       | 0                 | Cast to bool                                       |
| show_tax_breakdown  | tinyint(1)          | No       | 1                 | Cast to bool                                       |
| created_at          | timestamp           | No       | CURRENT_TIMESTAMP |                                                    |
| updated_at          | timestamp           | No       | CURRENT_TIMESTAMP |                                                    |

### API Resource shape:

```json
{
  "id": 1,
  "taxLabel": "VAT",
  "taxPercent": 5.0,
  "taxId": "100234567890003",
  "serviceTaxLabel": "Service Tax",
  "serviceTaxPercent": 0.0,
  "serviceTaxEnabled": false,
  "additionalTaxes": [],
  "taxInclusive": false,
  "showTaxBreakdown": true
}
```

`additionalTaxes`: This is a JSON array stored and returned as-is. The frontend always sends it (initialized as `[]`) in every PUT. Store it verbatim and return it verbatim. Do not validate or transform its contents.

### Endpoints

| Method | URL             | Description                              |
| ------ | --------------- | ---------------------------------------- |
| GET    | `/settings/tax` | Return the singleton tax settings object |
| PUT    | `/settings/tax` | Full update of the singleton             |

---

## 15. Settings — General

**Singleton resource.** Always one record.

### Database table: `general_settings`

| Column                 | Type                | Nullable | Default           | Notes                                 |
| ---------------------- | ------------------- | -------- | ----------------- | ------------------------------------- |
| id                     | bigint unsigned, PK | No       | 1                 | Always 1 — seeded                     |
| currency               | varchar(10)         | No       | 'AED'             |                                       |
| currency_symbol        | varchar(10)         | No       | 'AED'             |                                       |
| quotation_prefix       | varchar(20)         | No       | 'PI'              | Prefix for quotation/performa numbers |
| invoice_prefix         | varchar(20)         | No       | 'INV'             | Prefix for invoice numbers            |
| boq_prefix             | varchar(20)         | No       | 'BOQ'             | Prefix for BOQ numbers                |
| boq_invoice_prefix     | varchar(20)         | No       | 'BOQINV'          | Prefix for BOQ invoice numbers        |
| quotation_valid_days   | int                 | No       | 30                |                                       |
| payment_terms          | varchar(100)        | Yes      | 'Net 30'          |                                       |
| default_payment_method | varchar(100)        | Yes      | 'Bank Transfer'   |                                       |
| fiscal_year_start      | varchar(10)         | Yes      | '01-01'           | Format: MM-DD                         |
| date_format            | varchar(20)         | No       | 'DD/MM/YYYY'      |                                       |
| time_zone              | varchar(50)         | Yes      | 'Asia/Dubai'      |                                       |
| number_format          | varchar(20)         | Yes      | '1,000.00'        |                                       |
| decimal_places         | tinyint             | No       | 2                 |                                       |
| created_at             | timestamp           | No       | CURRENT_TIMESTAMP |                                       |
| updated_at             | timestamp           | No       | CURRENT_TIMESTAMP |                                       |

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

| Method | URL                 | Description                                  |
| ------ | ------------------- | -------------------------------------------- |
| GET    | `/settings/general` | Return the singleton general settings object |
| PUT    | `/settings/general` | Full update of the singleton                 |

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

| Seeder                     | Purpose                                     | Key data                                                                                                               |
| -------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| UserSeeder                 | Create default admin user                   | email: `invoice@thisinteriors.com`, password: `THIS@123###`                                                            |
| OrganizationSettingsSeeder | Seed singleton org record with id = 1       | name: "THIS INTERIORS", all other fields empty                                                                         |
| TaxSettingsSeeder          | Seed singleton tax record with id = 1       | All values zero/false/disabled; additionalTaxes: `[]`                                                                  |
| GeneralSettingsSeeder      | Seed singleton general settings with id = 1 | All prefixes as shown in Section 15                                                                                    |
| BoqAreaSeeder              | Seed default areas                          | Entrance, Hallway, Living Room, Bedroom, Master Bedroom, Bathroom, Kitchen, Lobby, Terrace, Common Area                |
| BoqCategorySeeder          | Seed default categories                     | Furniture, Sofa, Coffee Table, Bed, Dining Table, Lights, Carpets, Wallpaper, Curtains, Accessories, Flooring, Artwork |

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

## 19. Changelog — v1.0 → v2.0

| Section                         | Change                                                                                                                                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1.9 (new)**                   | Added critical rule: ignore `createdAt`, `updatedAt`, and `id` in all POST/PUT request bodies. The frontend sends these in every single request — Laravel must not use them.                             |
| **Section 7 (Invoices)**        | Added `?quotationId=` as a supported query filter. `ViewQuotation.jsx` currently fetches all invoices and filters client-side; this param enables server-side filtering for better performance at scale. |
| **Section 9 (BOQ Areas)**       | Added explicit note that PUT body includes `id`, `createdAt`, `updatedAt` — ignore all three.                                                                                                            |
| **Section 10 (BOQ Categories)** | Same note as BOQ Areas.                                                                                                                                                                                  |
| **Section 12 (BOQ Invoices)**   | Clarified that auto-generation also occurs from `ViewBOQ.jsx` (not only `CreateBOQ.jsx`), and documented the exact 3-step idempotency flow the frontend uses.                                            |

---

## 20. Changelog — v2.0 → v2.1

| Section                                | Change                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Section 13 (Organization Settings)** | Added 4 legacy bank fields (`bank_name`, `bank_account`, `bank_branch`, `bank_iban`) to the DB schema table. These exist in the current JSON Server `db.json` and must be included in the MySQL migration for data completeness. They are NOT exposed in the API response and must be excluded from the `PUT` handler. See the migration note in Section 13 for details. |

---

## 21. Changelog — v2.1 → v2.2

| Section                          | Change                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Section 6 (Quotations)**       | Added implementation note clarifying that `?status=`, `?start_date=`, and `?end_date=` query parameters are defined in the frontend API service and MUST be supported, even though current React components filter client-side. Server-side filters exist for performance optimization and future frontend updates. |
| **Section 7 (Invoices)**         | Added similar implementation note for `?clientId=`, `?start_date=`, `?end_date=`, and `?quotationId=` filters.                                                                                                                                                                                                     |
| **Frontend bug fix (PaymentUpdate.jsx)** | Fixed 3 bugs: (1) Added missing `bankAccountId` to invoice creation, (2) Replaced hardcoded `"AED"` currency with `quotation.currency`, (3) Fixed `totalAmount`/`paidAmount` being sent as strings instead of numbers. These fixes ensure invoices created from the PaymentUpdate page match the spec exactly.       |

---

**End of specification — v2.2**
