import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// ============================================
// Contract Guardian - Supabase Client
// Backend: hvlsuwdqtffiilvampxq (propio)
// ============================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://hvlsuwdqtffiilvampxq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bHN1d2RxdGZmaWlsdmFtcHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTI5MDIsImV4cCI6MjA4Mzg4ODkwMn0.3ERR8T1wBF3FUDfVoTH91avPMlWEL37ueVCNbYHJp4M";

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

// Export URL for services that need it
export const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
