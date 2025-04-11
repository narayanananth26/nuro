"use client";

import { usePathname } from "next/navigation";
import Navigation from "./Navigation";
import AuthNavigation from "./AuthNavigation";
import { isAuthPage } from "@/utils/pathUtils";

export default function ConditionalNavigation() {
  const pathname = usePathname();
  
  // Show AuthNavigation on auth pages, regular Navigation elsewhere
  if (isAuthPage(pathname)) {
    return <AuthNavigation />;
  }
  
  return <Navigation />;
}
