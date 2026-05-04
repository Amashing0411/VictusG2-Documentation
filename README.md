<p align="center">
  <img src="https://raw.githubusercontent.com/Amashing0411/VictusG2-Documentation/main/github-header-banner.png" width="100%" />
</p>

<h1 align="center">☁️ VictusG2 Cloud Drive</h1>

<p align="center">
  <b>An Enterprise-Grade, Full-Stack Cloud Storage Platform with Persistent Server-Side Storage.</b>
</p>

<p align="center">
  <a href="https://victusg2.me">
    <img src="https://img.shields.io/badge/Live_Demo-victusg2.me-0ea5e9?style=for-the-badge&logo=google-cloud" />
  </a>
  <img src="https://img.shields.io/badge/Status-Production-success?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" />
</p>

---

## 📖 Table of Contents
1. [System Architecture](#-system-architecture)
2. [Core Features](#-core-features)
3. [Technology Stack](#️-technology-stack)
4. [Project Structure](#-project-structure)
5. [Local Development Guide](#️-local-development-guide)
6. [Production Deployment](#-production-deployment-vpsubuntu)
7. [Team & Contributions](#-team--contributions)
8. [Roadmap](#️-roadmap-v20)
9. [License](#-license)

---

## 🚀 System Architecture

The architecture of VictusG2 is defined by a transition from ephemeral, containerized environments to a stateful, self-managed infrastructure.

A dedicated Ubuntu 24.04 LTS VM ensures persistent storage using:

```
/var/www/uploads
```

This avoids filesystem resets from platforms like Heroku or Render.

A hybrid system is used:
- Database → metadata, permissions, quotas  
- Filesystem → raw binary storage  

This enables predictable scaling and full system control.

---

## ✨ Core Features

### 🛡️ Security & Authentication
- Supabase Auth (JWT sessions)
- Row Level Security (RLS)
- File validation via Multer
- Nginx + SSL (Let's Encrypt)

### 📂 Storage & Media System
- Persistent SSD storage
- In-browser streaming (MP4, PDFs, images)
- Drag-and-drop uploads
- Real-time indexing

### 👑 Admin Console
- System telemetry (CPU, RAM, Disk)
- RBAC via JWT claims
- Global moderation tools

---

## 🛠️ Technology Stack

| Domain | Technology |
|--------|----------|
| Frontend | React (Vite), Tailwind, Framer Motion |
| Backend | Node.js, Express, Multer |
| Database | Supabase (PostgreSQL), JWT |
| Infra | Ubuntu, Nginx, PM2 |

---

## 📁 Project Structure

```
VictusG2-Documentation/
├── frontend/
├── backend/
└── README.md
```

---

## ⚙️ Local Development Guide

### 1. Prerequisites
- Node.js (v18+)
- Git
- Supabase account

---

### 2. Database Setup

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user',
  storage_used BIGINT DEFAULT 0
);
```

Enable RLS after creation.

---

### 3. Environment Variables

**Frontend (.env)**
```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_API_BASE_URL=http://localhost:5000/api
```

**Backend (.env)**
```env
PORT=5000
SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_key
UPLOAD_DIR=./uploads
```

---

### 4. Run the App

**Backend**
```bash
cd backend
npm install
mkdir uploads
npm start
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

App runs at:
```
http://localhost:5173
```

---

## 🌍 Production Deployment (VPS/Ubuntu)

### Install Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm git nginx -y
sudo npm install -g pm2
```

---

### Clone Project
```bash
cd /var/www
git clone https://github.com/Amashing0411/VictusG2-Documentation.git
```

---

### Build Frontend
```bash
cd frontend
npm install
npm run build
```

---

### Start Backend
```bash
cd ../backend
npm install
pm2 start server.js --name victus-api
pm2 save
```

---

### Nginx Config
```nginx
server {
    server_name victusg2.me;

    location / {
        root /var/www/victusg2/frontend/dist;
        index index.html;
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        client_max_body_size 1024M;
    }
}
```

---

## 👨‍💻 Team & Contributions

| Member | Role |
|-------|------|
| Mark James Alcantara | Full-Stack / Architect |
| Alleny P. Hernandez | Project Manager |
| Myka Ella A. Dalit | Infrastructure |
| Arwin E. Eser Jose | Backend |
| John Rei R. Tolentino | Backend |
| Daniel Sotalbo | Frontend |
| Brylle Edward A. Ramos | QA |

---

## 🗺️ Roadmap (v2.0)

- MFA (TOTP)
- File sharing links
- Folder system

---

## 📜 License

MIT License

---

<p align="center">
  <i>Built for practical and reliable cloud storage deployment.</i>
</p>
