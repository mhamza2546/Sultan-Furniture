# 🪑 Sultan Furniture — Manufacturing ERP System

<div align="center">

![Sultan Furniture ERP](https://img.shields.io/badge/Sultan%20Furniture-ERP%20System-C5A059?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0yMCAxOFYxNUgxNlY5SDhWMTVINFYxOEgyVjIwSDIyVjE4SDIwek0xMCAzSDhWMUg2VjNINFY1SDIwVjNIMThWMUgxNlYzSDEweiIvPjwvc3ZnPg==)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss)

**A full-stack, production-grade ERP system built for a real furniture manufacturing business.**

[🚀 Live Demo](#) • [📸 Screenshots](#-screenshots) • [⚙️ Tech Stack](#️-tech-stack) • [🛠️ Setup](#️-local-setup)

</div>

---

## 📋 Overview

Sultan Furniture ERP is a complete **Enterprise Resource Planning** system designed specifically for a furniture manufacturing factory. It replaces manual ledger books and spreadsheets with a modern, digital solution that tracks everything from raw material inventory to worker payments and customer orders — all in real time.

> Built as a real-world client project for an active furniture manufacturer.

---

## ✨ Features

### 🏭 Manufacturing Pipeline
- **5-Stage Production Tracking** — Cutting → Framing → Polishing → Upholstery → QC
- **Dynamic Bill of Materials (BOM)** — Track materials consumed per product
- Real-time stage status updates

### 📦 Inventory Management
- Add, update, and delete raw materials
- Auto-deduction when materials are used in production
- Stock level alerts

### 👷 Worker Ledger System
- Individual worker profiles with job roles
- Track work performed (earnings) and cash paid (advances)
- **Running balance** automatically calculated per worker
- Complete account statement: Credit | Debit | Balance columns
- Search workers by name

### 💰 Customer Accounts & Sales
- Create new orders with customer details
- Track down payments and installments
- Outstanding balance tracking per customer
- Due date reminders

### 📊 Private Ledger
- Owner's private financial records
- Transaction history with date tracking

### 🔐 Authentication
- Secure login/signup system
- Session management
- Password hashing (SHA-256)

---

## 📸 Screenshots

> *(Add screenshots here after deployment)*

| Dashboard | Worker Ledger | Inventory |
|---|---|---|
| ![Dashboard](./screenshots/dashboard.png) | ![Worker Ledger](./screenshots/worker.png) | ![Inventory](./screenshots/inventory.png) |

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL 8 |
| **Auth** | Custom session-based auth with SHA-256 |
| **Deployment** | Vercel (frontend) + Railway (backend + MySQL) |
| **Email** | Nodemailer + Gmail SMTP |

---

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- MySQL 8+
- Git

### 1. Clone the repo
```bash
git clone https://github.com/mhamza2546/Sultan-Furniture.git
cd Sultan-Furniture
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=sultan_erp
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in `/frontend`:
```env
VITE_API_URL=http://localhost:5000
```

### 4. Run the App
```bash
# From root directory
npm run dev
```

This starts both frontend (port 5173) and backend (port 5000) simultaneously.

---

## 🚀 Deployment

| Service | Platform |
|---|---|
| Frontend | [Vercel](https://vercel.com) |
| Backend + MySQL | [Railway](https://railway.app) |

See the [Deployment Guide](./DEPLOY.md) for full step-by-step instructions.

---

## 📁 Project Structure

```
Sultan-Furniture/
├── frontend/                 # React + Vite app
│   ├── src/
│   │   ├── components/       # All page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── WorkerLedger.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── ManufacturingStages.jsx
│   │   │   ├── LabourPayouts.jsx
│   │   │   ├── Accounts.jsx
│   │   │   └── Auth.jsx
│   │   └── lib/
│   │       └── api.js        # API base URL config
│   └── vercel.json
├── backend/                  # Express.js API
│   ├── index.js              # All API routes
│   ├── database.js           # MySQL schema + init
│   ├── railway.json          # Railway deployment config
│   └── .env.example
└── package.json              # Root scripts (concurrently)
```

---

## 👨‍💻 Author

**Muhammad Hamza**
- GitHub: [@mhamza2546](https://github.com/mhamza2546)

---

## 📄 License

This project is private software built for Sultan Furniture. All rights reserved.

---

<div align="center">
  Built with ❤️ for Sultan Furniture — Making quality furniture since decades.
</div>
