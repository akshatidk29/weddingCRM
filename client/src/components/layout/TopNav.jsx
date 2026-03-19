import { NavLink, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Users,
  Heart,
  CheckSquare,
  Building2,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads',      label: 'Leads',     icon: Users },
  { to: '/weddings',   label: 'Weddings',  icon: Heart },
  { to: '/tasks',      label: 'Tasks',     icon: CheckSquare },
  { to: '/vendors',    label: 'Vendors',   icon: Building2 },
];

function NavItem({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300',
          isActive
            ? 'text-stone-900 bg-stone-900/10 font-semibold shadow-sm'
            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-900/5'
        )
      }
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      {label}
    </NavLink>
  );
}

export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  // Handle scroll for transparency effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const onOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    setIsMobileNavOpen(false);
    navigate('/login');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Outfit:wght@300;400;500;600&display=swap');
        .nav-font-display { font-family: 'Playfair Display', Georgia, serif; }
        .nav-font-body    { font-family: 'Outfit', sans-serif; }
      `}</style>

      <header
        className={clsx(
          'nav-font-body sticky top-0 z-50 transition-all duration-500',
          scrolled 
            ? 'bg-[#faf9f7]/70 backdrop-blur-lg border-b border-stone-200/40 py-2 shadow-sm' 
            : 'bg-transparent border-b border-transparent py-4'
        )}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between">

            {/* LEFT — Logo + Desktop Nav */}
            <div className="flex items-center gap-8 lg:gap-12">
              <NavLink
                to="/"
                className="nav-font-display text-2xl font-bold text-stone-900 tracking-tight transition-transform hover:scale-105"
              >
                Lagna
              </NavLink>

              {user && (
                <nav className="hidden md:flex items-center gap-1">
                  {navItems.map(item => (
                    <NavItem key={item.to} {...item} />
                  ))}
                </nav>
              )}
            </div>

            {/* RIGHT — Actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* User Dropdown (Desktop) */}
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setIsMenuOpen(o => !o)}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-full hover:bg-stone-900/5 transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center shadow-inner">
                        <span className="text-xs font-bold text-rose-600">
                          {user?.name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-stone-700 truncate max-w-[120px]">
                        {user?.name}
                      </span>
                      <ChevronDown
                        className={clsx(
                          'h-3.5 w-3.5 text-stone-400 transition-transform duration-300',
                          isMenuOpen && 'rotate-180'
                        )}
                      />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 mt-3 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-200/50 py-2 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-4 py-3 border-b border-stone-100/60">
                          <p className="text-sm font-bold text-stone-900">{user.name}</p>
                          <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-0.5">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-900/5"
                          >
                            <User className="h-4 w-4 text-stone-400" /> Profile
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50"
                          >
                            <LogOut className="h-4 w-4" /> Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Toggle */}
                  <button
                    className="md:hidden p-2 rounded-full text-stone-600 hover:bg-stone-900/5 transition-colors"
                    onClick={() => setIsMobileNavOpen(o => !o)}
                  >
                    {isMobileNavOpen ? <X size={22} /> : <Menu size={22} />}
                  </button>
                </>
              ) : (
                /* Logged Out Actions */
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-sm font-semibold text-stone-500 hover:text-stone-900 px-4 py-2 transition-colors"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="text-sm font-bold px-6 py-2.5 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all hover:shadow-lg hover:shadow-stone-900/20 active:scale-95"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile Glass Drawer ── */}
        {user && isMobileNavOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#faf9f7]/90 backdrop-blur-2xl border-b border-stone-200/50 px-6 py-6 space-y-2 animate-in slide-in-from-top-4 duration-300">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Navigation</p>
            {navItems.map(item => (
              <NavItem
                key={item.to}
                {...item}
                onClick={() => setIsMobileNavOpen(false)}
              />
            ))}
            <div className="pt-4 mt-2 border-t border-stone-200/60">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-rose-500 rounded-xl hover:bg-rose-50 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}