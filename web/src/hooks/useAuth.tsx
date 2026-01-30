import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

// ===========================================
// DEV MODE - Set to TRUE to bypass Supabase Auth
// ===========================================
const USE_DEV_MODE = true;

// Auth User with minimal required fields
export interface AuthUser {
    id: string;
    email: string;
    full_name: string;
    role: string;
    organization_id: string;
    organization_name: string;
    is_superuser: boolean;
    permissions: string[];
}

// Dev user for testing when USE_DEV_MODE is true
const DEV_USER: AuthUser = {
    id: 'dev-00000000-0000-0000-0000-000000000001',
    email: 'dev@contractguardian.local',
    full_name: 'Developer (Dev Mode)',
    role: 'admin',
    organization_id: '11111111-1111-1111-1111-111111111111',
    organization_name: 'Contract Guardian Dev',
    is_superuser: true,
    permissions: ['all'],
};

interface AuthContextType {
    user: AuthUser | null;
    rawUser: User | null;
    isLoading: boolean;
    isSuperuser: boolean;
    isDevMode: boolean;
    error: string | null;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    rawUser: null,
    isLoading: false,
    isSuperuser: false,
    isDevMode: USE_DEV_MODE,
    error: null,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    // In DEV MODE, immediately set the dev user
    const [user, setUser] = useState<AuthUser | null>(USE_DEV_MODE ? DEV_USER : null);
    const [rawUser, setRawUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(!USE_DEV_MODE);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Skip all auth logic in dev mode
        if (USE_DEV_MODE) {
            console.log('🔓 DEV MODE: Authentication bypassed');
            return;
        }

        // Real auth flow (only runs when USE_DEV_MODE is false)
        let mounted = true;

        const initializeAuth = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.warn('Session error:', sessionError);
                }

                if (session?.user && mounted) {
                    setRawUser(session.user);
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        full_name: session.user.user_metadata?.full_name || session.user.email || 'User',
                        role: 'user',
                        organization_id: '',
                        organization_name: 'Contract Guardian',
                        is_superuser: false,
                        permissions: ['all'],
                    });
                }
            } catch (e) {
                console.error('Auth error:', e);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            if (session?.user) {
                setRawUser(session.user);
                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    full_name: session.user.user_metadata?.full_name || session.user.email || 'User',
                    role: 'user',
                    organization_id: '',
                    organization_name: 'Contract Guardian',
                    is_superuser: false,
                    permissions: ['all'],
                });
            } else {
                setUser(null);
                setRawUser(null);
            }
            setIsLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        if (!USE_DEV_MODE) {
            try {
                await supabase.auth.signOut();
            } catch (e) {
                console.error('Sign out error:', e);
            }
        }
        // In dev mode, just log
        console.log('🔓 DEV MODE: Sign out (no-op)');
    };

    return (
        <AuthContext.Provider value={{
            user,
            rawUser,
            isLoading,
            isSuperuser: user?.is_superuser || false,
            isDevMode: USE_DEV_MODE,
            error,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
