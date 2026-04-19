import { load, save } from "./storage.js";

const BAGS_KEY = "brew.bags.v1";

const listeners = new Set();

const state = {
  bags: load(BAGS_KEY, []),
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

export function allBrews() {
  return state.bags.flatMap((b) =>
    (b.brews ?? []).map((br) => ({ ...br, bag: b }))
  );
}

export function addBag(bag) {
  const newBag = {
    id: uid(),
    createdAt: Date.now(),
    brews: [],
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

export function addBrew(bagId, brew) {
  const bag = getBag(bagId);
  if (!bag) return;
  bag.brews = bag.brews ?? [];
  bag.brews.unshift({
    id: uid(),
    createdAt: Date.now(),
    ...brew,
  });
  persist();
  emit();
}

export function removeBrew(bagId, brewId) {
  const bag = getBag(bagId);
  if (!bag) return;
  bag.brews = (bag.brews ?? []).filter((br) => br.id !== brewId);
  persist();
  emit();
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
