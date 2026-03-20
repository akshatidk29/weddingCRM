import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft, ChevronDown } from 'lucide-react';
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

const roleOptions = [
  { value: 'admin',                label: 'Admin' },
  { value: 'relationship_manager', label: 'Relationship Manager' },
  { value: 'team_member',          label: 'Team Member' },
];

const inputCls = "w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/6 transition-all";
const labelCls = "block text-[10px] font-semibold tracking-[0.18em] text-stone-400 uppercase mb-2";

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', role: 'team_member',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [mounted, setMounted]           = useState(false);
  const { register }                    = useAuth();
  const navigate                        = useNavigate();

  useEffect(() => { setMounted(true); }, []);
  const handleChange = e => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // FIX: Storing the form as a JSX variable instead of an inner component function.
  // This prevents React from destroying and recreating the inputs on every keystroke.
  const formJSX = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Full Name</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
          <input type="text" name="name" value={formData.name} onChange={handleChange}
            placeholder="Your full name" required className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Email address</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
          <input type="email" name="email" value={formData.email} onChange={handleChange}
            placeholder="you@example.com" required className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Phone number</label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
            placeholder="+91 98765 43210" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Role</label>
        <div className="relative">
          <select name="role" value={formData.role} onChange={handleChange}
            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 appearance-none focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/6 transition-all">
            {roleOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300 pointer-events-none" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Password</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
          <input type={showPassword ? 'text' : 'password'} name="password"
            value={formData.password} onChange={handleChange}
            placeholder="Create a strong password" required
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
              Creating account...
            </span>
          ) : 'Create account'}
        </button>
      </div>
    </form>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=Outfit:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-body    { font-family: 'Outfit', sans-serif; }
      `}</style>

      <div className="font-body min-h-screen bg-[#faf9f7]">

        {/* ── MOBILE ── */}
        <div className="lg:hidden flex flex-col min-h-screen">
          <div className="relative flex-shrink-0" style={{ height: '40vh' }}>
            <img src="Login.jpg" alt=""
              className="absolute inset-0 w-full h-full object-cover object-top"
              onError={e => { e.currentTarget.style.display = 'none'; }} />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/25 to-stone-950/55" />
            <div className="absolute inset-0 flex flex-col p-5 z-10">
              <Link to="/" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm w-fit">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
              <div className="mt-4">
                <h1 className="font-display font-bold text-white leading-none text-[3.2rem]">Lagna</h1>
                <p className="font-display italic text-white/60 text-sm mt-2 leading-snug">
                  Join <span className="text-rose-300 not-italic font-semibold">wedding planners</span> who trust Lagna
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-6 py-8 overflow-y-auto">
            <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold text-stone-900">Create your account</h2>
                <p className="mt-1.5 text-stone-400 text-sm">Get started with your wedding planning journey</p>
              </div>
              {error && (
                <div className="mb-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">{error}</div>
              )}
              {/* FIX: Render the JSX variable directly here */}
              {formJSX}
              <p className="mt-6 text-center text-stone-400 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-stone-900 font-semibold hover:underline underline-offset-2">Sign in</Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── DESKTOP ── */}
        <div className="hidden lg:flex max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 min-h-screen flex-row gap-10 py-8">

          {/* Left: image card */}
          <div className="w-[52%] sticky top-8 self-start flex-shrink-0">
            <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
              <img src="Login.jpg" alt=""
                className="absolute inset-0 w-full h-full object-cover object-top"
                onError={e => { e.currentTarget.style.display = 'none'; }} />
              <div className="absolute inset-0 bg-gradient-to-b from-stone-950/72 via-stone-950/20 to-stone-950/55" />
              <div className="absolute inset-0 flex flex-col z-10 p-8 xl:p-10">
                <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm w-fit">
                  <ArrowLeft className="h-4 w-4" /> Back to home
                </Link>
                <div className="mt-1">
                  <h1 className="font-display font-bold text-white leading-none" style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}>
                    <AnimatedLagna />
                  </h1>
                  <p className={`font-display italic text-white/60 text-base mt-3 leading-snug max-w-[22ch]
                    transition-all duration-700 delay-[1100ms]
                    ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    Join wedding planners who trust{' '}
                    <span className="text-rose-300 not-italic font-semibold">Lagna</span>{' '}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="flex-1 flex items-center justify-center py-8">
            <div className={`w-full max-w-xs transition-all duration-700 delay-200
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="mb-7">
                <h2 className="font-display text-3xl font-bold text-stone-900">Create your account</h2>
                <p className="mt-2 text-stone-400 text-sm">Get started with your wedding planning journey</p>
              </div>
              {error && (
                <div className="mb-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">{error}</div>
              )}
              {/* FIX: Render the JSX variable directly here */}
              {formJSX}
              <p className="mt-7 text-center text-stone-400 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-stone-900 font-semibold hover:underline underline-offset-2">Sign in</Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}