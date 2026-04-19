import { sb } from "./supabase.js";
import { captureException } from "./sentry.js";
import { load, remove } from "./storage.js";

const LEGACY_BAGS_KEY = "brew.bags.v1";
const LEGACY_EQUIPMENT_KEY = "brew.equipment.v1";

const SIGNED_URL_TTL = 60 * 60 * 24 * 7;

const listeners = new Set();

let state = {
  bags: [],
  equipment: { machine: { id: "", custom: "" }, grinder: { id: "", custom: "" } },
  loading: true,
  userId: null,
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

export function getEquipment() {
  return state.equipment;
}

export async function loadInitialData(userId) {
  state.userId = userId;
  state.loading = true;
  emit();

  try {
    const [bagsRes, ratingsRes, eqRes] = await Promise.all([
      sb.from("bags").select("*").order("created_at", { ascending: false }),
      sb.from("ratings").select("*"),
      sb.from("equipment").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    if (bagsRes.error) throw bagsRes.error;
    if (ratingsRes.error) throw ratingsRes.error;
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

    state.bags = bags.map((row, i) => ({
      ...bagRowToState(row),
      photo: signedUrls[i]?.data?.signedUrl ?? "",
      ratings: ratingsByBag.get(row.id) ?? [],
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
    currency: "€",
    altitude: "",
    ocrText: "",
    photo: "",
    photoPath: "",
    photoUpload: "",
    ...bag,
    ratings: [],
  };
  state.bags = [newBag, ...state.bags];
  emit();
  persistBag(newBag).catch((err) => captureException(err, { where: "addBag", id }));
  return id;
}

export function updateBag(id, patch) {
  const bag = getBag(id);
  if (!bag) return;
  Object.assign(bag, patch);
  emit();
  persistBag(bag).catch((err) => captureException(err, { where: "updateBag", id }));
}

export function removeBag(id) {
  const bag = getBag(id);
  state.bags = state.bags.filter((b) => b.id !== id);
  emit();
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

export function setEquipment(patch) {
  state.equipment = { ...state.equipment, ...patch };
  emit();

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
    currency: r.currency ?? "€",
    altitude: r.altitude ?? "",
    ocrText: r.ocr_text ?? "",
    photoPath: r.photo_path ?? "",
    photoUpload: "",
  };
}

function bagStateToRow(s, userId) {
  return {
    id: s.id,
    user_id: userId,
    brand: s.brand || null,
    origin: s.origin || null,
    process: s.process || null,
    variety: s.variety || null,
    roast: s.roast || null,
    notes: s.notes || null,
    weight: s.weight === "" || s.weight == null ? null : Number(s.weight),
    price: s.price === "" || s.price == null ? null : Number(s.price),
    currency: s.currency || null,
    altitude: s.altitude || null,
    ocr_text: s.ocrText || null,
    photo_path: s.photoPath || null,
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
