import { normalizePhone } from "@/lib/phone-normalize";

/** Single canonical key for mock/API user lookup (email or E.164 phone). */
export function normalizeAuthIdentifier(value: string): string {
  const compact = value.replace(/\s/g, "").trim();
  if (!compact) return compact;

  if (compact.includes("@")) {
    let email = compact.toLowerCase();
    if (email.startsWith("+")) {
      email = email.slice(1);
    }
    return email;
  }

  if (compact.startsWith("+")) return compact;
  return normalizePhone(compact);
}
