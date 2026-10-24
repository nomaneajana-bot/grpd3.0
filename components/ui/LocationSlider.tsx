import React, { useEffect, useMemo, useState } from "react";

import { OptionSlider } from "@/components/ui/OptionSlider";
import { DEFAULT_LOCATIONS } from "@/lib/moroccoPlaces";
import { getSpots } from "@/lib/spotsStore";

type Props = {
  value: string;
  onChange: (location: string) => void;
  /** Extra options (merged, de-duped). */
  options?: readonly string[];
  testID?: string;
  /** Load persisted spots from spotsStore (default true). */
  loadSavedSpots?: boolean;
};

export function LocationSlider({
  value,
  onChange,
  options,
  testID = "location-slider",
  loadSavedSpots = true,
}: Props) {
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    if (!loadSavedSpots) return;
    let alive = true;
    void getSpots().then((list) => {
      if (alive) setSaved(list);
    });
    return () => {
      alive = false;
    };
  }, [loadSavedSpots]);

  const merged = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of [
      ...(options ?? []),
      ...saved,
      ...DEFAULT_LOCATIONS,
    ]) {
      const key = item.trim();
      if (!key) continue;
      const norm = key.toLowerCase();
      if (seen.has(norm)) continue;
      seen.add(norm);
      out.push(key);
    }
    return out;
  }, [options, saved]);

  return (
    <OptionSlider
      options={merged}
      value={value}
      onChange={onChange}
      label="Lieu"
      testID={testID}
    />
  );
}
