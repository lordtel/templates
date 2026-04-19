export const MACHINES = [
  { id: "bambino-plus", brand: "Breville", model: "Bambino Plus" },
  { id: "barista-express", brand: "Breville", model: "Barista Express" },
  { id: "dual-boiler", brand: "Breville", model: "Dual Boiler (BES920)" },
  { id: "linea-mini", brand: "La Marzocco", model: "Linea Mini" },
  { id: "linea-micra", brand: "La Marzocco", model: "Linea Micra" },
  { id: "silvia-pro-x", brand: "Rancilio", model: "Silvia Pro X" },
  { id: "gaggia-classic-pro", brand: "Gaggia", model: "Classic Pro" },
  { id: "lelit-bianca", brand: "Lelit", model: "Bianca V3" },
  { id: "lelit-mara-x", brand: "Lelit", model: "Mara X" },
  { id: "oscar-ii", brand: "Nuova Simonelli", model: "Oscar II" },
  { id: "profitec-pro-600", brand: "Profitec", model: "Pro 600" },
  { id: "synchronika", brand: "ECM", model: "Synchronika" },
];

export const GRINDERS = [
  {
    id: "baratza-encore",
    brand: "Baratza",
    model: "Encore",
    burrSize: "40mm conical",
    scale: { min: 1, max: 40, step: 1, unit: "step" },
    espressoRange: [5, 10],
    filterRange: [15, 30],
  },
  {
    id: "baratza-sette-270wi",
    brand: "Baratza",
    model: "Sette 270Wi",
    burrSize: "40mm conical",
    scale: { min: 1, max: 31, step: 1, unit: "" },
    espressoRange: [5, 15],
    filterRange: [18, 28],
  },
  {
    id: "eureka-specialita",
    brand: "Eureka",
    model: "Mignon Specialita",
    burrSize: "55mm flat",
    scale: { min: 0, max: 55, step: 1, unit: "" },
    espressoRange: [10, 25],
    filterRange: [30, 45],
  },
  {
    id: "niche-zero",
    brand: "Niche",
    model: "Zero",
    burrSize: "63mm conical",
    scale: { min: 0, max: 50, step: 1, unit: "" },
    espressoRange: [11, 19],
    filterRange: [35, 50],
  },
  {
    id: "df64-gen2",
    brand: "DF",
    model: "DF64 Gen 2",
    burrSize: "64mm flat",
    scale: { min: 0, max: 10, step: 0.1, unit: "turns" },
    espressoRange: [0.9, 1.6],
    filterRange: [3.0, 5.0],
  },
  {
    id: "x54",
    brand: "Mahlkönig",
    model: "X54",
    burrSize: "54mm flat",
    scale: { min: 1, max: 35, step: 1, unit: "" },
    espressoRange: [3, 8],
    filterRange: [12, 22],
  },
  {
    id: "ode-gen2",
    brand: "Fellow",
    model: "Ode Gen 2",
    burrSize: "64mm flat",
    scale: { min: 1, max: 11, step: 1, unit: "step" },
    espressoRange: [1, 3],
    filterRange: [4, 9],
  },
  {
    id: "comandante-c40",
    brand: "Comandante",
    model: "C40 MK4",
    burrSize: "39mm conical",
    scale: { min: 0, max: 40, step: 1, unit: "click" },
    espressoRange: [8, 14],
    filterRange: [22, 32],
  },
  {
    id: "1zpresso-jmax",
    brand: "1Zpresso",
    model: "J-Max",
    burrSize: "48mm conical",
    scale: { min: 0, max: 400, step: 1, unit: "click" },
    espressoRange: [20, 40],
    filterRange: [90, 130],
  },
  {
    id: "breville-smart-grinder-pro",
    brand: "Breville",
    model: "Smart Grinder Pro",
    burrSize: "40mm conical",
    scale: { min: 1, max: 60, step: 1, unit: "step" },
    espressoRange: [4, 12],
    filterRange: [20, 35],
  },
  {
    id: "lagom-casa",
    brand: "Option-O",
    model: "Lagom Casa",
    burrSize: "65mm conical",
    scale: { min: 0, max: 2.5, step: 0.1, unit: "rot" },
    espressoRange: [0.4, 0.9],
    filterRange: [1.3, 1.9],
  },
];

export function getMachine(id) {
  return MACHINES.find((m) => m.id === id) ?? null;
}

export function getGrinder(id) {
  return GRINDERS.find((g) => g.id === id) ?? null;
}

export function machineLabel(id, custom) {
  if (id === "custom") return custom || "";
  const m = getMachine(id);
  return m ? `${m.brand} ${m.model}` : "";
}

export function grinderLabel(id, custom) {
  if (id === "custom") return custom || "";
  const g = getGrinder(id);
  return g ? `${g.brand} ${g.model}` : "";
}

export function starterGrindFor(grinder, drinkType) {
  if (!grinder) return null;
  const [lo, hi] = grinder.espressoRange;
  const lerp = (t) => lo + (hi - lo) * t;
  const raw = {
    espresso: lerp(0.3),
    cappuccino: lerp(0.35),
    iced_latte: lerp(0.5),
    iced_americano: lerp(0.7),
  }[drinkType] ?? lerp(0.5);
  return snap(raw, grinder.scale.step);
}

function snap(n, step) {
  if (!step || step <= 0) return n;
  const snapped = Math.round(n / step) * step;
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  return Number(snapped.toFixed(decimals));
}
