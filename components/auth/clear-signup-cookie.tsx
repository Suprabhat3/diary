"use client";

import { useEffect } from "react";

import { clearSignupCookie } from "@/lib/auth/signup-cookie";

/** Drops signup details once the profile has been created on the server. */
export function ClearSignupCookie() {
  useEffect(() => {
    clearSignupCookie();
  }, []);

  return null;
}
