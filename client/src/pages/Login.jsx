import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function AnimatedLagna() {
  const [count, setCount] = useState(0);
  const word = 'Lagna';
  useEffect(() => {
    if (count >= word.length) return;
    const t = setTimeout(() => setCount(c => c + 1), 185);
    return () => clearTimeout(t);
  }, [count]);
  return (
    <>
      {word.split('').map((char, i) => (
        <span key={i} className="inline-block transition-all duration-500 ease-out"
          style={{
            opacity: i < count ? 1 : 0,
            transform: i < count ? 'translateY(0)' : 'translateY(40px)',
            transitionDelay: `${i * 60}ms`,
          }}>
          {char}
        </span>
      ))}
    </>
  );
}

export default function Login() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [mounted, setMounted]           = useState(false);
  const { login }                       = useAuth();
  const navigate                        = useNavigate();

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=Outfit:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-body    { font-family: 'Outfit', sans-serif; }
      `}</style>

      <div className="font-body min-h-screen bg-[#faf9f7]">

        {/* ── MOBILE layout: stacked, no margins ── */}
        <div className="lg:hidden flex flex-col min-h-screen">

          {/* Image — takes top 45% of screen */}
          <div className="relative flex-shrink-0" style={{ height: '45vh' }}>
            <img
              src="Login.jpg" alt=""
              className="absolute inset-0 w-full h-full object-cover object-top"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/25 to-stone-950/55" />
            <div className="absolute inset-0 flex flex-col p-5 z-10">
              <Link to="/" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm w-fit">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
              {/* Text top of image */}
              <div className="mt-4">
                <h1 className="font-display font-bold text-white leading-none text-[3.2rem]">
                  Lagna
                </h1>
                <p className="font-display italic text-white/60 text-sm mt-2 leading-snug">
                  The modern CRM for{' '}
                  <span className="text-rose-300 not-italic font-semibold">wedding planners</span>{' '}
                </p>
              </div>
            </div>
          </div>

          {/* Form — scrollable bottom portion */}
          <div className="flex-1 px-6 py-8 overflow-y-auto">
            <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold text-stone-900">Welcome back</h2>
                <p className="mt-1.5 text-stone-400 text-sm">Sign in to your account to continue</p>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold tracking-[0.18em] text-stone-400 uppercase mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" required
                      className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold tracking-[0.18em] text-stone-400 uppercase mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <input type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password" required
                      className="w-full pl-11 pr-11 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 transition-all" />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="pt-1">
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 bg-stone-900 text-white rounded-full text-sm font-semibold hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Signing in...
                      </span>
                    ) : 'Sign in'}
                  </button>
                </div>
              </form>

              <p className="mt-6 text-center text-stone-400 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-stone-900 font-semibold hover:underline underline-offset-2">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── DESKTOP layout: side by side, inside max-w-7xl grid ── */}
        <div className="hidden lg:flex max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 min-h-screen flex-row gap-10 py-8">

          {/* Left: image card */}
          <div className="w-[52%] sticky top-8 self-start flex-shrink-0">
            <div className="relative w-full rounded-2xl overflow-hidden"
              style={{ height: 'calc(100vh - 4rem)' }}>
              <img
                src="Login.jpg" alt=""
                className="absolute inset-0 w-full h-full object-cover object-top"
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-stone-950/72 via-stone-950/20 to-stone-950/55" />
              <div className="absolute inset-0 flex flex-col z-10 p-8 xl:p-10">
                <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm w-fit">
                  <ArrowLeft className="h-4 w-4" /> Back to home
                </Link>
                <div className="mt-1">
                  <h1 className="font-display font-bold text-white leading-none"
                    style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}>
                    <AnimatedLagna />
                  </h1>
                  <p className={`font-display italic text-white/60 text-base mt-3 leading-snug max-w-[22ch]
                    transition-all duration-700 delay-[1100ms]
                    ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    The modern CRM for{' '}
                    <span className="text-rose-300 not-italic font-semibold">wedding planners</span>{' '}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="flex-1 flex items-center justify-center">
            <div className={`w-full max-w-xs transition-all duration-700 delay-200
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="mb-7">
                <h2 className="font-display text-3xl font-bold text-stone-900">Welcome back</h2>
                <p className="mt-2 text-stone-400 text-sm">Sign in to your account to continue</p>
              </div>
              {error && (
                <div className="mb-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold tracking-[0.18em] text-stone-400 uppercase mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" required
                      className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/6 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold tracking-[0.18em] text-stone-400 uppercase mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <input type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password" required
                      className="w-full pl-11 pr-11 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/6 transition-all" />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="pt-1">
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 bg-stone-900 text-white rounded-full text-sm font-semibold hover:bg-stone-800 transition-all hover:shadow-lg hover:shadow-stone-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Signing in...
                      </span>
                    ) : 'Sign in'}
                  </button>
                </div>
              </form>
              <p className="mt-7 text-center text-stone-400 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-stone-900 font-semibold hover:underline underline-offset-2">
                  Create one
                </Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}