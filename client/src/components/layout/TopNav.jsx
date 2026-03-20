import { NavLink, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { LogOut, User, ChevronDown, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../../stores/authStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/leads',     label: 'Leads' },
  { to: '/weddings',  label: 'Weddings' },
  { to: '/tasks',     label: 'Tasks' },
  { to: '/vendors',   label: 'Vendors' },
  { to: '/budget',    label: 'Budget' },
];

/* ─────────────────────────────────────────
   NAV ITEM — underline slide-in on hover/active
───────────────────────────────────────── */
function NavItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'relative text-sm font-medium py-1 transition-colors duration-200 group',
          isActive ? 'text-stone-900' : 'text-stone-400 hover:text-stone-900'
        )
      }
    >
      {({ isActive }) => (
        <>
          {label}
          {/* Underline: always present for active, slides in on hover */}
          <span
            className={clsx(
              'absolute -bottom-0.5 left-0 h-px bg-stone-900 transition-all duration-300',
              isActive
                ? 'w-full'
                : 'w-0 group-hover:w-full'
            )}
          />
        </>
      )}
    </NavLink>
  );
}

export default function TopNav() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate          = useNavigate();
  const [isMenuOpen, setIsMenuOpen]           = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [scrolled, setScrolled]               = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

      <header className={clsx(
        'nav-font-body sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[#faf9f7]/90 backdrop-blur-md border-b border-stone-200/60 shadow-sm'
          : 'bg-[#faf9f7] border-b border-stone-100'
      )}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* LEFT — Logo + nav */}
            <div className="flex items-center gap-8 lg:gap-10">
              <NavLink
                to="/"
                className="nav-font-display text-xl font-bold text-stone-900 tracking-wide flex-shrink-0"
              >
                Lagna
              </NavLink>

              {user && (
                <nav className="hidden md:flex items-center gap-6 lg:gap-7">
                  {navItems.map(item => (
                    <NavItem key={item.to} {...item} />
                  ))}
                </nav>
              )}
            </div>

            {/* RIGHT — user actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {/* User dropdown */}
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setIsMenuOpen(o => !o)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-stone-900/5 transition-colors"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-rose-600">
                          {user?.name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-stone-700 max-w-[110px] truncate">
                        {user?.name}
                      </span>
                      <ChevronDown className={clsx(
                        'h-3.5 w-3.5 text-stone-400 transition-transform duration-200 flex-shrink-0',
                        isMenuOpen && 'rotate-180'
                      )} />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-[#faf9f7] rounded-2xl shadow-xl border border-stone-200/80 py-1.5 z-50">
                        <div className="px-4 py-3 border-b border-stone-100">
                          <p className="text-sm font-semibold text-stone-900 truncate">{user.name}</p>
                          <p className="text-xs text-stone-400 truncate mt-0.5">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-900/5 transition-colors"
                          >
                            <User className="h-3.5 w-3.5 text-stone-400" /> Profile
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <LogOut className="h-3.5 w-3.5" /> Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile hamburger */}
                  <button
                    className="md:hidden p-2 rounded-full text-stone-500 hover:bg-stone-900/5 transition-colors"
                    onClick={() => setIsMobileNavOpen(o => !o)}
                    aria-label="Toggle menu"
                  >
                    {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors px-2 py-1"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="text-sm font-semibold px-5 py-2 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all hover:shadow-md"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile drawer ── */}
        {user && isMobileNavOpen && (
          <div className="md:hidden bg-[#faf9f7] border-t border-stone-100 px-5 py-5 space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileNavOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'text-stone-900 bg-stone-900/6'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    {isActive && <span className="w-1 h-1 rounded-full bg-stone-900" />}
                  </>
                )}
              </NavLink>
            ))}
            <div className="pt-2 mt-2 border-t border-stone-100">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm font-medium text-rose-500 rounded-xl hover:bg-rose-50 transition-colors"
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