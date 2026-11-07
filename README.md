# EggTrack

EggTrack is a planned web-based egg production and farm management system for Golden Nest Poultry Farm. It will track production by egg size, loose eggs and trays, inventory, sales, expenses, and reports. One tray holds 30 eggs of the same size. The four sizes are Small, Medium, Large, and Extra-Large.

## Current status

**Implemented:** a Node.js/Express API foundation with `GET /api/health`, local environment variable support, and a repository structure for team development. The health endpoint confirms only that the API server is running.

**Planned:** production, inventory, packing, sales, expenses, dashboard/reports, Supabase Auth, permissions, database migrations, and the user interface. Inventory validation rules, including nonnegative stock and sales limited to available trays, are requirements for later features; they are not implemented yet.

## Technology

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js and Express.js
- Database: Supabase PostgreSQL, after the Milestone II design is reviewed
- Authentication: Supabase Auth, planned
- Collaboration: Git and GitHub

Use Node.js 20 or later (prefer a currently supported LTS release), npm, and Git. VS Code and Postman are optional development tools.

## Project structure

```text
frontend/             Planned browser interface
backend/src/          Express API source
supabase/migrations/  Future reviewed PostgreSQL migrations
docs/                 Project and database design documents
.env.example          Safe template for local environment settings
.gitignore            Local files and generated output excluded from Git
.editorconfig         Shared basic editor formatting
```

## Run the API

After the initial setup has been pushed to GitHub, a teammate can clone the repository and run these commands in PowerShell:

```powershell
git clone https://github.com/Zenrooo/AngelNest_EggTracker-.git
Set-Location AngelNest_EggTracker-
npm.cmd ci --prefix backend
Copy-Item .env.example .env
npm.cmd run dev --prefix backend
```

The `.env` copy is optional for the health endpoint; without it the server uses port `3000`. To check the running API in another PowerShell window:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Expected JSON:

```json
{"status":"ok","application":"EggTrack"}
```

Use `npm.cmd start --prefix backend` to run without watch mode. Stop the server with `Ctrl+C`.

## Environment variables and Supabase

Keep `.env` in the repository root and never commit it. Set `PORT` to change the API port. When a Supabase project is available, copy its project URL and publishable key from the Supabase dashboard into `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. If backend administration later requires a secret key, place it in `SUPABASE_SECRET_KEY` in the local `.env` only. The secret key must stay on the server and must be used only behind appropriate authorization checks.

No Supabase client or database connection exists yet. If future frontend code connects directly to Supabase, review Row Level Security and policies before exposing data. Do not write migrations until the Milestone II ERD, data dictionary, and logical model are approved.

## Team workflow

The leader owns backend, database, Supabase setup, authentication, API integration, GitHub management, and final integration. The other four members can take frontend screens, production/inventory, sales/expenses, testing, and documentation in agreed feature branches.

For each small task:

```powershell
git switch main
git pull origin main
git switch -c feature/short-task-name
# Make and test the change, then stage only the relevant files.
git add <files>
git commit -m "feat: describe the change"
git push -u origin feature/short-task-name
```

Open a pull request into `main`, ask a teammate to review it, and merge after the checks and review pass. Do not put passwords or Supabase secret keys in commits, issues, or pull requests.

After the initial push, the repository owner should add a `main` branch ruleset in GitHub Settings → Rules → Rulesets: require pull requests and one approval, and prevent force pushes and deletion. Add required automated status checks only after the team creates useful checks.
