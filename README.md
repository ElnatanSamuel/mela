# 🍽️ Mela — Hotel Menu & Payment System

**Mela** is a high-performance, multi-tenant hospitality platform designed specifically for the Ethiopian market. It enables hotels to offer a seamless scan-to-order experience with real-time merchant dashboards and local payment integration.

---

## 🏗️ Architecture: The "All-in-One" Repo
This project is a unified Full-Stack Monolith built with **Next.js 15**. It manages the entire ecosystem in a single codebase:

- **Merchant Dashboard**: `/src/app/(dashboard)` — Secure "Command Center" for hotel staff.
- **Customer QR Menu**: `/src/app/(customer)` — Ultra-fast, mobile-first PWA for diners.
- **Shared Backend**: `/src/app/api` — Secure API routes for orders, payments, and QR generation.
- **Database Layer**: `/src/db` — Multi-tenant PostgreSQL schema with Drizzle ORM.

---

## 🚀 Tech Stack
| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Database** | Supabase (PostgreSQL) |
| **ORM** | Drizzle ORM |
| **Real-time** | Supabase Realtime (WebSockets) |
| **Styling** | Tailwind CSS (Linear-style Dark Mode) |
| **State** | TanStack Query + Zustand |
| **Auth** | Supabase Auth + SSR Middleware |
| **Payments** | Chapa API (Ethiopian Market Leader) |

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js 18+
- A Supabase Project ([database.new](https://database.new))

### 2. Setup Environment
Copy `.env.example` to `.env` and fill in your Supabase credentials.

```bash
cp .env.example .env
```

### 3. Initialize Database
```bash
# Install dependencies
npm install

# Push schema to Supabase
npm run db:push

# Load demo data (Habesha Palace)
npm run db:seed
```

### 4. Enable Real-time
Go to your **Supabase Dashboard > Database > Replication** and enable replication for the `orders` table. This is required for the Live Order Board to function.

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to view the Merchant Command Center.

---

## 🔐 Security & Multi-Tenancy
- **Row Level Security (RLS)**: Data is strictly isolated. Users from Hotel A can never access data from Hotel B.
- **RBAC**: Different access levels for `owner`, `manager`, and `waiter`.
- **Server-Side Validation**: All operations are verified against the user's secure session on the server.

## 🇪🇹 Local Features
- **Amharic Support**: Full localization for menu items and categories.
- **Fast Food Logic**: Built-in `isVegetarian` support for Ethiopian fasting days.
- **Local Tax Compliance**: Automated 15% VAT and 10% Service Charge calculation.
- **Payment Integration**: Support for Telebirr, CBE Birr, and Chapa.

---

*Designed for the future of Ethiopian hospitality.*
