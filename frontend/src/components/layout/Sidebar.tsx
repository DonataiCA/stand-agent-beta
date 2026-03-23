import { NavLink } from 'react-router-dom';
import { Users, Calendar, Search, Wifi, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { to: '/', icon: Users, label: 'Leads' },
  { to: '/events', icon: Calendar, label: 'Eventos' },
  { to: '/search', icon: Search, label: 'RAG Search' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col min-h-screen">
      <div className="p-5 flex items-center gap-2">
        <div className="bg-sidebar-primary rounded-lg p-1.5">
          <Wifi className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">DOMOTAI</span>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <p className="font-medium truncate">{user?.name}</p>
            <p className="text-sidebar-foreground/50 text-xs truncate">{user?.email}</p>
          </div>
          <button onClick={logout} className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors" title="Cerrar sesión">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
