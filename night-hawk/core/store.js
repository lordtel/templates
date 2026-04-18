import { load, save, read, write } from "./storage.js";

const TASKS_KEY = "nighthawk.tasks.v1";
const FILTER_KEY = "nighthawk.filter.v1";

const listeners = new Set();

const state = {
  tasks: load(TASKS_KEY, []),
  filter: read(FILTER_KEY, "all"),
};

export function subscribe(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export function getState() {
  return state;
}

export function visibleTasks() {
  if (state.filter === "active") return state.tasks.filter((t) => !t.done);
  if (state.filter === "done") return state.tasks.filter((t) => t.done);
  return state.tasks;
}

export function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  state.tasks.unshift({
    id: uid(),
    text: trimmed,
    done: false,
    createdAt: Date.now(),
  });
  persistTasks();
  emit();
}

export function toggleTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  task.done = !task.done;
  persistTasks();
  emit();
}

export function removeTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  persistTasks();
  emit();
}

export function clearCompleted() {
  state.tasks = state.tasks.filter((t) => !t.done);
  persistTasks();
  emit();
}

export function setFilter(next) {
  state.filter = next;
  write(FILTER_KEY, next);
  emit();
}

function persistTasks() {
  save(TASKS_KEY, state.tasks);
}

function emit() {
  listeners.forEach((fn) => fn(state));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
