import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { useAuth } from '@/hooks/useAuth'

export function Layout() {
    const { user, signOut } = useAuth()

    const sidebarUser = user ? {
        name: user.full_name || user.email,
        organization: user.organization_name || 'Organization'
    } : undefined

    return (
        <div className="flex h-screen bg-background">
            <AppSidebar user={sidebarUser} pendingEscalations={3} signOut={signOut} />
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    )
}
