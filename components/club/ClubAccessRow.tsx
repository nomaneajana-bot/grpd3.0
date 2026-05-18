import React from "react";

import { NavRow } from "@/components/ui/NavRow";

type ClubAccessRowProps = {
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function ClubAccessRow({ title, subtitle, onPress }: ClubAccessRowProps) {
  return <NavRow title={title} subtitle={subtitle} onPress={onPress} />;
}
