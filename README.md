<div align="center">
  <img src="https://raw.githubusercontent.com/Amashing0411/VictusG2-Documentation/main/github-header-banner.png" alt="VictusG2 Cloud Banner" width="100%" />

  <br />

  # ☁️ VictusG2 Cloud Drive
  **An Industry-Standard, Full-Stack Persistent Cloud Storage Platform.**
  
  [![Live Demo](https://img.shields.io/badge/Live_Demo-victusg2.me-0ea5e9?style=for-the-badge&logo=google-cloud)](https://victusg2.me)
  [![Status](https://img.shields.io/badge/Status-Production-success?style=for-the-badge)](#)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

  *Engineered for secure, high-performance file management with dedicated Linux persistent storage.*
</div>

---

## 🚀 The Architecture
Unlike standard student projects deployed on ephemeral PaaS containers (Render/Railway/Heroku) which permanently delete user files on server restarts, **VictusG2** is architected as a true persistent cloud drive. 

It is deployed on a dedicated **Ubuntu 24.04 LTS Virtual Machine** via DigitalOcean. This ensures true physical local storage (`/var/www/uploads`), strict 1GB user quotas tracked dynamically at the database level, and real-time Linux server hardware monitoring.

---

## ✨ Features

### 🛡️ Security & Authentication
* **Supabase Auth:** Secure Email Sign-up, JWT Login, and automated HTML Password Reset emails.
* **Row Level Security (RLS):** Strict PostgreSQL database policies ensure users can *only* access their own metadata.
* **Anti-Malware File Filter:** Node.js Multer middleware strictly rejects executable files (`.exe`, `.sh`, `.bat`) to prevent server injection attacks.
* **Nginx Reverse Proxy:** All API traffic is securely routed and encrypted via Let's Encrypt SSL (`https://`).

### 📂 Cloud Storage Engine
* **Persistent Storage:** Files are written in chunks directly to the Ubuntu server's physical SSD.
* **Cinematic Media Engine:** PDFs and MP4 Videos open dynamically in a sleek, in-browser theater modal without requiring a download.
* **Drag-and-Drop Dropzone:** Smart UI that detects file hovers and instantly uploads via FormData.
* **Real-Time Filtering:** Client-side React state dynamically filters files by name instantly as the user types.

### 👑 Admin Console
* **Live Telemetry:** Tracks the actual Ubuntu Server's CPU, RAM, and Disk Space in real-time.
* **User Moderation:** Admins can promote/demote users, or utilize the "Ban & Wipe" feature which recursively deletes a user's physical folder from the Linux hard drive (`fs.rmSync`).
* **Global Oversight:** Admins can filter the global file table by owner and forcefully delete any file violating TOS.

---

## 🛠️ Tech Stack

### Frontend (Client)
* **Framework:** React.js (Vite for speed and optimized builds)
* **Styling:** Tailwind CSS (Fully responsive with `localStorage` Light/Dark mode toggles)
* **Animation:** Framer Motion (Pop-layouts, presence detection, modal scaling)
* **UX/UI:** React Hot Toast (Notifications), Lucide React (Icons)

### Backend (API & Infrastructure)
* **Server:** Node.js with Express.js
* **File Handling:** Multer (DiskStorage Engine)
* **Security:** Helmet (HTTP Headers), CORS (Cross-Origin Resource Sharing)
* **Database & BaaS:** Supabase (PostgreSQL with custom SQL Triggers & RPC Functions)
* **Deployment:** Ubuntu LTS 24.04, Nginx, Certbot (SSL), PM2 (Process Manager), Git CI/CD

---

## 👨‍💻 Project Development
This project was solo-developed by **Mark James Alcantara** (Group 2). 

**Key Contributions:**
* **Frontend:** Designed and built the entire React user interface, including the Google Drive-style file manager, Light/Dark mode toggles, and Framer Motion animations.
* **Backend:** Wrote the Node.js/Express server to handle physical file uploads (`multer`), enforce the 1GB quota, and block malicious file types.
* **Database:** Configured Supabase Auth and wrote the PostgreSQL triggers and RPC functions to sync user data.
* **Deployment:** Spun up the DigitalOcean Ubuntu Virtual Machine, configured the Nginx reverse proxy, generated the SSL certificates, and managed the Git CI/CD pipeline to push the code live.

---

## 🗺️ V2.0 Future Roadmap
While the current MVP focuses on core infrastructure and persistent storage, the following features are architected for the next major release:
* **Multi-Factor Authentication (MFA):** Integration with TOTP apps (Google Authenticator/Authy) via Supabase Auth Assurance Levels (AAL2).
* **Public File Sharing:** Generate expiring, cryptographically secure public URLs for specific files.
* **Nested Directories:** Allowing users to create and manage virtual folders within their root directory.

---
*Built with ❤️ for secure cloud storage.*
