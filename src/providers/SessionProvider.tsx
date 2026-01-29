"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

interface SessionProviderProps {
  children: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  )
}
