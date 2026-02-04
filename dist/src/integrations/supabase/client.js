"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPABASE_FUNCTIONS_URL = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
// ============================================
// Contract Guardian - Supabase Client
// Backend: hvlsuwdqtffiilvampxq (propio)
// ============================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://hvlsuwdqtffiilvampxq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bHN1d2RxdGZmaWlsdmFtcHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTI5MDIsImV4cCI6MjA4Mzg4ODkwMn0.3ERR8T1wBF3FUDfVoTH91avPMlWEL37ueVCNbYHJp4M";
// Create untyped client to avoid type conflicts with external Supabase
exports.supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
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
// Export URL for services that need it
exports.SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
//# sourceMappingURL=client.js.map