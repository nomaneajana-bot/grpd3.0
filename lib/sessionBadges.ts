export type SessionBadge = {
  label: string;
  variant: "default" | "active" | "success" | "custom";
};

function normalizeBadgeLabel(label: string): string {
  return label.trim().replace(/\s+/g, " ").toLowerCase();
}

export function uniqueSessionBadges(badges: SessionBadge[]): SessionBadge[] {
  const seen = new Set<string>();

  return badges.filter((badge) => {
    const normalized = normalizeBadgeLabel(badge.label);
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}
