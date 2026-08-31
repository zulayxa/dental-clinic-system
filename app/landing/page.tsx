import type { Metadata } from "next";
import { ViewTransition } from "react";

import { LandingPage } from "@/components/landing-page";

export const metadata: Metadata = {
  title: "Dental Care",
  description: "Advanced dental solutions crafted for your comfort and a brilliant smile.",
};

export default function LandingRoutePage() {
  return (
    <ViewTransition>
      <LandingPage />
    </ViewTransition>
  );
}
