"use client";

import { DentalJaw3D } from "@/components/dental-jaw-3d";

export function InteractiveDentalChart({
  selected,
  onChange,
  name = "chartedTeeth",
  readOnly = false,
  fill = false,
}: {
  selected: number[];
  onChange?: (teeth: number[]) => void;
  name?: string;
  readOnly?: boolean;
  fill?: boolean;
}) {
  return (
    <DentalJaw3D
      selected={selected}
      onChange={onChange}
      name={name}
      readOnly={readOnly}
      fill={fill}
    />
  );
}
