/** Format stored phone for display (e.g. +212 8080 80 80 0). */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("212")) {
    const rest = digits.slice(3);
    return `+212 ${formatLocal(rest)}`.trim();
  }
  if (digits.length > 0) {
    return `+212 ${formatLocal(digits)}`.trim();
  }
  return phone;
}

/** Morocco local: 4 digits then groups of 2, last group 1–2 digits. */
function formatLocal(d: string): string {
  if (d.length === 0) return "";
  const parts: string[] = [d.slice(0, Math.min(4, d.length))];
  let i = 4;
  while (i < d.length) {
    const remaining = d.length - i;
    const size = remaining <= 2 ? remaining : 2;
    parts.push(d.slice(i, i + size));
    i += size;
  }
  return parts.join(" ");
}
