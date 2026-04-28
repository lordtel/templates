// Compute a freshness pill from a roast date.
//
// Convention (single-origin coffee, espresso-focused):
//   0–6 days:   resting    — beans need a few days to off-gas
//   7–21 days:  peak       — sweet spot for espresso
//   22–35 days: still good — gentle decline
//   36+ days:   stale      — off-flavours likely

export function freshness(roastDate, today = Date.now()) {
  if (!roastDate) return null;
  const t = parseDate(roastDate);
  if (!t) return null;

  const days = Math.floor((today - t) / (1000 * 60 * 60 * 24));
  if (days < 0) return null;

  let stage, label;
  if (days <= 6) {
    stage = "resting";
    label = days === 0 ? "Fresh roast" : `Day ${days} · resting`;
  } else if (days <= 21) {
    stage = "peak";
    label = `Day ${days} · peak`;
  } else if (days <= 35) {
    stage = "fading";
    label = `Day ${days}`;
  } else {
    stage = "stale";
    label = `Day ${days} · stale`;
  }

  return { days, stage, label };
}

function parseDate(input) {
  if (!input) return null;
  if (input instanceof Date) return input.getTime();
  // YYYY-MM-DD: parse as local-midnight to avoid TZ jumps
  const m = String(input).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d.getTime();
  }
  const fallback = new Date(input);
  return isNaN(fallback.getTime()) ? null : fallback.getTime();
}
