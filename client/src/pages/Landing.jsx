import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, Heart,
  BarChart3, Shield, ChevronDown, Calendar
} from 'lucide-react';

/* ─────────────────────────────────────────
   UTILITY: Fade-in on scroll
───────────────────────────────────────── */
function FadeIn({ children, className = '', delay = 0, direction = 'up' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTimeout(() => setVisible(true), delay); },
      { threshold: 0.12 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  const translate =
    direction === 'up' ? 'translate-y-10' :
      direction === 'left' ? '-translate-x-10' :
        'translate-x-10';

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${translate}`
        } ${className}`}
    >
      {children}
    </div>
  );
}

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

  return (
    <h1
      className="font-display leading-[0.88] text-stone-900 mb-6"
      style={{ fontSize: 'clamp(2.5rem, 9vw, 8rem)', fontWeight: 700, minHeight: '1.1em' }}
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
  );
}
/* ─────────────────────────────────────────
   MAIN
───────────────────────────────────────── */
export default function Landing() {
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  const features = [
    {
      tag: 'Lead Management',
      headline: 'Never lose a lead again.',
      body: 'Capture every inquiry, track conversations, and move prospects through your pipeline with ease. Know exactly where every couple stands from first hello to signed contract.',
      img: '3.png',
      imgAlt: 'Lead pipeline view',
      flip: false,
    },
    {
      tag: 'Wedding Planning',
      headline: 'Every detail, one place.',
      body: 'From guest count to floral themes, Aayojan keeps all wedding details beautifully organised. Assign tasks, set milestones, and deliver a flawless experience every time.',
      img: '2.png',
      imgAlt: 'Wedding detail view',
      flip: true,
    },
    {
      tag: 'Vendor Network',
      headline: 'Your go to vendors, always at hand.',
      body: 'Build your trusted vendor directory. Rate performance, track payments, and instantly know who to call for any occasion.',
      img: '4.png',
      imgAlt: 'Vendor network view',
      flip: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7] overflow-x-hidden">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=Outfit:wght@300;400;500;600&display=swap');
        *, body { font-family: 'Outfit', sans-serif; }
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
      `}</style>

      {/* ══════════════════════
          HERO
      ══════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-rose-50/60 via-[#faf9f7] to-amber-50/40" />
        <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full bg-linear-to-bl from-rose-50/80 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 w-full pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">

            {/* Left — text */}
            <div>

              <AnimatedAayojan />

              <div className={`transition-all duration-700 delay-820 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                <p className="font-display italic text-xl sm:text-2xl text-stone-500 mb-4 leading-snug">
                  The modern CRM for{' '}
                  <span className="text-rose-400 not-italic font-bold">wedding planners</span>{' '}
                  who mean business.
                </p>
                <p className="text-stone-400 text-sm sm:text-base leading-relaxed max-w-sm">
                  Manage leads, plan weddings, coordinate vendors, all from one beautifully
                  crafted platform built for the Indian wedding industry.
                </p>
              </div>

              <div className={`flex flex-wrap gap-3 mt-9 transition-all duration-700 delay-1050 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 px-7 py-3.5 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all hover:shadow-lg hover:shadow-stone-900/20"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-stone-600 text-sm font-medium rounded-full border border-stone-200 hover:border-stone-400 transition-colors"
                >
                  See how it works
                </a>
              </div>

            </div>

            {/* Right — image */}
            <div className={`transition-all duration-1000 delay-600 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="relative">
                {/* Soft Glow Background - Adjusted to be more subtle for a floating image */}
                <div className="absolute -inset-10 bg-linear-to-br from-rose-200/30 to-blue-100/20 rounded-full blur-3xl opacity-60" />

                <div className="relative flex items-center justify-center">
                  <img
                    src="1.png"
                    alt="Aayojan dashboard"
                    /* 1. Changed object-cover to object-contain to prevent cropping.
                       2. Removed fixed aspect ratio to let the image's natural shape lead.
                       3. Removed the border and shadow from this specific wrapper to let the image 'float'.
                    */
                    className="w-full h-auto max-h-125 rounded-2xl border border-stone-200/60 object-contain drop-shadow-2xl"
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }}
                  />

                  {/* Fallback Placeholder */}
                  <div
                    className="w-full aspect-4/3 bg-linear-to-br from-rose-50 to-amber-50/40 rounded-2xl items-center justify-center text-stone-400 text-xs text-center p-8 border border-dashed border-stone-200"
                    style={{ display: 'none' }}
                  >
                    Dashboard Preview
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-stone-300">
          <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </div>
      </section>

      {/* ══════════════════════
          HOW IT WORKS
          Dark bg preserved, interior redesigned
      ══════════════════════ */}
      <section className="py-24 sm:py-32 bg-stone-900 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <FadeIn>
            <div className="mb-16 sm:mb-20">
              <span className="text-[10px] font-semibold tracking-[0.22em] text-rose-400 uppercase">
                How it works
              </span>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mt-3 leading-tight">
                Simple as saying{' '}
                <span className="italic text-rose-300">"I do."</span>
              </h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3">
            {[
              {
                num: '01',
                title: 'Capture every lead',
                desc: 'Import contacts or capture new inquiries instantly. Every touchpoint logged from first hello to signed contract.',
                numColor: 'text-rose-400',
                bar: 'bg-rose-500',
              },
              {
                num: '02',
                title: 'Plan & coordinate',
                desc: 'Convert leads to weddings. Manage tasks, vendors, timelines, and guest details.',
                numColor: 'text-amber-400',
                bar: 'bg-amber-500',
              },
              {
                num: '03',
                title: 'Deliver & grow',
                desc: 'Execute flawlessly, delight couples, and grow through referrals and smart business insights.',
                numColor: 'text-emerald-400',
                bar: 'bg-emerald-500',
              },
            ].map((item, i) => (
              <FadeIn key={item.num} delay={i * 130}>
                <div className={`py-10 md:py-0 md:px-10 ${i !== 0 ? 'border-t border-white/10 md:border-t-0 md:border-l md:border-white/10' : ''}`}>
                  <div className={`font-display text-7xl sm:text-8xl font-bold leading-none mb-5 ${item.numColor} opacity-25`}>
                    {item.num}
                  </div>
                  <div className={`h-px w-8 ${item.bar} mb-5 rounded-full`} />
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-stone-400 leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════
          FEATURES
      ══════════════════════ */}
      <section id="features" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <FadeIn>
            <div className="text-center mb-16 sm:mb-24">
              <span className="text-[10px] font-semibold tracking-[0.22em] text-rose-400 uppercase">Features</span>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mt-3">
                Built for planners,{' '}
                <span className="italic text-stone-400">by planners.</span>
              </h2>
            </div>
          </FadeIn>

          <div className="space-y-20 sm:space-y-32">
            {features.map((f) => (
              <div
                key={f.tag}
                className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center"
              >
                <FadeIn
                  delay={100}
                  direction={f.flip ? 'right' : 'left'}
                  className={f.flip ? 'lg:order-2' : ''}
                >
                  <div>
                    <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 mt-5 mb-4 leading-tight">
                      {f.headline}
                    </h3>
                    <p className="text-stone-500 text-base sm:text-lg leading-relaxed">
                      {f.body}
                    </p>
                  </div>
                </FadeIn>

                <FadeIn
                  delay={200}
                  direction={f.flip ? 'left' : 'right'}
                  className={f.flip ? 'lg:order-1' : ''}
                >
                  <div className="relative">
                    <div className="absolute -inset-4 bg-linear-to-br from-rose-100/30 to-amber-100/20 rounded-2xl blur-xl" />
                    <div className="relative rounded-2xl overflow-hidden border border-stone-100 shadow-xl shadow-stone-900/5">
                      <img
                        src={f.img}
                        alt={f.imgAlt}
                        className="w-full object-cover"
                        style={{ aspectRatio: '16/10' }}
                        onError={e => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div
                        className="w-full bg-linear-to-br from-stone-50 to-rose-50/30 items-center justify-center text-stone-300 text-xs text-center p-8"
                        style={{ aspectRatio: '16/10', display: 'none' }}
                      >
                        Place screenshot at {f.img}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════
          EVERYTHING ELSE — coloured bars only, no emoji
      ══════════════════════ */}
      {/* ══════════════════════
    EVERYTHING ELSE — Modernized Bento Grid
    ══════════════════════ */}
      <section className="py-24 sm:py-32 bg-stone-50/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <FadeIn>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div className="max-w-2xl">
                <h2 className="font-display text-4xl sm:text-6xl font-bold text-stone-900 tracking-tight leading-none mb-6">
                  Everything else <br /> <span className="text-stone-400">you need</span>
                </h2>
                <p className="text-stone-500 text-lg">
                  Powerful tools designed to stay out of your way and let you focus on what matters.
                </p>
              </div>
              <div className="hidden md:block h-px flex-1 bg-stone-200 mx-12 mb-4" />
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'Calendar & Timeline', desc: 'Visual timelines for every wedding. Never double book, never miss a deadline.', bar: 'bg-rose-500' },
              { label: 'Role Based Access', desc: 'Admins, managers, coordinators, everyone sees exactly what they need.', bar: 'bg-amber-500' },
              { label: 'Analytics', desc: 'Track conversions, revenue, and team performance at a glance.', bar: 'bg-emerald-500' },
              { label: 'Client Communication', desc: 'Log calls, emails, and notes. Every client conversation in one thread.', bar: 'bg-sky-500' },
              { label: 'Custom Tags', desc: 'Organise leads and weddings your way with flexible tagging and filters.', bar: 'bg-violet-500' },
              { label: 'Follow-up Reminders', desc: 'Automated reminders so no lead goes cold and no task is forgotten.', bar: 'bg-stone-900' },
            ].map((item, i) => (
              <FadeIn key={item.label} delay={i * 100}>
                <div className="group relative bg-white border border-stone-200/60 p-8 rounded-3xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-500 h-full flex flex-col justify-between overflow-hidden">

                  {/* Background Subtle Gradient Glow */}
                  <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${item.bar}`} />

                  <div>
                    {/* Feature Numbering (Sleek Modern Detail) */}
                    <span className="block text-[10px] font-bold tracking-[0.2em] text-stone-300 uppercase mb-8">
                      0{i + 1} // Feature
                    </span>

                    <h4 className="text-xl font-bold text-stone-900 mb-3 tracking-tight">
                      {item.label}
                    </h4>
                    <p className="text-stone-500 text-sm leading-relaxed max-w-60">
                      {item.desc}
                    </p>
                  </div>

                  {/* The Animated Bar - Now sits at the bottom for a "foundation" look */}
                  <div className="mt-10">
                    <div className="w-full h-px bg-stone-100 relative overflow-hidden">
                      <div
                        className={`absolute inset-0 w-0 group-hover:w-full h-full ${item.bar} transition-all duration-700 ease-out`}
                      />
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════
          CTA
      ══════════════════════ */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-rose-50 via-amber-50 to-[#faf9f7]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <FadeIn>
            <span className="text-[10px] font-semibold tracking-[0.22em] text-rose-500 uppercase">Get started</span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mt-4 mb-6 leading-tight">
              Ready to plan your{' '}
              <span className="italic text-rose-400">next great wedding?</span>
            </h2>
            <p className="text-stone-500 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Join wedding planners across India who trust Aayojan to run their business.
              Start free.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-full font-semibold text-sm sm:text-base hover:bg-stone-800 transition-all hover:shadow-xl hover:shadow-stone-900/20"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
