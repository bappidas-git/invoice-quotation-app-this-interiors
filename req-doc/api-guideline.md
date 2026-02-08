# THIS INTERIORS - Invoice & Quotation Management System

## Complete API Guideline for Laravel + MySQL Backend

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Tech Stack Requirements](#2-tech-stack-requirements)
3. [Database Schema Design](#3-database-schema-design)
4. [API Endpoints](#4-api-endpoints)
5. [Dashboard API](#5-dashboard-api)
6. [Authentication & Middleware](#6-authentication--middleware)
7. [Response Format Standards](#7-response-format-standards)
8. [Error Handling](#8-error-handling)
9. [Migration Commands](#9-migration-commands)
10. [Seeder Data](#10-seeder-data)
11. [CORS Configuration](#11-cors-configuration)
12. [Environment Configuration](#12-environment-configuration)

---

## 1. Introduction

### Project Overview

THIS INTERIORS is an interior design business management application that handles quotations (also referred to as "Performa"), invoices, Bill of Quantities (BOQ), client management, and organizational settings. The frontend is built with React and currently uses `json-server` as a mock backend. This document provides the complete specification for building the production Laravel API backend.

### Objective

Build a RESTful API backend using Laravel and MySQL that is a drop-in replacement for the current `json-server` mock. The frontend application should work without any code changes other than updating the base URL environment variable.

### Current Frontend Base URL Configuration

The frontend reads the API base URL from the environment variable `REACT_APP_API_BASE_URL`. For the Laravel backend, the frontend will set this to:

```
REACT_APP_API_BASE_URL=https://your-domain.com/api
```

All API endpoints listed in this document are relative to this base URL. For example, `GET /clients` means `GET https://your-domain.com/api/clients`.

### Key Business Rules

- **Quotations** go through a lifecycle: `Performa` -> `Partially Paid` -> `Fully Paid`.
- **Invoices** are generated automatically from quotation payments. Each payment on a quotation creates a corresponding invoice.
- **BOQs** (Bill of Quantities) have statuses: `Draft`, `Sent`, `Approved`, `Rejected`.
- **Quotation/Invoice numbers** are auto-generated using configurable prefixes from General Settings, in the format `{PREFIX}-{YEAR}-{SEQUENTIAL_NUMBER_PADDED_TO_4}` (e.g., `QT-2026-0001`, `INV-2026-0001`, `BOQ-2026-0001`).
- **Tax calculations**: Subtotal is computed from line items. Tax and service tax are applied as percentages on the subtotal.
- **Currency** is configurable via General Settings (default: `AED`).
- **Organization Settings**, **Tax Settings**, and **General Settings** are singleton records (always `id=1`).

---

## 2. Tech Stack Requirements

| Component          | Requirement                  |
| ------------------ | ---------------------------- |
| **Framework**      | Laravel 10+ (or Laravel 11)  |
| **PHP**            | PHP 8.1+                     |
| **Database**       | MySQL 8.0+                   |
| **Authentication** | Laravel Sanctum (API tokens) |
| **CORS**           | Laravel CORS middleware       |
| **Validation**     | Laravel Form Requests        |
| **API Format**     | JSON (application/json)      |

### Required Laravel Packages

```bash
composer require laravel/sanctum
```

---

## 3. Database Schema Design

### 3.1 `users` Table

Handles authentication. Uses Laravel's default users table with Sanctum for API tokens.

```sql
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `email_verified_at` TIMESTAMP NULL,
    `password` VARCHAR(255) NOT NULL,
    `remember_token` VARCHAR(100) NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.2 `clients` Table

```sql
CREATE TABLE `clients` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `contact` VARCHAR(50) NOT NULL,
    `address` TEXT NOT NULL,
    `pin` VARCHAR(20) NULL DEFAULT '',
    `state` VARCHAR(100) NULL DEFAULT '',
    `country` VARCHAR(100) NOT NULL DEFAULT 'UAE',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_clients_name` (`name`),
    INDEX `idx_clients_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.3 `scope_of_work` Table

```sql
CREATE TABLE `scope_of_work` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_scope_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.4 `tasks` Table

```sql
CREATE TABLE `tasks` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `scope_of_work_id` BIGINT UNSIGNED NOT NULL,
    `description` TEXT NOT NULL,
    `estimated_hours` DECIMAL(8,2) NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_tasks_scope` (`scope_of_work_id`),
    INDEX `idx_tasks_active` (`is_active`),
    CONSTRAINT `fk_tasks_scope_of_work` FOREIGN KEY (`scope_of_work_id`)
        REFERENCES `scope_of_work`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.5 `quotations` Table

```sql
CREATE TABLE `quotations` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `quotation_number` VARCHAR(50) NOT NULL UNIQUE,
    `client_id` BIGINT UNSIGNED NOT NULL,
    `date` TIMESTAMP NOT NULL,
    `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `service_tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `status` ENUM('Performa', 'Partially Paid', 'Fully Paid') NOT NULL DEFAULT 'Performa',
    `paid_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'AED',
    `notes` TEXT NULL,
    `tax_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `service_tax_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `tax_label` VARCHAR(50) NOT NULL DEFAULT 'Tax',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_quotations_client` (`client_id`),
    INDEX `idx_quotations_status` (`status`),
    INDEX `idx_quotations_date` (`date`),
    INDEX `idx_quotations_number` (`quotation_number`),
    CONSTRAINT `fk_quotations_client` FOREIGN KEY (`client_id`)
        REFERENCES `clients`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.6 `quotation_items` Table

```sql
CREATE TABLE `quotation_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `quotation_id` BIGINT UNSIGNED NOT NULL,
    `scope_of_work` VARCHAR(500) NOT NULL,
    `task` TEXT NOT NULL,
    `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX `idx_quotation_items_quotation` (`quotation_id`),
    CONSTRAINT `fk_quotation_items_quotation` FOREIGN KEY (`quotation_id`)
        REFERENCES `quotations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.7 `quotation_payments` Table

```sql
CREATE TABLE `quotation_payments` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `quotation_id` BIGINT UNSIGNED NOT NULL,
    `amount` DECIMAL(15,2) NOT NULL,
    `payment_method` VARCHAR(50) NOT NULL,
    `payment_date` TIMESTAMP NOT NULL,
    `notes` TEXT NULL DEFAULT '',
    `date` TIMESTAMP NOT NULL COMMENT 'Record creation date',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX `idx_quotation_payments_quotation` (`quotation_id`),
    CONSTRAINT `fk_quotation_payments_quotation` FOREIGN KEY (`quotation_id`)
        REFERENCES `quotations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.8 `invoices` Table

```sql
CREATE TABLE `invoices` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `invoice_number` VARCHAR(50) NOT NULL UNIQUE,
    `quotation_id` BIGINT UNSIGNED NOT NULL,
    `client_id` BIGINT UNSIGNED NOT NULL,
    `date` TIMESTAMP NOT NULL,
    `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `service_tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `paid_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `payment_date` TIMESTAMP NULL,
    `payment_method` VARCHAR(50) NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'AED',
    `tax_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `service_tax_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `tax_label` VARCHAR(50) NOT NULL DEFAULT 'Tax',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_invoices_client` (`client_id`),
    INDEX `idx_invoices_quotation` (`quotation_id`),
    INDEX `idx_invoices_date` (`date`),
    INDEX `idx_invoices_number` (`invoice_number`),
    CONSTRAINT `fk_invoices_client` FOREIGN KEY (`client_id`)
        REFERENCES `clients`(`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_invoices_quotation` FOREIGN KEY (`quotation_id`)
        REFERENCES `quotations`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.9 `invoice_items` Table

```sql
CREATE TABLE `invoice_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `invoice_id` BIGINT UNSIGNED NOT NULL,
    `scope_of_work` VARCHAR(500) NOT NULL,
    `task` TEXT NOT NULL,
    `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX `idx_invoice_items_invoice` (`invoice_id`),
    CONSTRAINT `fk_invoice_items_invoice` FOREIGN KEY (`invoice_id`)
        REFERENCES `invoices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.10 `bank_accounts` Table

```sql
CREATE TABLE `bank_accounts` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `bank_name` VARCHAR(255) NOT NULL,
    `account_number` VARCHAR(100) NOT NULL,
    `branch` VARCHAR(255) NULL DEFAULT '',
    `ifsc_swift` VARCHAR(50) NULL DEFAULT '',
    `account_holder_name` VARCHAR(255) NOT NULL,
    `qr_code_url` VARCHAR(500) NULL DEFAULT '',
    `is_default` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.11 `organization_settings` Table

Singleton table (always has exactly one row with `id=1`).

```sql
CREATE TABLE `organization_settings` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `logo_url` VARCHAR(500) NULL DEFAULT '',
    `email` VARCHAR(255) NULL DEFAULT '',
    `contact` VARCHAR(50) NULL DEFAULT '',
    `website` VARCHAR(255) NULL DEFAULT '',
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL DEFAULT '',
    `state` VARCHAR(100) NULL DEFAULT '',
    `country` VARCHAR(100) NULL DEFAULT '',
    `postal_code` VARCHAR(20) NULL DEFAULT '',
    `registration_number` VARCHAR(100) NULL DEFAULT '',
    `bank_name` VARCHAR(255) NULL DEFAULT '',
    `bank_account` VARCHAR(100) NULL DEFAULT '',
    `bank_branch` VARCHAR(255) NULL DEFAULT '',
    `bank_ifsc` VARCHAR(50) NULL DEFAULT '',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.12 `tax_settings` Table

Singleton table (always has exactly one row with `id=1`).

```sql
CREATE TABLE `tax_settings` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tax_label` VARCHAR(50) NULL DEFAULT '',
    `tax_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `tax_id` VARCHAR(100) NULL DEFAULT '',
    `service_tax_label` VARCHAR(50) NULL DEFAULT 'Service Tax',
    `service_tax_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `service_tax_enabled` BOOLEAN NOT NULL DEFAULT FALSE,
    `tax_inclusive` BOOLEAN NOT NULL DEFAULT FALSE,
    `show_tax_breakdown` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.13 `boq_areas` Table

```sql
CREATE TABLE `boq_areas` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_boq_areas_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.14 `boq_categories` Table

```sql
CREATE TABLE `boq_categories` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_boq_categories_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.15 `boqs` Table

```sql
CREATE TABLE `boqs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `boq_number` VARCHAR(50) NOT NULL UNIQUE,
    `client_id` BIGINT UNSIGNED NOT NULL,
    `date` TIMESTAMP NOT NULL,
    `status` ENUM('Draft', 'Sent', 'Approved', 'Rejected') NOT NULL DEFAULT 'Draft',
    `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `total_discount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `tax_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `tax_label` VARCHAR(50) NOT NULL DEFAULT 'Tax',
    `service_tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `service_tax_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'AED',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_boqs_client` (`client_id`),
    INDEX `idx_boqs_status` (`status`),
    INDEX `idx_boqs_date` (`date`),
    INDEX `idx_boqs_number` (`boq_number`),
    CONSTRAINT `fk_boqs_client` FOREIGN KEY (`client_id`)
        REFERENCES `clients`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.16 `boq_items` Table

```sql
CREATE TABLE `boq_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `boq_id` BIGINT UNSIGNED NOT NULL,
    `area` VARCHAR(255) NOT NULL,
    `image_url` VARCHAR(500) NULL DEFAULT '',
    `category` VARCHAR(255) NOT NULL,
    `item_name` VARCHAR(500) NOT NULL,
    `unit_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `quantity` INT NOT NULL DEFAULT 1,
    `discount` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Discount percentage',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX `idx_boq_items_boq` (`boq_id`),
    CONSTRAINT `fk_boq_items_boq` FOREIGN KEY (`boq_id`)
        REFERENCES `boqs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.17 `general_settings` Table

Singleton table (always has exactly one row with `id=1`).

```sql
CREATE TABLE `general_settings` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'AED',
    `currency_symbol` VARCHAR(10) NOT NULL DEFAULT 'AED',
    `quotation_prefix` VARCHAR(20) NOT NULL DEFAULT 'QT',
    `invoice_prefix` VARCHAR(20) NOT NULL DEFAULT 'INV',
    `boq_prefix` VARCHAR(20) NOT NULL DEFAULT 'BOQ',
    `quotation_valid_days` INT NOT NULL DEFAULT 30,
    `payment_terms` VARCHAR(100) NOT NULL DEFAULT 'Net 30',
    `default_payment_method` VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
    `fiscal_year_start` VARCHAR(10) NOT NULL DEFAULT '01-01',
    `date_format` VARCHAR(20) NOT NULL DEFAULT 'DD/MM/YYYY',
    `time_zone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Dubai',
    `number_format` VARCHAR(20) NOT NULL DEFAULT '1,000.00',
    `decimal_places` INT NOT NULL DEFAULT 2,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. API Endpoints

### Important: JSON Key Naming Convention

The frontend expects **camelCase** JSON keys in all API responses and sends **camelCase** keys in request bodies. The Laravel backend must transform between snake_case (database columns) and camelCase (JSON). Use Eloquent API Resources or a global response transformer to handle this.

**Example:** Database column `client_id` must appear as `clientId` in JSON responses. The frontend will send `clientId` in request bodies, which the backend must convert to `client_id` before database operations.

---

### 4.1 Authentication

#### `POST /auth/login`

Authenticates a user and returns a Bearer token.

**Request Body:**
```json
{
    "email": "invoice@thisinteriors.com",
    "password": "THIS@123###"
}
```

**Validation Rules:**
| Field      | Rules                       |
| ---------- | --------------------------- |
| `email`    | required, string, email     |
| `password` | required, string, min:6     |

**Success Response (200):**
```json
{
    "token": "1|abc123tokenstring...",
    "message": "Login successful"
}
```

**Error Response (401):**
```json
{
    "message": "Invalid credentials"
}
```

**Implementation Notes:**
- Use Laravel Sanctum for token generation.
- The frontend stores the token in `localStorage` as `auth_token`.
- The frontend sends the token as `Authorization: Bearer {token}` on every subsequent request.

---

#### `POST /auth/logout`

Revokes the current user's token.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:** None

**Success Response (200):**
```json
{
    "message": "Logged out successfully"
}
```

**Implementation Notes:**
- Delete the current access token using `$request->user()->currentAccessToken()->delete()`.

---

### 4.2 Clients

#### `GET /clients`

Returns all clients.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
[
    {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "contact": "+971501234567",
        "address": "123 Business Bay",
        "pin": "12345",
        "state": "Dubai",
        "country": "UAE",
        "createdAt": "2024-01-15T10:30:00Z"
    }
]
```

**Note:** The response MUST be a flat JSON array (not wrapped in a `data` key). This applies to all list endpoints.

---

#### `GET /clients/{id}`

Returns a single client by ID.

**Success Response (200):**
```json
{
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "contact": "+971501234567",
    "address": "123 Business Bay",
    "pin": "12345",
    "state": "Dubai",
    "country": "UAE",
    "createdAt": "2024-01-15T10:30:00Z"
}
```

**Error Response (404):**
```json
{
    "message": "Client not found"
}
```

---

#### `POST /clients`

Creates a new client.

**Request Body:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "contact": "+971501234567",
    "address": "123 Business Bay",
    "pin": "12345",
    "state": "Dubai",
    "country": "UAE"
}
```

**Validation Rules:**
| Field     | Rules                          |
| --------- | ------------------------------ |
| `name`    | required, string, max:255      |
| `email`   | required, email, max:255       |
| `contact` | required, string, max:50       |
| `address` | required, string               |
| `pin`     | nullable, string, max:20       |
| `state`   | nullable, string, max:100      |
| `country` | required, string, max:100      |

**Success Response (201):**
Returns the created client object with `id` and `createdAt`.

---

#### `PUT /clients/{id}`

Updates an existing client.

**Request Body:** Same as POST (all fields).

**Success Response (200):**
Returns the updated client object.

---

#### `DELETE /clients/{id}`

Deletes a client. Should fail if client has associated quotations, invoices, or BOQs.

**Success Response (200):**
```json
{
    "message": "Client deleted successfully"
}
```

**Error Response (409):**
```json
{
    "message": "Cannot delete client with existing quotations or invoices"
}
```

---

### 4.3 Scope of Work

#### `GET /scopeOfWork`

Returns all scope of work entries.

**Success Response (200):**
```json
[
    {
        "id": 1,
        "name": "CAD drawings",
        "description": null,
        "isActive": true,
        "createdAt": "2024-01-10T10:00:00Z",
        "updatedAt": "2025-11-01T06:14:16Z"
    }
]
```

---

#### `GET /scopeOfWork/{id}`

Returns a single scope of work entry.

**Success Response (200):**
```json
{
    "id": 1,
    "name": "CAD drawings",
    "description": null,
    "isActive": true,
    "createdAt": "2024-01-10T10:00:00Z",
    "updatedAt": "2025-11-01T06:14:16Z"
}
```

---

#### `POST /scopeOfWork`

Creates a new scope of work entry.

**Request Body:**
```json
{
    "name": "CAD drawings",
    "description": "Detailed CAD drawings for the project",
    "isActive": true
}
```

**Validation Rules:**
| Field         | Rules                     |
| ------------- | ------------------------- |
| `name`        | required, string, max:500 |
| `description` | nullable, string          |
| `isActive`    | required, boolean         |

**Success Response (201):**
Returns the created scope of work object.

---

#### `PUT /scopeOfWork/{id}`

Updates a scope of work entry.

**Request Body:** Same as POST.

**Success Response (200):**
Returns the updated object.

---

#### `DELETE /scopeOfWork/{id}`

Deletes a scope of work entry. Should fail if tasks reference this scope.

**Success Response (200):**
```json
{
    "message": "Scope of work deleted successfully"
}
```

---

### 4.4 Tasks

#### `GET /tasks`

Returns all tasks.

**Success Response (200):**
```json
[
    {
        "id": 1,
        "scopeOfWorkId": 1,
        "description": "Space Planning, Detailed Layouts, Concept Design, and Permit Drawings",
        "estimatedHours": 0,
        "isActive": true,
        "createdAt": "2024-01-10T10:00:00Z",
        "updatedAt": "2025-11-01T06:06:55Z"
    }
]
```

---

#### `GET /tasks?scopeOfWorkId={id}`

Returns all tasks filtered by scope of work ID.

**Query Parameters:**
| Param           | Type    | Description                        |
| --------------- | ------- | ---------------------------------- |
| `scopeOfWorkId` | integer | Filter tasks by scope of work ID   |

**Success Response (200):**
Returns an array of tasks belonging to the specified scope of work.

---

#### `GET /tasks/{id}`

Returns a single task by ID.

---

#### `POST /tasks`

Creates a new task.

**Request Body:**
```json
{
    "scopeOfWorkId": 1,
    "description": "Space Planning and Layout Design",
    "estimatedHours": 5,
    "isActive": true
}
```

**Validation Rules:**
| Field            | Rules                                   |
| ---------------- | --------------------------------------- |
| `scopeOfWorkId`  | required, integer, exists:scope_of_work,id |
| `description`    | required, string                        |
| `estimatedHours` | nullable, numeric, min:0                |
| `isActive`       | required, boolean                       |

**Success Response (201):**
Returns the created task object.

---

#### `PUT /tasks/{id}`

Updates a task.

**Request Body:** Same as POST.

**Success Response (200):**
Returns the updated task object.

---

#### `DELETE /tasks/{id}`

Deletes a task.

**Success Response (200):**
```json
{
    "message": "Task deleted successfully"
}
```

---

### 4.5 Quotations

#### `GET /quotations`

Returns all quotations with their nested `items` and `payments` arrays.

**Success Response (200):**
```json
[
    {
        "id": 1,
        "quotationNumber": "QT-2025-0001",
        "clientId": 1,
        "date": "2025-11-07T08:14:47Z",
        "items": [
            {
                "scopeOfWork": "CAD drawings",
                "task": "3D renders",
                "amount": 100
            },
            {
                "scopeOfWork": "Design Concept & Proposal",
                "task": "Space Planning, Detailed Layouts, Concept Design, and Permit Drawings",
                "amount": 150
            }
        ],
        "subtotal": 250,
        "taxAmount": 12.5,
        "serviceTaxAmount": 0,
        "totalAmount": 262.5,
        "status": "Fully Paid",
        "paidAmount": 262.5,
        "payments": [
            {
                "amount": 62.5,
                "paymentMethod": "Cash",
                "paymentDate": "2025-11-07T08:23:29Z",
                "notes": "1st Payment",
                "date": "2025-11-07T08:24:32Z"
            },
            {
                "amount": 200,
                "paymentMethod": "Cheque",
                "paymentDate": "2025-11-07T08:27:51Z",
                "notes": "Final Payment",
                "date": "2025-11-07T08:28:36Z"
            }
        ],
        "currency": "AED",
        "notes": "Test Notes",
        "taxPercent": 5,
        "serviceTaxPercent": 0,
        "taxLabel": "VAT",
        "createdAt": "2025-11-07T08:18:47Z",
        "updatedAt": "2025-11-07T08:28:36Z"
    }
]
```

**CRITICAL:** The `items` and `payments` arrays MUST be included inline in the quotation object. They are stored in separate database tables (`quotation_items` and `quotation_payments`) but must be returned as nested arrays within the quotation JSON. This is how the frontend expects the data.

---

#### `GET /quotations?status={status}`

Filter quotations by status.

**Query Parameters:**
| Param    | Type   | Description                                          |
| -------- | ------ | ---------------------------------------------------- |
| `status` | string | One of: `Performa`, `Partially Paid`, `Fully Paid`   |

---

#### `GET /quotations?date_gte={startDate}&date_lte={endDate}`

Filter quotations by date range.

**Query Parameters:**
| Param      | Type   | Description                              |
| ---------- | ------ | ---------------------------------------- |
| `date_gte` | string | Start date (ISO 8601), inclusive          |
| `date_lte` | string | End date (ISO 8601), inclusive            |

---

#### `GET /quotations/{id}`

Returns a single quotation with nested `items` and `payments`.

---

#### `POST /quotations`

Creates a new quotation.

**Request Body:**
```json
{
    "quotationNumber": "QT-2026-0001",
    "clientId": 1,
    "date": "2026-02-08T10:00:00Z",
    "items": [
        {
            "scopeOfWork": "CAD drawings",
            "task": "Space Planning and Layout Design",
            "amount": 500
        }
    ],
    "subtotal": 500,
    "taxAmount": 25,
    "serviceTaxAmount": 0,
    "totalAmount": 525,
    "status": "Performa",
    "paidAmount": 0,
    "payments": [],
    "currency": "AED",
    "notes": "Initial quotation",
    "taxPercent": 5,
    "serviceTaxPercent": 0,
    "taxLabel": "VAT"
}
```

**Validation Rules:**
| Field               | Rules                                              |
| ------------------- | -------------------------------------------------- |
| `quotationNumber`   | required, string, unique:quotations,quotation_number |
| `clientId`          | required, integer, exists:clients,id               |
| `date`              | required, date (ISO 8601)                          |
| `items`             | required, array, min:1                             |
| `items.*.scopeOfWork` | required, string                                |
| `items.*.task`      | required, string                                   |
| `items.*.amount`    | required, numeric, min:0                           |
| `subtotal`          | required, numeric, min:0                           |
| `taxAmount`         | required, numeric, min:0                           |
| `serviceTaxAmount`  | required, numeric, min:0                           |
| `totalAmount`       | required, numeric, min:0                           |
| `status`            | required, in:Performa,Partially Paid,Fully Paid    |
| `paidAmount`        | required, numeric, min:0                           |
| `payments`          | required, array                                    |
| `currency`          | required, string, max:10                           |
| `notes`             | nullable, string                                   |
| `taxPercent`        | required, numeric, min:0                           |
| `serviceTaxPercent` | required, numeric, min:0                           |
| `taxLabel`          | required, string, max:50                           |

**Success Response (201):**
Returns the created quotation with nested `items` and `payments`.

**Implementation Notes:**
- Store `items` in the `quotation_items` table.
- Store `payments` in the `quotation_payments` table.
- Always return `items` and `payments` as nested arrays in the response.

---

#### `PUT /quotations/{id}`

Updates a quotation. The frontend sends the entire quotation object including updated `items` and `payments` arrays.

**Request Body:** Same structure as POST.

**Implementation Notes:**
- On update, delete all existing `quotation_items` and `quotation_payments` for this quotation and re-insert the new ones from the request (replace strategy).
- Wrap in a database transaction.

**Success Response (200):**
Returns the updated quotation with nested `items` and `payments`.

---

#### `DELETE /quotations/{id}`

Deletes a quotation and its related items and payments (cascaded by FK).

**Success Response (200):**
```json
{
    "message": "Quotation deleted successfully"
}
```

---

### 4.6 Invoices

#### `GET /invoices`

Returns all invoices with their nested `items` array.

**Success Response (200):**
```json
[
    {
        "id": 1,
        "invoiceNumber": "INV-2025-0001",
        "quotationId": 1,
        "clientId": 1,
        "date": "2025-11-07T08:24:32Z",
        "items": [
            {
                "scopeOfWork": "CAD drawings",
                "task": "3D renders",
                "amount": 23.81
            },
            {
                "scopeOfWork": "Design Concept & Proposal",
                "task": "Space Planning, Detailed Layouts, Concept Design, and Permit Drawings",
                "amount": 35.71
            }
        ],
        "subtotal": 59.52,
        "taxAmount": 2.98,
        "serviceTaxAmount": 0,
        "totalAmount": 62.5,
        "paidAmount": 62.5,
        "paymentDate": "2025-11-07T08:23:29Z",
        "paymentMethod": "Cash",
        "currency": "AED",
        "taxPercent": 5,
        "serviceTaxPercent": 0,
        "taxLabel": "VAT",
        "notes": "1st Payment",
        "createdAt": "2025-11-07T08:24:32Z"
    }
]
```

---

#### `GET /invoices?date_gte={startDate}&date_lte={endDate}`

Filter invoices by date range.

**Query Parameters:**
| Param      | Type   | Description                             |
| ---------- | ------ | --------------------------------------- |
| `date_gte` | string | Start date (ISO 8601), inclusive         |
| `date_lte` | string | End date (ISO 8601), inclusive           |

---

#### `GET /invoices?clientId={clientId}`

Filter invoices by client.

**Query Parameters:**
| Param      | Type    | Description          |
| ---------- | ------- | -------------------- |
| `clientId` | integer | Client ID to filter  |

---

#### `GET /invoices/{id}`

Returns a single invoice with nested `items`.

---

#### `POST /invoices`

Creates a new invoice.

**Request Body:**
```json
{
    "invoiceNumber": "INV-2026-0001",
    "quotationId": 1,
    "clientId": 1,
    "date": "2026-02-08T10:00:00Z",
    "items": [
        {
            "scopeOfWork": "CAD drawings",
            "task": "Space Planning and Layout Design",
            "amount": 500
        }
    ],
    "subtotal": 500,
    "taxAmount": 25,
    "serviceTaxAmount": 0,
    "totalAmount": 525,
    "paidAmount": 525,
    "paymentDate": "2026-02-08T10:00:00Z",
    "paymentMethod": "Bank Transfer",
    "currency": "AED",
    "taxPercent": 5,
    "serviceTaxPercent": 0,
    "taxLabel": "VAT",
    "notes": "Payment received"
}
```

**Validation Rules:**
| Field                  | Rules                                           |
| ---------------------- | ----------------------------------------------- |
| `invoiceNumber`        | required, string, unique:invoices,invoice_number |
| `quotationId`          | required, integer, exists:quotations,id          |
| `clientId`             | required, integer, exists:clients,id             |
| `date`                 | required, date (ISO 8601)                        |
| `items`                | required, array, min:1                           |
| `items.*.scopeOfWork`  | required, string                                 |
| `items.*.task`         | required, string                                 |
| `items.*.amount`       | required, numeric, min:0                         |
| `subtotal`             | required, numeric, min:0                         |
| `taxAmount`            | required, numeric, min:0                         |
| `serviceTaxAmount`     | required, numeric, min:0                         |
| `totalAmount`          | required, numeric, min:0                         |
| `paidAmount`           | required, numeric, min:0                         |
| `paymentDate`          | nullable, date (ISO 8601)                        |
| `paymentMethod`        | nullable, string, max:50                         |
| `currency`             | required, string, max:10                         |
| `taxPercent`           | required, numeric, min:0                         |
| `serviceTaxPercent`    | required, numeric, min:0                         |
| `taxLabel`             | required, string, max:50                         |
| `notes`                | nullable, string                                 |

**Success Response (201):**
Returns the created invoice with nested `items`.

---

#### `PUT /invoices/{id}`

Updates an invoice. Replace strategy for `items`.

**Request Body:** Same structure as POST.

**Success Response (200):**
Returns the updated invoice with nested `items`.

---

#### `DELETE /invoices/{id}`

Deletes an invoice and its related items (cascaded by FK).

**Success Response (200):**
```json
{
    "message": "Invoice deleted successfully"
}
```

---

### 4.7 Bank Accounts

#### `GET /bankAccounts`

Returns all bank accounts.

**Success Response (200):**
```json
[
    {
        "id": 1,
        "bankName": "Standard Chartered",
        "accountNumber": "1234567890",
        "branch": "Dubai",
        "ifscSwift": "XYZ000012345",
        "accountHolderName": "THIS INTERIORS",
        "qrCodeUrl": "",
        "isDefault": true,
        "createdAt": "2026-02-08T00:00:00Z"
    }
]
```

---

#### `GET /bankAccounts/{id}`

Returns a single bank account.

---

#### `POST /bankAccounts`

Creates a new bank account.

**Request Body:**
```json
{
    "bankName": "Standard Chartered",
    "accountNumber": "1234567890",
    "branch": "Dubai",
    "ifscSwift": "XYZ000012345",
    "accountHolderName": "THIS INTERIORS",
    "qrCodeUrl": "",
    "isDefault": true
}
```

**Validation Rules:**
| Field               | Rules                     |
| ------------------- | ------------------------- |
| `bankName`          | required, string, max:255 |
| `accountNumber`     | required, string, max:100 |
| `branch`            | nullable, string, max:255 |
| `ifscSwift`         | nullable, string, max:50  |
| `accountHolderName` | required, string, max:255 |
| `qrCodeUrl`         | nullable, string, max:500 |
| `isDefault`         | required, boolean         |

**Success Response (201):**
Returns the created bank account.

**Implementation Notes:**
- If `isDefault` is set to `true`, set all other bank accounts' `isDefault` to `false`.

---

#### `PUT /bankAccounts/{id}`

Updates a bank account.

**Request Body:** Same as POST.

**Success Response (200):**
Returns the updated bank account.

---

#### `DELETE /bankAccounts/{id}`

Deletes a bank account.

**Success Response (200):**
```json
{
    "message": "Bank account deleted successfully"
}
```

---

### 4.8 Organization Settings (Singleton)

#### `GET /organizationSettings/1`

Returns the organization settings.

**Success Response (200):**
```json
{
    "id": 1,
    "name": "THIS INTERIORS",
    "logoUrl": "https://thisinteriors.com/wp-content/uploads/2023/05/NEW-FINAL-THIS-Logo-2.png",
    "email": "info@thisinteriors.com",
    "contact": "+971 58 944 7432",
    "website": "www.thisinteriors.com",
    "address": "Office 1009, Prism Tower - Business Bay",
    "city": "Dubai",
    "state": "",
    "country": "United Arab Emirates",
    "postalCode": "",
    "registrationNumber": "ABCDE12345",
    "bankName": "Standard Chartered",
    "bankAccount": "1234567890",
    "bankBranch": "Dubai",
    "bankIFSC": "XYZ000012345"
}
```

---

#### `PUT /organizationSettings/1`

Updates the organization settings.

**Request Body:**
```json
{
    "id": 1,
    "name": "THIS INTERIORS",
    "logoUrl": "https://example.com/logo.png",
    "email": "info@thisinteriors.com",
    "contact": "+971 58 944 7432",
    "website": "www.thisinteriors.com",
    "address": "Office 1009, Prism Tower - Business Bay",
    "city": "Dubai",
    "state": "",
    "country": "United Arab Emirates",
    "postalCode": "",
    "registrationNumber": "ABCDE12345",
    "bankName": "Standard Chartered",
    "bankAccount": "1234567890",
    "bankBranch": "Dubai",
    "bankIFSC": "XYZ000012345"
}
```

**Note:** The frontend always sends `{ ...data, id: 1 }`. The backend must accept the `id` field in the body and always update record with `id=1`.

**Validation Rules:**
| Field                | Rules                      |
| -------------------- | -------------------------- |
| `name`               | required, string, max:255  |
| `logoUrl`            | nullable, string, max:500  |
| `email`              | nullable, email, max:255   |
| `contact`            | nullable, string, max:50   |
| `website`            | nullable, string, max:255  |
| `address`            | nullable, string           |
| `city`               | nullable, string, max:100  |
| `state`              | nullable, string, max:100  |
| `country`            | nullable, string, max:100  |
| `postalCode`         | nullable, string, max:20   |
| `registrationNumber` | nullable, string, max:100  |
| `bankName`           | nullable, string, max:255  |
| `bankAccount`        | nullable, string, max:100  |
| `bankBranch`         | nullable, string, max:255  |
| `bankIFSC`           | nullable, string, max:50   |

**Success Response (200):**
Returns the updated organization settings object.

---

### 4.9 Tax Settings (Singleton)

#### `GET /taxSettings/1`

Returns the tax settings.

**Success Response (200):**
```json
{
    "id": 1,
    "taxLabel": "",
    "taxPercent": 0,
    "taxId": "",
    "serviceTaxLabel": "Service Tax",
    "serviceTaxPercent": 0,
    "serviceTaxEnabled": false,
    "taxInclusive": false,
    "showTaxBreakdown": false
}
```

---

#### `PUT /taxSettings/1`

Updates the tax settings.

**Request Body:**
```json
{
    "id": 1,
    "taxLabel": "VAT",
    "taxPercent": 5,
    "taxId": "TRN123456",
    "serviceTaxLabel": "Service Tax",
    "serviceTaxPercent": 0,
    "serviceTaxEnabled": false,
    "taxInclusive": false,
    "showTaxBreakdown": true
}
```

**Note:** The frontend always sends `{ ...data, id: 1 }`.

**Validation Rules:**
| Field                | Rules                      |
| -------------------- | -------------------------- |
| `taxLabel`           | nullable, string, max:50   |
| `taxPercent`         | required, numeric, min:0   |
| `taxId`              | nullable, string, max:100  |
| `serviceTaxLabel`    | nullable, string, max:50   |
| `serviceTaxPercent`  | required, numeric, min:0   |
| `serviceTaxEnabled`  | required, boolean          |
| `taxInclusive`       | required, boolean          |
| `showTaxBreakdown`   | required, boolean          |

**Success Response (200):**
Returns the updated tax settings object.

---

### 4.10 BOQ Areas

#### `GET /boqAreas`

Returns all BOQ areas.

**Success Response (200):**
```json
[
    {
        "id": 1,
        "name": "Entrance",
        "isActive": true,
        "createdAt": "2026-02-08T00:00:00Z",
        "updatedAt": "2026-02-08T10:55:54Z"
    }
]
```

---

#### `GET /boqAreas/{id}`

Returns a single BOQ area.

---

#### `POST /boqAreas`

Creates a new BOQ area.

**Request Body:**
```json
{
    "name": "Entrance",
    "isActive": true
}
```

**Validation Rules:**
| Field      | Rules                     |
| ---------- | ------------------------- |
| `name`     | required, string, max:255 |
| `isActive` | required, boolean         |

**Success Response (201):**
Returns the created BOQ area.

---

#### `PUT /boqAreas/{id}`

Updates a BOQ area.

**Request Body:** Same as POST.

**Success Response (200):**
Returns the updated BOQ area.

---

#### `DELETE /boqAreas/{id}`

Deletes a BOQ area.

**Success Response (200):**
```json
{
    "message": "BOQ area deleted successfully"
}
```

---

### 4.11 BOQ Categories

#### `GET /boqCategories`

Returns all BOQ categories.

**Success Response (200):**
```json
[
    {
        "id": 1,
        "name": "Furniture",
        "isActive": true,
        "createdAt": "2026-02-08T00:00:00Z"
    }
]
```

---

#### `GET /boqCategories/{id}`

Returns a single BOQ category.

---

#### `POST /boqCategories`

Creates a new BOQ category.

**Request Body:**
```json
{
    "name": "Furniture",
    "isActive": true
}
```

**Validation Rules:**
| Field      | Rules                     |
| ---------- | ------------------------- |
| `name`     | required, string, max:255 |
| `isActive` | required, boolean         |

**Success Response (201):**
Returns the created BOQ category.

---

#### `PUT /boqCategories/{id}`

Updates a BOQ category.

**Request Body:** Same as POST.

**Success Response (200):**
Returns the updated BOQ category.

---

#### `DELETE /boqCategories/{id}`

Deletes a BOQ category.

**Success Response (200):**
```json
{
    "message": "BOQ category deleted successfully"
}
```

---

### 4.12 BOQs (Bill of Quantities)

#### `GET /boqs`

Returns all BOQs with their nested `items` array.

**Success Response (200):**
```json
[
    {
        "id": 1,
        "boqNumber": "BOQ-2026-0001",
        "clientId": 1,
        "date": "2026-02-08T00:00:00Z",
        "status": "Approved",
        "items": [
            {
                "area": "Entrance",
                "imageUrl": "",
                "category": "Dining Chair",
                "itemName": "Test",
                "unitPrice": 3000,
                "quantity": 31,
                "discount": 10
            }
        ],
        "subtotal": 93000,
        "totalDiscount": 9300,
        "taxAmount": 0,
        "taxPercent": 0,
        "taxLabel": "Tax",
        "serviceTaxAmount": 0,
        "serviceTaxPercent": 0,
        "totalAmount": 83700,
        "currency": "AED",
        "notes": "Test BOQ",
        "updatedAt": "2026-02-08T10:55:26Z"
    }
]
```

---

#### `GET /boqs?clientId={clientId}`

Filter BOQs by client.

**Query Parameters:**
| Param      | Type    | Description         |
| ---------- | ------- | ------------------- |
| `clientId` | integer | Client ID to filter |

---

#### `GET /boqs/{id}`

Returns a single BOQ with nested `items`.

---

#### `POST /boqs`

Creates a new BOQ.

**Request Body:**
```json
{
    "boqNumber": "BOQ-2026-0001",
    "clientId": 1,
    "date": "2026-02-08T00:00:00Z",
    "status": "Draft",
    "items": [
        {
            "area": "Living Room",
            "imageUrl": "",
            "category": "Sofa",
            "itemName": "3-Seater Sofa",
            "unitPrice": 5000,
            "quantity": 1,
            "discount": 0
        }
    ],
    "subtotal": 5000,
    "totalDiscount": 0,
    "taxAmount": 250,
    "taxPercent": 5,
    "taxLabel": "VAT",
    "serviceTaxAmount": 0,
    "serviceTaxPercent": 0,
    "totalAmount": 5250,
    "currency": "AED",
    "notes": ""
}
```

**Validation Rules:**
| Field                  | Rules                                    |
| ---------------------- | ---------------------------------------- |
| `boqNumber`            | required, string, unique:boqs,boq_number |
| `clientId`             | required, integer, exists:clients,id     |
| `date`                 | required, date (ISO 8601)                |
| `status`               | required, in:Draft,Sent,Approved,Rejected |
| `items`                | required, array, min:1                   |
| `items.*.area`         | required, string                         |
| `items.*.imageUrl`     | nullable, string                         |
| `items.*.category`     | required, string                         |
| `items.*.itemName`     | required, string                         |
| `items.*.unitPrice`    | required, numeric, min:0                 |
| `items.*.quantity`     | required, integer, min:1                 |
| `items.*.discount`     | required, numeric, min:0, max:100        |
| `subtotal`             | required, numeric, min:0                 |
| `totalDiscount`        | required, numeric, min:0                 |
| `taxAmount`            | required, numeric, min:0                 |
| `taxPercent`           | required, numeric, min:0                 |
| `taxLabel`             | required, string, max:50                 |
| `serviceTaxAmount`     | required, numeric, min:0                 |
| `serviceTaxPercent`    | required, numeric, min:0                 |
| `totalAmount`          | required, numeric, min:0                 |
| `currency`             | required, string, max:10                 |
| `notes`                | nullable, string                         |

**Success Response (201):**
Returns the created BOQ with nested `items`.

---

#### `PUT /boqs/{id}`

Updates a BOQ. Replace strategy for `items`.

**Request Body:** Same structure as POST.

**Success Response (200):**
Returns the updated BOQ with nested `items`.

---

#### `DELETE /boqs/{id}`

Deletes a BOQ and its related items (cascaded by FK).

**Success Response (200):**
```json
{
    "message": "BOQ deleted successfully"
}
```

---

### 4.13 General Settings (Singleton)

#### `GET /generalSettings/1`

Returns the general settings.

**Success Response (200):**
```json
{
    "id": 1,
    "currency": "AED",
    "currencySymbol": "AED",
    "quotationPrefix": "PI",
    "invoicePrefix": "INV",
    "boqPrefix": "BOQ",
    "quotationValidDays": 30,
    "paymentTerms": "Net 30",
    "defaultPaymentMethod": "Online Payment",
    "fiscalYearStart": "01-01",
    "dateFormat": "DD/MM/YYYY",
    "timeZone": "Asia/Dubai",
    "numberFormat": "1,000.00",
    "decimalPlaces": 2
}
```

---

#### `PUT /generalSettings/1`

Updates the general settings.

**Request Body:**
```json
{
    "id": 1,
    "currency": "AED",
    "currencySymbol": "AED",
    "quotationPrefix": "PI",
    "invoicePrefix": "INV",
    "boqPrefix": "BOQ",
    "quotationValidDays": 30,
    "paymentTerms": "Net 30",
    "defaultPaymentMethod": "Online Payment",
    "fiscalYearStart": "01-01",
    "dateFormat": "DD/MM/YYYY",
    "timeZone": "Asia/Dubai",
    "numberFormat": "1,000.00",
    "decimalPlaces": 2
}
```

**Note:** The frontend always sends `{ ...data, id: 1 }`.

**Validation Rules:**
| Field                  | Rules                        |
| ---------------------- | ---------------------------- |
| `currency`             | required, string, max:10     |
| `currencySymbol`       | required, string, max:10     |
| `quotationPrefix`      | required, string, max:20     |
| `invoicePrefix`        | required, string, max:20     |
| `boqPrefix`            | required, string, max:20     |
| `quotationValidDays`   | required, integer, min:1     |
| `paymentTerms`         | required, string, max:100    |
| `defaultPaymentMethod` | required, string, max:50     |
| `fiscalYearStart`      | required, string, max:10     |
| `dateFormat`           | required, string, max:20     |
| `timeZone`             | required, string, max:50     |
| `numberFormat`         | required, string, max:20     |
| `decimalPlaces`        | required, integer, min:0, max:4 |

**Success Response (200):**
Returns the updated general settings object.

---

## 5. Dashboard API

### `GET /dashboard`

A single endpoint that returns all aggregated dashboard data. This replaces the current frontend approach of making four separate API calls (quotations, invoices, clients, BOQs) and computing stats client-side.

**Query Parameters (all optional):**
| Param         | Type   | Description                                                     |
| ------------- | ------ | --------------------------------------------------------------- |
| `date_filter` | string | Preset filter: `today`, `last_week`, `last_month`, `all`        |
| `start_date`  | string | Custom start date (ISO 8601). Used when `date_filter` is absent |
| `end_date`    | string | Custom end date (ISO 8601). Used when `date_filter` is absent   |

**Date Filter Logic:**
- `today` - Records from the start of today to end of today.
- `last_week` - Records from 7 days ago to now.
- `last_month` - Records from 30 days ago to now (this is the default if no filter is provided).
- `all` - No date filtering. Return all records.
- If `start_date` and `end_date` are provided (and `date_filter` is absent), filter by that custom range.
- Date filtering applies to quotations, invoices, and BOQs based on their `date` field.
- Total clients count is NOT filtered by date (always returns the total count).

**Success Response (200):**
```json
{
    "totalInvoices": 7,
    "totalInvoiceAmount": 1284.50,
    "totalQuotations": 7,
    "totalQuotationAmount": 3482.50,
    "dueAmount": 2198.00,
    "totalClients": 3,
    "totalBoqs": 1,
    "totalBoqAmount": 83700.00,
    "boqApproved": 1,
    "boqPending": 0,
    "recentQuotations": [
        {
            "id": 8,
            "quotationNumber": "PI-2026-0008",
            "clientId": 1,
            "date": "2026-02-08T03:38:39Z",
            "totalAmount": 200,
            "status": "Fully Paid",
            "paidAmount": 200,
            "currency": "AED"
        },
        {
            "id": 7,
            "quotationNumber": "QT-2026-0007",
            "clientId": 3,
            "date": "2026-02-08T02:58:12Z",
            "totalAmount": 500,
            "status": "Partially Paid",
            "paidAmount": 200,
            "currency": "AED"
        },
        {
            "id": 6,
            "quotationNumber": "QT-2026-0006",
            "clientId": 1,
            "date": "2026-02-06T10:39:46Z",
            "totalAmount": 1000,
            "status": "Partially Paid",
            "paidAmount": 100,
            "currency": "AED"
        }
    ],
    "recentInvoices": [
        {
            "id": 7,
            "invoiceNumber": "INV-2026-0007",
            "clientId": 1,
            "date": "2026-02-08T03:39:16Z",
            "totalAmount": 200,
            "paidAmount": 200,
            "paymentMethod": "Bank Transfer",
            "currency": "AED"
        },
        {
            "id": 6,
            "invoiceNumber": "INV-2026-0006",
            "clientId": 3,
            "date": "2026-02-08T03:00:41Z",
            "totalAmount": 200,
            "paidAmount": 200,
            "paymentMethod": "Credit Card",
            "currency": "AED"
        },
        {
            "id": 5,
            "invoiceNumber": "INV-2026-0005",
            "clientId": 1,
            "date": "2026-02-06T10:41:18Z",
            "totalAmount": 100,
            "paidAmount": 100,
            "paymentMethod": "Bank Transfer",
            "currency": "AED"
        }
    ],
    "recentBoqs": [
        {
            "id": 1,
            "boqNumber": "BOQ-2026-0001",
            "clientId": 1,
            "date": "2026-02-08T00:00:00Z",
            "totalAmount": 83700,
            "status": "Approved",
            "currency": "AED"
        }
    ]
}
```

**Computation Logic:**

| Field                  | Calculation                                                                      |
| ---------------------- | -------------------------------------------------------------------------------- |
| `totalInvoices`        | Count of invoices within date range                                              |
| `totalInvoiceAmount`   | Sum of `total_amount` of invoices within date range                              |
| `totalQuotations`      | Count of quotations within date range                                            |
| `totalQuotationAmount` | Sum of `total_amount` of quotations within date range                            |
| `dueAmount`            | `totalQuotationAmount - totalInvoiceAmount` (min 0)                              |
| `totalClients`         | Total count of all clients (not date filtered)                                   |
| `totalBoqs`            | Count of BOQs within date range                                                  |
| `totalBoqAmount`       | Sum of `total_amount` of BOQs within date range                                  |
| `boqApproved`          | Count of BOQs with status `Approved` within date range                           |
| `boqPending`           | Count of BOQs where status is NOT `Approved` and NOT `Rejected` within date range |
| `recentQuotations`     | Latest 3 quotations within date range, sorted by `date` descending               |
| `recentInvoices`       | Latest 3 invoices within date range, sorted by `date` descending                 |
| `recentBoqs`           | Latest 3 BOQs within date range, sorted by `date` descending                     |

---

## 6. Authentication & Middleware

### Laravel Sanctum Setup

1. Install Sanctum:
```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

2. Add the `HasApiTokens` trait to the User model:
```php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
}
```

3. Configure Sanctum middleware in `app/Http/Kernel.php`:
```php
'api' => [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
],
```

### Route Configuration

All API routes should be defined in `routes/api.php`. Routes under `/api` prefix are automatically applied by Laravel.

```php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ScopeOfWorkController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\BankAccountController;
use App\Http\Controllers\OrganizationSettingController;
use App\Http\Controllers\TaxSettingController;
use App\Http\Controllers\BoqAreaController;
use App\Http\Controllers\BoqCategoryController;
use App\Http\Controllers\BoqController;
use App\Http\Controllers\GeneralSettingController;
use App\Http\Controllers\DashboardController;

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes (require Bearer token)
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Clients
    Route::apiResource('clients', ClientController::class);

    // Scope of Work
    Route::apiResource('scopeOfWork', ScopeOfWorkController::class);

    // Tasks
    Route::apiResource('tasks', TaskController::class);

    // Quotations
    Route::apiResource('quotations', QuotationController::class);

    // Invoices
    Route::apiResource('invoices', InvoiceController::class);

    // Bank Accounts
    Route::apiResource('bankAccounts', BankAccountController::class);

    // BOQ Areas
    Route::apiResource('boqAreas', BoqAreaController::class);

    // BOQ Categories
    Route::apiResource('boqCategories', BoqCategoryController::class);

    // BOQs
    Route::apiResource('boqs', BoqController::class);

    // Singleton Settings
    Route::get('/organizationSettings/{id}', [OrganizationSettingController::class, 'show']);
    Route::put('/organizationSettings/{id}', [OrganizationSettingController::class, 'update']);

    Route::get('/taxSettings/{id}', [TaxSettingController::class, 'show']);
    Route::put('/taxSettings/{id}', [TaxSettingController::class, 'update']);

    Route::get('/generalSettings/{id}', [GeneralSettingController::class, 'show']);
    Route::put('/generalSettings/{id}', [GeneralSettingController::class, 'update']);
});
```

### Token-Based Authentication Flow

1. The frontend sends `POST /api/auth/login` with email and password.
2. The backend validates credentials, creates a Sanctum token, and returns `{ "token": "..." }`.
3. The frontend stores the token in `localStorage` under the key `auth_token`.
4. On every subsequent request, the frontend sets the header `Authorization: Bearer {token}`.
5. On `POST /api/auth/logout`, the backend revokes the current token.
6. On receiving a `401` response, the frontend clears the token and redirects to `/login`.

---

## 7. Response Format Standards

### List Endpoints (GET all)

All list endpoints MUST return a **flat JSON array**, not wrapped in any envelope:

```json
[
    { "id": 1, "name": "..." },
    { "id": 2, "name": "..." }
]
```

Do NOT return Laravel's default paginated format or `{ "data": [...] }` wrapper. The frontend calls `response.data` on the Axios response, which is the parsed JSON body. If you wrap it in `{ "data": [...] }`, the frontend would need `response.data.data`, which is incorrect.

### Single Resource Endpoints (GET by ID)

Return a flat JSON object:

```json
{
    "id": 1,
    "name": "...",
    "email": "..."
}
```

### Create Endpoints (POST)

Return the created resource as a flat JSON object with HTTP status `201`.

### Update Endpoints (PUT)

Return the updated resource as a flat JSON object with HTTP status `200`.

### Delete Endpoints (DELETE)

Return a message with HTTP status `200`:

```json
{
    "message": "Resource deleted successfully"
}
```

### CamelCase JSON Keys

All JSON keys in responses MUST be camelCase. Use a global transformer or Eloquent API Resources. For example:

```php
// In your Eloquent model or a base controller/resource:
// Database: client_id, created_at, is_active
// JSON:     clientId,  createdAt,  isActive
```

**Recommended approach:** Create a base API Resource or use a middleware that converts all snake_case keys to camelCase in outbound JSON responses and converts camelCase to snake_case in inbound JSON request bodies.

Example using a trait or helper:

```php
// Helper function to convert array keys to camelCase
function arrayKeysToCamel(array $array): array
{
    $result = [];
    foreach ($array as $key => $value) {
        $camelKey = \Illuminate\Support\Str::camel($key);
        $result[$camelKey] = is_array($value) ? arrayKeysToCamel($value) : $value;
    }
    return $result;
}

// Helper function to convert array keys to snake_case
function arrayKeysToSnake(array $array): array
{
    $result = [];
    foreach ($array as $key => $value) {
        $snakeKey = \Illuminate\Support\Str::snake($key);
        $result[$snakeKey] = is_array($value) ? arrayKeysToSnake($value) : $value;
    }
    return $result;
}
```

### Date Format in JSON

All dates MUST be returned as ISO 8601 strings: `"2026-02-08T03:39:16.000000Z"`.

Laravel returns Carbon dates in this format by default when cast to `datetime`, which is compatible with what the frontend expects.

---

## 8. Error Handling

### Standard Error Response Format

All errors should return JSON in the following format:

```json
{
    "message": "Human-readable error message",
    "errors": {
        "fieldName": ["Validation error for this field"]
    }
}
```

### HTTP Status Codes

| Status | Usage                                         |
| ------ | --------------------------------------------- |
| `200`  | Successful GET, PUT, DELETE                    |
| `201`  | Successful POST (resource created)             |
| `400`  | Bad request (malformed JSON, invalid params)   |
| `401`  | Unauthorized (missing or invalid token)        |
| `403`  | Forbidden (authenticated but not authorized)   |
| `404`  | Resource not found                             |
| `409`  | Conflict (e.g., deleting client with invoices) |
| `422`  | Validation error                               |
| `500`  | Internal server error                          |

### Validation Error Response (422)

Laravel returns validation errors in this format by default:

```json
{
    "message": "The given data was invalid.",
    "errors": {
        "email": ["The email field is required."],
        "name": ["The name field must not be greater than 255 characters."]
    }
}
```

The frontend accesses errors via `error.response.data.message`.

### Not Found Error (404)

```json
{
    "message": "Client not found"
}
```

### Unauthorized Error (401)

```json
{
    "message": "Unauthenticated."
}
```

### Conflict Error (409)

```json
{
    "message": "Cannot delete client with existing quotations or invoices"
}
```

### Global Exception Handler

Configure `app/Exceptions/Handler.php` to return JSON for all API requests:

```php
public function render($request, Throwable $exception)
{
    if ($request->expectsJson() || $request->is('api/*')) {
        if ($exception instanceof ModelNotFoundException) {
            return response()->json([
                'message' => 'Resource not found'
            ], 404);
        }

        if ($exception instanceof AuthenticationException) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }
    }

    return parent::render($request, $exception);
}
```

---

## 9. Migration Commands

### Creating Migrations

```bash
php artisan make:migration create_clients_table
php artisan make:migration create_scope_of_work_table
php artisan make:migration create_tasks_table
php artisan make:migration create_quotations_table
php artisan make:migration create_quotation_items_table
php artisan make:migration create_quotation_payments_table
php artisan make:migration create_invoices_table
php artisan make:migration create_invoice_items_table
php artisan make:migration create_bank_accounts_table
php artisan make:migration create_organization_settings_table
php artisan make:migration create_tax_settings_table
php artisan make:migration create_boq_areas_table
php artisan make:migration create_boq_categories_table
php artisan make:migration create_boqs_table
php artisan make:migration create_boq_items_table
php artisan make:migration create_general_settings_table
```

### Running Migrations

```bash
# Run all migrations
php artisan migrate

# Rollback all and re-run
php artisan migrate:fresh

# Run with seeders
php artisan migrate:fresh --seed
```

### Example Migration File

`database/migrations/xxxx_xx_xx_create_clients_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('email', 255);
            $table->string('contact', 50);
            $table->text('address');
            $table->string('pin', 20)->nullable()->default('');
            $table->string('state', 100)->nullable()->default('');
            $table->string('country', 100)->default('UAE');
            $table->timestamps();

            $table->index('name');
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
```

`database/migrations/xxxx_xx_xx_create_quotations_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->string('quotation_number', 50)->unique();
            $table->foreignId('client_id')->constrained('clients')->restrictOnDelete();
            $table->timestamp('date');
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('service_tax_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->enum('status', ['Performa', 'Partially Paid', 'Fully Paid'])->default('Performa');
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->string('currency', 10)->default('AED');
            $table->text('notes')->nullable();
            $table->decimal('tax_percent', 5, 2)->default(0);
            $table->decimal('service_tax_percent', 5, 2)->default(0);
            $table->string('tax_label', 50)->default('Tax');
            $table->timestamps();

            $table->index('client_id');
            $table->index('status');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
```

---

## 10. Seeder Data

### User Seeder

`database/seeders/UserSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'THIS INTERIORS Admin',
            'email' => 'invoice@thisinteriors.com',
            'password' => Hash::make('THIS@123###'),
        ]);
    }
}
```

### Client Seeder

```php
<?php

namespace Database\Seeders;

use App\Models\Client;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        Client::insert([
            [
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'contact' => '+971501234567',
                'address' => '123 Business Bay',
                'pin' => '12345',
                'state' => 'Dubai',
                'country' => 'UAE',
                'created_at' => '2024-01-15 10:30:00',
                'updated_at' => '2024-01-15 10:30:00',
            ],
            [
                'name' => 'Bhaswar Bhuyan',
                'email' => 'bhaswar@assamdigital.com',
                'contact' => '9011223344',
                'address' => 'Beltola, Guwahati',
                'pin' => '781001',
                'state' => 'Assam',
                'country' => 'India',
                'created_at' => '2025-11-07 08:16:15',
                'updated_at' => '2025-11-07 08:16:15',
            ],
            [
                'name' => 'Bappi Das',
                'email' => 'bappi@assamdigital.com',
                'contact' => '+919638959503',
                'address' => 'Guwahati',
                'pin' => '781032',
                'state' => 'Assam',
                'country' => 'India',
                'created_at' => '2026-02-08 02:59:16',
                'updated_at' => '2026-02-08 02:59:16',
            ],
        ]);
    }
}
```

### Scope of Work Seeder

```php
<?php

namespace Database\Seeders;

use App\Models\ScopeOfWork;
use Illuminate\Database\Seeder;

class ScopeOfWorkSeeder extends Seeder
{
    public function run(): void
    {
        $scopes = [
            ['name' => 'CAD drawings', 'is_active' => true],
            ['name' => 'Design Concept & Proposal', 'is_active' => true],
            ['name' => 'Up to 12x 3D Visualizations & Renderings - 2 Rooms', 'is_active' => true],
            ['name' => 'Bill of Quantity/ FF&E', 'is_active' => true],
            ['name' => 'Schematic & Interior Design Drawings', 'is_active' => true],
            ['name' => 'Procurement Management (3 months included)', 'is_active' => true],
            ['name' => 'Installation', 'is_active' => false],
            ['name' => 'Test Scope 1', 'description' => 'Test Scope 1 Description', 'is_active' => true],
        ];

        foreach ($scopes as $scope) {
            ScopeOfWork::create($scope);
        }
    }
}
```

### Task Seeder

```php
<?php

namespace Database\Seeders;

use App\Models\Task;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $tasks = [
            ['scope_of_work_id' => 1, 'description' => 'Space Planning, Detailed Layouts, Concept Design, and Permit Drawings', 'is_active' => true],
            ['scope_of_work_id' => 2, 'description' => 'Market Insights, Initial Design Planning, Creative Concepts, Mood Boards, and Presentation with Furniture, Fixtures & Equipment (FF&E) Selections', 'is_active' => true],
            ['scope_of_work_id' => 3, 'description' => '3D renders', 'is_active' => true],
            ['scope_of_work_id' => 4, 'description' => 'Furniture, Fixtures & Equipment (FF&E) Selections List', 'is_active' => true],
            ['scope_of_work_id' => 5, 'description' => 'Overall Layout Plans, Ceiling Designs (RCP), Furniture Placement Plans, Materials and Finishes Schedule, Lighting & Electrical Layouts, and Custom Joinery Concepts', 'is_active' => true],
            ['scope_of_work_id' => 6, 'description' => 'Overseeing FF&E Procurement, Custom Furniture and Joinery Production, and Coordinating Installation – including detailed fit-out drawings. Final scope will be determined once the number of fit-outs is confirmed', 'is_active' => true],
            ['scope_of_work_id' => 7, 'description' => 'Styling & Staging', 'is_active' => true],
            ['scope_of_work_id' => 8, 'description' => 'Test Scope 1 Related Task Description...', 'estimated_hours' => 5, 'is_active' => true],
        ];

        foreach ($tasks as $task) {
            Task::create($task);
        }
    }
}
```

### Organization Settings Seeder

```php
<?php

namespace Database\Seeders;

use App\Models\OrganizationSetting;
use Illuminate\Database\Seeder;

class OrganizationSettingSeeder extends Seeder
{
    public function run(): void
    {
        OrganizationSetting::create([
            'name' => 'THIS INTERIORS',
            'logo_url' => 'https://thisinteriors.com/wp-content/uploads/2023/05/NEW-FINAL-THIS-Logo-2.png',
            'email' => 'info@thisinteriors.com',
            'contact' => '+971 58 944 7432',
            'website' => 'www.thisinteriors.com',
            'address' => 'Office 1009, Prism Tower - Business Bay',
            'city' => 'Dubai',
            'state' => '',
            'country' => 'United Arab Emirates',
            'postal_code' => '',
            'registration_number' => 'ABCDE12345',
            'bank_name' => 'Standard Chartered',
            'bank_account' => '1234567890',
            'bank_branch' => 'Dubai',
            'bank_ifsc' => 'XYZ000012345',
        ]);
    }
}
```

### Tax Settings Seeder

```php
<?php

namespace Database\Seeders;

use App\Models\TaxSetting;
use Illuminate\Database\Seeder;

class TaxSettingSeeder extends Seeder
{
    public function run(): void
    {
        TaxSetting::create([
            'tax_label' => '',
            'tax_percent' => 0,
            'tax_id' => '',
            'service_tax_label' => 'Service Tax',
            'service_tax_percent' => 0,
            'service_tax_enabled' => false,
            'tax_inclusive' => false,
            'show_tax_breakdown' => false,
        ]);
    }
}
```

### General Settings Seeder

```php
<?php

namespace Database\Seeders;

use App\Models\GeneralSetting;
use Illuminate\Database\Seeder;

class GeneralSettingSeeder extends Seeder
{
    public function run(): void
    {
        GeneralSetting::create([
            'currency' => 'AED',
            'currency_symbol' => 'AED',
            'quotation_prefix' => 'PI',
            'invoice_prefix' => 'INV',
            'boq_prefix' => 'BOQ',
            'quotation_valid_days' => 30,
            'payment_terms' => 'Net 30',
            'default_payment_method' => 'Online Payment',
            'fiscal_year_start' => '01-01',
            'date_format' => 'DD/MM/YYYY',
            'time_zone' => 'Asia/Dubai',
            'number_format' => '1,000.00',
            'decimal_places' => 2,
        ]);
    }
}
```

### Bank Account Seeder

```php
<?php

namespace Database\Seeders;

use App\Models\BankAccount;
use Illuminate\Database\Seeder;

class BankAccountSeeder extends Seeder
{
    public function run(): void
    {
        BankAccount::create([
            'bank_name' => 'Standard Chartered',
            'account_number' => '1234567890',
            'branch' => 'Dubai',
            'ifsc_swift' => 'XYZ000012345',
            'account_holder_name' => 'THIS INTERIORS',
            'qr_code_url' => '',
            'is_default' => true,
        ]);
    }
}
```

### BOQ Areas Seeder

```php
<?php

namespace Database\Seeders;

use App\Models\BoqArea;
use Illuminate\Database\Seeder;

class BoqAreaSeeder extends Seeder
{
    public function run(): void
    {
        $areas = [
            'Entrance', 'Hallway', 'Living Room', 'Dining Room',
            'Master Bedroom', 'Guest Bedroom', 'Master Bathroom',
            'Guest Bathroom', 'Kitchen', 'Dresser', 'Lobby', 'Terrace',
        ];

        foreach ($areas as $area) {
            BoqArea::create(['name' => $area, 'is_active' => true]);
        }
    }
}
```

### BOQ Categories Seeder

```php
<?php

namespace Database\Seeders;

use App\Models\BoqCategory;
use Illuminate\Database\Seeder;

class BoqCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'Furniture', 'Sofa', 'Coffee Table', 'Side Table',
            'Chairs', 'Dining Table', 'Dining Chair', 'Bed',
            'Lights and Lamps', 'Carpets and Rugs', 'Wallpaper',
            'Curtains and Sheers', 'Pelmets', 'Artworks',
            'Accessories', 'Cushions', 'Beddings', 'Installation',
        ];

        foreach ($categories as $category) {
            BoqCategory::create(['name' => $category, 'is_active' => true]);
        }
    }
}
```

### Main Database Seeder

`database/seeders/DatabaseSeeder.php`:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            ClientSeeder::class,
            ScopeOfWorkSeeder::class,
            TaskSeeder::class,
            OrganizationSettingSeeder::class,
            TaxSettingSeeder::class,
            GeneralSettingSeeder::class,
            BankAccountSeeder::class,
            BoqAreaSeeder::class,
            BoqCategorySeeder::class,
        ]);
    }
}
```

### Run Seeders

```bash
php artisan db:seed

# Or fresh migration + seed
php artisan migrate:fresh --seed
```

---

## 11. CORS Configuration

The frontend React application runs on a different origin (e.g., `http://localhost:3000` in development) and requires CORS headers.

### Laravel CORS Configuration

Edit `config/cors.php`:

```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000',      // React dev server
        'http://localhost:3001',      // Alternative React dev port
        'https://your-production-domain.com',  // Production frontend
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
```

### Important Notes

- In production, replace the wildcard origins with the actual frontend domain.
- The frontend sends `Content-Type: application/json` and `Authorization: Bearer {token}` headers. Both must be allowed.
- Preflight `OPTIONS` requests are handled automatically by Laravel's CORS middleware.

---

## 12. Environment Configuration

### `.env` File

```env
APP_NAME="THIS INTERIORS API"
APP_ENV=local
APP_KEY=base64:GENERATE_WITH_PHP_ARTISAN_KEY_GENERATE
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=this_interiors
DB_USERNAME=root
DB_PASSWORD=your_password

# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:3001

# App timezone (matches frontend general settings default)
APP_TIMEZONE=Asia/Dubai

# Log
LOG_CHANNEL=stack
LOG_LEVEL=debug
```

### Initial Setup Commands

```bash
# 1. Install dependencies
composer install

# 2. Generate application key
php artisan key:generate

# 3. Create the database
mysql -u root -p -e "CREATE DATABASE this_interiors CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. Run migrations
php artisan migrate

# 5. Seed the database
php artisan db:seed

# 6. Install Sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# 7. Start the development server
php artisan serve
```

After running the server, the API will be available at `http://localhost:8000/api`.

The frontend needs to set:
```
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

---

## Appendix A: Constants Reference

These are the constants used by the frontend. The backend should enforce these values via ENUMs and validation rules.

### Quotation Statuses
| Value            | Description                                    |
| ---------------- | ---------------------------------------------- |
| `Performa`       | Initial state, no payment received             |
| `Partially Paid` | Some payment received                          |
| `Fully Paid`     | Total amount has been paid                     |

### BOQ Statuses
| Value      | Description                       |
| ---------- | --------------------------------- |
| `Draft`    | BOQ is being prepared             |
| `Sent`     | BOQ has been sent to the client   |
| `Approved` | Client has approved the BOQ       |
| `Rejected` | Client has rejected the BOQ       |

### Payment Methods
| Value             |
| ----------------- |
| `Cash`            |
| `Bank Transfer`   |
| `Credit Card`     |
| `Debit Card`      |
| `Cheque`          |
| `Online Payment`  |

### Date Formats Supported
| Value          | Display Example |
| -------------- | --------------- |
| `DD/MM/YYYY`   | 08/02/2026      |
| `MM/DD/YYYY`   | 02/08/2026      |
| `YYYY-MM-DD`   | 2026-02-08      |
| `DD-MM-YYYY`   | 08-02-2026      |

---

## Appendix B: Full API Endpoint Summary Table

| Method   | Endpoint                          | Description                     | Auth Required |
| -------- | --------------------------------- | ------------------------------- | ------------- |
| `POST`   | `/api/auth/login`                 | User login                      | No            |
| `POST`   | `/api/auth/logout`                | User logout                     | Yes           |
| `GET`    | `/api/dashboard`                  | Dashboard aggregated data       | Yes           |
| `GET`    | `/api/clients`                    | List all clients                | Yes           |
| `GET`    | `/api/clients/{id}`               | Get single client               | Yes           |
| `POST`   | `/api/clients`                    | Create client                   | Yes           |
| `PUT`    | `/api/clients/{id}`               | Update client                   | Yes           |
| `DELETE` | `/api/clients/{id}`               | Delete client                   | Yes           |
| `GET`    | `/api/scopeOfWork`                | List all scope of work          | Yes           |
| `GET`    | `/api/scopeOfWork/{id}`           | Get single scope of work        | Yes           |
| `POST`   | `/api/scopeOfWork`                | Create scope of work            | Yes           |
| `PUT`    | `/api/scopeOfWork/{id}`           | Update scope of work            | Yes           |
| `DELETE` | `/api/scopeOfWork/{id}`           | Delete scope of work            | Yes           |
| `GET`    | `/api/tasks`                      | List all tasks                  | Yes           |
| `GET`    | `/api/tasks?scopeOfWorkId={id}`   | Filter tasks by scope           | Yes           |
| `GET`    | `/api/tasks/{id}`                 | Get single task                 | Yes           |
| `POST`   | `/api/tasks`                      | Create task                     | Yes           |
| `PUT`    | `/api/tasks/{id}`                 | Update task                     | Yes           |
| `DELETE` | `/api/tasks/{id}`                 | Delete task                     | Yes           |
| `GET`    | `/api/quotations`                 | List all quotations             | Yes           |
| `GET`    | `/api/quotations?status={s}`      | Filter quotations by status     | Yes           |
| `GET`    | `/api/quotations?date_gte=&date_lte=` | Filter by date range       | Yes           |
| `GET`    | `/api/quotations/{id}`            | Get single quotation            | Yes           |
| `POST`   | `/api/quotations`                 | Create quotation                | Yes           |
| `PUT`    | `/api/quotations/{id}`            | Update quotation                | Yes           |
| `DELETE` | `/api/quotations/{id}`            | Delete quotation                | Yes           |
| `GET`    | `/api/invoices`                   | List all invoices               | Yes           |
| `GET`    | `/api/invoices?date_gte=&date_lte=` | Filter by date range         | Yes           |
| `GET`    | `/api/invoices?clientId={id}`     | Filter invoices by client       | Yes           |
| `GET`    | `/api/invoices/{id}`              | Get single invoice              | Yes           |
| `POST`   | `/api/invoices`                   | Create invoice                  | Yes           |
| `PUT`    | `/api/invoices/{id}`              | Update invoice                  | Yes           |
| `DELETE` | `/api/invoices/{id}`              | Delete invoice                  | Yes           |
| `GET`    | `/api/bankAccounts`               | List all bank accounts          | Yes           |
| `GET`    | `/api/bankAccounts/{id}`          | Get single bank account         | Yes           |
| `POST`   | `/api/bankAccounts`               | Create bank account             | Yes           |
| `PUT`    | `/api/bankAccounts/{id}`          | Update bank account             | Yes           |
| `DELETE` | `/api/bankAccounts/{id}`          | Delete bank account             | Yes           |
| `GET`    | `/api/organizationSettings/1`     | Get organization settings       | Yes           |
| `PUT`    | `/api/organizationSettings/1`     | Update organization settings    | Yes           |
| `GET`    | `/api/taxSettings/1`              | Get tax settings                | Yes           |
| `PUT`    | `/api/taxSettings/1`              | Update tax settings             | Yes           |
| `GET`    | `/api/generalSettings/1`          | Get general settings            | Yes           |
| `PUT`    | `/api/generalSettings/1`          | Update general settings         | Yes           |
| `GET`    | `/api/boqAreas`                   | List all BOQ areas              | Yes           |
| `GET`    | `/api/boqAreas/{id}`              | Get single BOQ area             | Yes           |
| `POST`   | `/api/boqAreas`                   | Create BOQ area                 | Yes           |
| `PUT`    | `/api/boqAreas/{id}`              | Update BOQ area                 | Yes           |
| `DELETE` | `/api/boqAreas/{id}`              | Delete BOQ area                 | Yes           |
| `GET`    | `/api/boqCategories`              | List all BOQ categories         | Yes           |
| `GET`    | `/api/boqCategories/{id}`         | Get single BOQ category         | Yes           |
| `POST`   | `/api/boqCategories`              | Create BOQ category             | Yes           |
| `PUT`    | `/api/boqCategories/{id}`         | Update BOQ category             | Yes           |
| `DELETE` | `/api/boqCategories/{id}`         | Delete BOQ category             | Yes           |
| `GET`    | `/api/boqs`                       | List all BOQs                   | Yes           |
| `GET`    | `/api/boqs?clientId={id}`         | Filter BOQs by client           | Yes           |
| `GET`    | `/api/boqs/{id}`                  | Get single BOQ                  | Yes           |
| `POST`   | `/api/boqs`                       | Create BOQ                      | Yes           |
| `PUT`    | `/api/boqs/{id}`                  | Update BOQ                      | Yes           |
| `DELETE` | `/api/boqs/{id}`                  | Delete BOQ                      | Yes           |

---

## Appendix C: Eloquent Model Guide

### Key Relationships

```
Client
  |- hasMany Quotation
  |- hasMany Invoice
  |- hasMany Boq

Quotation
  |- belongsTo Client
  |- hasMany QuotationItem
  |- hasMany QuotationPayment
  |- hasMany Invoice

Invoice
  |- belongsTo Client
  |- belongsTo Quotation
  |- hasMany InvoiceItem

ScopeOfWork
  |- hasMany Task

Task
  |- belongsTo ScopeOfWork

Boq
  |- belongsTo Client
  |- hasMany BoqItem
```

### Model Casts

All models should cast boolean and numeric fields appropriately:

```php
// Example for Quotation model
protected $casts = [
    'date' => 'datetime',
    'subtotal' => 'decimal:2',
    'tax_amount' => 'decimal:2',
    'service_tax_amount' => 'decimal:2',
    'total_amount' => 'decimal:2',
    'paid_amount' => 'decimal:2',
    'tax_percent' => 'decimal:2',
    'service_tax_percent' => 'decimal:2',
    'created_at' => 'datetime',
    'updated_at' => 'datetime',
];

// Example for ScopeOfWork model
protected $casts = [
    'is_active' => 'boolean',
    'created_at' => 'datetime',
    'updated_at' => 'datetime',
];
```

---

**End of API Guideline Document**

*This document version: 1.0*
*Last updated: 2026-02-08*
*Project: THIS INTERIORS - Invoice & Quotation Management System*
