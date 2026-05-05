<p align="center">
  <img src="https://raw.githubusercontent.com/Amashing0411/VictusG2-Documentation/main/github-header-banner.png" alt="VictusG2 Cloud Banner" width="100%" />
</p>

<h1 align="center">☁️ VictusG2 Cloud Drive</h1>

<p align="center">
  <b>An Enterprise-Grade, Full-Stack Cloud Storage Platform with Persistent Server-Side Storage</b>
</p>

<p align="center">
  <a href="https://victusg2.me">
    <img src="https://img.shields.io/badge/🌐_Live-victusg2.me-0ea5e9?style=for-the-badge&logo=icloud&logoColor=white" />
  </a>
  <img src="https://img.shields.io/badge/STATUS-PRODUCTION-16a34a?style=for-the-badge" />
  <img src="https://img.shields.io/badge/ARCHITECTURE-Stateful%20VPS-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/SECURITY-RLS%20%7C%20ClamAV-critical?style=for-the-badge" />
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/LICENSE-MIT-yellow?style=for-the-badge" />
  </a>
</p>

<p align="center">
  <i>Designed for reliability, persistence, and full infrastructure control — bridging academic theory with production-grade implementation.</i>
</p>

---

## 📖 Table of Contents
1. [System Architecture](#-system-architecture)
2. [Core Features](#-core-features)
3. [Technology Stack](#️-technology-stack)
4. [Project Structure](#-project-structure)
5. [Local Development Guide](#️-local-development-guide)
6. [API Reference](#-api-reference)
7. [Production Deployment (VPS/Ubuntu)](#-production-deployment-vpsubuntu)
8. [Team & Contributions](#-team--contributions)
9. [Roadmap (v3.0)](#️-roadmap-v20)
10. [License](#-license)

---

## 🚀 System Architecture

The architecture of VictusG2 represents a deliberate transition from **ephemeral, container-based hosting environments** (e.g., Heroku, Render) to a **stateful, self-managed VPS infrastructure**. This decision was driven by the need to achieve persistent storage without reliance on third-party object storage services such as AWS S3.

By deploying the system on a dedicated **Ubuntu 24.04 LTS virtual machine (DigitalOcean)**, the platform establishes a stable compute layer where application state and file storage are fully controlled.

### 🧠 Architectural Flow

```text
Client (React Frontend + Cloudflare Turnstile)
        ↓
Node.js API (Express Backend + ClamAV Engine)
        ↓
Supabase (Auth + PostgreSQL Metadata + RLS)
        ↓
Local Disk Storage (/var/www/uploads)
```

### 🔑 Key Architectural Decisions

1. Persistent Storage Layer  
Files are stored directly on the server filesystem at /var/www/uploads.  
Eliminates dependency on external storage APIs and ensures data persistence across deployments.

2. Virtual Filesystem (Nested Directories)  
Emulates a traditional OS filesystem. Files remain flat on the physical Linux drive, but are mapped via parent_id relations in PostgreSQL, allowing infinite nested folder structures in the UI.

3. Deep Security & Anti-Malware  
Instead of relying solely on MIME-type restriction, the Node.js backend streams all uploads through a live ClamAV Daemon. Binary signatures are scanned heuristically before writing to the disk, permanently blocking embedded malware payloads.

4. Tiered Storage & Manual Payment Verification  
Base users are restricted to 1GB. Users can request 5GB or 15GB upgrades by uploading GCash payment receipts via the platform. Admins verify the transaction in the God-Mode console, dynamically expanding the user's PostgreSQL quota and triggering an automated 30-day expiration timer.

---

## ✨ Core Features

### 🛡️ Enterprise Security
Cloudflare Turnstile: Cryptographic bot mitigation preventing automated authentication brute-forcing.  
Supabase Auth: Secure email/password authentication with stateless JWT session handling.  
Row Level Security (RLS): Strict PostgreSQL policies enforcing per-user data isolation.  
System Audit Logs: Immutable database logs tracking all blocked malware attempts, banned users, and security warnings.

### 📂 Storage & Media System
Cinematic Engine: Browser-native streaming of MP4 videos, PDF documents, and high-res images in a theater-style modal.  
Smart Workspace: Drag-and-drop Dropzone, real-time client-side search filtering, and categorised views (Images/Docs/Media).  
Personalization: Users can upload custom avatar pictures, rename files, and navigate via breadcrumbs.

### 👑 God-Mode Admin Console
Live Telemetry: Real-time monitoring of Linux CPU, RAM, and Disk space visualized via Recharts Area & Bar graphs.  
Activity Heatmap: A GitHub-style contribution heatmap tracking the last 90 days of system upload activity.  
Moderation Engine:  
GCash Subscription Approvals  
"Ban & Wipe" functionality (Recursively deletes user accounts and physically purges their Linux directories via fs.rmSync).  
Send forced-acknowledgement "Warnings" that lock a user's screen upon login.

---

## 📸 Screenshots

### 🔐 Authentication (Login Page)
<p align="center">
  <img src="docs/screenshots/login.png" width="800" />
</p>

---

### 📊 HomePage
<p align="center">
  <img src="docs/screenshots/homepage.png" width="800" />
</p>

---

### 📂 File Upload System
<p align="center">
  <img src="docs/screenshots/upload.png" width="800" />
</p>

---

### 👑 Admin Console
<p align="center">
  <img src="docs/screenshots/admin.png" width="800" />
</p>

---

## 🛠️ Technology Stack

| Domain | Technology Used |
|--------|---------------|
| Frontend | React.js (Vite), Tailwind CSS, Framer Motion, Recharts, React Hot Toast, Lucide Icons |
| Backend API | Node.js, Express.js, Multer, Clamscan (Anti-Virus Connector), Helmet.js, CORS |
| Database & Auth | Supabase (PostgreSQL), JWT, Custom SQL Triggers, Stored RPC Functions |
| Infrastructure | DigitalOcean (Ubuntu 24.04 LTS), Nginx, PM2, Certbot (SSL), ClamAV Daemon |

---

## 📁 Project Structure

```bash
VictusG2-Documentation/
├── frontend/                  # React.js Client Application
│   ├── public/
│   ├── src/
│   │   ├── components/        # UI Components (Modals, Dropzones, Navigation)
│   │   ├── pages/             # Application Views (Dashboard, Admin, Login)
│   │   ├── context/           # Global State Management (Auth Context)
│   │   ├── utils/             # Helper Functions
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                   # Express.js API Server
│   ├── controllers/           # Business Logic (Auth, Files, Admin)
│   ├── middleware/            # JWT Validation, File Filtering, Security Layers
│   ├── routes/                # API Route Definitions
│   ├── server.js              # Entry Point
│   ├── package.json
│   └── uploads/               # Local File Storage (Git-Ignored)
│
└── README.md
```
---

## ⚙️ Local Development Guide

### 1. Environment Variables

Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TURNSTILE_SITE_KEY=your_cloudflare_site_key
VITE_API_URL=http://localhost:5000
```

Backend (`backend/.env`)
```env
PORT=5000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

---

### 2. Running the Application

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|------------|
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/register` | Register new user |

### File Management
| Method | Endpoint | Description |
|--------|----------|------------|
| POST | `/api/upload` | Upload file |
| GET | `/api/files` | Retrieve user files |
| DELETE | `/api/files/:id` | Delete file |

### Admin
| Method | Endpoint | Description |
|--------|----------|------------|
| GET | `/api/admin/stats` | System metrics |
| POST | `/api/admin/promote` | Promote user |

---

## 🌍 Production Deployment (VPS/Ubuntu)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm git nginx python3-certbot-nginx -y
sudo npm install -g pm2
sudo apt install -y clamav clamav-daemon
```

---

## 👨‍💻 Team & Contributions

Developed and maintained by **Group 2**.

| Team Member | Detailed Contributions |
| :--- | :--- |
| **Mark James Alcantara** | Lead System Architect and Full-Stack Developer responsible for designing the overall system architecture, implementing the React frontend, developing the Express.js backend API, configuring Multer-based file validation, integrating Supabase authentication and database logic, and deploying the application using Nginx, SSL (Certbot), and PM2. Also handled CI/CD considerations and infrastructure optimization. |
| **Alleny P. Hernandez** | Project Manager responsible for coordinating development timelines, managing cloud resource allocation, monitoring operational expenses, and securing GitHub Student Developer Pack benefits for infrastructure support. |
| **Myka Ella A. Dalit** | Infrastructure and Frontend contributor responsible for provisioning the Ubuntu virtual machine, configuring the Linux environment, assisting in deployment setup, and supporting frontend UI styling and responsiveness. |
| **Arwin E. Eser Jose** | Backend Developer responsible for implementing API routing, request handling, middleware integration, and debugging backend logic related to file validation and user operations. |
| **John Rei R. Tolentino** | Backend Developer responsible for Supabase database configuration, implementing logical quota enforcement mechanisms, and optimizing database queries and performance. |
| **Daniel Sotalbo** | Frontend Developer responsible for structuring React components, refining UI/UX interactions, and ensuring usability and responsiveness across different views. |
| **Brylle Edward A. Ramos** | Quality Assurance and Technical Support responsible for system testing, identifying bugs in production, validating security mechanisms, and assisting in deployment troubleshooting. |

---

## 🗺️ Roadmap (v3.0)

Automated Payment Gateway  
Large File Chunking  
Secure File Sharing  

---

## 📜 License

This project is licensed under the MIT License.

---

<p align="center">
<b>VictusG2 Cloud — A practical implementation of full-stack cloud infrastructure engineering.</b>
</p>
