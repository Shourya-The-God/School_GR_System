# School General Register (GR) & Student Management System

A digital General Register (GR) and student lifecycle management system built with **Vanilla HTML5, CSS3, ES6+ JavaScript**, **Node.js + Express.js**, and **PostgreSQL with Prisma ORM**, featuring an intelligent **OCR Migration Engine** (Tesseract.js).

---

## 🌟 Key Features

1. **Vanilla Frontend Architecture (No Framework Complexity)**:
   - Built entirely in semantic **HTML5**, responsive **CSS3**, and **Vanilla ES6+ JavaScript**.
   - Communicates cleanly with backend REST APIs via standard `fetch()`.
   - Zero React, Vue, Next.js, or TypeScript overhead.

2. **General Register (GR) Management**:
   - Unique internal IDs with indexed searches on **GR Number**, **Admission Number**, **Student Name**, **Class**, and **Status**.
   - Standard General Register sheet view with full print formatting (`window.print()`).
   - Detailed academic progression timeline and historical admission tracking.

3. **Transfer Certificate (TC) Workflow**:
   - Issue official School Leaving / Transfer Certificates.
   - Automatically transition student status to `TRANSFERRED`.
   - Generates state-board compliant printable Transfer Certificates.

4. **OCR Migration Pipeline & Side-by-Side Human Review**:
   - Pluggable OCR abstraction layer (`OCREngine` $\to$ `TesseractEngine` $\to$ `parseGRData`).
   - Drag & drop upload for scanned GR books and admission forms (JPG, PNG, PDF).
   - Automated candidate field extraction with per-field and overall confidence scoring.
   - **Side-by-side human review UI**: operator inspects the original document while reviewing and correcting extracted fields before committing to the official student database.

5. **Security & Compliance**:
   - Role-Based Access Control (Admin, Principal, Clerk, Teacher).
   - Passwords hashed with `bcrypt`.
   - Private document storage with authenticated preview streaming (no public exposure of uploaded documents).
   - Immutable audit logging on student admissions, GR updates, TC issuance, and OCR approvals.

---

## 📁 Project Structure

```text
school-gr-system/
├── frontend/
│   ├── pages/
│   │   ├── login.html          # Authentication portal
│   │   ├── dashboard.html      # KPI metrics & Chart.js visualizations
│   │   ├── students.html       # Student directory with search & filters
│   │   ├── student.html        # Student 360 profile & GR print sheet
│   │   ├── import.html         # OCR document drag-and-drop uploader
│   │   ├── verification.html   # Side-by-side OCR verification review
│   │   ├── transfers.html      # TC issuance & certificate generator
│   │   └── audit.html          # Immutable system audit trail
│   ├── css/
│   │   ├── main.css            # Base design system & typography
│   │   ├── dashboard.css       # KPI & Chart styling
│   │   ├── students.css        # Data tables & GR print styling
│   │   └── forms.css           # Forms & OCR split view styling
│   └── js/
│       ├── api.js              # Fetch client & toast notification helper
│       ├── auth.js             # Session management & route guards
│       ├── dashboard.js        # Analytics & Chart.js graphs
│       ├── students.js         # Student search, filters, pagination
│       ├── student.js          # Student 360 & GR sheet rendering
│       ├── import.js           # File upload queue & status tracking
│       ├── verification.js     # Side-by-side review & commit logic
│       ├── transfers.js        # TC issuance & printable layout
│       └── audit.js            # Audit log inspection
│
├── backend/
│   ├── controllers/            # Route handler business logic
│   ├── routes/                 # REST API endpoints (/api/*)
│   ├── middleware/             # Auth, RBAC, Multer upload, error handlers
│   ├── services/
│   │   ├── ocr/                # Tesseract OCR engine & GR heuristic parser
│   │   ├── auditService.js     # Audit log recorder
│   │   └── exportService.js    # CSV export generator
│   ├── utils/                  # Logger, response envelope, validators
│   ├── db.js                   # Prisma Client singleton
│   ├── app.js                  # Express app setup & security headers
│   └── server.js               # Server bootstrap & graceful shutdown
│
├── prisma/
│   ├── schema.prisma           # Relational schema with indexes & foreign keys
│   └── seed.js                 # Initial seed data (roles, users, classes, sample GRs)
│
├── storage/
│   └── uploads/                # Secure private uploads folder
│
├── tests/
│   └── run-tests.js            # Automated test suite
│
├── .env.example
├── .gitignore
└── package.json
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or newer)
- **PostgreSQL** database instance

### 2. Installation
```bash
cd school-gr-system
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and set your PostgreSQL credentials:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/school_gr_db?schema=public"
JWT_SECRET="super-secret-jwt-key-replace-in-production-gr-system-2026"
```

### 4. Database Setup & Seeding
```bash
# Push schema to PostgreSQL database
npm run prisma:push

# Generate Prisma Client
npm run prisma:generate

# Seed default roles, classes, and administrative users
npm run prisma:seed
```

### 5. Running the Application
```bash
# Start server
npm start
```
Open your browser at **`http://localhost:3000`**.

---

## 🔐 Default Credentials

| Username | Password | Role |
| :--- | :--- | :--- |
| `admin` | `Admin@12345` | System Administrator |
| `principal` | `Admin@12345` | Principal / Academic Head |
| `clerk` | `Admin@12345` | Data Entry & OCR Clerk |

---

## 🧪 Running Automated Tests

```bash
npm test
```
Runs unit tests validating password hashing, JWT claims, OCR GR extraction heuristics, confidence calculation, and CSV generation.
