import { NavLink } from 'react-router-dom';
import { Instagram, Twitter, Facebook, ArrowRight } from 'lucide-react';
import useAuthStore from '../../stores/authStore';

export default function Footer() {
  const user = useAuthStore((s) => s.user);
  const currentYear = new Date().getFullYear();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Cormorant Garamond', serif; }
        .font-body    { font-family: 'Inter', sans-serif; }
      `}</style>

      <footer className={`font-body bg-stone-900 text-stone-400 ${user ? 'lg:ml-60' : ''}`}>
        {/* Main grid */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pt-12 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-10">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <NavLink to="/" className="font-display text-xl font-medium text-white tracking-tight block mb-3 italic">
                Lagna
              </NavLink>
              <p className="text-sm text-stone-500 leading-relaxed max-w-xs">
                The modern CRM for wedding planners. Manage leads, plan weddings, and grow your business.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-2 mt-4">
                {[Instagram, Twitter, Facebook].map((Icon, idx) => (
                  <a
                    key={idx}
                    href="#"
                    className="w-7 h-7 rounded-full border border-stone-700 flex items-center justify-center text-stone-500 hover:border-stone-400 hover:text-stone-300 transition-all duration-200"
                  >
                    <Icon className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>

            {/* Dynamic links */}
            <div>
              <h4 className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase mb-4">
                {user ? 'Platform' : 'Product'}
              </h4>
              <ul className="space-y-2 text-sm">
                {user ? (
                  <>
                    <li><NavLink to="/dashboard" className="text-stone-500 hover:text-white transition-colors">Dashboard</NavLink></li>
                    <li><NavLink to="/weddings"  className="text-stone-500 hover:text-white transition-colors">Weddings</NavLink></li>
                    <li><NavLink to="/leads"     className="text-stone-500 hover:text-white transition-colors">Leads</NavLink></li>
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
              <h4 className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase mb-4">
                Support
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-stone-500 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-stone-500 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-stone-500 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-stone-500 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase mb-4">
                Stay Updated
              </h4>
              <p className="text-sm text-stone-500 mb-3 leading-relaxed">
                Get the latest updates and tips.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 min-w-0 px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500 transition-colors"
                />
                <button className="shrink-0 w-9 h-9 bg-stone-700 hover:bg-stone-600 transition-colors rounded-lg flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-stone-300" />
                </button>
              </div>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-stone-600">
              {currentYear} Lagna. All rights reserved.
            </p>
            <div className="flex items-center gap-5 text-xs text-stone-600">
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