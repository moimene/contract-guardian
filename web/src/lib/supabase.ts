import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hvlsuwdqtffiilvampxq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bHN1d2RxdGZmaWlsdmFtcHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTI5MDIsImV4cCI6MjA4Mzg4ODkwMn0.AYhrbvL5OZ5cdG5e5THLEiEAxOD7n8p3eif0sTrzWbg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        detectSessionInUrl: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
})

export const SUPABASE_FUNCTIONS_URL = `${supabaseUrl}/functions/v1`
