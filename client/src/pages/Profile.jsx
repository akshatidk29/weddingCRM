import { useState } from 'react';
import { User, Mail, Phone, Lock, Check, AlertCircle, ChevronRight, MapPin, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

/* ── Role config ── */
const roleConfig = {
  admin: { label: 'Administrator', badge: 'bg-rose-50 text-rose-600 border-rose-100' },
  relationship_manager: { label: 'Relationship Manager', badge: 'bg-amber-50 text-amber-600 border-amber-100' },
  team_member: { label: 'Team Member', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
};

/* ── UI Components ── */
function Field({ label, children, hint }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-stone-400 italic">{hint}</p>}
    </div>
  );
}

function TextInput({ icon: Icon, ...props }) {
  return (
    <div className="relative group">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300 group-focus-within:text-stone-600 transition-colors pointer-events-none" />}
      <input
        {...props}
        className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-900/5 transition-all disabled:opacity-60`}
      />
    </div>
  );
}

function StatusBanner({ type, text }) {
  if (!text) return null;
  const isSuccess = type === 'success';
  return (
    <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-sm border animate-in fade-in slide-in-from-top-2 ${isSuccess ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
      {isSuccess ? <Check size={18} /> : <AlertCircle size={18} />}
      {text}
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '', location: 'Mumbai, India' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const role = roleConfig[user?.role] || roleConfig.team_member;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await api.put('/auth/profile', profileForm);
      setMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update profile.' });
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Outfit:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .font-body { font-family: 'Outfit', sans-serif; }
      `}</style>

      <div className="font-body min-h-screen bg-[#faf9f7] pb-20">

        {/* ── TOP HERO IMAGE SECTION ── */}
        <div className="relative h-[300px] sm:h-[350px] w-full overflow-hidden bg-[#faf9f7]">
          <img
            src="image.png"
            // 90% anchors the focus near the bottom, but keeps a small margin of the very bottom visible/safe.
            className="h-full w-full object-cover object-[center_70%] bg-[#faf9f7]"
            alt="Cover"
          />
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

          {/* "Your Account" Bottom Left of Image */}
          <div className="absolute bottom-0 left-0 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pb-10 sm:pb-16">
            <h1 className="font-display text-4xl sm:text-6xl text-white drop-shadow-md">
              Your Account
            </h1>
          </div>
        </div>

        {/* ── MAIN CONTENT AREA ── */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 -mt-8 sm:-mt-12 relative z-10">
          <div className="grid lg:grid-cols-[300px_1fr] gap-8">

            {/* ── SIDEBAR ── */}
            <aside className="space-y-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-stone-200/50 overflow-hidden">
                {/* User Info */}
                <div className="p-8 text-center border-b border-stone-100">
                  <div className="relative inline-block mb-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-100 to-orange-50 p-1 shadow-inner">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-display text-3xl text-rose-500 font-bold">
                        {user?.name?.[0]}
                      </div>
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-stone-100 text-stone-400 hover:text-stone-900 transition-colors">
                      <Camera size={14} />
                    </button>
                  </div>
                  <h2 className="font-display text-xl font-bold text-stone-900">{user?.name}</h2>
                  <p className="text-stone-400 text-sm mb-4">{user?.email}</p>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider `}>
                    {role.label}
                  </span>
                </div>

                {/* Tabs Nav */}
                <nav className="p-2">
                  {[
                    { id: 'info', label: 'Personal Info', icon: User },
                    { id: 'password', label: 'Security', icon: Lock }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-medium transition-all ${activeTab === tab.id
                          ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20'
                          : 'text-stone-500 hover:bg-stone-50'
                        }`}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* ── CONTENT CARD ── */}
            <main className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 sm:p-10">

              {activeTab === 'info' ? (
                <div className="animate-in fade-in duration-500">
                  <div className="mb-10">
                    <h3 className="text-2xl font-display font-bold text-stone-900">Personal Details</h3>
                    <p className="text-stone-400 text-sm mt-1">Manage your public profile and contact info.</p>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="grid gap-8">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <Field label="Full Name"><TextInput icon={User} value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} /></Field>
                      <Field label="Phone"><TextInput icon={Phone} value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} /></Field>
                    </div>
                    <Field label="Email Address (Locked)" hint="Contact admin to change login email.">
                      <TextInput icon={Mail} value={user?.email} disabled />
                    </Field>
                    <StatusBanner {...msg} />

                    <button type="submit" disabled={loading} className="w-fit px-10 py-4 bg-stone-900 text-white rounded-full font-bold hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50">
                      {loading ? 'Saving Changes...' : 'Save Settings'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="animate-in fade-in duration-500">
                  <div className="mb-10">
                    <h3 className="text-2xl font-display font-bold text-stone-900">Security</h3>
                    <p className="text-stone-400 text-sm mt-1">Keep your account secure with a strong password.</p>
                  </div>
                  {/* Password Form Logic here as per previous code... */}
                  <form className="grid gap-6 max-w-md">
                    <Field label="Current Password"><TextInput icon={Lock} type="password" /></Field>
                    <Field label="New Password"><TextInput icon={Lock} type="password" /></Field>
                    <Field label="Confirm New Password"><TextInput icon={Lock} type="password" /></Field>
                    <button className="w-fit px-10 py-4 bg-stone-900 text-white rounded-full font-bold">Update Password</button>
                  </form>
                </div>
              )}

            </main>
          </div>
        </div>
      </div>
    </>
  );
}