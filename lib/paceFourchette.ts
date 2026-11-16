/**
 * Pace range (“fourchette d’allure”) helpers for create/publish.
 * Display shape matches discovery cards: `6:00–7:00`.
 */

const PACE_TOKEN =
  /^(\d{1,2})[:'′](\d{2})$/;

export function normalizePaceToken(raw: string): string | null {
  const t = raw.trim().replace(/\s+/g, "").replace(",", ":").replace(".", ":");
  if (!t) return null;
  if (/^libre$/i.test(t)) return "Libre";
  const m = t.match(PACE_TOKEN);
  if (!m) return null;
  const min = Number(m[1]);
  const sec = Number(m[2]);
  if (!Number.isFinite(min) || !Number.isFinite(sec)) return null;
  if (min < 2 || min > 20 || sec < 0 || sec > 59) return null;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

export function paceTokenToSeconds(token: string): number | null {
  const n = normalizePaceToken(token);
  if (!n || n === "Libre") return null;
  const m = n.match(PACE_TOKEN);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Split stored targetPace into min/max fields for the create form. */
export function splitPaceFourchette(raw: string | null | undefined): {
  min: string;
  max: string;
  libre: boolean;
} {
  const s = (raw ?? "").trim();
  if (!s || s === "—" || /^allure\s+libre$/i.test(s) || /^libre$/i.test(s)) {
    return { min: "", max: "", libre: Boolean(s && /libre/i.test(s)) };
  }
  const cleaned = s
    .replace(/^Allure\s+/i, "")
    .replace(/\s*\/\s*km$/i, "")
    .trim();
  const parts = cleaned.split(/\s*[–—−-]\s*/);
  if (parts.length >= 2) {
    return {
      min: normalizePaceToken(parts[0]!) ?? parts[0]!.trim(),
      max: normalizePaceToken(parts[1]!) ?? parts[1]!.trim(),
      libre: false,
    };
  }
  const single = normalizePaceToken(cleaned) ?? cleaned;
  return { min: single, max: "", libre: false };
}

/**
 * Build the canonical targetPace string for cards / API.
 * Returns null when empty (optional field).
 */
export function buildPaceFourchetteLabel(
  minRaw: string,
  maxRaw: string,
  libre: boolean,
): { label: string | null; error: string | null } {
  if (libre) return { label: "Allure libre", error: null };

  const min = normalizePaceToken(minRaw);
  const max = normalizePaceToken(maxRaw);

  if (!minRaw.trim() && !maxRaw.trim()) {
    return { label: null, error: null };
  }
  if (minRaw.trim() && !min) {
    return {
      label: null,
      error: "Allure min invalide — ex. 6:00",
    };
  }
  if (maxRaw.trim() && !max) {
    return {
      label: null,
      error: "Allure max invalide — ex. 7:00",
    };
  }
  if (min && !max) {
    return { label: `${min}/km`, error: null };
  }
  if (!min && max) {
    return {
      label: null,
      error: "Indique le bas de la fourchette (plus rapide).",
    };
  }
  if (min && max) {
    const a = paceTokenToSeconds(min);
    const b = paceTokenToSeconds(max);
    if (a != null && b != null && a > b) {
      return {
        label: null,
        error: "La fourchette doit aller du plus rapide au plus lent.",
      };
    }
    if (min === max) return { label: `${min}/km`, error: null };
    return { label: `${min}–${max}/km`, error: null };
  }
  return { label: null, error: null };
}
