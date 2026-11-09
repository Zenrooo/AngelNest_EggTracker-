# EggTrack

EggTrack is an early web-based egg production and farm management prototype for Golden Nest Poultry Farm. One tray holds 30 eggs of the same size. The four sizes are Small, Medium, Large, and Extra-Large.

## Current status

**Implemented in the local prototype:** Dashboard, Egg Production, Inventory & Packing, Sales, and Expenses. Production increases loose stock; packing converts 30 same-size eggs into each tray; sales deduct trays; expenses update totals. Validation rejects negative/fractional counts and stock shortages. A shared transaction history drives all pages, with localStorage persistence and reset controls.

**Demo-only:** all records and prices. Data is saved in the current browser, not a shared database. The prototype has no login or role enforcement.

**Existing backend:** Node.js/Express with `GET /api/health` and local environment variable support. This confirms only that the API server is running. The frontend demo runs independently of it.

**Planned:** reviewed PostgreSQL migrations, Supabase integration, authentication/authorization, authoritative server-side stock transactions, record corrections, and additional reports. No database schema has been deployed by this prototype.

## Run the interactive prototype

Open this repository folder in VS Code. In a PowerShell terminal at the repository root:

```powershell
npm.cmd ci --prefix frontend
npm.cmd run dev --prefix frontend
```

Open the local URL printed by Vite, normally `http://127.0.0.1:5173/`. Use the Vite command to run the application. The demo needs no `.env` file and no Supabase credentials. Stop the server with `Ctrl+C`.

Use **Reset Demo Data** to choose **Restore sample data** or **Start empty demo**. Each reset replaces only this browser's EggTrack demo transactions after you choose a reset option. Browser storage is scoped to the hostname and port, so keep using the same URL when checking persistence.

### Demonstrate from an empty state

1. Start empty demo, then record 95 Large eggs in Egg Production.
2. Pack 3 Large trays: 5 loose eggs and 3 full trays remain.
3. Sell 2 Large trays at an illustrative ₱210 per tray: 1 tray remains, revenue ₱420.
4. Record a Chicken Feed expense of ₱500 with a description.
5. Dashboard shows 95 produced, 5 loose, 1 available tray, 2 sold, ₱420 revenue, ₱500 expenses, and -₱80 simple net result.
6. Reload the page to check persistence. Try overselling to see stock validation.

### Tests and build

```powershell
npm.cmd test --prefix frontend
npm.cmd run build --prefix frontend
npm.cmd run preview --prefix frontend
```

The tests use Node's built-in runner. Build output is in ignored `frontend/dist/`. Preview serves the build at the URL it prints; its separate port has separate demo storage.

See [executed test results](docs/prototype-test-results.md), the [standup script and demo plan](docs/prototype-standup.md), and the [Supabase integration plan](docs/supabase-integration-plan.md).

## Technology

- Frontend: HTML, CSS, vanilla JavaScript with Vite
- Backend: Node.js and Express.js
- Database: Supabase PostgreSQL, after the Milestone II design is reviewed
- Authentication: Supabase Auth, planned
- Collaboration: Git and GitHub

Vite 8 requires Node.js 20.19+ within Node 20, or Node.js 22.12+. This prototype was tested with the installed Node.js 26.13.0. Use npm and Git. VS Code and Postman are optional development tools.

## Project structure

```text
frontend/src/         Browser UI, transaction rules, storage adapter, and styles
frontend/test/        Automated domain and persistence tests
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
{ "status": "ok", "application": "EggTrack" }
```

Use `npm.cmd start --prefix backend` to run without watch mode. Stop the server with `Ctrl+C`.

## Environment variables and Supabase

Keep `.env` in the repository root and never commit it. Set `PORT` to change the API port. When a Supabase project is available, copy its project URL and publishable key from the Supabase dashboard into `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. If backend administration later requires a secret key, place it in `SUPABASE_SECRET_KEY` in the local `.env` only. The secret key must stay on the server and must be used only behind appropriate authorization checks.

No Supabase client or database connection exists yet. If future frontend code connects directly to Supabase, review Row Level Security and policies before exposing data. Never place privileged credentials in variables prefixed `VITE_`, which are exposed to browser code. Do not write migrations until the Milestone II ERD, data dictionary, and logical model are reviewed, including how tray packing fits the latest ten-entity design. See the integration plan for the required sequence.

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
