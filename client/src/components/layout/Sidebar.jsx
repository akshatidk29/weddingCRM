import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Heart, 
  CheckSquare, 
  Store,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Weddings', href: '/weddings', icon: Heart },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Vendors', href: '/vendors', icon: Store },
  { name: 'Budget', href: '/budget', icon: Wallet },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  return (
    <aside className={clsx(
      'fixed left-0 top-0 h-screen bg-gray-900/50 backdrop-blur-xl border-r border-white/[0.06]',
      'flex flex-col transition-all duration-300 z-40',
      collapsed ? 'w-20' : 'w-64'
    )}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.06]">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">WedCRM</span>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                isActive 
                  ? 'bg-purple-500/20 text-purple-400' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white',
                collapsed && 'justify-center'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/[0.06]">
        {isAdmin && (
          <NavLink
            to="/settings"
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all',
              collapsed && 'justify-center'
            )}
          >
            <Settings className="w-5 h-5" />
            {!collapsed && <span className="font-medium">Settings</span>}
          </NavLink>
        )}
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:bg-white/5 hover:text-white transition-all"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
