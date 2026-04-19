import { load, save } from "./storage.js";

const BAGS_KEY = "brew.bags.v1";
const EQUIPMENT_KEY = "brew.equipment.v1";

const listeners = new Set();

const state = {
  bags: migrateBags(load(BAGS_KEY, [])),
  equipment: migrateEquipment(load(EQUIPMENT_KEY, null)),
};

export const DRINK_TYPES = [
  { id: "espresso", label: "Espresso" },
  { id: "iced_americano", label: "Iced Americano" },
  { id: "iced_latte", label: "Iced Latte" },
  { id: "cappuccino", label: "Cappuccino" },
];

export function drinkLabel(id) {
  return DRINK_TYPES.find((d) => d.id === id)?.label ?? id;
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export function getState() {
  return state;
}

export function getBag(id) {
  return state.bags.find((b) => b.id === id) ?? null;
}

export function allRatings() {
  return state.bags.flatMap((b) =>
    (b.ratings ?? []).map((r) => ({ ...r, bag: b }))
  );
}

export function getRating(bagId, drinkType) {
  const bag = getBag(bagId);
  if (!bag) return null;
  return (bag.ratings ?? []).find((r) => r.drinkType === drinkType) ?? null;
}

export function addBag(bag) {
  const newBag = {
    id: uid(),
    createdAt: Date.now(),
    ratings: [],
    ...bag,
  };
  state.bags.unshift(newBag);
  persist();
  emit();
  return newBag.id;
}

export function updateBag(id, patch) {
  const bag = getBag(id);
  if (!bag) return;
  Object.assign(bag, patch);
  persist();
  emit();
}

export function removeBag(id) {
  state.bags = state.bags.filter((b) => b.id !== id);
  persist();
  emit();
}

export function upsertRating(bagId, drinkType, rating) {
  const bag = getBag(bagId);
  if (!bag) return;
  bag.ratings = bag.ratings ?? [];
  const idx = bag.ratings.findIndex((r) => r.drinkType === drinkType);
  const now = Date.now();
  const entry = {
    id: idx >= 0 ? bag.ratings[idx].id : uid(),
    drinkType,
    rating: Number(rating.rating) || 0,
    grindSize: rating.grindSize != null && rating.grindSize !== "" ? Number(rating.grindSize) : null,
    notes: rating.notes ?? "",
    date: rating.date || isoDate(now),
    createdAt: idx >= 0 ? bag.ratings[idx].createdAt : now,
    updatedAt: now,
  };
  if (idx >= 0) bag.ratings[idx] = entry;
  else bag.ratings.push(entry);
  persist();
  emit();
}

export function removeRating(bagId, drinkType) {
  const bag = getBag(bagId);
  if (!bag) return;
  bag.ratings = (bag.ratings ?? []).filter((r) => r.drinkType !== drinkType);
  persist();
  emit();
}

export function getEquipment() {
  return state.equipment;
}

export function setEquipment(patch) {
  state.equipment = { ...state.equipment, ...patch };
  save(EQUIPMENT_KEY, state.equipment);
  emit();
}

function migrateEquipment(raw) {
  const empty = { machine: { id: "", custom: "" }, grinder: { id: "", custom: "" } };
  if (!raw) return empty;
  const machine = typeof raw.machine === "string"
    ? (raw.machine ? { id: "custom", custom: raw.machine } : { id: "", custom: "" })
    : raw.machine ?? { id: "", custom: "" };
  const grinder = typeof raw.grinder === "string"
    ? (raw.grinder ? { id: "custom", custom: raw.grinder } : { id: "", custom: "" })
    : raw.grinder ?? { id: "", custom: "" };
  return { machine, grinder };
}

function migrateBags(bags) {
  return bags.map((bag) => {
    if (Array.isArray(bag.ratings)) return bag;
    const brews = Array.isArray(bag.brews) ? bag.brews : [];
    const byDrink = new Map();
    brews.forEach((b) => {
      const cur = byDrink.get(b.drinkType);
      if (!cur || (b.createdAt ?? 0) > (cur.createdAt ?? 0)) byDrink.set(b.drinkType, b);
    });
    const ratings = [...byDrink.values()].map((b) => ({
      id: b.id ?? uid(),
      drinkType: b.drinkType,
      rating: Number(b.rating) || 0,
      grindSize: b.grindSize != null && b.grindSize !== "" ? Number(b.grindSize) : null,
      notes: b.notes ?? "",
      date: isoDate(b.createdAt ?? Date.now()),
      createdAt: b.createdAt ?? Date.now(),
      updatedAt: b.createdAt ?? Date.now(),
    }));
    const { brews: _drop, ...rest } = bag;
    return { ...rest, ratings };
  });
}

function isoDate(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function persist() {
  save(BAGS_KEY, state.bags);
}

function emit() {
  listeners.forEach((fn) => fn(state));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
