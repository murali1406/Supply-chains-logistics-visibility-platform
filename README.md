# LogiTrack — Supply Chain Management System

A professional, production-style supply-chain and warehouse management platform built on the **MERN stack**.

---

## Features

| Module | Features |
|---|---|
| **Authentication** | JWT login, register, protected routes, role-based access |
| **User Management** | Full CRUD, role assignments, status management, audit trails, self-protection guards |
| **Dashboard** | Real KPIs, charts, low-stock alerts, recent activity |
| **Warehouses** | Full CRUD, capacity tracking, utilization visualization |
| **Inventory** | Products + stock tracking, search, filter, status badges |
| **Suppliers** | Full CRUD, contact management, status tracking |
| **Purchase Orders** | Shipment/order lifecycle (PENDING→DELIVERED), multi-item |
| **Stock Movements** | Automatic audit trail for all stock changes |
| **Notifications** | System alerts (low stock, shipment, adjustments) |
| **Activity Log** | Complete audit trail of all user actions |

---

## Tech Stack

**Frontend:** React 19 · Vite 8 · React Router 7 · Axios · Recharts · Lucide React

**Backend:** Node.js · Express 5 · MongoDB · Mongoose 9 · JWT · bcryptjs · Helmet · express-rate-limit

---

## Architecture

```
LogiTrack/
├── client/               # React frontend (Vite)
│   └── src/
│       ├── context/      # AuthContext, ToastContext
│       ├── layouts/      # AppLayout (sidebar + topbar)
│       ├── pages/        # Feature pages
│       ├── components/   # Reusable UI components
│       └── services/     # Axios API modules
└── server/               # Express backend
    ├── src/
    │   ├── models/       # Mongoose models
    │   ├── routes/       # Express routes
    │   ├── controllers/  # Request handlers
    │   ├── services/     # Business logic
    │   ├── middleware/   # Auth, roles, validation
    │   └── config/       # DB connection
    └── seed.js           # Database seeder
```

---

## Environment Variables

### Server (`server/.env`)
```
PORT=5001
MONGO_URI=mongodb://localhost:27017/logitrack
CLIENT_URL=http://localhost:5173
NODE_ENV=development
JWT_SECRET=your_strong_secret_here
JWT_EXPIRES_IN=1d
```

### Client (`client/.env`)
```
VITE_API_URL=http://localhost:5001/api/v1
```

---

## Running Locally

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Install dependencies

```bash
# Backend
cd LogiTrack/server
npm install

# Frontend
cd LogiTrack/client
npm install
```

### 2. Set up environment

```bash
# Server
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Client
cd client
cp .env.example .env
```

### 3. Seed the database (optional, for demo data)

```bash
cd server
npm run seed
```

This creates:
- 4 users (admin, manager, logistics, staff)
- 5 warehouses across India
- 5 suppliers
- 15 inventory items
- 5 shipments
- 30 stock movements
- Activity logs + notifications

**Login credentials after seeding:**
| Role | Email | Password |
|---|---|---|
| Admin | admin@logitrack.com | Admin@123 |
| Manager | manager@logitrack.com | Admin@123 |
| Logistics | logistics@logitrack.com | Admin@123 |
| Staff | staff@logitrack.com | Admin@123 |

### 4. Start the application

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

- Backend: http://localhost:5001
- Frontend: http://localhost:5173

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Login and get JWT |
| GET | `/api/v1/auth/me` | Get current user profile |
| GET/POST | `/api/v1/users` | List platform users with filters / Create user |
| GET/PUT/DELETE | `/api/v1/users/:id` | User details + audit / Update / Delete user |
| PATCH | `/api/v1/users/:id/role` | Update user role |
| PATCH | `/api/v1/users/:id/status` | Update user account status (ACTIVE/INACTIVE/SUSPENDED) |
| GET | `/api/v1/dashboard/stats` | Aggregated dashboard KPIs |
| GET/POST | `/api/v1/warehouses` | List / Create warehouses |
| GET/PUT/DELETE | `/api/v1/warehouses/:id` | Warehouse detail / Update / Delete |
| GET/POST | `/api/v1/inventory` | List / Create inventory |
| PATCH | `/api/v1/inventory/:id/stock` | Adjust stock quantity |
| GET/POST | `/api/v1/suppliers` | List / Create suppliers |
| GET/POST | `/api/v1/shipments` | List / Create shipments (purchase orders) |
| PATCH | `/api/v1/shipments/:id/status` | Update shipment status |
| GET | `/api/v1/stock-movements` | Stock movement history |
| GET | `/api/v1/activity` | Activity/audit log |
| GET | `/api/v1/notifications` | User notifications |
| PATCH | `/api/v1/notifications/:id/read` | Mark notification as read |

---

## RBAC

| Role | Create | Edit | Delete | View |
|---|---|---|---|---|
| ADMIN | ✅ | ✅ | ✅ | ✅ |
| WAREHOUSE_MANAGER | ✅ | ✅ | ❌ | ✅ |
| LOGISTICS_MANAGER | ❌ | ✅ | ❌ | ✅ |
| PROCUREMENT_MANAGER | ❌ | ❌ | ❌ | ✅ |
| STAFF | ❌ | ❌ | ❌ | ✅ |

---

## Build for Production

```bash
# Frontend
cd client
npm run build
# Output: client/dist/

# Backend
cd server
NODE_ENV=production npm start
```

---

## Security Features

- JWT authentication with expiry
- bcrypt password hashing (12 rounds)
- Helmet security headers
- CORS with allowed origin whitelist
- Rate limiting (200 req / 15 min)
- Role-based authorization on every protected route
- MongoDB ObjectId validation
- No stack traces in production responses
