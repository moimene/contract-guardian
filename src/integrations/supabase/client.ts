import { createClient } from '@supabase/supabase-js';

// Supabase propietario (backend unificado)
const SUPABASE_URL = "https://hvlsuwdqtffiilvampxq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bHN1d2RxdGZmaWlsdmFtcHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MTc2MTEsImV4cCI6MjA2MTA5MzYxMX0.YOUR_ANON_KEY_HERE";

// Create untyped client to avoid type conflicts with external Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
        persistSession: true,
        detectSessionInUrl: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});
