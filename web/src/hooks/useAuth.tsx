import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

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

interface AuthContextType {
    user: AuthUser | null;
    rawUser: User | null;
    isLoading: boolean;
    isSuperuser: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    rawUser: null,
    isLoading: true,
    isSuperuser: false,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [rawUser, setRawUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const buildAuthUser = async (supabaseUser: User): Promise<AuthUser> => {
        // Try to get profile, but don't fail if it doesn't exist or has different schema
        let fullName = supabaseUser.email || 'User';

        try {
            // Only query columns we know exist: id, full_name
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', supabaseUser.id)
                .maybeSingle();

            if (profile?.full_name) {
                fullName = profile.full_name;
            }
        } catch (e) {
            // Ignore profile errors - use email as fallback
            console.warn('Could not fetch profile:', e);
        }

        return {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            full_name: fullName,
            role: 'user', // Default role
            organization_id: '',
            organization_name: 'Contract Guardian',
            is_superuser: false,
            permissions: ['all'], // Grant all permissions for now
        };
    };

    useEffect(() => {
        // Check initial session
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setRawUser(session.user);
                    const authUser = await buildAuthUser(session.user);
                    setUser(authUser);
                }
            } catch (error) {
                console.error('Auth session check error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);

            if (session?.user) {
                setRawUser(session.user);
                const authUser = await buildAuthUser(session.user);
                setUser(authUser);
            } else {
                setUser(null);
                setRawUser(null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setRawUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            rawUser,
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
