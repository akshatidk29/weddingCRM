import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import useAuthStore from '../stores/authStore';

/* ─────────────────────────────────────────
   ANIMATED TITLE
───────────────────────────────────────── */
function AnimatedAayojan() {
  const hindi = ['आ', 'यो', 'ज', 'न'];
  const english = ['A', 'a', 'y', 'o', 'j', 'a', 'n'];

  const [phase, setPhase] = useState('hindi-in');
  const [hindiCount, setHindiCount] = useState(0);
  const [hindiVisible, setHindiVisible] = useState(hindi.map(() => true));
  const [englishCount, setEnglishCount] = useState(0);

  // 1. Type Hindi in
  useEffect(() => {
    if (phase !== 'hindi-in') return;
    if (hindiCount >= hindi.length) {
      const t = setTimeout(() => setPhase('hindi-out'), 900);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setHindiCount(c => c + 1), 185);
    return () => clearTimeout(t);
  }, [phase, hindiCount]);

  // 2. Erase Hindi right to left
  useEffect(() => {
    if (phase !== 'hindi-out') return;
    const next = hindiVisible.lastIndexOf(true);
    if (next === -1) {
      const t = setTimeout(() => setPhase('english-in'), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setHindiVisible(v => v.map((val, i) => i === next ? false : val));
    }, 160);
    return () => clearTimeout(t);
  }, [phase, hindiVisible]);

  // 3. Type English in — then loop
  useEffect(() => {
    if (phase !== 'english-in') return;
    if (englishCount < english.length) {
      const t = setTimeout(() => setEnglishCount(c => c + 1), 185);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setHindiCount(0);
      setHindiVisible(hindi.map(() => true));
      setEnglishCount(0);
      setPhase('hindi-in');
    }, 1500);
    return () => clearTimeout(t);
  }, [phase, englishCount]);

  const showHindi = phase === 'hindi-in' || phase === 'hindi-out';
  const showEnglish = phase === 'english-in';

  // Subtitle visible when current animation batch is done typing
  const showSub = (showHindi && hindiCount >= hindi.length) || (showEnglish && englishCount >= english.length);

  return (
    <div className="flex items-baseline gap-3 flex-wrap mt-2">
      <h1
        className="font-display leading-[0.88] text-white whitespace-nowrap"
        style={{ fontSize: 'clamp(2rem, 10vw, 5rem)', fontWeight: 700, minHeight: '1.1em' }}
      >
        {showHindi && hindi.map((char, i) => (
          <span
            key={`h-${i}`}
            className="inline-block transition-all duration-500 ease-out"
            style={{
              opacity: i < hindiCount && hindiVisible[i] ? 1 : 0,
              transform: i < hindiCount && hindiVisible[i] ? 'translateY(0)' : 'translateY(50px)',
            }}
          >
            {char}
          </span>
        ))}

        {showEnglish && english.map((char, i) => (
          <span
            key={`e-${i}`}
            className="inline-block transition-all duration-500 ease-out"
            style={{
              opacity: i < englishCount ? 1 : 0,
              transform: i < englishCount ? 'translateY(0)' : 'translateY(50px)',
              transitionDelay: `${i * 55}ms`,
            }}
          >
            {char}
          </span>
        ))}
      </h1>
      <p className={`font-display italic text-white/40 text-base xl:text-lg leading-snug transition-all duration-500
        ${showSub ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        for <span className="text-[#c9a96e] not-italic font-medium">wedding planners</span>
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════
   LOGIN PAGE
═══════════════════════════════════════ */
export default function Login() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [mounted, setMounted]           = useState(false);
  const login    = useAuthStore((s) => s.login);
  const navigate = useNavigate();

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

  const inputCls = "w-full pl-11 pr-4 py-3 bg-white border border-stone-200/60 rounded-lg text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 transition-all shadow-sm";
  const labelCls = "block text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Cormorant Garamond', serif; letter-spacing: -0.02em; }
        .font-body    { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="font-body min-h-screen bg-[#faf9f7]">

        {/* ── MOBILE: stacked ── */}
        <div className="lg:hidden flex flex-col min-h-screen">
          <div className="relative flex-shrink-0" style={{ height: '38vh' }}>
            <img src="Login.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-top"
              onError={e => { e.currentTarget.style.display = 'none'; }} />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/30 to-stone-900/60" />
            <div className="absolute inset-0 flex flex-col p-5 z-10">
              <Link to="/" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm w-fit">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
              <div>
                <h1 className="font-display font-medium text-white leading-none text-5xl">Aayojan</h1>
                <p className="font-display italic text-white/50 text-sm mt-2">
                  The modern CRM for <span className="text-[#c9a96e] not-italic font-medium">wedding planners</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-6 py-8 overflow-y-auto">
            <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="mb-6">
                <h2 className="font-display text-3xl font-medium text-stone-900">Welcome back</h2>
                <p className="mt-1.5 text-stone-400 text-sm">Sign in to your account to continue</p>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 bg-stone-100 border border-stone-200/60 rounded-lg text-stone-700 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" required className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <input type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password" required
                      className="w-full pl-11 pr-11 py-3 bg-white border border-stone-200/60 rounded-lg text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 transition-all shadow-sm" />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-stone-900 text-[#faf9f7] rounded-lg text-sm font-medium hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
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
                <Link to="/register" className="text-stone-900 font-medium hover:underline underline-offset-2">Create one</Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── DESKTOP: flush-left image | right form ── */}
        <div className="hidden lg:flex min-h-screen">

          {/* Left: Image — flush to left edge */}
          <div className="w-[45%] relative flex-shrink-0">
            <div className="absolute inset-0 overflow-hidden">
              <img src="Login.jpg" alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: 'center 15%' }}
                onError={e => { e.currentTarget.style.display = 'none'; }} />
              <div className="absolute inset-0 bg-gradient-to-br from-stone-900/75 via-stone-900/30 to-stone-900/50" />
            </div>

            {/* Content overlay — title at top */}
            <div className="relative z-10 flex flex-col h-full px-8 xl:px-10 pt-6 pb-10">
              <div>
                <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm w-fit mb-10">
                  <ArrowLeft className="h-4 w-4" /> Back to home
                </Link>
                <AnimatedAayojan />
              </div>

              <div className="mt-auto flex items-center gap-2">
                <div className="w-8 h-[2px] bg-white/20 rounded-full" />
                <div className="w-2 h-[2px] bg-white/10 rounded-full" />
                <div className="w-2 h-[2px] bg-white/10 rounded-full" />
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="flex-1 flex items-center justify-center px-10 xl:px-16">
            <div className={`w-full max-w-sm transition-all duration-700 delay-200
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

              <div className="mb-8">
                <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-3">Sign In</p>
                <h2 className="font-display text-4xl font-medium text-stone-900 leading-tight">Welcome back</h2>
                <p className="mt-2 text-stone-400 text-sm">Sign in to your account to continue</p>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 bg-stone-100 border border-stone-200/60 rounded-lg text-stone-700 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={labelCls}>Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" required className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <input type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password" required
                      className="w-full pl-11 pr-11 py-3 bg-white border border-stone-200/60 rounded-lg text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 transition-all shadow-sm" />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-stone-900 text-[#faf9f7] rounded-lg text-sm font-medium hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
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

              <div className="mt-8 pt-6 border-t border-stone-200/60 text-center">
                <p className="text-stone-400 text-sm">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-stone-900 font-medium hover:underline underline-offset-2">Create one</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}