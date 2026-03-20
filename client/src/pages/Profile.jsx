import { useState } from 'react';
import { User, Mail, Phone, Lock, Check, AlertCircle, Shield } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useToastStore from '../stores/toastStore';

/* ── Role config ── */
const roleConfig = {
  admin:                { label: 'Administrator',        badge: 'bg-stone-700 text-[#faf9f7]' },
  relationship_manager: { label: 'Relationship Manager', badge: 'bg-stone-200 text-stone-700' },
  team_member:          { label: 'Team Member',          badge: 'bg-stone-100 text-stone-600' },
};

/* ── UI Components ── */
function Field({ label, children, hint }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  );
}

function TextInput({ icon: Icon, ...props }) {
  return (
    <div className="relative group">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300 group-focus-within:text-stone-500 transition-colors pointer-events-none" />}
      <input
        {...props}
        className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 bg-white border border-stone-200/60 rounded-lg text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 transition-all shadow-sm disabled:opacity-50 disabled:bg-stone-50`}
      />
    </div>
  );
}

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const changePassword = useAuthStore((s) => s.changePassword);
  const toast = useToastStore();
  const [activeTab, setActiveTab] = useState('info');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const role = roleConfig[user?.role] || roleConfig.team_member;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(profileForm);
    } catch { /* handled by store/interceptor */ }
    finally { setLoading(false); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } finally { setLoading(false); }
  };

  const tabs = [
    { id: 'info', label: 'Personal Info', icon: User },
    { id: 'password', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7] pb-16">

      {/* ── Header ── */}
      <div className="border-b border-stone-200/60 bg-white/50">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-stone-700 flex items-center justify-center flex-shrink-0">
              <span className="text-[#faf9f7] text-2xl sm:text-3xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {user?.name?.[0]?.toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {user?.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${role.badge}`}>
                  {role.label}
                </span>
              </div>
              <p className="text-stone-400 text-sm mt-1 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10 mt-8">
        <div className="grid lg:grid-cols-[220px_1fr] gap-6 lg:gap-8">

          {/* ── Sidebar tabs ── */}
          <aside>
            <nav className="flex lg:flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium transition-all w-full text-left
                    ${activeTab === tab.id
                      ? 'bg-stone-900 text-[#faf9f7] shadow-sm'
                      : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100/60'
                    }`}
                >
                  <tab.icon size={15} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Content card ── */}
          <main className="bg-white border border-stone-200/60 rounded-lg shadow-sm p-6 sm:p-8">

            {activeTab === 'info' ? (
              <div>
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-stone-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Personal Details
                  </h3>
                  <p className="text-stone-400 text-sm mt-1">Manage your public profile and contact info.</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Full Name">
                      <TextInput icon={User} value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
                    </Field>
                    <Field label="Phone">
                      <TextInput icon={Phone} value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Email Address (Locked)" hint="Contact admin to change login email.">
                    <TextInput icon={Mail} value={user?.email} disabled />
                  </Field>

                  <div className="pt-2">
                    <button type="submit" disabled={loading}
                      className="px-8 py-3 bg-stone-900 text-[#faf9f7] rounded-lg text-sm font-medium hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-stone-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Security
                  </h3>
                  <p className="text-stone-400 text-sm mt-1">Keep your account secure with a strong password.</p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
                  <Field label="Current Password">
                    <TextInput
                      icon={Lock}
                      type="password"
                      placeholder="Enter current password"
                      value={passwordData.currentPassword}
                      onChange={e => setPasswordData(d => ({ ...d, currentPassword: e.target.value }))}
                      required
                    />
                  </Field>
                  <Field label="New Password">
                    <TextInput
                      icon={Lock}
                      type="password"
                      placeholder="Enter new password"
                      value={passwordData.newPassword}
                      onChange={e => setPasswordData(d => ({ ...d, newPassword: e.target.value }))}
                      required
                    />
                  </Field>
                  <Field label="Confirm New Password">
                    <TextInput
                      icon={Lock}
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={e => setPasswordData(d => ({ ...d, confirmPassword: e.target.value }))}
                      required
                    />
                  </Field>

                  <div className="pt-2">
                    <button type="submit" disabled={loading}
                      className="px-8 py-3 bg-stone-900 text-[#faf9f7] rounded-lg text-sm font-medium hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}