![VictusG2 Cloud Banner](https://raw.githubusercontent.com/Amashing0411/VictusG2-Documentation/main/github-header-banner.png)

# VictusG2 Cloud Drive  
**A full-stack cloud storage platform with persistent server-side storage.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-victusg2.me-0ea5e9?style=for-the-badge&logo=google-cloud)](https://victusg2.me)
[![Status](https://img.shields.io/badge/Status-Production-success?style=for-the-badge)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## Table of Contents
* [Architecture](#architecture)
* [Features](#features)
* [Tech Stack](#tech-stack)
* [Getting Started (Local Setup)](#getting-started-local-setup)
* [Environment Variables](#environment-variables)
* [Production Deployment (VPS/Ubuntu)](#production-deployment-vpsubuntu)
* [Project Development & Team](#project-development--team)
* [Roadmap (v2.0)](#roadmap-v20)
* [License](#license)

---

## Architecture

The architecture of VictusG2 is defined by a transition from ephemeral, containerized environments to a stateful, self-managed infrastructure. By leveraging a dedicated Ubuntu 24.04 LTS virtual machine on DigitalOcean, the system establishes a stable compute layer that avoids the volatile filesystem resets common in platforms like Heroku or Render. This foundation allows the application to utilize the server's local disk as a permanent storage repository, specifically within the /var/www/uploads directory. Unlike cloud-native storage solutions that often require complex external integrations, this direct-to-disk approach ensures that data persists across deployments and system reboots, providing a reliable environment for long-term file management.

To maintain system integrity and prevent resource exhaustion, the architecture incorporates a logical enforcement layer at the database level. Instead of relying on rigid operating system partitions, the application logic queries the database to track and validate user storage quotas in real-time before any write operations occur. This creates a coordinated workflow where the database manages metadata and permissions while the filesystem handles the raw binary data. This hybrid design grants the developer total control over the environment, from fine-tuning the underlying Linux kernel to scaling resources vertically, resulting in a more predictable and cost-effective system compared to traditional PaaS offerings.

---

## Features

### Security & Authentication
* Supabase Auth: Secure email authentication and JWT-based sessions.
* Row Level Security (RLS): Strict user-level data isolation at the PostgreSQL database level.
* Anti-Malware Filtering: File validation using Multer to block executable uploads (.exe, .sh, .bat).
* Nginx & HTTPS: Secure reverse proxy configuration with Let's Encrypt SSL.

### Storage System
* Persistent Local Storage: Files are saved directly to the server's SSD, surviving reboots.
* Cinematic Media Engine: In-browser previews for PDFs, MP4s, and Images via custom dark-mode modals.
* Smart UI: Drag-and-drop upload interface using FormData.
* Lightning Search: Real-time client-side file filtering without page reloads.

### Admin Tools
* Live Telemetry: WebSockets/Polling for real-time CPU, RAM, and Disk space monitoring.
* Role Management: Easily promote or demote registered users.
* Global Moderation: View all uploaded files globally and execute forced "Ban & Wipe" deletions.

---

## Tech Stack

### Frontend
* React.js (Vite)  
* Tailwind CSS  
* Framer Motion  
* React Hot Toast, Lucide Icons  

### Backend & Infrastructure
* Node.js, Express.js  
* Multer (file handling middleware)  
* Supabase (PostgreSQL, Auth, RLS)  
* Nginx, PM2, Certbot  
* Ubuntu 24.04 LTS (DigitalOcean VM)  

---

## Getting Started (Local Setup)

Want to run VictusG2 Cloud on your own machine? Follow these steps to get a local development environment up and running.

### Prerequisites
* Node.js (v18 or higher recommended)
* Git
* A free Supabase account (for Database & Auth)

### 1. Clone the Repository
git clone https://github.com/Amashing0411/VictusG2-Documentation.git
cd VictusG2-Documentation

### 2. Setup the Backend
Open a terminal in the backend directory:
cd backend
npm install

Create a local uploads folder where files will be stored during development:
mkdir uploads

### 3. Setup the Frontend
Open a new terminal window in the frontend directory:
cd frontend
npm install

### 4. Configure Supabase
1. Create a new project on Supabase.
2. Enable Email Authentication.
3. Create a "profiles" table to track user storage quotas and an "admin" role column.
4. Enable Row Level Security (RLS) on your tables.

---

## Environment Variables

You will need to create a .env file in both the frontend and backend directories.

### Frontend (frontend/.env)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:5000/api

### Backend (backend/.env)
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
UPLOAD_DIR=./uploads

### 5. Run the Application
Start the backend server:
cd backend
npm start

Start the frontend React app:
cd frontend
npm run dev

Visit http://localhost:5173 in your browser!

---

## Production Deployment (VPS/Ubuntu)

VictusG2 is designed to run on a persistent Linux Virtual Machine (like a DigitalOcean Droplet). Here is a brief overview of how to deploy it for production.

1. Provision a Server: Spin up an Ubuntu 24.04 server.
2. Install Dependencies: Install Node.js, Git, Nginx, and PM2 on the server.
3. Clone & Build:
   - Clone the repo to /var/www/victusg2.
   - Run "npm install" in both frontend and backend.
   - Run "npm run build" in the frontend directory to generate static files.
4. Start the Backend Daemon:
   Use PM2 to keep the backend alive 24/7:
   pm2 start server.js --name "victus-backend"
   pm2 save
5. Nginx Reverse Proxy:
   Configure Nginx to serve the React dist folder and proxy API requests to the Node backend (port 5000).
6. SSL Certificate:
   Run "sudo certbot --nginx -d yourdomain.com" to secure the app with HTTPS.

---

## Project Development & Team

Developed by Group 2.

### Mark James Alcantara
* Led the overall system architecture and full-stack development  
* Designed and implemented the complete React-based user interface, including file management workflows and UI state handling  
* Developed the backend API using Node.js and Express, handling file uploads, validation, and quota enforcement  
* Integrated Supabase authentication and configured PostgreSQL with custom triggers and RPC functions for data consistency  
* Deployed the system on a DigitalOcean Ubuntu VM, including Nginx reverse proxy configuration, SSL setup, and process management via PM2  
* Established CI/CD workflow for automated deployment and updates  

### Brylle Edward A. Ramos
* Provided assistance in project-related service expenses and resource allocation  
* Assisted in identifying deployment-related errors and stability improvements during production setup  
* Contributed to testing and validation of system functionality under different scenarios  

### Myka Ella A. Dalit
* Led the initial setup and configuration of the Linux virtual machine environment
* Contributed in frontend coding
* Handled provisioning and baseline system configuration on DigitalOcean  

### Alleny P. Hernandez
* Managed project-related service expenses and resource allocation 
* Secured access to the GitHub Student Developer Pack, enabling the use of cloud and development tools  
* Supported logistical and operational requirements necessary for system deployment  

### Arwin E. Eser Jose & John Rei R. Tolentino 
* Assisted in backend development, particularly in API logic and request handling  
* Contributed to implementation and refinement of server-side features  
* Supported debugging and optimization of backend processes  

### Daniel Sotalbo
* Contributed to component structuring and interface improvements  
* Supported testing and refinement of user-facing features  

---

## Roadmap (v2.0)

Planned improvements:
* Multi-Factor Authentication (TOTP-based)  
* Public file sharing with expiring secure links  
* Support for nested directories  

---

## License

This project is licensed under the MIT License. You are free to use, modify, and distribute this software as long as the original license header is included.

Built for practical and reliable cloud storage deployment.
