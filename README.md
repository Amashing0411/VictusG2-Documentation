<div align="center">
  <img src="https://raw.githubusercontent.com/Amashing0411/VictusG2-Documentation/main/github-header-banner.png" alt="VictusG2 Cloud Banner" width="100%" />
  <br />

# ☁️ VictusG2 Cloud Drive  
**An Enterprise-Grade, Full-Stack Cloud Storage Platform with Persistent Server-Side Storage.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-victusg2.me-0ea5e9?style=for-the-badge&logo=google-cloud)](https://victusg2.me)
[![Status](https://img.shields.io/badge/Status-Production-success?style=for-the-badge)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

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

The architecture of VictusG2 is defined by a transition from ephemeral, containerized environments to a stateful, self-managed infrastructure. By leveraging a dedicated Ubuntu 24.04 LTS virtual machine on DigitalOcean, the system establishes a stable compute layer that avoids the volatile filesystem resets common in platforms like Heroku or Render. This foundation allows the application to utilize the server’s local disk as a permanent storage repository, specifically within the /var/www/uploads directory. Unlike cloud-native storage solutions that often require complex external integrations, this direct-to-disk approach ensures that data persists across deployments and system reboots, providing a reliable environment for long-term file management.

To maintain system integrity and prevent resource exhaustion, the architecture incorporates a logical enforcement layer at the database level. Instead of relying on rigid operating system partitions, the application logic queries the database to track and validate user storage quotas in real-time before any write operations occur. This creates a coordinated workflow where the database manages metadata and permissions while the filesystem handles the raw binary data. This hybrid design grants the developer total control over the environment, from fine-tuning the underlying Linux kernel to scaling resources vertically, resulting in a more predictable and cost-effective system compared to traditional PaaS offerings.

---

## ✨ Core Features

### 🛡️ Security & Authentication
- Supabase Auth Integration: Secure email/password authentication generating stateless JWT sessions.
- Row Level Security (RLS): Cryptographic database-level isolation ensuring users can only query their own files.
- Strict File Validation: Express middleware utilizing Multer to intercept, inspect, and block executable payloads (.exe, .sh, .bat, .msi) before they touch the disk.
- Secure Infrastructure: Nginx reverse proxy configured with Let’s Encrypt SSL/TLS encryption.

### 📂 Storage & Media System
- Persistent SSD Storage: Direct-to-disk binary storage bypassing the need for expensive S3 buckets.
- Cinematic Media Engine: Custom React components allowing in-browser streaming of MP4s, PDFs, and high-res images without forcing downloads.
- Smart Drag-and-Drop: Asynchronous file uploads using FormData APIs and buttery-smooth Framer Motion animations.
- Real-Time Indexing: Instant client-side state filtering without synchronous page reloads.

### 👑 God-Mode Admin Console
- Kernel-Level Telemetry: WebSockets/Polling fetching raw CPU load, RAM usage, and Disk Space directly from the Ubuntu kernel via systeminformation.
- RBAC (Role-Based Access Control): UI elements dynamically render based on JWT admin claims.
- Global Moderation: The ability to globally view files, promote users, or execute a recursive file wipe on malicious accounts.

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

VictusG2-Documentation/
├── frontend/                  # React.js Client Application
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # Reusable UI (Modals, Dropzones, Navbars)
│   │   ├── pages/             # Route views (Dashboard, Admin, Login)
│   │   ├── context/           # React Context (Auth State)
│   │   ├── utils/             # Helper functions (API formatters)
│   │   └── App.jsx            # Main router
│   ├── package.json
│   └── vite.config.js
│
├── backend/                   # Node.js/Express API Server
│   ├── controllers/           # Route logic (Auth, Files, Telemetry)
│   ├── middleware/            # JWT validation, Multer config, Virus scanning
│   ├── routes/                # Express router definitions
│   ├── server.js              # Application entry point
│   ├── package.json
│   └── uploads/               # Local directory for file storage (Ignored in Git)
│
└── README.md                  # Project documentation

---

## ⚙️ Local Development Guide

### 1. Prerequisites
Ensure you have the following installed on your local machine:
- Node.js (v18.x or higher)
- Git
- A Supabase account (Free tier is sufficient)

### 2. Database Configuration (Supabase)
To run this project, you must configure a PostgreSQL database on Supabase:
1. Create a new Supabase project.
2. Go to Authentication -> Providers and enable Email.
3. Open the SQL Editor and execute a script to create your profiles table to track quotas:
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
     email TEXT,
     role TEXT DEFAULT 'user',
     storage_used BIGINT DEFAULT 0
   );
4. Enable Row Level Security (RLS) on the profiles table so users can only view their own data.

### 3. Environment Variables
Clone the repository:
git clone https://github.com/Amashing0411/VictusG2-Documentation.git
cd VictusG2-Documentation

You need to create a .env file in both directories.

Frontend (frontend/.env)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:5000/api

Backend (backend/.env)
PORT=5000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
UPLOAD_DIR=./uploads

### 4. Running the Application

Start the Backend Server:
cd backend
npm install
mkdir uploads
npm start

Start the Frontend Client:
Open a separate terminal window:
cd frontend
npm install
npm run dev

The application will be available at http://localhost:5173.

---

## 🌍 Production Deployment (VPS/Ubuntu)

VictusG2 is engineered for bare-metal or VPS deployments. Here is the standard deployment flow for an Ubuntu 24.04 server.

### 1. Server Initialization
SSH into your server and install the required dependencies:
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm git nginx -y
sudo npm install -g pm2

### 2. Clone and Build
cd /var/www
git clone https://github.com/Amashing0411/VictusG2-Documentation.git victusg2
cd victusg2/frontend
npm install
npm run build

### 3. Start the Node.js Daemon
Navigate to the backend, install modules, and start PM2 to ensure 24/7 uptime:
cd ../backend
npm install
pm2 start server.js --name victus-api
pm2 save
pm2 startup

### 4. Nginx Reverse Proxy Configuration
Create an Nginx server block (/etc/nginx/sites-available/victusg2) to serve the static frontend and proxy API requests to the hidden Node.js port:

server {
    server_name victusg2.me www.victusg2.me;

    # Serve React Frontend
    location / {
        root /var/www/victusg2/frontend/dist;
        index index.html;
        try_files $uri /index.html;
    }

    # Reverse Proxy for Node.js Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 1024M; 
    }
}

Enable the site and secure it with SSL:
sudo ln -s /etc/nginx/sites-available/victusg2 /etc/nginx/sites-enabled/
sudo systemctl restart nginx
sudo snap install --classic certbot
sudo certbot --nginx -d victusg2.me -d www.victusg2.me

---

## 👨‍💻 Team & Contributions

Developed and maintained by **Group 2**.

| Team Member | Role & Contributions |
| :--- | :--- |
| **Mark James Alcantara** | Lead Architect / Full-Stack: System architecture design, React frontend implementation, Node.js API development, Multer validation, Supabase integration, Nginx/SSL production deployment, and CI/CD pipelines. |
| **Alleny P. Hernandez** | Project Manager: Resource allocation, service expense management, and securing GitHub Student Developer Pack resources for cloud hosting. |
| **Myka Ella A. Dalit** | Infrastructure / Frontend: Ubuntu virtual machine provisioning, Linux OS environment configuration, and React component styling. |
| **Arwin E. Eser Jose** | Backend Developer: Express.js API routing, request handling, file validation security, and backend logic debugging. |
| **John Rei R. Tolentino** | Backend Developer: Supabase database configuration, logical quota enforcement API development, and process optimization. |
| **Daniel Sotalbo** | Frontend Developer: React component structuring, UI/UX refinement, and user-facing feature testing. |
| **Brylle Edward A. Ramos** | QA & Tech Support: Production environment debugging, system stability testing, security validation, and deployment troubleshooting. |

---

## 🗺️ Roadmap (v2.0)

We are actively working on expanding the capabilities of VictusG2 Cloud. Planned features include:
- TOTP Multi-Factor Authentication: Enhancing account security with authenticator apps.
- Secure File Sharing: Generating public download links with automated expiration dates.
- Nested Directory Support: Full folder-creation capabilities for advanced file organization.

---

## 📜 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT). You are free to use, modify, and distribute this software as long as the original license header is included.

<br />

<div align="center">
  <i>Built for practical and reliable cloud storage deployment.</i>
</div>
