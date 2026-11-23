/** Normalize to E.164 (+212…) for Morocco-first flows. */
export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("212")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return `+212${digits}`;
}
