import React from "react";

import { CitySlider } from "@/components/ui/CitySlider";

type CityChipRowProps = {
  value: string;
  onChange: (city: string) => void;
};

/** @deprecated Prefer CitySlider — kept as alias for existing imports. */
export function CityChipRow({ value, onChange }: CityChipRowProps) {
  return <CitySlider value={value} onChange={onChange} testID="city-chip-row" />;
}
