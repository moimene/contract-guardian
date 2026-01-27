import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  Book,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/new', label: 'Nuevo Análisis', icon: FilePlus },
  { href: '/escalations', label: 'Escalaciones', icon: AlertTriangle },
];

const configItems = [
  { href: '/config/playbooks', label: 'Playbooks', icon: Book },
  { href: '/config/knowledge-graph', label: 'Knowledge Graph', icon: Share2 },
];

interface SidebarContentProps {
  collapsed: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

function SidebarContent({ collapsed, onToggle, onClose }: SidebarContentProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border p-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-primary">Contract Expert</span>
          </div>
        )}
        {collapsed && <FileText className="h-6 w-6 text-primary" />}

        {/* Desktop toggle */}
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn("hidden md:flex", collapsed && "hidden")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Mobile close */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                collapsed && "justify-center"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Sección Configuración */}
        {!collapsed && (
          <div className="mt-6 px-3 mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Configuración
            </h3>
          </div>
        )}

        {configItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                collapsed && "justify-center"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        "border-t border-sidebar-border p-3",
        collapsed && "flex flex-col items-center"
      )}>
        {/* User info */}
        {!collapsed && user && (
          <div className="mb-3 px-3 py-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.full_name || user.email}
            </p>
            {user.organization_name && (
              <p className="text-xs text-muted-foreground truncate">
                {user.organization_name}
              </p>
            )}
          </div>
        )}

        {/* Expand button (collapsed state) */}
        {collapsed && onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="mb-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Sign out */}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={signOut}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            !collapsed && "w-full justify-start"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Cerrar sesión</span>}
        </Button>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  // Mobile: Sheet drawer
  if (isMobile) {
    return (
      <>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-4 top-4 z-50 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px]">
            <SidebarContent
              collapsed={false}
              onClose={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-[56px]" : "w-[280px]"
      )}
    >
      <SidebarContent
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
    </aside>
  );
}
