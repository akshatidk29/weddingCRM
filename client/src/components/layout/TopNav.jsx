import { NavLink, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { LogOut, User, ChevronDown, Menu, X, Search, Plus } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import useAuthStore from '../../stores/authStore';
import NotificationBell from '../chat/NotificationBell';
import api from '../../utils/api';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/leads',     label: 'Leads' },
  { to: '/weddings',  label: 'Weddings' },
  { to: '/templates', label: 'Templates' },
  { to: '/vendors',   label: 'Vendors' },
  { to: '/tasks',     label: 'Tasks' },
  { to: '/budget',    label: 'Budget' },
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
          'relative text-[11px] font-semibold uppercase tracking-[0.12em] py-1 transition-colors duration-200',
          isActive
            ? 'text-[#faf9f7]'
            : 'text-stone-500 hover:text-stone-300'
        )
      }
    >
      {({ isActive }) => (
        <>
          {label}
          {isActive && (
            <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-[#faf9f7] rounded-full" />
          )}
        </>
      )}
    </NavLink>
  );
}

/* ─────────────────────────────────────────
   SEARCH RESULTS DROPDOWN
───────────────────────────────────────── */
function SearchResults({ results, query, onClose, navigate }) {
  if (!query.trim()) return null;

  const hasResults = results.weddings.length || results.leads.length || results.vendors.length;

  return (
    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-stone-200/60 overflow-hidden z-50 max-h-80 overflow-y-auto">
      {!hasResults ? (
        <div className="px-4 py-5 text-center">
          <p className="text-sm text-stone-400 italic">No results for "{query}"</p>
        </div>
      ) : (
        <>
          {results.weddings.length > 0 && (
            <div>
              <p className="px-4 py-2 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase bg-[#faf9f7]">Weddings</p>
              {results.weddings.map(w => (
                <button
                  key={w._id}
                  onClick={() => { navigate(`/weddings/${w._id}`); onClose(); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#faf9f7] transition-colors flex items-center gap-3 border-b border-stone-50 last:border-0"
                >
                  <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-stone-500">{w.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{w.name}</p>
                    {w.weddingDate && (
                      <p className="text-[11px] text-stone-400">{new Date(w.weddingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          {results.leads.length > 0 && (
            <div>
              <p className="px-4 py-2 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase bg-[#faf9f7]">Leads</p>
              {results.leads.map(l => (
                <button
                  key={l._id}
                  onClick={() => { navigate('/leads'); onClose(); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#faf9f7] transition-colors flex items-center gap-3 border-b border-stone-50 last:border-0"
                >
                  <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-stone-500">{l.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{l.name}</p>
                    <p className="text-[11px] text-stone-400 capitalize">{l.stage?.replace('_', ' ')}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {results.vendors.length > 0 && (
            <div>
              <p className="px-4 py-2 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase bg-[#faf9f7]">Vendors</p>
              {results.vendors.map(v => (
                <button
                  key={v._id}
                  onClick={() => { navigate('/vendors'); onClose(); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#faf9f7] transition-colors flex items-center gap-3 border-b border-stone-50 last:border-0"
                >
                  <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-stone-500">{v.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{v.name}</p>
                    <p className="text-[11px] text-stone-400 capitalize">{v.category}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   TOP NAV
═══════════════════════════════════════ */
export default function TopNav() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ weddings: [], leads: [], vendors: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const filteredNavItems = navItems.filter(item => {
    if (user?.role === 'client') {
      return !['Templates', 'Leads'].includes(item.label);
    }
    return true;
  });

  useEffect(() => {
    const onOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchResults(false);
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

  // Debounced search
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setSearchResults({ weddings: [], leads: [], vendors: [] });
      setShowSearchResults(false);
      return;
    }
    try {
      const [wRes, lRes, vRes] = await Promise.allSettled([
        api.get(`/weddings?search=${encodeURIComponent(q)}`),
        api.get(`/leads?search=${encodeURIComponent(q)}`),
        api.get(`/vendors?search=${encodeURIComponent(q)}`),
      ]);
      const weddings = (wRes.status === 'fulfilled' ? (wRes.value.data?.weddings || wRes.value.data || []) : []).slice(0, 5);
      const leads    = (lRes.status === 'fulfilled' ? (lRes.value.data?.leads    || lRes.value.data || []) : []).slice(0, 5);
      const vendors  = (vRes.status === 'fulfilled' ? (vRes.value.data?.vendors  || vRes.value.data || []) : []).slice(0, 5);
      setSearchResults({ weddings, leads, vendors });
      setShowSearchResults(true);
    } catch {
      setSearchResults({ weddings: [], leads: [], vendors: [] });
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ weddings: [], leads: [], vendors: [] });
    setShowSearchResults(false);
    setShowMobileSearch(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap');
        .nav-font-display { font-family: 'Cormorant Garamond', serif; letter-spacing: -0.02em; }
        .nav-font-body    { font-family: 'Inter', sans-serif; }
      `}</style>

      <header className="nav-font-body fixed top-0 left-0 right-0 z-50 bg-stone-900">
        <div className="flex items-center justify-between px-5 sm:px-8 lg:px-10 h-14">

          {/* Left — Logo */}
          <div className="flex items-center gap-6 lg:gap-8">
            <NavLink to="/" className="flex-shrink-0">
              <img src="/Logo.png" alt="Aayojan" className="h-8 w-8 object-contain" />
            </NavLink>

            {/* Desktop Search */}
            {user && (
              <div className="hidden md:block relative" ref={searchRef}>
                <div className="flex items-center bg-stone-800/80 border border-stone-700/50 px-3.5 py-1.5 rounded-lg focus-within:border-stone-600 focus-within:bg-stone-800 transition-all w-56 lg:w-72">
                  <Search className="w-3.5 h-3.5 text-stone-500 mr-2 flex-shrink-0" />
                  <input
                    className="bg-transparent border-none focus:outline-none text-[13px] w-full text-stone-300 placeholder-stone-600"
                    placeholder="Search..."
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => { if (searchQuery.trim()) setShowSearchResults(true); }}
                  />
                  {searchQuery && (
                    <button onClick={clearSearch} className="p-0.5 text-stone-500 hover:text-stone-300 transition-colors flex-shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {showSearchResults && (
                  <SearchResults
                    results={searchResults}
                    query={searchQuery}
                    onClose={clearSearch}
                    navigate={navigate}
                  />
                )}
              </div>
            )}
          </div>

          {/* Center — Nav Links */}
          {user && (
            <nav className="hidden lg:flex items-center gap-5">
              {filteredNavItems.map(item => (
                <NavItem key={item.to} {...item} />
              ))}
            </nav>
          )}

          {/* Right — Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Mobile search toggle */}
                <button
                  className="md:hidden p-2 text-stone-500 hover:text-stone-300 transition-colors"
                  onClick={() => setShowMobileSearch(!showMobileSearch)}
                >
                  <Search className="h-4 w-4" />
                </button>

                {/* Notifications */}
                <NotificationBell />

                {/* Add Wedding */}
                <NavLink
                  to="/weddings"
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-[#faf9f7] text-stone-900 text-[11px] font-semibold rounded-lg hover:bg-white transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">New Wedding</span>
                </NavLink>

                {/* User Menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(o => !o)}
                    className="flex items-center gap-1.5 ml-1"
                  >
                    <div className="w-8 h-8 rounded-lg bg-stone-800 border border-stone-700/50 flex items-center justify-center overflow-hidden">
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-stone-400">
                          {user?.name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={clsx(
                      'h-3 w-3 text-stone-500 transition-transform hidden sm:block',
                      isMenuOpen && 'rotate-180'
                    )} />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2.5 w-56 bg-white rounded-xl shadow-xl border border-stone-200/60 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-stone-100/60 bg-[#faf9f7]">
                        <p className="text-sm font-medium text-stone-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-stone-400 truncate mt-0.5">{user.email}</p>
                        <p className="text-[9px] text-stone-500 font-bold uppercase tracking-[0.2em] mt-1">
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
                  className="lg:hidden p-2 text-stone-500 hover:text-stone-300 transition-colors"
                  onClick={() => setIsMobileNavOpen(o => !o)}
                >
                  {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="text-[13px] font-medium text-stone-500 hover:text-stone-300 px-3 py-1.5 transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="text-[13px] font-medium px-5 py-2 bg-[#faf9f7] text-stone-900 rounded-lg hover:bg-white transition-all"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        {user && showMobileSearch && (
          <div className="md:hidden px-4 pb-3 bg-stone-900 border-t border-stone-800">
            <div className="relative" ref={!searchRef.current ? searchRef : undefined}>
              <div className="flex items-center bg-stone-800 border border-stone-700/50 px-3.5 py-2 rounded-lg">
                <Search className="w-3.5 h-3.5 text-stone-500 mr-2 flex-shrink-0" />
                <input
                  className="bg-transparent border-none focus:outline-none text-[13px] w-full text-stone-300 placeholder-stone-600"
                  placeholder="Search..."
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => { if (searchQuery.trim()) setShowSearchResults(true); }}
                />
                <button onClick={clearSearch} className="p-1 text-stone-500 hover:text-stone-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {showSearchResults && (
                <SearchResults
                  results={searchResults}
                  query={searchQuery}
                  onClose={clearSearch}
                  navigate={navigate}
                />
              )}
            </div>
          </div>
        )}

        {/* Mobile Nav Drawer */}
        {user && isMobileNavOpen && (
          <div className="lg:hidden bg-stone-900 border-t border-stone-800 px-4 py-3 space-y-0.5">
            {filteredNavItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileNavOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'text-[#faf9f7] bg-stone-800'
                      : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-3 mt-3 border-t border-stone-800 space-y-0.5">
              <button
                onClick={() => { navigate('/profile'); setIsMobileNavOpen(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-stone-500 rounded-lg hover:bg-stone-800/50 hover:text-stone-300 transition-colors"
              >
                <User className="h-4 w-4" /> Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-stone-500 rounded-lg hover:bg-stone-800/50 hover:text-stone-300 transition-colors"
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