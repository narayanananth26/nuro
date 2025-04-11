"use client";

/**
 * Check if the current path is an auth page
 */
export function isAuthPage(pathname: string): boolean {
  return pathname.startsWith('/auth/');
}
