<<<<<<< HEAD
<div align="center">
  <img src="https://raw.githubusercontent.com/Amashing0411/VictusG2-Documentation/main/github-header-banner.png" alt="VictusG2 Cloud Banner" width="100%" />
  <br />

# ☁️ VictusG2 Cloud Drive  
**A full-stack cloud storage platform with persistent server-side storage.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-victusg2.me-0ea5e9?style=for-the-badge&logo=google-cloud)](https://victusg2.me)
[![Status](https://img.shields.io/badge/Status-Production-success?style=for-the-badge)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 🚀 Architecture

The architecture of VictusG2 is defined by a transition from ephemeral, containerized environments to a stateful, self-managed infrastructure. By leveraging a dedicated Ubuntu 24.04 LTS virtual machine on DigitalOcean, the system establishes a stable compute layer that avoids the volatile filesystem resets common in platforms like Heroku or Render. This foundation allows the application to utilize the server’s local disk as a permanent storage repository, specifically within the /var/www/uploads directory. Unlike cloud-native storage solutions that often require complex external integrations, this direct-to-disk approach ensures that data persists across deployments and system reboots, providing a reliable environment for long-term file management.
=======
<p align="center">
  <img src="https://raw.githubusercontent.com/Amashing0411/VictusG2-Documentation/main/github-header-banner.png" alt="VictusG2 Cloud Banner" width="100%" />
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
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" />
  </a>
</p>

---

## 📖 Table of Contents
1. [System Architecture](#-system-architecture)
2. [Core Features](#-core-features)
3. [Technology Stack](#️-technology-stack)
4. [Project Structure](#-project-structure)
5. [Local Development Guide](#️-local-development-guide)
   - [Prerequisites](#1-prerequisites)
   - [Database Configuration](#2-database-configuration-supabase)
   - [Environment Variables](#3-environment-variables)
   - [Running the Application](#4-running-the-application)
6. [Production Deployment (VPS/Ubuntu)](#-production-deployment-vpsubuntu)
7. [Team & Contributions](#-team--contributions)
8. [Roadmap (v2.0)](#️-roadmap-v20)
9. [License](#-license)

---

## 🚀 System Architecture

The architecture of VictusG2 is defined by a transition from ephemeral, containerized environments to a stateful, self-managed infrastructure. By leveraging a dedicated Ubuntu 24.04 LTS virtual machine on DigitalOcean, the system establishes a stable compute layer that avoids the volatile filesystem resets common in platforms like Heroku or Render. This foundation allows the application to utilize the server’s local disk as a permanent storage repository, specifically within the `/var/www/uploads` directory. Unlike cloud-native storage solutions that often require complex external integrations, this direct-to-disk approach ensures that data persists across deployments and system reboots, providing a reliable environment for long-term file management.
>>>>>>> 38b2cd80ee1eb627b69d2538b35661b651350f7a

To maintain system integrity and prevent resource exhaustion, the architecture incorporates a logical enforcement layer at the database level. Instead of relying on rigid operating system partitions, the application logic queries the database to track and validate user storage quotas in real-time before any write operations occur. This creates a coordinated workflow where the database manages metadata and permissions while the filesystem handles the raw binary data. This hybrid design grants the developer total control over the environment, from fine-tuning the underlying Linux kernel to scaling resources vertically, resulting in a more predictable and cost-effective system compared to traditional PaaS offerings.

---

<<<<<<< HEAD
## ✨ Features

### 🛡️ Security & Authentication
- Supabase Auth (email authentication and JWT-based sessions)  
- Row Level Security (RLS) for strict user-level data isolation  
- File validation using Multer to block executable uploads (`.exe`, `.sh`, `.bat`)  
- Nginx reverse proxy with HTTPS (Let’s Encrypt SSL)  

### 📂 Storage System
- Persistent file storage on the server’s SSD  
- In-browser preview for PDFs and MP4 files  
- Drag-and-drop upload interface using FormData  
- Real-time client-side file filtering  

### 👑 Admin Tools
- Live server telemetry (CPU, RAM, disk usage)  
- User role management (promotion, demotion, ban & wipe)  
- Global file monitoring and forced deletion system  

---

## 🛠️ Tech Stack

### Frontend
- React.js (Vite)  
- Tailwind CSS  
- Framer Motion  
- React Hot Toast, Lucide Icons  

### Backend & Infrastructure
- Node.js, Express.js  
- Multer (file handling middleware)  
- Supabase (PostgreSQL, Auth, RLS)  
- Nginx, PM2, Certbot  
- Ubuntu 24.04 (DigitalOcean VM)  

---

## 👨‍💻 Project Development

Developed by **Group 2**.

### Mark James Alcantara
- Led the overall system architecture and full-stack development  
- Designed and implemented the complete React-based user interface, including file management workflows and UI state handling  
- Developed the backend API using Node.js and Express, handling file uploads, validation, and quota enforcement  
- Integrated Supabase authentication and configured PostgreSQL with custom triggers and RPC functions for data consistency  
- Deployed the system on a DigitalOcean Ubuntu VM, including Nginx reverse proxy configuration, SSL setup, and process management via PM2  
- Established CI/CD workflow for automated deployment and updates  

### Brylle Edward A. Ramos
- Provided technical support in debugging both frontend and backend issues  
- Assisted in identifying deployment-related errors and stability improvements during production setup  
- Contributed to testing and validation of system functionality under different scenarios  

### Myka Ella A. Dalit
- Led the initial setup and configuration of the Linux virtual machine environment
- Contributed in frontend coding
- Handled provisioning and baseline system configuration on DigitalOcean  

### Alleny P. Hernandez
- Managed project-related service expenses and resource allocation 
- Secured access to the GitHub Student Developer Pack, enabling the use of cloud and development tools  
- Supported logistical and operational requirements necessary for system deployment  

### Arwin E. Eser Jose & John Rei R. Tolentino 
- Assisted in backend development, particularly in API logic and request handling  
- Contributed to implementation and refinement of server-side features  
- Supported debugging and optimization of backend processes  

### Daniel Sotalbo
- Contributed to component structuring and interface improvements  
- Supported testing and refinement of user-facing features  
=======
## ✨ Core Features

### 🛡️ Security & Authentication
- Supabase Auth Integration: Secure email/password authentication generating stateless JWT sessions.
- Row Level Security (RLS): Cryptographic database-level isolation ensuring users can only query their own files.
- Strict File Validation: Express middleware utilizing Multer to intercept, inspect, and block executable payloads (`.exe`, `.sh`, `.bat`, `.msi`) before they touch the disk.
- Secure Infrastructure: Nginx reverse proxy configured with Let’s Encrypt SSL/TLS encryption.

### 📂 Storage & Media System
- Persistent SSD Storage: Direct-to-disk binary storage bypassing the need for expensive S3 buckets.
- Cinematic Media Engine: Custom React components allowing in-browser streaming of MP4s, PDFs, and high-res images without forcing downloads.
- Smart Drag-and-Drop: Asynchronous file uploads using FormData APIs and Framer Motion animations.
- Real-Time Indexing: Instant client-side state filtering without synchronous page reloads.

### 👑 God-Mode Admin Console
- Kernel-Level Telemetry: WebSockets/Polling fetching CPU load, RAM usage, and disk space via `systeminformation`.
- RBAC (Role-Based Access Control): UI elements dynamically render based on JWT admin claims.
- Global Moderation: Ability to view files, promote users, or execute recursive file wipes.

---

## 🛠️ Technology Stack

| Domain | Technology Used |
| :--- | :--- |
| Frontend | React.js (Vite), Tailwind CSS, Framer Motion, React Dropzone, Lucide Icons |
| Backend API | Node.js, Express.js, Multer, Helmet.js, CORS |
| Database & Auth | Supabase (PostgreSQL), JWT, Custom SQL Triggers |
| Infrastructure | DigitalOcean Droplet (Ubuntu 24.04 LTS), Nginx, PM2, Certbot (SSL) |

---

## 📁 Project Structure

```bash
VictusG2-Documentation/
├── frontend/                  # React.js Client Application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                   # Node.js/Express API Server
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── uploads/               # Ignored in Git
│
└── README.md
```

---

## ⚙️ Local Development Guide

### 1. Prerequisites
- Node.js (v18.x or higher)
- Git
- Supabase account

---

### 2. Database Configuration (Supabase)

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user',
  storage_used BIGINT DEFAULT 0
);
```

Enable Row Level Security (RLS) after creating the table.

---

### 3. Environment Variables

Clone the repository:

```bash
git clone https://github.com/Amashing0411/VictusG2-Documentation.git
cd VictusG2-Documentation
```

Create `.env` files in both directories.

**Frontend (`frontend/.env`)**
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:5000/api
```

**Backend (`backend/.env`)**
```env
PORT=5000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
UPLOAD_DIR=./uploads
```

---

### 4. Running the Application

**Backend Server**
```bash
cd backend
npm install
mkdir uploads
npm start
```

**Frontend Client**
```bash
cd frontend
npm install
npm run dev
```

Application runs at:
```
http://localhost:5173
```

---

## 🌍 Production Deployment (VPS/Ubuntu)

### 1. Server Initialization

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm git nginx -y
sudo npm install -g pm2
```

---

### 2. Clone and Build

```bash
cd /var/www
git clone https://github.com/Amashing0411/VictusG2-Documentation.git victusg2
cd victusg2/frontend
npm install
npm run build
```

---

### 3. Start Node.js Daemon

```bash
cd ../backend
npm install
pm2 start server.js --name victus-api
pm2 save
pm2 startup
```

---

### 4. Nginx Reverse Proxy Configuration

```nginx
server {
    server_name victusg2.me www.victusg2.me;

    location / {
        root /var/www/victusg2/frontend/dist;
        index index.html;
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 1024M;
    }
}
```

Enable and secure:

```bash
sudo ln -s /etc/nginx/sites-available/victusg2 /etc/nginx/sites-enabled/
sudo systemctl restart nginx
sudo snap install --classic certbot
sudo certbot --nginx -d victusg2.me -d www.victusg2.me
```

---

## 👨‍💻 Team & Contributions

Developed and maintained by **Group 2**.

| Team Member | Role & Contributions |
| :--- | :--- |
| Mark James Alcantara | Lead Architect / Full-Stack: System architecture design, React frontend, Node.js API, Multer validation, Supabase integration, Nginx/SSL deployment, CI/CD |
| Alleny P. Hernandez | Project Manager: Resource allocation, service expense management |
| Myka Ella A. Dalit | Infrastructure / Frontend: Ubuntu VM setup, environment configuration |
| Arwin E. Eser Jose | Backend Developer: API routing, validation, debugging |
| John Rei R. Tolentino | Backend Developer: Supabase configuration, quota logic |
| Daniel Sotalbo | Frontend Developer: UI/UX refinement |
| Brylle Edward A. Ramos | QA & Tech Support: Testing, debugging, deployment support |
>>>>>>> 38b2cd80ee1eb627b69d2538b35661b651350f7a

---

## 🗺️ Roadmap (v2.0)

<<<<<<< HEAD
Planned improvements:
- Multi-Factor Authentication (TOTP-based)  
- Public file sharing with expiring secure links  
- Support for nested directories  

---

*Built for practical and reliable cloud storage deployment.*
=======
- TOTP Multi-Factor Authentication
- Secure File Sharing with expiration links
- Nested directory system

---

## 📜 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

<p align="center">
  <i>Built for practical and reliable cloud storage deployment.</i>
</p>
>>>>>>> 38b2cd80ee1eb627b69d2538b35661b651350f7a
