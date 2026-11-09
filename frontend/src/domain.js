// Demo transaction model, independent of the future PostgreSQL schema.
export const SIZES = ["Small", "Medium", "Large", "Extra-Large"];
export const CATEGORIES = [
  "Chicken Feed",
  "Supplies",
  "Utilities",
  "Other Farm Expenses",
];
export const EGGS_PER_TRAY = 30;
const LIMIT = 1_000_000;

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function whole(value, label, minimum = 0) {
  if (
    !/^\d+$/.test(String(value)) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) < minimum ||
    Number(value) > LIMIT
  ) {
    throw new Error(
      `${label} must be a whole number from ${minimum.toLocaleString()} to ${LIMIT.toLocaleString()}.`,
    );
  }
  return Number(value);
}

export function money(value, label = "Amount") {
  if (!/^\d+(\.\d{1,2})?$/.test(String(value)))
    throw new Error(
      `${label} must be a positive amount with at most two decimal places.`,
    );
  const [pesos, centavos = ""] = String(value).split(".");
  const cents = Number(pesos) * 100 + Number(centavos.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 100_000_000)
    throw new Error(`${label} must be between ₱0.01 and ₱1,000,000.00.`);
  return cents;
}

function date(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number(value.slice(0, 4)) < 1900
  )
    throw new Error("Enter a valid date.");
  const parsed = new Date(`${value}T00:00:00Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  )
    throw new Error("Enter a valid date.");
  return value;
}

function safeTotal(value) {
  if (!Number.isSafeInteger(value))
    throw new Error("This transaction exceeds the supported demo total.");
  return value;
}

export function emptyState() {
  return { version: 1, events: [] };
}

function normalize(action) {
  const base = { type: action.type, date: date(action.date) };
  if (action.type === "production") {
    const quantities = Object.fromEntries(
      SIZES.map((size) => [
        size,
        whole(action.quantities?.[size], `${size} eggs`),
      ]),
    );
    if (Object.values(quantities).every((n) => n === 0))
      throw new Error("Record at least one egg.");
    return { ...base, quantities };
  }
  if (action.type === "packing" || action.type === "sale") {
    if (!SIZES.includes(action.size))
      throw new Error("Select a valid egg size.");
    const event = {
      ...base,
      size: action.size,
      trays: whole(action.trays, "Trays", 1),
    };
    if (action.type === "sale")
      event.priceCents = money(action.price, "Price per tray");
    return event;
  }
  if (action.type === "expense") {
    if (!CATEGORIES.includes(action.category))
      throw new Error("Select a valid expense category.");
    const description = String(action.description ?? "").trim();
    if (!description || description.length > 200)
      throw new Error("Enter a description between 1 and 200 characters.");
    return {
      ...base,
      category: action.category,
      description,
      amountCents: money(action.amount),
    };
  }
  throw new Error("Unknown transaction type.");
}

function apply(totals, event) {
  if (event.type === "production") {
    for (const size of SIZES) {
      totals.stock[size].loose = safeTotal(
        totals.stock[size].loose + event.quantities[size],
      );
      totals.produced = safeTotal(totals.produced + event.quantities[size]);
    }
  } else if (event.type === "packing") {
    const stock = totals.stock[event.size];
    const eggs = event.trays * EGGS_PER_TRAY;
    if (eggs > stock.loose)
      throw new Error(
        `Not enough ${event.size} loose eggs. ${stock.loose} available; ${eggs} needed.`,
      );
    stock.loose -= eggs;
    stock.trays = safeTotal(stock.trays + event.trays);
  } else if (event.type === "sale") {
    const stock = totals.stock[event.size];
    if (event.trays > stock.trays)
      throw new Error(
        `Not enough ${event.size} trays. ${stock.trays} available.`,
      );
    stock.trays -= event.trays;
    totals.sold = safeTotal(totals.sold + event.trays);
    totals.revenueCents = safeTotal(
      totals.revenueCents + safeTotal(event.trays * event.priceCents),
    );
  } else if (event.type === "expense") {
    totals.expenseCents = safeTotal(totals.expenseCents + event.amountCents);
  }
}

export function summary(state) {
  const totals = {
    produced: 0,
    sold: 0,
    revenueCents: 0,
    expenseCents: 0,
    stock: Object.fromEntries(
      SIZES.map((size) => [size, { loose: 0, trays: 0 }]),
    ),
  };
  for (const event of state.events) apply(totals, event);
  totals.loose = Object.values(totals.stock).reduce((n, s) => n + s.loose, 0);
  totals.trays = Object.values(totals.stock).reduce((n, s) => n + s.trays, 0);
  totals.netCents = totals.revenueCents - totals.expenseCents;
  return totals;
}

export function transact(state, action) {
  const event = {
    ...normalize(action),
    id: crypto.randomUUID(),
    recordedAt: new Date().toISOString(),
  };
  apply(summary(state), event); // Reject invalid stock changes before changing state.
  return { version: 1, events: [...state.events, event] };
}

export function validateState(value) {
  if (
    value?.version !== 1 ||
    !Array.isArray(value.events) ||
    value.events.length > 50_000
  )
    throw new Error("Unsupported or invalid saved demo data.");
  const ids = new Set();
  const events = value.events.map((event) => {
    if (
      !event ||
      typeof event.id !== "string" ||
      !event.id ||
      ids.has(event.id) ||
      typeof event.recordedAt !== "string" ||
      !Number.isFinite(Date.parse(event.recordedAt))
    )
      throw new Error("Invalid saved transaction.");
    ids.add(event.id);
    if (
      event.type === "sale" &&
      (!Number.isSafeInteger(event.priceCents) || event.priceCents <= 0)
    )
      throw new Error("Invalid saved price.");
    if (
      event.type === "expense" &&
      (!Number.isSafeInteger(event.amountCents) || event.amountCents <= 0)
    )
      throw new Error("Invalid saved expense.");
    const normalized = normalize({
      ...event,
      price: (event.priceCents / 100).toFixed(2),
      amount: (event.amountCents / 100).toFixed(2),
    });
    return { ...normalized, id: event.id, recordedAt: event.recordedAt };
  });
  const state = { version: 1, events };
  summary(state); // Replaying all transactions also verifies nonnegative stock.
  return state;
}

export function sampleState() {
  let state = emptyState();
  const day = today();
  const actions = [
    {
      type: "production",
      date: day,
      quantities: { Small: 65, Medium: 125, Large: 185, "Extra-Large": 35 },
    },
    ...[
      ["Small", 2],
      ["Medium", 4],
      ["Large", 6],
      ["Extra-Large", 1],
    ].map(([size, trays]) => ({ type: "packing", date: day, size, trays })),
    { type: "sale", date: day, size: "Large", trays: 2, price: "210" },
    { type: "sale", date: day, size: "Medium", trays: 1, price: "195" },
    {
      type: "expense",
      date: day,
      category: "Chicken Feed",
      description: "Sample feed purchase",
      amount: "500",
    },
  ];
  for (const action of actions) state = transact(state, action);
  return state;
}
