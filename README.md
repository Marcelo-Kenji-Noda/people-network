People Network – Dev Setup and Run Guide

Overview

This project is a small full‑stack app:
- Backend: Express + TypeScript + PostgreSQL
- Frontend: React + TypeScript (Vite + MUI)

Prerequisites

- Node.js 20.19+ (or 22.12+). Vite will warn/fail on older Node.
- PostgreSQL 13+ running locally (or a reachable server).
- Windows PowerShell 5.1+ (for the manage.ps1 convenience script).

1) Install dependencies

- Backend: from backend, run: npm install
- Frontend: from frontend, run: npm install

2) Database setup

Option A — Quick local database
- Connect as a superuser and run backend/migrations/create_database.sql to create DB and optional app user.

Option B — Use an existing database
- Skip create_database.sql and use your credentials in .env.

3) Configure backend environment

- Create backend/.env using the example below (or copy backend/.env.example to backend/.env):

	DB_HOST=localhost
	DB_PORT=5432
	DB_USER=postgres
	DB_PASSWORD=
	DB_NAME=people_network
	PORT=3001

4) Run database migrations

- From backend, run: npm run db:migrate
- If you hit ownership/permission errors, apply the SQL files manually as a superuser in this order:
	- backend/migrations/001_init.sql
	- backend/migrations/002_groups.sql
	- backend/migrations/003_group_color.sql

5) Start/Stop servers (recommended)

Use the root manage.ps1 script to run both servers in separate windows.

- Start: .\manage.ps1 start
- Status: .\manage.ps1 status
- Stop: .\manage.ps1 stop
- Restart: .\manage.ps1 restart

Notes:
- If script execution is restricted, run in the current session: Set-ExecutionPolicy -Scope Process Bypass -Force
- Logs remain attached to the new windows; closing those windows will stop the process.

Manual run (alternative)

- Backend (from backend): npm run dev  → http://localhost:3001/health
- Frontend (from frontend): npm run dev → http://localhost:5173

Troubleshooting

- Node version warning from Vite: upgrade to Node 20.19+ or 22.12+.
- Port in use: stop conflicting processes or change PORT in backend/.env.
- DB connection: verify backend/.env values and that the DB accepts connections.
- Migrations: if npm run db:migrate fails, apply SQL files manually as superuser.

API Endpoints (dev)

- Health: GET http://localhost:3001/health
- People: GET/POST/PUT/DELETE http://localhost:3001/api/people
- Interactions: POST http://localhost:3001/api/interactions
- Interactions (by date): GET/DELETE http://localhost:3001/api/interactions/:date/people
- Stats: GET http://localhost:3001/api/stats?filter=all|year|month&period=YYYY|YYYY-MM
- Groups: GET/POST/PUT/DELETE http://localhost:3001/api/groups

Frontend (dev)

- App served by Vite at http://localhost:5173
- Expects backend at http://localhost:3001 (CORS enabled)

Notes on Groups Color

- Groups have a color (default #9e9e9e). You can update it on the Groups page via the color picker. The People table shows a colored stripe from the person’s group.
