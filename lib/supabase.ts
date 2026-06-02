import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  url !== "" &&
  key !== "" &&
  !url.includes("tu-proyecto") &&
  !key.includes("tu-anon-key");

// Lazy client — only instantiated when Supabase is actually configured
export const supabase = isSupabaseConfigured
  ? createClient(url, key)
  : null;
