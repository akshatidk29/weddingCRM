import { NavLink, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { LogOut, User, ChevronDown, Menu, X, Search, Bell, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../../stores/authStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/leads',     label: 'Leads' },
  { to: '/weddings',  label: 'Weddings' },
  { to: '/templates', label: 'Templates' },
  { to: '/moodboard', label: 'Mood Board' },
  { to: '/vendors',   label: 'Vendors' },
  { to: '/hotels',    label: 'Hotels' },
];

/* ─────────────────────────────────────────
   NAV ITEM
───────────────────────────────────────── */
function NavItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'relative text-xs font-bold uppercase tracking-wider py-1 transition-colors duration-200',
          isActive ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-900'
        )
      }
    >
      {label}
    </NavLink>
  );
}

export default function TopNav() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap');
        .nav-font-display { font-family: 'Cormorant Garamond', serif; }
        .nav-font-body    { font-family: 'Inter', sans-serif; }
      `}</style>

      <header className={clsx(
        'nav-font-body fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-white shadow-sm shadow-stone-900/5' : 'bg-white'
      )}>
        <div className="flex items-center justify-between px-5 sm:px-8 lg:px-10 h-14">

          {/* Left - Logo + Search */}
          <div className="flex items-center gap-6 lg:gap-8">
            <NavLink to="/" className="nav-font-display text-2xl italic font-medium text-stone-900 tracking-tight flex-shrink-0">
              Lagna
            </NavLink>

            {user && (
              <div className="hidden md:flex items-center bg-white border border-stone-200/60 px-4 py-1.5 rounded-full shadow-sm">
                <Search className="w-4 h-4 text-stone-300 mr-2" />
                <input 
                  className="bg-transparent border-none focus:outline-none text-sm w-48 lg:w-64 text-stone-700 placeholder-stone-300"
                  placeholder="Search weddings, leads..."
                  type="text"
                />
              </div>
            )}
          </div>

          {/* Center - Nav Links */}
          {user && (
            <nav className="hidden lg:flex items-center gap-6">
              {navItems.map(item => (
                <NavItem key={item.to} {...item} />
              ))}
            </nav>
          )}

          {/* Right - Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Mobile search */}
                <button 
                  className="md:hidden p-2 text-stone-400 hover:text-stone-900 transition-colors"
                  onClick={() => setShowSearch(!showSearch)}
                >
                  <Search className="h-5 w-5" />
                </button>

                {/* Notifications */}
                <button className="hidden sm:flex p-2 text-stone-400 hover:text-stone-900 transition-colors">
                  <Bell className="h-5 w-5" />
                </button>

                {/* Add Wedding */}
                <NavLink
                  to="/weddings"
                  className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-[#faf9f7] text-xs font-medium rounded-full hover:bg-stone-800 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden lg:inline">New Wedding</span>
                </NavLink>

                {/* User Menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(o => !o)}
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200/60 flex items-center justify-center overflow-hidden">
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-stone-600">
                          {user?.name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={clsx(
                      'h-3.5 w-3.5 text-stone-400 transition-transform hidden sm:block',
                      isMenuOpen && 'rotate-180'
                    )} />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-stone-200/60 py-1 z-50">
                      <div className="px-4 py-3 border-b border-stone-200/60">
                        <p className="text-sm font-medium text-stone-900 truncate">{user.name}</p>
                        <p className="text-xs text-stone-400 truncate mt-0.5">{user.email}</p>
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-[0.2em] mt-1">
                          {user.role?.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-stone-600 hover:bg-[#faf9f7] transition-colors"
                        >
                          <User className="h-4 w-4 text-stone-400" /> Profile Settings
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-stone-500 hover:bg-[#faf9f7] transition-colors"
                        >
                          <LogOut className="h-4 w-4" /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                  className="lg:hidden p-2 text-stone-400 hover:text-stone-900 transition-colors"
                  onClick={() => setIsMobileNavOpen(o => !o)}
                >
                  {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm font-medium text-stone-500 hover:text-stone-900 px-3 py-1.5 transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="text-sm font-medium px-5 py-2.5 bg-stone-900 text-[#faf9f7] rounded-full hover:bg-stone-800 transition-all duration-300"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        {user && showSearch && (
          <div className="md:hidden px-4 pb-3 border-b border-stone-200/60">
            <div className="flex items-center bg-white border border-stone-200/60 px-4 py-2 rounded-full shadow-sm">
              <Search className="w-4 h-4 text-stone-300 mr-2" />
              <input 
                className="bg-transparent border-none focus:outline-none text-sm w-full text-stone-700 placeholder-stone-300"
                placeholder="Search weddings, leads..."
                type="text"
                autoFocus
              />
              <button onClick={() => setShowSearch(false)} className="p-1 text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Nav Drawer */}
        {user && isMobileNavOpen && (
          <div className="lg:hidden bg-white border-t border-stone-200/60 px-4 py-3 space-y-1 shadow-lg">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileNavOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'text-stone-900 bg-[#faf9f7] border-l-2 border-stone-900'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-[#faf9f7]'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-3 mt-3 border-t border-stone-200/60 space-y-1">
              <button
                onClick={() => { navigate('/profile'); setIsMobileNavOpen(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-stone-500 rounded-xl hover:bg-[#faf9f7] transition-colors"
              >
                <User className="h-4 w-4" /> Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-stone-500 rounded-xl hover:bg-[#faf9f7] transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Spacer */}
      <div className="h-14" />
    </>
  );
}