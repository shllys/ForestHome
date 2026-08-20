<<<<<<< HEAD
// components/SupabaseProvider.tsx
"use client";

import { createClient } from "@supabase/supabase-js";
import { createContext, useContext, ReactNode } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const SupabaseContext = createContext(supabase);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => useContext(SupabaseContext);
=======
// components/SupabaseProvider.tsx
"use client";

import { createClient } from "@supabase/supabase-js";
import { createContext, useContext, ReactNode } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const SupabaseContext = createContext(supabase);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => useContext(SupabaseContext);
>>>>>>> 02f9303c8184b0748965b59f13c2968fd053d4f2
