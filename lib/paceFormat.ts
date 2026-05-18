/** Format decimal minutes/km as 5'15 /km */
export function formatPaceMinPerKm(minutes: number): string {
  const whole = Math.floor(minutes);
  const secs = Math.round((minutes - whole) * 60);
  if (secs === 0) return `${whole}'00 /km`;
  return `${whole}'${secs.toString().padStart(2, "0")} /km`;
}

/** Slider value 0–1 maps to pace range ~3.5–8 min/km */
export function sliderToPaceMinutes(slider: number): number {
  const minP = 3.5;
  const maxP = 8;
  return minP + slider * (maxP - minP);
}

export function paceMinutesToSlider(pace: number): number {
  const minP = 3.5;
  const maxP = 8;
  return Math.max(0, Math.min(1, (pace - minP) / (maxP - minP)));
}

export type PaceReference = {
  id: string;
  label: string;
  minutes: number;
  hint?: string;
};

export const PACE_REFERENCES: PaceReference[] = [
  { id: "fast", label: "Allure soutenue", minutes: 4 },
  {
    id: "run",
    label: "Allure de course",
    minutes: 5,
    hint: "Tu peux parler par phrases courtes.",
  },
  { id: "talk", label: "Allure de conversation", minutes: 6 },
  { id: "walk", label: "Course ↔ marche", minutes: 7 },
];
