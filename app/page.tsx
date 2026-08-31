import type { Metadata } from "next";
import { ViewTransition } from "react";

import { StaffLoginForm } from "@/components/staff-login-form";

export const metadata: Metadata = {
  title: "Sign in — Dental Care",
  description: "Authorized clinic login.",
};

export default function Home() {
  return (
    <ViewTransition>
      <StaffLoginForm />
    </ViewTransition>
  );
}
