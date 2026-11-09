import test from "node:test";
import assert from "node:assert/strict";
import {
  SIZES,
  emptyState,
  transact,
  summary,
  sampleState,
  validateState,
  money,
} from "../src/domain.js";
import { createRepository, STORAGE_KEY } from "../src/storage.js";

const production = (large = 95) => ({
  type: "production",
  date: "2026-11-09",
  quantities: { Small: 0, Medium: 0, Large: large, "Extra-Large": 0 },
});
const pack = (trays = 3) => ({
  type: "packing",
  date: "2026-11-09",
  size: "Large",
  trays,
});
const sale = (trays = 2, price = "210") => ({
  type: "sale",
  date: "2026-11-09",
  size: "Large",
  trays,
  price,
});
const expense = (amount) => ({
  type: "expense",
  date: "2026-11-09",
  category: "Chicken Feed",
  description: "Feed purchase",
  amount,
});

test("95 eggs → 3 trays → sell 2 → expense ₱500 produces consistent totals", () => {
  let state = transact(emptyState(), production());
  assert.deepEqual(summary(state).stock.Large, { loose: 95, trays: 0 });
  state = transact(state, pack());
  assert.deepEqual(summary(state).stock.Large, { loose: 5, trays: 3 });
  state = transact(state, sale());
  state = transact(state, expense("500"));
  const t = summary(state);
  assert.deepEqual(t.stock.Large, { loose: 5, trays: 1 });
  assert.equal(t.produced, 95);
  assert.equal(t.sold, 2);
  assert.equal(t.revenueCents, 42000);
  assert.equal(t.expenseCents, 50000);
  assert.equal(t.netCents, -8000);
  assert.equal(t.produced, t.loose + 30 * (t.trays + t.sold));
  assert.equal(state.events.length, 4);
});

test("rejects invalid production counts and empty production without mutating input", () => {
  const state = emptyState();
  for (const count of [-1, 1.5, "", "abc", "1e2", Infinity, 1_000_001])
    assert.throws(() => transact(state, production(count)));
  assert.throws(() => transact(state, production(0)), /at least one egg/);
  assert.deepEqual(state, emptyState());
});

test("packing checks stock per size and rejects nonpositive/fractional trays", () => {
  const state = transact(emptyState(), production());
  assert.throws(() => transact(state, pack(4)), /Not enough/);
  assert.throws(
    () => transact(state, { ...pack(1), size: "Small" }),
    /Not enough/,
  );
  for (const count of [0, -1, 0.5, ""])
    assert.throws(() => transact(state, pack(count)));
  assert.equal(summary(state).stock.Large.loose, 95);
});

test("sales require packed stock; over-selling never changes balances", () => {
  let state = transact(emptyState(), production());
  assert.throws(() => transact(state, sale(1)), /Not enough/);
  state = transact(state, pack());
  assert.throws(() => transact(state, sale(4)), /Not enough/);
  assert.throws(
    () => transact(state, { ...sale(1), size: "Huge" }),
    /valid egg size/,
  );
  assert.equal(summary(state).stock.Large.trays, 3);
  state = transact(state, sale(3));
  assert.equal(summary(state).stock.Large.trays, 0);
  assert.throws(() => transact(state, sale(1)), /Not enough/);
});

test("money uses integer centavos and rejects invalid prices/expenses", () => {
  assert.equal(money("0.29"), 29);
  let state = transact(transact(emptyState(), production()), pack());
  state = transact(state, sale(3, "0.29"));
  assert.equal(summary(state).revenueCents, 87);
  for (const amount of ["-1", "0", "", "1.001", "NaN", "Infinity", "1000001"]) {
    assert.throws(() => money(amount));
    assert.throws(() => transact(emptyState(), expense(amount)));
  }
  assert.throws(() =>
    transact(emptyState(), { ...expense("5"), description: " " }),
  );
  assert.throws(() =>
    transact(emptyState(), { ...expense("5"), category: "Unknown" }),
  );
});

test("calendar dates must exist", () => {
  for (const date of ["", "2026-02-30", "2026-13-01", "tomorrow"])
    assert.throws(() => transact(emptyState(), { ...production(), date }));
});

test("sample scenario is coherent and all stock is nonnegative", () => {
  const state = sampleState();
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))), state);
  const t = summary(state);
  assert.equal(t.produced, 410);
  assert.equal(t.loose, 20);
  assert.equal(t.trays, 10);
  assert.equal(t.sold, 3);
  assert.equal(t.revenueCents, 61500);
  assert.equal(t.expenseCents, 50000);
  assert.equal(t.netCents, 11500);
  for (const size of SIZES)
    assert.ok(t.stock[size].loose >= 0 && t.stock[size].trays >= 0);
});

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
}

test("saving and reloading preserves transactions; reset replaces the demo", () => {
  const storage = memoryStorage();
  const repo = createRepository(storage);
  repo.load();
  const state = transact(emptyState(), production());
  repo.save(state);
  assert.deepEqual(createRepository(storage).load(), state);
  repo.save(emptyState(), { replace: true });
  assert.deepEqual(repo.load(), emptyState());
  repo.save(sampleState(), { replace: true });
  assert.equal(summary(repo.load()).produced, 410);
});

test("invalid persisted data is detected without overwriting it", () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, "{broken");
  assert.throws(() => createRepository(storage).load());
  assert.equal(storage.getItem(STORAGE_KEY), "{broken");
  const state = transact(emptyState(), production());
  state.events[0].quantities.Large = -1;
  assert.throws(() => validateState(state));
  assert.throws(() => validateState({ version: 2, events: [] }));
  const oversold = transact(
    transact(transact(emptyState(), production()), pack()),
    sale(),
  );
  oversold.events[2].trays = 9;
  assert.throws(() => validateState(oversold), /Not enough/);
});

test("storage failure and stale tab saves do not silently overwrite data", () => {
  const storage = memoryStorage();
  const first = createRepository(storage);
  const second = createRepository(storage);
  first.load();
  second.load();
  const original = transact(emptyState(), production());
  first.save(original);
  assert.throws(() => second.save(emptyState()), /another tab/);
  assert.deepEqual(first.load(), original);
  const failing = createRepository({
    getItem: () => null,
    setItem: () => {
      throw new Error("quota exceeded");
    },
  });
  failing.load();
  assert.throws(() => failing.save(original), /Could not save demo data/);
});
