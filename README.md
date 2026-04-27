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

Unlike typical student projects deployed on ephemeral platforms (e.g., Render, Railway, Heroku) where uploaded files are lost on restart, **VictusG2** is built around persistent storage.

The system runs on a dedicated **Ubuntu 24.04 LTS virtual machine** hosted on DigitalOcean. Files are stored directly on the server’s disk (`/var/www/uploads`), with user quotas enforced at the database level. This ensures consistent data retention, improved reliability, and full control over system resources.

---

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
- Handled provisioning and baseline system configuration on DigitalOcean  
- Ensured proper server environment preparation for backend deployment and storage operations  

### Alleny P. Hernandez
- Managed project-related service expenses and resource allocation  
- Secured access to the GitHub Student Developer Pack, enabling the use of cloud and development tools  
- Supported logistical and operational requirements necessary for system deployment  

### Arwin E. Eser Jose & John Rei R. Tolentino 
- Assisted in backend development, particularly in API logic and request handling  
- Contributed to implementation and refinement of server-side features  
- Supported debugging and optimization of backend processes  

### Daniel Sotalbo
- Assisted in frontend development and UI implementation  
- Contributed to component structuring and interface improvements  
- Supported testing and refinement of user-facing features  

---

## 🗺️ Roadmap (v2.0)

Planned improvements:
- Multi-Factor Authentication (TOTP-based)  
- Public file sharing with expiring secure links  
- Support for nested directories  

---

*Built for practical and reliable cloud storage deployment.*
