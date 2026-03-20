import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Heart, 
  CheckSquare, 
  Briefcase,
  TrendingUp,
  Settings,
  HelpCircle,
  Plus,
  Building2,
  Layers
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Weddings', href: '/weddings', icon: Heart },
  { name: 'Templates', href: '/templates', icon: Layers },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Vendors', href: '/vendors', icon: Briefcase },
  { name: 'Budget', href: '/budget', icon: TrendingUp },
  { name: 'Hotels', href: '/hotels', icon: Building2 },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-[#faf9f7] border-r border-stone-200/60 fixed left-0 top-14 h-[calc(100vh-56px)] z-30">
      {/* Brand */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="font-display text-lg text-stone-900 tracking-tight">Aayojan</h2>
        <p className="text-[9px] uppercase tracking-[0.18em] text-stone-400 font-medium mt-0.5">
          Wedding CRM
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 mb-0.5 transition-all duration-200 rounded-lg ${
                isActive 
                  ? 'bg-white text-stone-900 font-medium shadow-sm' 
                  : 'text-stone-500 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 mt-auto space-y-2">
        <NavLink
          to="/leads"
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-stone-900 text-[#faf9f7] rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Lead
        </NavLink>
        <div className="pt-3 border-t border-stone-200/60 space-y-0.5">
          <NavLink 
            to="/profile" 
            className="flex items-center gap-2 text-stone-400 text-xs hover:text-stone-900 transition-colors py-1.5 px-2 rounded"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </NavLink>
          <button className="flex items-center gap-2 text-stone-400 text-xs hover:text-stone-900 transition-colors py-1.5 px-2 rounded w-full text-left">
            <HelpCircle className="w-3.5 h-3.5" />
            Help
          </button>
        </div>
      </div>
    </aside>
  );
}
