# Invoice Naija Backend API (Node.js + Express + MySQL + Drizzle ORM)

This is the dedicated backend service for **Invoice Naija**, engineered to be deployed independently to **Render** while the Next.js frontend is deployed to **Vercel**.

---

## 🏗️ Architecture Overview

```
                                ┌──────────────────────────────────────────────┐
                                │          User Browser / Mobile App           │
                                └──────────────────────┬───────────────────────┘
                                                       │
                                  ┌────────────────────┴───────────────────┐
                                  ▼                                        ▼
                   ┌──────────────────────────────┐       ┌──────────────────────────────┐
                   │    Vercel (Frontend App)     │──────▶│    Render (Backend API)      │
                   │    Next.js 16 + HeroUI       │       │    Node.js + Express + TS    │
                   └──────────────────────────────┘       └──────────────┬───────────────┘
                                                                         │
                                              ┌──────────────────────────┴──────────────────────────┐
                                              ▼                                                     ▼
                               ┌──────────────────────────────┐                      ┌──────────────────────────────┐
                               │        MySQL Database        │                      │       Google Gemini AI       │
                               │  (TiDB Cloud / Aiven / RDS)  │                      │       Invoice Drafting       │
                               └──────────────────────────────┘                      └──────────────────────────────┘
```

---

## 📋 Accounts You Need to Open (All Free Tiers Available)

| Account | Purpose | Website | Free Tier Available? |
| :--- | :--- | :--- | :--- |
| **1. GitHub** | Code repository; connects directly to both Vercel and Render for automatic continuous deployment upon push. | [github.com](https://github.com) | ✅ Yes (100% Free) |
| **2. Render** | Cloud hosting for this Node.js/Express backend service. Provides free web services, automatic SSL, and zero-downtime health checks. | [render.com](https://render.com) | ✅ Yes (Free Web Services) |
| **3. Vercel** | Cloud hosting for the Next.js frontend (`invoice-naija`). Optimized for Next.js, Edge network, and lightning-fast worldwide delivery. | [vercel.com](https://vercel.com) | ✅ Yes (Free Hobby tier) |
| **4. Cloud MySQL Database** | Managed cloud MySQL 8 database. Recommended: **TiDB Cloud Serverless** (fully MySQL-compatible, 5 GB free permanent storage, no credit card required) or **Aiven MySQL** / **Clever Cloud**. | [tidbcloud.com](https://tidbcloud.com) | ✅ Yes (5 GB free forever) |
| **5. Google AI Studio** | Generates the API key (`GEMINI_API_KEY`) used for AI invoice & receipt drafting from natural text notes. | [aistudio.google.com](https://aistudio.google.com) | ✅ Yes (Free tier with generous quotas) |

---

## 🔑 Keys & Environment Variables (Meticulous Breakdown)

### 1. Backend Service (Set in Render Dashboard)

Go to **Render Dashboard** -> Your Web Service -> **Environment** tab:

| Variable Name | Required? | Example Value | Where to Get It / Instructions |
| :--- | :--- | :--- | :--- |
| `PORT` | Auto | `10000` | Render sets this automatically, but you can explicitly add `10000`. |
| `NODE_ENV` | Yes | `production` | Tells Node and Express to run in optimized production mode. |
| `DATABASE_URL` | **Yes** | `mysql://2XabcDEF.root:SecretPass123@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/invoicenaija?ssl={"rejectUnauthorized":true}` | **From TiDB Cloud or your MySQL provider:** Create a cluster, click **Connect**, select **Node.js** or **General connection string**, and copy the MySQL connection string. |
| `FRONTEND_URL` | **Yes** | `https://your-invoice-app.vercel.app` | The production URL of your frontend app on Vercel. Controls CORS security headers. |
| `GEMINI_API_KEY` | Optional (Recommended) | `AIzaSy...` | Open [Google AI Studio](https://aistudio.google.com/), click **Get API Key**, and create a free key. |
| `GEMINI_MODEL` | Optional | `gemini-2.5-flash` | Default is `gemini-2.5-flash`. You can also use `gemini-1.5-flash` or `gemini-2.0-flash`. |

---

### 2. Frontend App (Set in Vercel Dashboard)

Go to **Vercel Dashboard** -> Your Project -> **Settings** -> **Environment Variables**:

| Variable Name | Required? | Example Value | Where to Get It / Instructions |
| :--- | :--- | :--- | :--- |
| `BACKEND_URL` | **Yes** | `https://invoice-naija-backend.onrender.com` | The public `.onrender.com` URL of your deployed backend service. Used by Next.js server-side rewrites. |
| `NEXT_PUBLIC_API_URL` | **Yes** | `https://invoice-naija-backend.onrender.com` | Same backend URL. Used for client-side API requests. |
| `NEON_AUTH_BASE_URL` | Optional | `https://...` | Only needed if you use Neon Managed Auth on the frontend. |
| `NEON_AUTH_COOKIE_SECRET` | Optional | Random 32+ char string | Secret used for cookie signing if using managed auth. |

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Push Projects to GitHub
Create two separate repositories on GitHub (or a monorepo with 2 folders):
1. `invoice-naija` (Frontend)
2. `invoice-naija-backend` (Backend)

```bash
# Push Backend:
cd c:\Users\ADMIN\OneDrive\Documents\projects\invoice-naija-backend
git init
git add .
git commit -m "feat: initial invoice naija mysql backend"
git remote add origin https://github.com/<your-username>/invoice-naija-backend.git
git push -u origin main
```

### Step 2: Deploy Backend on Render
1. Log into [Render](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your `invoice-naija-backend` GitHub repository.
4. Settings:
   - **Name**: `invoice-naija-backend`
   - **Region**: Frankfurt / Oregon / Ohio (choose closest to your database)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
5. Click **Advanced** -> **Add Environment Variables**:
   - `DATABASE_URL`: Your cloud MySQL connection string
   - `FRONTEND_URL`: `https://<your-app>.vercel.app` (or temporary `*`)
   - `GEMINI_API_KEY`: Your Google AI Studio key
6. Click **Create Web Service**. Render will build and deploy!

### Step 3: Run Database Schema Push to MySQL
To create the MySQL tables automatically:
```bash
cd c:\Users\ADMIN\OneDrive\Documents\projects\invoice-naija-backend
# Set your DATABASE_URL in .env, then run:
npm run db:push
```
This generates and creates:
- `workspaces` table
- `customers` table
- `documents` table (invoices & receipts)
- `feature_requests` table

### Step 4: Deploy Frontend on Vercel
1. Log into [Vercel](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Import your `invoice-naija` repository.
4. Under **Environment Variables**, add:
   - `BACKEND_URL`: `https://invoice-naija-backend.onrender.com`
   - `NEXT_PUBLIC_API_URL`: `https://invoice-naija-backend.onrender.com`
5. Click **Deploy**.

---

## 🧪 Local Development

### 1. Run Backend Locally:
```bash
cd invoice-naija-backend
# Make sure .env has DATABASE_URL
npm run dev
# Server starts on http://localhost:5000
# Health check: http://localhost:5000/health
```

### 2. Run Frontend Locally:
```bash
cd invoice-naija
npm run dev
# App starts on http://localhost:3000
# Frontend rewrites /api/* calls automatically to http://localhost:5000!
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Render health check endpoint. Tests server uptime & MySQL connection. |
| `GET` | `/` | API info and active endpoint list. |
| `GET` | `/api/customers` | Lists all customers for the workspace. |
| `POST` | `/api/customers` | Creates or updates a customer. |
| `DELETE` | `/api/customers/:id` | Deletes a customer. |
| `GET` | `/api/documents` | Lists all invoices and receipts. |
| `GET` | `/api/documents/:id` | Retrieves a specific document by ID. |
| `POST` | `/api/documents` | Saves or updates an invoice or receipt. |
| `DELETE` | `/api/documents/:id` | Deletes a document. |
| `GET` | `/api/settings` | Retrieves business profile, bank details, and branding settings. |
| `PUT` | `/api/settings` | Updates business profile, template, and branding settings. |
| `POST` | `/api/gemini/draft` | Uses Gemini AI (with Nigerian trade fallback) to draft an invoice from text. |
| `POST` | `/api/feature-requests` | Saves user feedback and requested features. |
