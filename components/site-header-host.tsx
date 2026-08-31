import { headers } from "next/headers";

import { SiteHeader } from "@/components/site-header";

export async function SiteHeaderHost() {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname === "/" || pathname === "/login") {
    return null;
  }
  return <SiteHeader />;
}
