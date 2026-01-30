import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    FilePlus,
    AlertTriangle,
    LogOut,
    Shield,
    ChevronLeft,
    ChevronRight,
    BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/new', label: 'Nuevo Análisis', icon: FilePlus },
    { href: '/playbook', label: 'Playbook', icon: BookOpen },
    { href: '/escalations', label: 'Escalaciones', icon: AlertTriangle },
]

interface AppSidebarProps {
    user?: {
        name: string
        organization: string
    }
    pendingEscalations?: number
    signOut?: () => Promise<void>
}

export function AppSidebar({ user, pendingEscalations = 0, signOut }: AppSidebarProps) {
    const location = useLocation()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={cn(
                "h-screen flex flex-col transition-all duration-300",
                collapsed ? "w-16" : "w-64"
            )}
            style={{ backgroundColor: '#004438', borderRight: '1px solid #007362' }}
        >
            {/* Logo */}
            <div
                className="h-16 flex items-center px-4"
                style={{ borderBottom: '1px solid rgba(0, 115, 98, 0.5)' }}
            >
                <Shield className="h-8 w-8 flex-shrink-0" style={{ color: '#ffffff' }} />
                {!collapsed && (
                    <span className="ml-2 font-bold text-lg" style={{ color: '#ffffff' }}>
                        Contract Guardian
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors"
                            )}
                            style={{
                                color: '#ffffff',
                                backgroundColor: isActive ? '#007362' : 'transparent',
                                fontWeight: isActive ? 600 : 500
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(0, 115, 98, 0.5)'
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                        >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && (
                                <span>{item.label}</span>
                            )}
                            {!collapsed && item.href === '/escalations' && pendingEscalations > 0 && (
                                <span
                                    className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                                >
                                    {pendingEscalations}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* User info */}
            {user && !collapsed && (
                <div
                    className="p-4"
                    style={{ borderTop: '1px solid rgba(0, 115, 98, 0.5)' }}
                >
                    <div className="text-sm font-medium" style={{ color: '#ffffff' }}>{user.name}</div>
                    <div className="text-xs" style={{ color: '#6dc1b0' }}>{user.organization}</div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 justify-start"
                        style={{ color: '#ffffff' }}
                        onClick={() => signOut?.()}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Cerrar sesión
                    </Button>
                </div>
            )}

            {/* Collapse toggle */}
            <div
                className="p-2"
                style={{ borderTop: '1px solid rgba(0, 115, 98, 0.5)' }}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full"
                    style={{ color: '#ffffff' }}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>
        </aside>
    )
}
