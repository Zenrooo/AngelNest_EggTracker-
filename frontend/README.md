# Frontend

Vanilla JavaScript and Vite power the interactive demo. From the repository root, run `npm.cmd ci --prefix frontend`, then `npm.cmd run dev --prefix frontend`.

- `src/main.js`: navigation, accessible forms, tables, and dashboard rendering.
- `src/domain.js`: pure transaction rules and derived inventory/totals.
- `src/storage.js`: localStorage repository boundary with validation and stale-tab detection.
- `src/style.css`: responsive neutral dashboard layout with collapsible mobile navigation.
- `test/domain.test.js`: executable rules and persistence tests using Node's built-in test runner.

All records are demo data stored in this browser. There is no Supabase connection or authentication. See the root README and `docs/prototype-standup.md` for setup and the demonstration sequence.
