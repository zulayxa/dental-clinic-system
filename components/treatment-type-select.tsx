"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DropdownMenu } from "radix-ui";

import { cn } from "@/lib/utils";

type TreatmentCategory =
  | { label: string; children?: undefined }
  | { label: string; children: readonly string[] };

const TREATMENT_CATEGORIES: readonly TreatmentCategory[] = [
  {
    label: "Composite",
    children: ["Class I", "Class II", "Class III", "Class IV", "Class V"],
  },
  { label: "Root Canal Treatment (RCT)" },
  { label: "Dental Scaling and Polishing" },
  { label: "Orthodontic Treatment", children: ["Orthodontic Braces"] },
  { label: "Tooth Extraction", children: ["Surgical Extraction"] },
  { label: "Dental Crown", children: ["Zircon", "Ceramic", "Emax"] },
  { label: "Dental Bridge", children: ["Zircon", "Ceramic", "Emax"] },
];

function formatTreatmentValue(category: string, subtype?: string) {
  return subtype ? `${category} — ${subtype}` : category;
}

const menuSurfaceClassName =
  "z-[300] w-[min(16.5rem,calc(100vw-1.5rem))] min-w-0 overflow-hidden rounded-xl border border-white/15 bg-[#01113a] p-1 text-sm text-white shadow-[0_18px_48px_rgba(1,17,58,0.55)]";

const itemClassName =
  "flex cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm text-cyan-50 outline-none select-none data-[highlighted]:bg-white/12 data-[highlighted]:text-white";

type TreatmentTypeSelectProps = {
  id?: string;
  name?: string;
  required?: boolean;
  className?: string;
  defaultValue?: string;
};

export function TreatmentTypeSelect({
  id = "register-treatment",
  name = "treatmentType",
  required = true,
  className,
  defaultValue = "",
}: TreatmentTypeSelectProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="relative min-w-0">
      <input
        id={`${id}-value`}
        name={name}
        value={value}
        required={required}
        readOnly
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          id={id}
          type="button"
          aria-haspopup="menu"
          className={cn(
            "flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-3 text-left outline-none",
            className,
            !value && "text-sky-200/40",
          )}
        >
          <span className="min-w-0 truncate">
            {value || "Select treatment"}
          </span>
          <ChevronDown className="size-4 shrink-0 text-cyan-100/70" aria-hidden />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="bottom"
            align="start"
            sideOffset={6}
            collisionPadding={12}
            className={menuSurfaceClassName}
          >
            {TREATMENT_CATEGORIES.map((category) =>
              category.children ? (
                <DropdownMenu.Sub key={category.label}>
                  <DropdownMenu.SubTrigger
                    className={cn(itemClassName, "justify-between gap-3")}
                  >
                    <span>{category.label}</span>
                    <ChevronRight
                      className="size-3.5 shrink-0 text-cyan-100/70"
                      aria-hidden
                    />
                  </DropdownMenu.SubTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.SubContent
                      sideOffset={6}
                      alignOffset={-4}
                      collisionPadding={12}
                      className={menuSurfaceClassName}
                    >
                      {category.children.map((subtype) => (
                        <DropdownMenu.Item
                          key={subtype}
                          className={itemClassName}
                          onSelect={() =>
                            setValue(formatTreatmentValue(category.label, subtype))
                          }
                        >
                          {subtype}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Portal>
                </DropdownMenu.Sub>
              ) : (
                <DropdownMenu.Item
                  key={category.label}
                  className={itemClassName}
                  onSelect={() => setValue(formatTreatmentValue(category.label))}
                >
                  {category.label}
                </DropdownMenu.Item>
              ),
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
