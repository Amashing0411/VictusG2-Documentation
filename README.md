# ☁️ VictusG2 Cloud Drive

<p align="center">
  <img src="https://i.postimg.cc/mPxzyf0W/github-header-banner.png" width="1000">
</p>

An Industry-Standard, Full-Stack Persistent Cloud Storage Platform built for secure file management.

## 🚀 Overview
VictusG2 is a persistent FTP/Cloud Drive hybrid. Unlike standard PaaS deployments (Render/Railway) which use ephemeral containers that delete user files on restart, VictusG2 is deployed on a dedicated **Ubuntu 24.04 LTS Virtual Machine**. This ensures true persistent local storage, strict 1GB user quotas, and real-time Linux server monitoring.

## ✨ Enterprise Features
* **Authentication:** Secure Email Sign-up, Login, and automated HTML Password Reset emails via Supabase Auth.
* **Persistent Storage:** Files are saved directly to the Node.js server's physical hard drive.
* **Quota Management:** Strict 1GB per-user storage limit enforced at the PostgreSQL database level.
* **Row Level Security (RLS):** Supabase database policies ensure users can *only* access their own files.
* **God-Mode Admin Console:** Live dashboard that tracks the actual Ubuntu Server's CPU, RAM, and Disk Space, with full moderation controls (Ban, Wipe, Role Management).
* **Modern UI/UX:** Built with React, Tailwind CSS, Framer Motion animations, Light/Dark Mode toggles, and Google Drive-style file previews.

## 🛠️ Tech Stack
* **Frontend:** React.js (Vite), Tailwind CSS, Framer Motion
* **Backend:** Node.js, Express.js, Multer (File Handling), Helmet & CORS (Security)
* **Database & BaaS:** Supabase (PostgreSQL)
* **Infrastructure:** DigitalOcean Ubuntu LTS Server, Nginx Reverse Proxy, Let's Encrypt SSL (HTTPS)

## 👨‍💻 Developer
* **Mark James Alcantara** - Solo Developer, UI/UX Designer, Backend Engineer, & Cloud Architect
