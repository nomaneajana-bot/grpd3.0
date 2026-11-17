import React from "react";

import { OptionSlider } from "@/components/ui/OptionSlider";
import { MOROCCO_CITIES } from "@/lib/moroccoPlaces";

type Props = {
  value: string;
  onChange: (city: string) => void;
  testID?: string;
};

export function CitySlider({ value, onChange, testID = "city-slider" }: Props) {
  return (
    <OptionSlider
      options={MOROCCO_CITIES}
      value={value}
      onChange={onChange}
      label="Ville"
      testID={testID}
    />
  );
}
