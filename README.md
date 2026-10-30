<<<<<<< HEAD
# LPMS — Linux Process Management System

### Linux System Administration Portal

A lightweight, professional, and robust Linux process monitoring and system administration portal designed for workstation and server oversight.

LPMS provides real-time visibility into running Linux processes, hardware resource telemetry, threshold alerting, and native process controls (`kill -STOP`, `kill -TERM`).

---

## Architecture

```text
Linux Operating System (Ubuntu / WSL)
               ↓
    /proc/stat & /proc/meminfo & ps
               ↓
Java ProcessAPI Backend (ProcessAPI.java on port 8080)
               ↓
    Standard REST Endpoints
               ↓
React Frontend (Vite on port 3000)
               ↓
   LPMS System Administration Portal
```

---

## How It Works

```text
Linux System
     ↓
Running Processes
     ↓
CPU & Memory Monitoring
     ↓
Java ProcessAPI Backend
     ↓
LPMS Dashboard
     ↓
Alerts & Activity Logs
```

---

## Project Structure

```text
linux-process-monitor/
├── backend/
│   └── ProcessAPI.java      # Lightweight Java HTTP REST API (com.sun.net.httpserver)
├── frontend/ (src/)
│   ├── components/
│   │   ├── DashboardView.tsx # Summary cards, 2-column layout, alerts, activity, deployment profiles & pipeline
│   │   ├── ProcessesView.tsx # Full process table with search, Stop and Terminate controls
│   │   ├── AlertsView.tsx    # Real-time threshold alerts (High CPU, High RAM)
│   │   ├── ActivityView.tsx  # Audit trail from logs/activity.log
│   │   ├── SettingsView.tsx  # Threshold configuration, refresh rate & deployment profile
│   │   ├── Header.tsx        # LPMS branding, system status, live indicator, refresh button
│   │   └── Sidebar.tsx       # LPMS navigation & backend status
│   ├── services/
│   │   └── api.ts           # REST API client
│   ├── types/
│   │   └── process.ts       # Type definitions
│   ├── App.tsx              # Root container & automatic polling scheduler
│   └── main.tsx             # React entry point
├── logs/
│   └── activity.log         # Audit log written by Java backend
└── README.md
```

---

## How to Run

### 1. Start the Java Backend (Ubuntu / WSL)

```bash
cd backend
javac ProcessAPI.java
java ProcessAPI
```

The server starts on `http://localhost:8080` with the following REST endpoints:
- `GET  /api/processes` — Live processes parsed from `ps -eo pid,args,%cpu,%mem,state --no-headers`
- `POST /api/processes/{pid}/stop` — Sends `kill -STOP <pid>`
- `POST /api/processes/{pid}/terminate` — Sends `kill -TERM <pid>` (protected against PID 1 and backend PID)
- `GET  /api/system-stats` — Real CPU from `/proc/stat` and RAM from `/proc/meminfo`
- `GET  /api/alerts` — Real-time threshold alerts (`?cpuThreshold=80&memThreshold=80`)
- `GET  /api/activity` — Reads audit events from `logs/activity.log`
- `GET  /api/health` — Status verification

### 2. Start the React Frontend

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Dashboard Overview

- **Top**: **LPMS — Linux Process Management System** with subtitle **Linux System Administration Portal**, System Online/Offline status, and LIVE indicator.
- **Summary Cards**:
  1. `Total Processes`: Number of detected Linux processes.
  2. `Running Processes`: Active processes in kernel execution state `R`.
  3. `CPU Usage`: Host system CPU usage percentage.
  4. `Memory Usage`: Host physical RAM allocation percentage.
- **Main Section (Two-Column Layout)**:
  - **Live Process Monitoring**: Table displaying PID, Process Name, CPU %, Memory %, Status, and functional Stop/Terminate buttons.
  - **System Resource Overview**: Dual-tone CPU & RAM progress bars, monitoring status, refresh interval, and backend service health.
- **Active Alerts**: Real-time alerts for processes exceeding CPU or RAM thresholds.
- **Recent Activity**: Audit events from process interventions (`STOPPED`, `TERMINATED`, `HIGH_CPU`, `HIGH_MEMORY`).
- **Deployment & Use-Case Section**: 4 deployment environments:
  1. **College Computer Lab**: "LPMS can be deployed to monitor Linux workstations in a college computer lab."
  2. **School Computer Lab**: "LPMS can be deployed to monitor Linux workstations in a school computer lab."
  3. **Department Linux Server**: "LPMS can be deployed to monitor a department Linux server."
  4. **Institution Linux Server**: "LPMS can be deployed to monitor an institution Linux server."
- **How It Works**: Visual pipeline diagram from Linux kernel to LPMS administration dashboard.

---

## Testing Real Linux Features

1. **Process Inspection**:
   In terminal: `sleep 1000 &`
   The process immediately appears on the Dashboard and Processes page.
2. **Process Stop (`kill -STOP`)**:
   Click **Stop** next to the process. State changes to **Stopped** and a `STOPPED` record is saved in `logs/activity.log`.
3. **Process Terminate (`kill -TERM`)**:
   Click **Terminate**, confirm the prompt. The process terminates and disappears from the process list.
4. **Threshold Alerts**:
   Lower the CPU threshold to `10%` in Settings. Run a temporary CPU-intensive command. A real High CPU alert appears on the Dashboard and Alerts page.
=======
## Project Abstract

[📄 Click here to view the OSSP Abstract](./OSSP_ABSTRACT.pdf)
>>>>>>> 721b8f1078583cb498927e26dfbc97f4e61fc539
