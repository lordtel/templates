import { sb } from "./supabase.js";
import { captureException } from "./sentry.js";
import { load, remove } from "./storage.js";

const LEGACY_BAGS_KEY = "brew.bags.v1";
const LEGACY_EQUIPMENT_KEY = "brew.equipment.v1";
const GUEST_FLAG_KEY = "crema.guest.v1";
const GUEST_DATA_KEY = "crema.guest-data.v1";

const SIGNED_URL_TTL = 60 * 60 * 24 * 7;

const listeners = new Set();

let state = {
  bags: [],
  equipment: { machine: { id: "", custom: "" }, grinder: { id: "", custom: "" } },
  loading: true,
  userId: null,
  guest: false,
};

export function isGuest() {
  try {
    return localStorage.getItem(GUEST_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function enterGuestMode() {
  try { localStorage.setItem(GUEST_FLAG_KEY, "1"); } catch {}
}

export function exitGuestMode() {
  try {
    localStorage.removeItem(GUEST_FLAG_KEY);
    localStorage.removeItem(GUEST_DATA_KEY);
  } catch {}
}

function readGuestData() {
  try {
    const raw = localStorage.getItem(GUEST_DATA_KEY);
    if (!raw) return { bags: [], equipment: null };
    const parsed = JSON.parse(raw);
    return {
      bags: Array.isArray(parsed.bags) ? parsed.bags : [],
      equipment: parsed.equipment ?? null,
    };
  } catch {
    return { bags: [], equipment: null };
  }
}

function writeGuestData() {
  if (!state.guest) return;
  try {
    localStorage.setItem(
      GUEST_DATA_KEY,
      JSON.stringify({ bags: state.bags, equipment: state.equipment })
    );
  } catch (err) {
    captureException(err, { where: "writeGuestData" });
  }
}

export const DRINK_TYPES = [
  { id: "espresso", label: "Espresso" },
  { id: "iced_americano", label: "Iced Americano" },
  { id: "iced_latte", label: "Iced Latte" },
  { id: "cappuccino", label: "Cappuccino" },
];

export function drinkLabel(id) {
  const hit = DRINK_TYPES.find((d) => d.id === id);
  if (hit) return hit.label;
  if (!id) return "";
  return String(id)
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function slugifyDrink(name) {
  return String(name ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
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

export function getDialInLogs(bagId) {
  const bag = getBag(bagId);
  if (!bag) return [];
  return (bag.dialIns ?? []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export function getDialInLog(bagId, logId) {
  const bag = getBag(bagId);
  if (!bag) return null;
  return (bag.dialIns ?? []).find((l) => l.id === logId) ?? null;
}

export function getDialedInRecipe(bagId) {
  const bag = getBag(bagId);
  if (!bag?.dialedInAt) return null;
  const r = bag.dialedInRecipe ?? {};
  return {
    dose: r.dose ?? null,
    yield: r.yield ?? null,
    time: r.time ?? null,
    grind: r.grind ?? null,
    at: bag.dialedInAt,
  };
}

export function getEquipment() {
  return state.equipment;
}

export function loadGuestData() {
  state.guest = true;
  state.userId = null;
  state.loading = false;
  const data = readGuestData();
  state.bags = data.bags.map((b) => ({
    ...b,
    ratings: b.ratings ?? [],
    dialIns: b.dialIns ?? [],
  }));
  state.equipment =
    data.equipment ?? { machine: { id: "", custom: "" }, grinder: { id: "", custom: "" } };
  emit();
}

export async function loadInitialData(userId) {
  state.guest = false;
  state.userId = userId;
  state.loading = true;
  emit();

  try {
    const [bagsRes, ratingsRes, dialInsRes, eqRes] = await Promise.all([
      sb.from("bags").select("*").order("created_at", { ascending: false }),
      sb.from("ratings").select("*"),
      sb.from("dial_in_logs").select("*"),
      sb.from("equipment").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    if (bagsRes.error) throw bagsRes.error;
    if (ratingsRes.error) throw ratingsRes.error;
    if (dialInsRes.error) throw dialInsRes.error;
    if (eqRes.error) throw eqRes.error;

    const bags = bagsRes.data ?? [];
    const signedUrls = await Promise.all(
      bags.map((b) =>
        b.photo_path
          ? sb.storage.from("bag-photos").createSignedUrl(b.photo_path, SIGNED_URL_TTL)
          : Promise.resolve({ data: null })
      )
    );

    const ratingsByBag = new Map();
    (ratingsRes.data ?? []).forEach((r) => {
      const arr = ratingsByBag.get(r.bag_id) ?? [];
      arr.push(ratingRowToState(r));
      ratingsByBag.set(r.bag_id, arr);
    });

    const dialInsByBag = new Map();
    (dialInsRes.data ?? []).forEach((r) => {
      const arr = dialInsByBag.get(r.bag_id) ?? [];
      arr.push(dialInRowToState(r));
      dialInsByBag.set(r.bag_id, arr);
    });

    state.bags = bags.map((row, i) => ({
      ...bagRowToState(row),
      photo: signedUrls[i]?.data?.signedUrl ?? "",
      ratings: ratingsByBag.get(row.id) ?? [],
      dialIns: dialInsByBag.get(row.id) ?? [],
    }));

    state.equipment = eqRes.data
      ? {
          machine: { id: eqRes.data.machine_id ?? "", custom: eqRes.data.machine_custom ?? "" },
          grinder: { id: eqRes.data.grinder_id ?? "", custom: eqRes.data.grinder_custom ?? "" },
        }
      : { machine: { id: "", custom: "" }, grinder: { id: "", custom: "" } };
  } catch (err) {
    captureException(err, { where: "loadInitialData" });
    throw err;
  } finally {
    state.loading = false;
    emit();
  }
}

export function resetStore() {
  state = {
    bags: [],
    equipment: { machine: { id: "", custom: "" }, grinder: { id: "", custom: "" } },
    loading: false,
    userId: null,
    guest: false,
  };
  emit();
}

export function addBag(bag) {
  const id = uid();
  const newBag = {
    id,
    brand: "",
    origin: "",
    process: "",
    variety: "",
    roast: "",
    notes: "",
    weight: "",
    price: "",
    dose: "",
    currency: "€",
    altitude: "",
    ocrText: "",
    photo: "",
    photoPath: "",
    photoUpload: "",
    dialedInAt: null,
    dialedInRecipe: null,
    ...bag,
    ratings: [],
    dialIns: [],
  };
  if (state.guest && newBag.photoUpload?.startsWith("data:")) {
    newBag.photo = newBag.photoUpload;
    newBag.photoUpload = "";
  }
  state.bags = [newBag, ...state.bags];
  emit();
  if (state.guest) {
    writeGuestData();
  } else {
    persistBag(newBag).catch((err) => captureException(err, { where: "addBag", id }));
  }
  return id;
}

export function updateBag(id, patch) {
  const bag = getBag(id);
  if (!bag) return;
  Object.assign(bag, patch);
  if (state.guest && bag.photoUpload?.startsWith("data:")) {
    bag.photo = bag.photoUpload;
    bag.photoUpload = "";
  }
  emit();
  if (state.guest) {
    writeGuestData();
  } else {
    persistBag(bag).catch((err) => captureException(err, { where: "updateBag", id }));
  }
}

export function removeBag(id) {
  const bag = getBag(id);
  state.bags = state.bags.filter((b) => b.id !== id);
  emit();
  if (state.guest) {
    writeGuestData();
    return;
  }
  (async () => {
    try {
      if (bag?.photoPath) {
        await sb.storage.from("bag-photos").remove([bag.photoPath]);
      }
      const { error } = await sb.from("bags").delete().eq("id", id);
      if (error) throw error;
    } catch (err) {
      captureException(err, { where: "removeBag", id });
    }
  })();
}

export function upsertRating(bagId, drinkType, rating) {
  const bag = getBag(bagId);
  if (!bag) return;
  bag.ratings = bag.ratings ?? [];
  const idx = bag.ratings.findIndex((r) => r.drinkType === drinkType);
  const entry = {
    drinkType,
    rating: Number(rating.rating) || 0,
    grindSize: rating.grindSize != null && rating.grindSize !== "" ? Number(rating.grindSize) : null,
    notes: rating.notes ?? "",
    date: rating.date || isoDate(Date.now()),
  };
  if (idx >= 0) bag.ratings[idx] = entry;
  else bag.ratings.push(entry);
  emit();

  if (state.guest) {
    writeGuestData();
    return;
  }

  (async () => {
    try {
      const { error } = await sb.from("ratings").upsert(
        ratingStateToRow(bagId, state.userId, entry),
        { onConflict: "bag_id,drink_type" }
      );
      if (error) throw error;
    } catch (err) {
      captureException(err, { where: "upsertRating", bagId, drinkType });
    }
  })();
}

export function removeRating(bagId, drinkType) {
  const bag = getBag(bagId);
  if (!bag) return;
  bag.ratings = (bag.ratings ?? []).filter((r) => r.drinkType !== drinkType);
  emit();

  if (state.guest) {
    writeGuestData();
    return;
  }

  (async () => {
    try {
      const { error } = await sb
        .from("ratings")
        .delete()
        .eq("bag_id", bagId)
        .eq("drink_type", drinkType);
      if (error) throw error;
    } catch (err) {
      captureException(err, { where: "removeRating", bagId, drinkType });
    }
  })();
}

export function upsertDialInLog(bagId, log) {
  const bag = getBag(bagId);
  if (!bag) return null;
  bag.dialIns = bag.dialIns ?? [];
  const id = log.id ?? uid();
  const entry = {
    id,
    bagId,
    dose: log.dose === "" || log.dose == null ? "" : Number(log.dose),
    yield: log.yield === "" || log.yield == null ? "" : Number(log.yield),
    time: log.time === "" || log.time == null ? "" : Number(log.time),
    grind: log.grind === "" || log.grind == null ? "" : Number(log.grind),
    taste: log.taste == null || log.taste === "" ? 0 : Number(log.taste),
    texture: log.texture == null || log.texture === "" ? 0 : Number(log.texture),
    note: log.note ?? "",
    date: log.date || isoDate(Date.now()),
  };
  const idx = bag.dialIns.findIndex((l) => l.id === id);
  if (idx >= 0) bag.dialIns[idx] = entry;
  else bag.dialIns.push(entry);
  emit();

  if (state.guest) {
    writeGuestData();
    return id;
  }

  (async () => {
    try {
      const { error } = await sb
        .from("dial_in_logs")
        .upsert(dialInStateToRow(entry, state.userId), { onConflict: "id" });
      if (error) throw error;
    } catch (err) {
      captureException(err, { where: "upsertDialInLog", bagId, id });
    }
  })();

  return id;
}

export function removeDialInLog(bagId, logId) {
  const bag = getBag(bagId);
  if (!bag) return;
  bag.dialIns = (bag.dialIns ?? []).filter((l) => l.id !== logId);
  emit();

  if (state.guest) {
    writeGuestData();
    return;
  }

  (async () => {
    try {
      const { error } = await sb.from("dial_in_logs").delete().eq("id", logId);
      if (error) throw error;
    } catch (err) {
      captureException(err, { where: "removeDialInLog", bagId, logId });
    }
  })();
}

export function markDialedIn(bagId, recipe) {
  const bag = getBag(bagId);
  if (!bag) return;
  const numOrNull = (v) => (v === "" || v == null ? null : Number(v));
  bag.dialedInAt = new Date().toISOString();
  bag.dialedInRecipe = {
    dose: numOrNull(recipe.dose),
    yield: numOrNull(recipe.yield),
    time: numOrNull(recipe.time),
    grind: numOrNull(recipe.grind),
  };
  if (bag.dialedInRecipe.dose != null) bag.dose = bag.dialedInRecipe.dose;
  emit();

  if (state.guest) {
    writeGuestData();
    return;
  }
  persistBag(bag).catch((err) => captureException(err, { where: "markDialedIn", bagId }));
}

export function unmarkDialedIn(bagId) {
  const bag = getBag(bagId);
  if (!bag) return;
  bag.dialedInAt = null;
  bag.dialedInRecipe = null;
  emit();

  if (state.guest) {
    writeGuestData();
    return;
  }
  persistBag(bag).catch((err) => captureException(err, { where: "unmarkDialedIn", bagId }));
}

export function setEquipment(patch) {
  state.equipment = { ...state.equipment, ...patch };
  emit();

  if (state.guest) {
    writeGuestData();
    return;
  }

  (async () => {
    try {
      const row = {
        user_id: state.userId,
        machine_id: state.equipment.machine?.id ?? "",
        machine_custom: state.equipment.machine?.custom ?? "",
        grinder_id: state.equipment.grinder?.id ?? "",
        grinder_custom: state.equipment.grinder?.custom ?? "",
        updated_at: new Date().toISOString(),
      };
      const { error } = await sb.from("equipment").upsert(row, { onConflict: "user_id" });
      if (error) throw error;
    } catch (err) {
      captureException(err, { where: "setEquipment" });
    }
  })();
}

async function persistBag(bag) {
  if (bag.photoUpload?.startsWith("data:")) {
    const path = `${state.userId}/${bag.id}.jpg`;
    const blob = dataUrlToBlob(bag.photoUpload);
    const { error: upErr } = await sb.storage
      .from("bag-photos")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (upErr) throw upErr;
    bag.photoPath = path;
    bag.photoUpload = "";
    const { data: signed } = await sb.storage
      .from("bag-photos")
      .createSignedUrl(path, SIGNED_URL_TTL);
    bag.photo = signed?.signedUrl ?? "";
    emit();
  }

  const row = bagStateToRow(bag, state.userId);
  const { error } = await sb.from("bags").upsert(row, { onConflict: "id" });
  if (error) throw error;
}

function bagRowToState(r) {
  const dialedRecipe =
    r.dialed_in_at
      ? {
          dose: r.dialed_in_dose,
          yield: r.dialed_in_yield,
          time: r.dialed_in_time,
          grind: r.dialed_in_grind,
        }
      : null;
  return {
    id: r.id,
    brand: r.brand ?? "",
    origin: r.origin ?? "",
    process: r.process ?? "",
    variety: r.variety ?? "",
    roast: r.roast ?? "",
    notes: r.notes ?? "",
    weight: r.weight ?? "",
    price: r.price ?? "",
    dose: r.dose ?? "",
    currency: r.currency ?? "€",
    altitude: r.altitude ?? "",
    ocrText: r.ocr_text ?? "",
    photoPath: r.photo_path ?? "",
    photoUpload: "",
    dialedInAt: r.dialed_in_at ?? null,
    dialedInRecipe: dialedRecipe,
  };
}

function bagStateToRow(s, userId) {
  const recipe = s.dialedInRecipe ?? {};
  const numOrNull = (v) => (v === "" || v == null ? null : Number(v));
  return {
    id: s.id,
    user_id: userId,
    brand: s.brand || null,
    origin: s.origin || null,
    process: s.process || null,
    variety: s.variety || null,
    roast: s.roast || null,
    notes: s.notes || null,
    weight: numOrNull(s.weight),
    price: numOrNull(s.price),
    dose: numOrNull(s.dose),
    currency: s.currency || null,
    altitude: s.altitude || null,
    ocr_text: s.ocrText || null,
    photo_path: s.photoPath || null,
    dialed_in_at: s.dialedInAt ?? null,
    dialed_in_dose: numOrNull(recipe.dose),
    dialed_in_yield: numOrNull(recipe.yield),
    dialed_in_time: numOrNull(recipe.time),
    dialed_in_grind: numOrNull(recipe.grind),
    updated_at: new Date().toISOString(),
  };
}

function dialInRowToState(r) {
  return {
    id: r.id,
    bagId: r.bag_id,
    dose: r.dose ?? "",
    yield: r.yield ?? "",
    time: r.time_s ?? "",
    grind: r.grind ?? "",
    taste: r.taste ?? 0,
    texture: r.texture ?? 0,
    note: r.note ?? "",
    date: r.date ?? "",
  };
}

function dialInStateToRow(log, userId) {
  const numOrNull = (v) => (v === "" || v == null ? null : Number(v));
  return {
    id: log.id,
    bag_id: log.bagId,
    user_id: userId,
    dose: numOrNull(log.dose),
    yield: numOrNull(log.yield),
    time_s: numOrNull(log.time),
    grind: numOrNull(log.grind),
    taste: log.taste == null || log.taste === "" ? 0 : Number(log.taste),
    texture: log.texture == null || log.texture === "" ? 0 : Number(log.texture),
    note: log.note || null,
    date: log.date || null,
    updated_at: new Date().toISOString(),
  };
}

function ratingRowToState(r) {
  return {
    drinkType: r.drink_type,
    rating: r.rating ?? 0,
    grindSize: r.grind_size,
    notes: r.notes ?? "",
    date: r.date ?? "",
  };
}

function ratingStateToRow(bagId, userId, r) {
  return {
    bag_id: bagId,
    drink_type: r.drinkType,
    user_id: userId,
    rating: r.rating,
    grind_size: r.grindSize,
    notes: r.notes,
    date: r.date || null,
    updated_at: new Date().toISOString(),
  };
}

function dataUrlToBlob(dataUrl) {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function isoDate(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function emit() {
  listeners.forEach((fn) => fn(state));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export async function migrateLegacyLocalStorage() {
  const legacyBags = load(LEGACY_BAGS_KEY, null);
  const legacyEq = load(LEGACY_EQUIPMENT_KEY, null);
  if (!legacyBags?.length && !legacyEq) return { migrated: 0 };

  let migrated = 0;
  try {
    if (legacyBags?.length) {
      for (const bag of legacyBags) {
        const id = bag.id ?? uid();
        const row = bagStateToRow(
          {
            id,
            brand: bag.brand ?? "",
            origin: bag.origin ?? "",
            process: bag.process ?? "",
            variety: bag.variety ?? "",
            roast: bag.roast ?? "",
            notes: bag.notes ?? "",
            weight: bag.weight ?? "",
            price: bag.price ?? "",
            currency: bag.currency ?? "€",
            altitude: bag.altitude ?? "",
            ocrText: bag.ocrText ?? "",
            photoPath: "",
          },
          state.userId
        );

        if (typeof bag.photo === "string" && bag.photo.startsWith("data:")) {
          const path = `${state.userId}/${id}.jpg`;
          try {
            const blob = dataUrlToBlob(bag.photo);
            const { error } = await sb.storage
              .from("bag-photos")
              .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
            if (!error) row.photo_path = path;
          } catch (err) {
            captureException(err, { where: "migrate photo", id });
          }
        }

        const { error } = await sb.from("bags").upsert(row, { onConflict: "id" });
        if (error) throw error;

        const ratings = Array.isArray(bag.ratings) ? bag.ratings : [];
        if (ratings.length) {
          const rows = ratings.map((r) => ({
            bag_id: id,
            drink_type: r.drinkType,
            user_id: state.userId,
            rating: Number(r.rating) || 0,
            grind_size: r.grindSize ?? null,
            notes: r.notes ?? "",
            date: r.date || null,
          }));
          const { error: rErr } = await sb.from("ratings").upsert(rows, {
            onConflict: "bag_id,drink_type",
          });
          if (rErr) throw rErr;
        }
        migrated++;
      }
      remove(LEGACY_BAGS_KEY);
    }

    if (legacyEq) {
      const row = {
        user_id: state.userId,
        machine_id:
          typeof legacyEq.machine === "string"
            ? (legacyEq.machine ? "custom" : "")
            : legacyEq.machine?.id ?? "",
        machine_custom:
          typeof legacyEq.machine === "string"
            ? legacyEq.machine ?? ""
            : legacyEq.machine?.custom ?? "",
        grinder_id:
          typeof legacyEq.grinder === "string"
            ? (legacyEq.grinder ? "custom" : "")
            : legacyEq.grinder?.id ?? "",
        grinder_custom:
          typeof legacyEq.grinder === "string"
            ? legacyEq.grinder ?? ""
            : legacyEq.grinder?.custom ?? "",
      };
      const { error } = await sb.from("equipment").upsert(row, { onConflict: "user_id" });
      if (error) throw error;
      remove(LEGACY_EQUIPMENT_KEY);
    }
  } catch (err) {
    captureException(err, { where: "migrateLegacyLocalStorage" });
    throw err;
  }

  return { migrated };
}
