import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database'; // We might need to generate this or mock it

// Supabase Externo (backend unificado)
const SUPABASE_URL = "https://hvlsuwdqtffiilvampxq.supabase.co";
// USAR VITE_SUPABASE_PUBLISHABLE_KEY de .env si existe, sino placeholder
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "INSERT_YOUR_ANON_KEY_HERE";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        detectSessionInUrl: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});
