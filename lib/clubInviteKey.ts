/**
 * Club “clé” helpers — invite codes & shareable links.
 * Clubs are not a directory: you arrive with a key someone gave you.
 */

const CODE_IN_PATH =
  /(?:grpd\.run|grpd30:\/\/|\/c\/|code=)([A-Za-z0-9]{4,12})/i;
const BARE_CODE = /^[A-Za-z0-9]{4,12}$/;

/** Extract an invite code from pasted text, URL, or bare code. */
export function extractInviteCode(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  const fromPath = text.match(CODE_IN_PATH);
  if (fromPath?.[1]) return fromPath[1].toUpperCase();
  // Last path segment if it looks like a code
  try {
    if (/^https?:\/\//i.test(text) || text.includes("/")) {
      const cleaned = text.split(/[?#]/)[0] ?? text;
      const seg = cleaned.split("/").filter(Boolean).pop() ?? "";
      if (BARE_CODE.test(seg)) return seg.toUpperCase();
    }
  } catch {
    /* ignore */
  }
  const compact = text.replace(/\s+/g, "");
  if (BARE_CODE.test(compact)) return compact.toUpperCase();
  // Any standalone 4–12 alnum token in the paste
  const token = text.match(/\b([A-Za-z0-9]{4,12})\b/);
  return token?.[1] ? token[1].toUpperCase() : null;
}

export function inviteShareUrl(code: string): string {
  return `https://grpd.run/c/${code.trim().toUpperCase()}`;
}

export function inviteShareMessage(code: string, clubName?: string | null): string {
  const name = clubName?.trim();
  const url = inviteShareUrl(code);
  const head = name
    ? `Rejoins ${name} sur GRpD`
    : "Rejoins mon club sur GRpD";
  return `${head}\nClé : ${code.trim().toUpperCase()}\n${url}`;
}
