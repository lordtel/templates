let tesseractPromise = null;

function loadTesseract() {
  if (tesseractPromise) return tesseractPromise;
  tesseractPromise = new Promise((resolve, reject) => {
    if (window.Tesseract) return resolve(window.Tesseract);
    const s = document.createElement("script");
    s.src = "https://unpkg.com/tesseract.js@5/dist/tesseract.min.js";
    s.async = true;
    s.onload = () => resolve(window.Tesseract);
    s.onerror = () => reject(new Error("Could not load OCR engine"));
    document.head.appendChild(s);
  });
  return tesseractPromise;
}

export async function ocrImage(dataUrl, onProgress) {
  const Tesseract = await loadTesseract();
  const result = await Tesseract.recognize(dataUrl, "eng", {
    logger: (m) => {
      if (!onProgress) return;
      if (m.status === "recognizing text") {
        onProgress({ stage: "recognizing", progress: m.progress });
      } else if (m.status === "loading tesseract core" || m.status === "initializing tesseract") {
        onProgress({ stage: "loading", progress: m.progress ?? 0 });
      }
    },
  });
  return result.data.text ?? "";
}

const COUNTRIES = [
  "Ethiopia", "Colombia", "Kenya", "Brazil", "Guatemala", "Costa Rica",
  "Panama", "Peru", "Honduras", "Rwanda", "Burundi", "El Salvador",
  "Nicaragua", "Jamaica", "Indonesia", "Mexico", "Yemen", "Uganda",
  "Vietnam", "Bolivia", "Tanzania", "Sumatra", "Sulawesi", "Java",
  "Myanmar", "India", "China", "Papua New Guinea", "Ecuador", "Dominican Republic",
];

const PROCESSES = [
  "Washed", "Natural", "Honey", "Anaerobic", "Wet-hulled",
  "Pulped Natural", "Carbonic Maceration", "Black Honey", "Red Honey", "Yellow Honey", "White Honey",
];

const VARIETIES = [
  "Geisha", "Gesha", "Heirloom", "Bourbon", "Typica", "Caturra",
  "Catuai", "SL28", "SL34", "Pacamara", "Sudan Rume", "Maragogype",
  "Pacas", "Mundo Novo", "Yirgacheffe", "Sidamo",
];

const ROAST_LEVELS = [
  { key: /MEDIUM[- ]DARK/i, value: "medium-dark" },
  { key: /MEDIUM[- ]LIGHT/i, value: "medium-light" },
  { key: /\bDARK\b/i, value: "dark" },
  { key: /\bMEDIUM\b/i, value: "medium" },
  { key: /\bLIGHT\b/i, value: "light" },
  { key: /\bFILTER\b/i, value: "filter" },
  { key: /\bOMNI\b/i, value: "omni" },
];

export function parseBagText(text) {
  if (!text) return {};
  const clean = text.replace(/\r/g, "");
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
  const upper = clean.toUpperCase();

  const origin = COUNTRIES.find((c) => upper.includes(c.toUpperCase()));
  const process = PROCESSES.find((p) => upper.includes(p.toUpperCase()));
  const variety = VARIETIES.find((v) => upper.includes(v.toUpperCase()));

  let roast;
  for (const r of ROAST_LEVELS) {
    if (r.key.test(clean)) {
      roast = r.value;
      break;
    }
  }

  let weight;
  const wMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|gram|oz)\b/i);
  if (wMatch) {
    const num = parseFloat(wMatch[1].replace(",", "."));
    const unit = wMatch[2].toLowerCase();
    if (unit === "kg") weight = Math.round(num * 1000);
    else if (unit === "oz") weight = Math.round(num * 28.35);
    else weight = Math.round(num);
  }

  let altitude;
  const aMatch = clean.match(/(\d{3,4})\s*(?:-\s*\d{3,4}\s*)?(?:m|masl|meters?)\b/i);
  if (aMatch) altitude = aMatch[1] + (clean.slice(aMatch.index, aMatch.index + aMatch[0].length).includes("-") ? "" : "") + " masl";

  const brand = lines
    .find((l) => l.length >= 3 && l.length <= 40 && !/^[0-9.,\s]+$/.test(l)) ?? "";

  const notes = extractNotes(clean);

  return { brand, origin, process, variety, roast, weight, altitude, notes, raw: clean };
}

function extractNotes(text) {
  const re = /(?:tasting\s*notes?|notes?|flavou?rs?)\s*[:\-]\s*([^\n]+)/i;
  const m = text.match(re);
  if (m) return m[1].trim().replace(/[.;]+$/, "");
  return "";
}
