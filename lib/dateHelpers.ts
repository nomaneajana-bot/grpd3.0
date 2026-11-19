// Date parsing and formatting utilities

/**
 * Parse dateLabel string (e.g. "LUNDI 10 NOVEMBRE 06:00") to Date object
 * This is a best-effort parser for legacy dateLabel format
 * Returns null if parsing fails
 */
export function parseDateLabel(dateLabel: string): { date: Date; dateISO: string; timeMinutes: number } | null {
  if (!dateLabel || typeof dateLabel !== 'string') return null;

  try {
    // Try to extract date and time from format like "LUNDI 10 NOVEMBRE 06:00"
    // or "LUNDI 10 06:00"
    const timeMatch = dateLabel.match(/(\d{2}):(\d{2})/);
    if (!timeMatch) return null;

    const hour = parseInt(timeMatch[1], 10);
    const minute = parseInt(timeMatch[2], 10);
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }

    // Extract day number
    const dayMatch = dateLabel.match(/\b(\d{1,2})\b/);
    if (!dayMatch) return null;

    const day = parseInt(dayMatch[1], 10);
    if (isNaN(day) || day < 1 || day > 31) return null;

    // Try to extract month (French month names)
    const monthMap: Record<string, number> = {
      janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
      juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
    };

    let month = new Date().getMonth(); // Default to current month
    const monthMatch = dateLabel.match(/\b(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i);
    if (monthMatch) {
      const monthName = monthMatch[1].toLowerCase();
      month = monthMap[monthName] ?? new Date().getMonth();
    }

    // Use current year (or next year if month/day has passed)
    const now = new Date();
    let year = now.getFullYear();
    const date = new Date(year, month, day, hour, minute, 0, 0);

    // If date is in the past, assume next year
    if (date < now) {
      year = now.getFullYear() + 1;
      date.setFullYear(year);
    }

    // Validate the date
    if (isNaN(date.getTime())) return null;

    // Generate ISO date string (YYYY-MM-DD)
    const dateISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Calculate time in minutes since midnight
    const timeMinutes = hour * 60 + minute;

    return { date, dateISO, timeMinutes };
  } catch (error) {
    console.warn('Failed to parse dateLabel:', dateLabel, error);
    return null;
  }
}

/**
 * Format date and time to dateLabel string (e.g. "LUNDI 10 NOVEMBRE 06:00")
 * Uses French month names and day names
 */
export function formatDateLabel(date: Date, timeMinutes: number): string {
  const dayNames = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
  const monthNames = ['JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'];

  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const monthName = monthNames[date.getMonth()];
  const hour = Math.floor(timeMinutes / 60);
  const minute = timeMinutes % 60;

  return `${dayName} ${day} ${monthName} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Check if date is in the future (calendar day >= today)
 */
export function isFutureDate(dateISO: string): boolean {
  if (!dateISO) return false;

  try {
    const date = new Date(dateISO);
    if (isNaN(date.getTime())) return false;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    return date >= now;
  } catch {
    return false;
  }
}

/** Today as YYYY-MM-DD in local time. */
export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * Next `count` calendar days starting from today (inclusive), as ISO dates.
 * Used by session create date picker — real dates, never invented weekdays.
 * `label` stays ALL-CAPS for the date *selector*; use `formatOutingDateShort`
 * for calm single-line row values.
 */
export function upcomingDateOptions(count = 14): {
  dateISO: string;
  label: string;
}[] {
  const options: { dateISO: string; label: string }[] = [];
  const dayNames = [
    "DIMANCHE",
    "LUNDI",
    "MARDI",
    "MERCREDI",
    "JEUDI",
    "VENDREDI",
    "SAMEDI",
  ];
  const monthNames = [
    "JANVIER",
    "FÉVRIER",
    "MARS",
    "AVRIL",
    "MAI",
    "JUIN",
    "JUILLET",
    "AOÛT",
    "SEPTEMBRE",
    "OCTOBRE",
    "NOVEMBRE",
    "DÉCEMBRE",
  ];
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  for (let i = 0; i < count; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    options.push({
      dateISO,
      label: `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`,
    });
  }
  return options;
}

/** Calm single-line create-form row value, e.g. "Mercredi 18 novembre". */
export function formatOutingDateShort(dateISO: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return dateISO;
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  if (isNaN(date.getTime())) return dateISO;
  const dayNames = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];
  const monthNames = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]}`;
}

/**
 * Reject past calendar days. Returns false for invalid ISO.
 */
export function isSelectableOutingDate(dateISO: string): boolean {
  return isFutureDate(dateISO);
}

/**
 * Reject invalid ISO or a date+time that is already in the past (local clock).
 * Calendar-today is allowed only when the chosen time is still upcoming.
 */
export function isSelectableOutingDateTime(
  dateISO: string,
  timeMinutes: number,
): boolean {
  if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return false;
  if (
    typeof timeMinutes !== "number" ||
    !Number.isFinite(timeMinutes) ||
    timeMinutes < 0 ||
    timeMinutes > 1439
  ) {
    return false;
  }
  if (!isSelectableOutingDate(dateISO)) return false;

  const [y, m, d] = dateISO.split("-").map((n) => parseInt(n, 10));
  const hour = Math.floor(timeMinutes / 60);
  const minute = timeMinutes % 60;
  const when = new Date(y, m - 1, d, hour, minute, 0, 0);
  if (isNaN(when.getTime())) return false;
  return when.getTime() > Date.now();
}

/**
 * Default create time: next 15-min slot ≥30 minutes ahead.
 * Avoids midnight-ish defaults (e.g. 01:30) — falls back to 09:00 same/next day.
 */
export function defaultUpcomingOutingTime(now = new Date()): {
  dateISO: string;
  hour: number;
  minute: number;
  timeMinutes: number;
} {
  const candidate = new Date(now.getTime() + 30 * 60 * 1000);
  // Snap up to next :00 / :15 / :30 / :45
  let minutes = candidate.getMinutes();
  let hour = candidate.getHours();
  const step = Math.ceil(minutes / 15) * 15;
  if (step === 60) {
    minutes = 0;
    hour += 1;
  } else if (step === 0 && minutes > 0) {
    minutes = 15;
  } else {
    minutes = step;
  }
  if (minutes === 0 && candidate.getMinutes() === 0) {
    // already on the hour after +30m — keep
  }

  const pushToMorning = (base: Date) => {
    const dateISO = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(
      base.getDate(),
    ).padStart(2, "0")}`;
    return { dateISO, hour: 9, minute: 0, timeMinutes: 9 * 60 };
  };

  if (hour >= 24) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return pushToMorning(tomorrow);
  }
  // Night / very early → sensible daytime default
  if (hour < 6 || hour >= 22) {
    if (hour >= 22) {
      const tomorrow = new Date(candidate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return pushToMorning(tomorrow);
    }
    return pushToMorning(candidate);
  }

  const dateISO = `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, "0")}-${String(
    candidate.getDate(),
  ).padStart(2, "0")}`;
  return { dateISO, hour, minute: minutes, timeMinutes: hour * 60 + minutes };
}

/**
 * Check if date is in the specified range
 */
export function isDateInRange(
  dateISO: string,
  range: 'today' | 'thisWeek' | 'thisMonth'
): boolean {
  if (!dateISO) return false;

  try {
    const date = new Date(dateISO);
    if (isNaN(date.getTime())) return false;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (range === 'today') {
      const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return targetDate.getTime() === today.getTime();
    }

    if (range === 'thisWeek') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

      const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return targetDate >= weekStart && targetDate <= weekEnd;
    }

    if (range === 'thisMonth') {
      const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      return targetDate >= monthStart && targetDate <= monthEnd;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Get sortable timestamp from session
 * Uses dateISO + timeMinutes if available, otherwise falls back to parsing dateLabel
 */
export function getSessionDateForSort(session: { dateISO?: string; timeMinutes?: number; dateLabel: string }): number {
  // If we have proper date fields, use them
  if (session.dateISO && session.timeMinutes !== undefined) {
    try {
      const date = new Date(session.dateISO);
      if (!isNaN(date.getTime())) {
        // Add time minutes to get full timestamp
        const hours = Math.floor(session.timeMinutes / 60);
        const minutes = session.timeMinutes % 60;
        date.setHours(hours, minutes, 0, 0);
        return date.getTime();
      }
    } catch {
      // Fall through to dateLabel parsing
    }
  }

  // Fallback: try to parse dateLabel
  const parsed = parseDateLabel(session.dateLabel);
  if (parsed) {
    return parsed.date.getTime();
  }

  // Last resort: extract day number for rough sorting
  const dayMatch = session.dateLabel.match(/\d+/);
  if (dayMatch) {
    return parseInt(dayMatch[0], 10);
  }

  return 0;
}

/**
 * Format date for display using Intl.DateTimeFormat
 */
export function formatDateForDisplay(dateISO: string, timeMinutes?: number): string {
  if (!dateISO) return 'À définir';

  try {
    const date = new Date(dateISO);
    if (isNaN(date.getTime())) return 'À définir';

    // If timeMinutes provided, set the time
    if (timeMinutes !== undefined) {
      const hours = Math.floor(timeMinutes / 60);
      const minutes = timeMinutes % 60;
      date.setHours(hours, minutes, 0, 0);
    }

    // Use French locale
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: timeMinutes !== undefined ? '2-digit' : undefined,
      minute: timeMinutes !== undefined ? '2-digit' : undefined,
    }).format(date);
  } catch {
    return 'À définir';
  }
}

/**
 * Format date for list display (short format)
 * Shows "24 nov" or "24 nov 2025" (year only if different from current)
 */
export function formatDateForList(dateISO: string | null | undefined): string {
  if (!dateISO) return 'À définir';

  try {
    const date = new Date(dateISO);
    if (isNaN(date.getTime())) return 'À définir';

    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    const currentYear = new Date().getFullYear();

    const shortMonths = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
    const monthLabel = shortMonths[monthIndex];

    // Show year only if different from current year
    if (year !== currentYear) {
      return `${day} ${monthLabel} ${year}`;
    }
    return `${day} ${monthLabel}`;
  } catch {
    return 'À définir';
  }
}
