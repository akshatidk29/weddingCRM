import { NavLink } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Footer() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Outfit:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-body    { font-family: 'Outfit', sans-serif; }
      `}</style>

      <footer className="font-body bg-stone-900 text-stone-400">

        {/* ── Main grid ── */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pt-16 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-16 mb-14">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <NavLink to="/" className="font-display text-2xl font-bold text-white tracking-wide block mb-4">
                Lagna
              </NavLink>
              <p className="text-sm text-stone-500 leading-relaxed max-w-xs">
                The modern CRM for wedding planners. Manage leads, plan weddings, and grow your business.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-3 mt-6">
                {[
                  { icon: Instagram, href: '#' },
                  { icon: Twitter,   href: '#' },
                  { icon: Facebook,  href: '#' },
                ].map(({ icon: Icon, href }) => (
                  <a
                    key={href + Icon.name}
                    href={href}
                    className="w-8 h-8 rounded-full border border-stone-700 flex items-center justify-center text-stone-500 hover:border-rose-400 hover:text-rose-400 transition-all duration-200"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Dynamic links */}
            <div>
              <h4 className="text-[10px] font-semibold tracking-[0.2em] text-stone-400 uppercase mb-5">
                {user ? 'Platform' : 'Product'}
              </h4>
              <ul className="space-y-3 text-sm">
                {user ? (
                  <>
                    <li><NavLink to="/dashboard" className="text-stone-500 hover:text-white transition-colors">Dashboard</NavLink></li>
                    <li><NavLink to="/weddings"  className="text-stone-500 hover:text-white transition-colors">My Weddings</NavLink></li>
                    <li><NavLink to="/vendors"   className="text-stone-500 hover:text-white transition-colors">Vendor Manager</NavLink></li>
                    <li><NavLink to="/tasks"     className="text-stone-500 hover:text-white transition-colors">Tasks</NavLink></li>
                  </>
                ) : (
                  <>
                    <li><a href="#features" className="text-stone-500 hover:text-white transition-colors">Features</a></li>
                    <li><a href="#pricing"  className="text-stone-500 hover:text-white transition-colors">Pricing</a></li>
                    <li><a href="#"         className="text-stone-500 hover:text-white transition-colors">About</a></li>
                  </>
                )}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-[10px] font-semibold tracking-[0.2em] text-stone-400 uppercase mb-5">
                Support
              </h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-stone-500 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-stone-500 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-stone-500 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-stone-500 hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-[10px] font-semibold tracking-[0.2em] text-stone-400 uppercase mb-5">
                Stay Updated
              </h4>
              <p className="text-sm text-stone-500 mb-4 leading-relaxed">
                Get the latest updates and wedding industry tips.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 min-w-0 px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-full text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-rose-400 transition-colors"
                />
                <button className="flex-shrink-0 w-10 h-10 bg-rose-500 hover:bg-rose-400 transition-colors rounded-full flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

          </div>

          {/* ── Bottom bar ── */}
          <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-stone-600">
              © {currentYear} Lagna. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs text-stone-600">
              <a href="#" className="hover:text-stone-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-stone-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-stone-400 transition-colors">Cookies</a>
            </div>
          </div>
        </div>

      </footer>
    </>
  );
}