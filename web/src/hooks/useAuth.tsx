import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

// Auth User with superuser support
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

// Fallback dev user for testing matches the one in root, but won't be used by default
const DEV_USER: AuthUser = {
    id: 'dev-user-00000000-0000-0000-0000-000000000000',
    email: 'dev@test.local',
    full_name: 'Usuario Desarrollo',
    role: 'admin',
    organization_id: '00000000-0000-0000-0000-000000000001',
    organization_name: 'Amazon Studios Dev',
    is_superuser: true,
    permissions: ['all'],
};

// Set to false to require real auth for production/vercel
const USE_DEV_MODE = false;

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isSuperuser: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: false,
    isSuperuser: false,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(USE_DEV_MODE ? DEV_USER : null);
    const [isLoading, setIsLoading] = useState(!USE_DEV_MODE);

    useEffect(() => {
        if (USE_DEV_MODE) return;

        // Real auth flow
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    // Get profile with superuser info
                    // Note: We might need to ensure 'profiles' table exists and has these fields.
                    // If not, we fallback to session info.
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name, role, is_superuser, permissions, organization_id')
                        .eq('id', session.user.id)
                        .maybeSingle(); // Changed to maybeSingle to handle missing profiles gracefully

                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        full_name: profile?.full_name || session.user.email || 'Usuario',
                        role: profile?.role || 'user',
                        organization_id: profile?.organization_id || '',
                        organization_name: 'Amazon Studios',
                        is_superuser: profile?.is_superuser || false,
                        permissions: profile?.permissions || [],
                    });
                }
            } catch (error) {
                console.error('Auth error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                checkSession();
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isSuperuser: user?.is_superuser || false,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
