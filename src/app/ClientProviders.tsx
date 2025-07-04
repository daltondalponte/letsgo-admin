"use client";
import { AuthProvider } from "@/context/authContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
} 