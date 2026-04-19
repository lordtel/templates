export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function read(key, fallback) {
  return localStorage.getItem(key) ?? fallback;
}

export function write(key, value) {
  localStorage.setItem(key, value);
}
