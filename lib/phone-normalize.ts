/** Normalize to E.164 (+212…) for Morocco-first flows. */
export function normalizePhone(phone: string): string {
  const compact = phone.replace(/\s/g, "");
  if (compact.startsWith("+")) return compact;
  if (compact.startsWith("0")) return `+212${compact.slice(1)}`;
  if (compact.startsWith("212")) return `+${compact}`;
  return `+212${compact}`;
}
