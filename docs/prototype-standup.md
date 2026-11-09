# EggTrack prototype standup

CSCC 21 – Software Engineering · Group 5 · Golden Nest Poultry Farm

## Verified accomplishments

- Built five navigable screens: Dashboard, Egg Production, Inventory & Packing, Sales, and Expenses.
- Implemented one shared demo transaction model. Production adds loose eggs; packing consumes 30 same-size eggs per tray; sales consume available trays; expenses update totals.
- Added validation, transaction histories, browser persistence, sample reset, and an empty starting state.
- Executed 10 passing automated tests, a successful production build, and the browser walkthrough documented in `prototype-test-results.md`.
- Prepared code for review. Git branch/commit/push status must be confirmed separately; do not present uncommitted changes as merged team contributions.

## What remains demo-only

All records and prices are illustrative. Storage uses localStorage, scoped to the current browser and origin. Supabase read/write, login, role enforcement, server-side stock rules, and multi-user transactions are not implemented. No database schema was deployed.

## Demonstration plan

Start the frontend and open the URL printed by Vite. Use the same hostname and port each time.

1. Choose **Reset Demo Data → Start empty demo**.
2. Egg Production: leave other sizes at 0, enter **95 Large eggs**, then save.
3. Inventory & Packing: choose **Large** and **3 trays**. Show that 5 loose eggs and 3 trays remain.
4. Sales: choose **Large**, **2 trays**, **₱210 per tray** (illustrative), then save.
5. Expenses: choose **Chicken Feed**, enter a description and **₱500**, then save.
6. Dashboard: show 95 produced, 5 loose, 1 tray available, 2 sold, ₱420 revenue, ₱500 expenses, and **-₱80** simple net result.
7. Reload to demonstrate local persistence. If time permits, try selling 2 more Large trays: it must be rejected because only 1 is available.

Reset can restore the sample scenario for a fuller-looking dashboard. Reset is intentionally limited to demo data in this browser.

## Suggested five-slide outline

1. **Development stage:** initial interactive prototype for Golden Nest Poultry Farm.
2. **Working workflow:** production, packing, sales, expenses, consistent dashboard totals.
3. **Verification:** 10 automated tests, production build, actual browser walkthrough.
4. **Current limitations:** demo data, localStorage, pending authentication and database reconciliation.
5. **Next milestone:** team review, agreed production API contract, reviewed schema and access rules, first verified Supabase operation.

## Speaking script (3–5 minutes including the demonstration)

Good day, Sir William. We are Group 5, and this is our first interactive prototype of EggTrack for Golden Nest Poultry Farm. Our earlier progress was the repository structure and a backend health endpoint. We now have a frontend that lets us demonstrate how records move through the farm workflow. This is an early prototype using sample data stored in this browser.

The application has five screens: Dashboard, Egg Production, Inventory and Packing, Sales, and Expenses. These screens share one set of demo transactions. That matters because saving production must affect the inventory that packing and sales use. The dashboard calculates its values from those same transactions.

For this demonstration, I will start with an empty workspace and record 95 Large eggs. After saving, inventory shows 95 loose eggs and no trays. The application does not pack them automatically. I will then pack three Large trays. Since each tray contains 30 eggs, that uses 90 eggs and leaves five loose eggs with three trays available.

Next, I will record a sale of two Large trays at an illustrative price of 210 pesos per tray. The sale totals 420 pesos and leaves one tray in stock. I will also record a 500-peso chicken-feed expense. On the dashboard, we can see 95 eggs produced, five loose eggs, one available tray, and two trays sold. Revenue is 420 pesos, expenses are 500 pesos, and the simple net result is negative 80 pesos. That result is expected for this small example.

We tested invalid cases as well. Negative production was rejected. Packing more eggs than available was rejected, and the application rejected a sale that exceeded tray stock. We also checked that values survived a page reload and that the reset action restored the sample data. Ten automated tests passed, and the frontend production build completed successfully.

The main limitation is that this currently runs on localStorage. It is not yet connected to Supabase, and authentication and role enforcement are not implemented. These browser checks are useful for validating the workflow, but they are not sufficient for a secure multi-user system. The final version needs authenticated requests and database operations that prevent concurrent stock problems.

Our next priority is to review this prototype as a team and reconcile the approved database model with tray packing. We will agree on a small production API contract, review the required permissions, and then implement and test the first real Supabase read/write operation. The frontend, testing, and documentation tasks can be reviewed in parallel by our teammates. We will report database integration as completed only after we have evidence that it works.

## Current challenges and next work

- Reconcile Employee/authentication and tray-packing representation with the latest approved ten-entity design before migrations.
- Confirm the pending collaborator invitations reported by the leader; this prototype task did not change invitations.
- Assign small reviewable tasks to teammates, collect their feedback, and test the first real production API before expanding integration to packing and sales.
