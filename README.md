# Aynkaran Consultants Desk ERP (Enterprise Workstation Solution)

An advanced ERP workstation application custom built for **Aynkaran Consultants Ltd.**, facilitating Licencing Trainee Recruitment Pipeline Tracking, Customer Profile Records archiving, and Policy Insurance Renewal forecasting. 

A hybrid offline first Electron shell enclosing a secure local Express server fueled by a relational SQLite Database.

---

## 📂 Core Desktop Architecture Folder Tree

```text
aynkaran-consultants/
│
├── electron/
│   ├── main.js             # Electron Main Process entry checkpoint
│   ├── preload.js          # Secure bridge context isolation
│   ├── ipcHandlers.js      # System Print, Directory Backups, and Native OS Hooks
│   └── updater.js          # Automatic OTA update check pipeline
│
├── backend/
│   ├── config/
│   │   └── db.js           # Relational high-performance SQLite engine tables setup
│   ├── controllers/
│   │   ├── customerController.js
│   │   ├── recruitmentController.js
│   │   ├── policyController.js
│   │   └── reminderController.js
│   ├── routes/
│   │   ├── customerRoutes.js
│   │   ├── recruitmentRoutes.js
│   │   ├── policyRoutes.js
│   │   └── reminderRoutes.js
│   ├── cron/
│   │   ├── reminderJobs.js # Daily check pipeline for delayed trainees
│   │   └── renewalJobs.js  # Premium due warning checker
│   ├── utils/
│   │   ├── pdfGenerator.js # High resolution certified PDF Dossier templates
│   │   ├── emailService.js # TLS Outbound MX receipt dispatcher
│   │   └── smsService.js   # WhatsApp integration gateways
│   ├── app.js              # Express core middlewares setup
│   └── server.js           # Server application boot entry point
│
├── frontend/ (Current directory root)
│   ├── src/                # Fully featured high contrast operation UI
│   └── package.json
│
├── database.json           # Offline file database fallback
├── electron-builder.json   # Package installers specification configuration
└── README.md
```

---

## ⚡ Setup & Launching Workspace Manually

### Prerequisite Dependencies
- Ensure **Node.js LTS (v18+)** is configured.

### 1. Installation of Module Packages
Navigate inside the root folder, and clean-install global core dependencies:
```bash
npm install
```

### 2. Run in Developer Mode
To spin up both the Vite React workstation front-end and the local Node SQLite API server concurrently:
```bash
npm run dev
```

### 3. Compile Production Application
Generate compiled server assets and optimized single page React outputs:
```bash
npm run build
```

### 4. Build Desktop Installers (.EXE / .DMG)
To package and generate your standalone offline executable installers (located under `./release/`):
```bash
npm run dist
```

---

## 🔒 Security & Access Best Practices
1. **Context Isolation**: Always keep `contextIsolation` enabled in `preload.js` preventing front-end scripts from triggering raw Node processes.
2. **Local Caching Encrypt**: For confidential client files, encrypt the SQLite database using standard **SQLCipher** bindings in production environment targets.
