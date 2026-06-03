import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://pfuskglbtkawcfkdnoad.supabase.co";
const SUPABASE_KEY = "sb_publishable_NhG4gZCQkfo2S47w0Kqpdg_MkfL_rwg";

if (!SUPABASE_URL.startsWith("https://") || !SUPABASE_URL.endsWith(".supabase.co")) {
  console.error("SUPABASE_URL inválida:", SUPABASE_URL);
  alert("Erro: a SUPABASE_URL precisa ser algo como https://xxxx.supabase.co");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});