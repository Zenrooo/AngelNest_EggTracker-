# Prototype test results

Review date: 9 November 2026 (Asia/Manila).

## Automated checks executed

`npm.cmd test --prefix frontend`: 10 tests passed, 0 failed.

The tests cover the 95-egg production-to-sale scenario; negative, fractional, blank and excessive quantities; packing by size; insufficient stock; sales requiring packed trays; money in integer centavos; expense validation; real calendar dates; coherent sample data; save/reload/reset; corrupt stored records; storage-write failures; and stale-tab overwrite rejection.

`npm.cmd run build --prefix frontend`: passed using Vite 8.3.6.

## Browser checks executed

The app was run using `npm.cmd run dev --prefix frontend -- --port 5173 --strictPort` and inspected at `http://127.0.0.1:5173/`.

| Check                    | Observed result                                                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard and navigation | All five pages opened and displayed their expected controls                                                                                                    |
| Start empty demo         | Transactions and stock cleared through the reset dialog                                                                                                        |
| Negative production      | -1 Large egg rejected with a visible validation message                                                                                                        |
| Valid production         | 95 Large eggs saved; loose stock 95, trays 0                                                                                                                   |
| Excessive packing        | 4 Large trays rejected: 120 eggs needed, 95 available                                                                                                          |
| Valid packing            | 3 Large trays saved; loose stock 5, trays 3                                                                                                                    |
| Insufficient-stock sale  | Sale of 4 Large trays rejected; 3 available                                                                                                                    |
| Valid sale               | Sale of 2 Large trays at demo price ₱210 accepted                                                                                                              |
| Expense                  | Chicken Feed expense of ₱500 saved and appeared in history                                                                                                     |
| Final dashboard          | Produced 95; loose 5; trays 1; sold 2; revenue ₱420; expenses ₱500; net -₱80                                                                                   |
| Reload persistence       | Same final dashboard totals after page reload                                                                                                                  |
| Restore sample data      | Produced 410; loose 20; trays 10; sold 3; revenue ₱615; expenses ₱500; net ₱115                                                                                |
| Responsive layout        | Dashboard inspected at normal browser width; dashboard and production form checked at 390px. No document-level horizontal overflow on the checked mobile pages |
| Browser error log        | No error entries returned by the browser log check                                                                                                             |

The automated tests are committed-source candidates. The browser walkthrough was performed interactively, not through a committed browser test suite. These checks do not establish production readiness, database connectivity, authentication, multi-user safety, or complete cross-browser/accessibility coverage.

The existing Express backend was not changed. Its successful health test from the foundation setup is separate evidence and was not rerun as part of these frontend checks.

## Visual redesign verification — 9 November 2026

Changes for this review are limited to `frontend/src/main.js`, `frontend/src/style.css`, and this test record. The domain, storage, and existing test files have identical SHA-256 hashes before and after the redesign. No dependencies or database changes were introduced.

The ten automated tests and Vite production build passed again after the redesign. The browser walkthrough above was repeated against the new interface, including negative production, overpacking, overselling, successful production/packing/sales/expenses, reload persistence, and both reset options. Sample data was restored afterward.

Additional responsive checks executed:

| Viewport | Result |
| --- | --- |
| Desktop 1440 × 1000 | Six metrics in three columns; all five pages visually inspected; no dashboard document overflow |
| Laptop 1024 × 768 | Three-column metrics; dashboard visually inspected; no document overflow |
| Tablet 768 × 1024 | Two-column metrics and collapsed navigation; no dashboard document overflow |
| Mobile 390 × 844 | Single-column metrics; all five routes checked without document overflow; production form visually inspected; wide history table scrolls inside its panel |

Mobile menu opening, automatic collapse after changing routes, and Escape-to-close were verified. No browser error log entries were returned. The browser viewport override was reset at the end.

The redesign was left uncommitted for visual review. The project owner subsequently authorized committing and pushing it to GitHub. Supabase and authentication remain outside the current local demo. Responsive checks used one browser with viewport emulation, not physical devices or a full accessibility audit.
