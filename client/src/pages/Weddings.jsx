import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Calendar, MapPin, Users,
  ChevronRight, X, ArrowRight
} from 'lucide-react';
import { formatDate, formatCurrency, daysUntil } from '../utils/helpers';
import useAuthStore from '../stores/authStore';
import useWeddingStore from '../stores/weddingStore';

/* ─────────────────────────────────────────
   SHARED PRIMITIVES
───────────────────────────────────────── */
const inputCls = "w-full px-4 py-3 bg-white border border-stone-200/60 shadow-sm rounded-xl text-sm font-body text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all duration-300";
const labelCls = "block text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2 font-body";

function Field({ label, children }) {
  return (
    <div>
      {label && <label className={labelCls}>{label}</label>}
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────
   STATUS META (Premium Palette)
───────────────────────────────────────── */
const statusMeta = {
  planning:    { bar: 'bg-stone-300',   dot: 'bg-stone-300',   text: 'text-stone-500',  label: 'Planning' },
  in_progress: { bar: 'bg-amber-700',   dot: 'bg-amber-700',   text: 'text-amber-700',  label: 'In Progress' },
  completed:   { bar: 'bg-teal-700',    dot: 'bg-teal-700',    text: 'text-teal-700',   label: 'Completed' },
  cancelled:   { bar: 'bg-rose-800',    dot: 'bg-rose-800',    text: 'text-rose-800',   label: 'Cancelled' },
};

function StatusPill({ status }) {
  const m = statusMeta[status] || statusMeta.planning;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-stone-200/60 bg-white shadow-sm text-[9px] font-bold uppercase tracking-[0.2em] ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

/* ─────────────────────────────────────────
   URGENCY CONFIG
───────────────────────────────────────── */
function urgencyLabel(days) {
  if (days === null || days === undefined) return null;
  if (days < 0)   return null;
  if (days === 0) return { text: 'Today',     color: 'text-rose-800 font-bold' };
  if (days <= 3)  return { text: `${days}d`,  color: 'text-amber-700 font-bold' };
  if (days <= 7)  return { text: `${days}d`,  color: 'text-stone-900 font-medium' };
  if (days <= 30) return { text: `${days}d`,  color: 'text-stone-500' };
  return null;
}

/* ─────────────────────────────────────────
   MODAL
───────────────────────────────────────── */
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300">
      <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#faf9f7] rounded-t-2xl sm:rounded-2xl shadow-sm border border-stone-200/60 w-full sm:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200/60 flex-shrink-0">
          <h2 className="font-display text-2xl font-medium tracking-tight text-stone-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-200/50 text-stone-400 hover:text-stone-900 transition-all duration-300">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 font-body">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SKELETON
───────────────────────────────────────── */
function Sk({ className = '' }) {
  return <div className={`bg-stone-200/50 animate-pulse rounded-2xl ${className}`} />;
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function Weddings() {
  const isManager = useAuthStore((s) => s.user?.role === 'relationship_manager' || s.user?.role === 'admin');
  const navigate = useNavigate();
  const { weddings, users, loading, fetchWeddings, createWedding, updateWedding } = useWeddingStore();
  const [showModal, setShowModal]   = useState(false);
  const [editingWedding, setEditingWedding] = useState(null);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');

  const emptyForm = {
    name: '', clientName: '', clientEmail: '', clientPhone: '',
    weddingDate: '', endDate: '',
    venue: { name: '', address: '', city: '' },
    guestCount: '', budget: { estimated: '' },
    relationshipManager: '', notes: ''
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchWeddings(); }, [fetchWeddings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      budget: { estimated: Number(form.budget.estimated) || 0 },
      guestCount: Number(form.guestCount) || 0,
    };
    if (editingWedding) await updateWedding(editingWedding._id, payload);
    else await createWedding(payload);
    closeModal();
  };

  const closeModal = () => { setShowModal(false); setEditingWedding(null); setForm(emptyForm); };

  const filtered = weddings.filter(w => {
    const matchF = filter === 'all' || w.status === filter;
    const matchS = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.clientName?.toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  /* Summary counts */
  const counts = {
    all:         weddings.length,
    planning:    weddings.filter(w => w.status === 'planning').length,
    in_progress: weddings.filter(w => w.status === 'in_progress').length,
    completed:   weddings.filter(w => w.status === 'completed').length,
  };

  const userOpts = users.filter(u => u.role !== 'team_member').map(u => ({ value: u._id, label: u.name }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Cormorant Garamond', serif; letter-spacing: -0.02em; }
        .font-body    { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="font-body min-h-screen bg-[#faf9f7] text-stone-900 selection:bg-stone-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-12">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 border-b border-stone-200/60 pb-8">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-3">Portfolio</p>
              <h1 className="font-display text-4xl sm:text-5xl font-medium text-stone-900">Weddings</h1>
              <p className="text-stone-400 text-sm mt-2 italic">Plan and track every wedding from start to finish.</p>
            </div>
            {isManager && (
              <button onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-[#faf9f7] rounded-full text-sm font-medium hover:bg-stone-800 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md self-start sm:self-auto flex-shrink-0">
                <Plus className="h-4 w-4" /> New Wedding
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><Sk key={i} className="h-28"/>)}</div>
              <Sk className="h-16" />
              <Sk className="h-[500px]" />
            </div>
          ) : (
            <>
              {/* ── Status summary cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                  { id: 'all',         label: 'All Weddings', bar: 'bg-stone-300' },
                  { id: 'planning',    label: 'Planning',     bar: 'bg-stone-400' },
                  { id: 'in_progress', label: 'In Progress',  bar: 'bg-amber-700' },
                  { id: 'completed',   label: 'Completed',    bar: 'bg-teal-700' },
                ].map(s => (
                  <button key={s.id} onClick={() => setFilter(s.id)}
                    className={`bg-white p-6 rounded-2xl shadow-sm border text-left transition-all duration-300 hover:-translate-y-0.5 group ${filter === s.id ? 'border-stone-400 ring-1 ring-stone-400/20' : 'border-stone-200/60'}`}>
                    <div className={`h-[1px] w-8 ${s.bar} mb-4 transition-all duration-500 ${filter === s.id ? 'w-16' : 'group-hover:w-12'}`} />
                    <p className="font-display text-3xl font-medium text-stone-900 leading-none">{counts[s.id]}</p>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mt-3">{s.label}</p>
                  </button>
                ))}
              </div>

              {/* ── Search + filter tabs ── */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300 pointer-events-none" />
                  <input
                    type="text" placeholder="Search weddings..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 text-sm rounded-full bg-white border border-stone-200/60 shadow-sm placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all duration-300"
                  />
                </div>

                <div className="flex gap-1 p-1 bg-white border border-stone-200/60 shadow-sm rounded-full self-start sm:self-auto overflow-x-auto scrollbar-hide">
                  {['all', 'planning', 'in_progress', 'completed'].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                        filter === s ? 'bg-stone-900 text-[#faf9f7]' : 'text-stone-400 hover:text-stone-900'
                      }`}>
                      {s === 'all' ? 'All' : statusMeta[s]?.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Count ── */}
              <p className="text-xs text-stone-400 mb-6 italic border-b border-stone-200/60 pb-4 inline-block">
                Displaying {filtered.length} wedding{filtered.length !== 1 ? 's' : ''}
              </p>

              {/* ── Weddings table ── */}
              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm py-20 text-center">
                  <p className="text-stone-400 text-sm italic">No weddings found matching criteria.</p>
                  {isManager && !search && filter === 'all' && (
                    <button onClick={() => setShowModal(true)}
                      className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold tracking-[0.1em] text-stone-400 uppercase hover:text-stone-900 transition-colors duration-300">
                      <Plus className="h-3.5 w-3.5" /> Create your first wedding
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone-100/60 bg-[#faf9f7]/50">
                          {['Wedding', 'Target Date', 'Venue', 'Guests', 'Budget', 'Progress', 'Status', ''].map((h, i) => (
                            <th key={h+i} className={`text-left px-6 py-5 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase whitespace-nowrap
                              ${h === 'Venue'  ? 'hidden lg:table-cell' : ''}
                              ${h === 'Guests' ? 'hidden md:table-cell' : ''}
                              ${h === 'Budget' ? 'hidden lg:table-cell' : ''}
                              ${h === 'Progress' ? 'hidden sm:table-cell' : ''}
                            `}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100/60">
                        {filtered.map(wedding => {
                          const days    = daysUntil(wedding.weddingDate);
                          const urgency = urgencyLabel(days);
                          const prog    = wedding.progress || 0;
                          const m       = statusMeta[wedding.status] || statusMeta.planning;

                          return (
                            <tr
                              key={wedding._id}
                              onClick={() => navigate(`/weddings/${wedding._id}`)}
                              className="cursor-pointer hover:bg-[#faf9f7] transition-colors duration-300 group"
                            >
                              {/* Wedding name */}
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-4">
                                  <div className={`w-[2px] h-8 rounded-full flex-shrink-0 ${m.bar} opacity-60 group-hover:opacity-100 transition-opacity`} />
                                  <div>
                                    <p className="font-medium text-stone-900 text-sm group-hover:translate-x-0.5 transition-transform duration-300">{wedding.name}</p>
                                    <p className="text-xs text-stone-400 mt-1 italic">{wedding.clientName}</p>
                                  </div>
                                </div>
                              </td>

                              {/* Date */}
                              <td className="px-6 py-5">
                                <p className={`text-sm ${urgency ? urgency.color : 'text-stone-500'}`}>
                                  {formatDate(wedding.weddingDate)}
                                </p>
                                {urgency && (
                                  <p className={`text-[10px] font-bold tracking-wide uppercase mt-1.5 ${urgency.color}`}>
                                    {days === 0 ? 'Today' : `In ${days} day${days !== 1 ? 's' : ''}`}
                                  </p>
                                )}
                              </td>

                              {/* Venue */}
                              <td className="px-6 py-5 hidden lg:table-cell">
                                {wedding.venue?.name ? (
                                  <div>
                                    <p className="text-sm text-stone-600">{wedding.venue.name}</p>
                                    {wedding.venue.city && <p className="text-xs text-stone-400 mt-1">{wedding.venue.city}</p>}
                                  </div>
                                ) : <span className="text-stone-300 text-sm">—</span>}
                              </td>

                              {/* Guests */}
                              <td className="px-6 py-5 hidden md:table-cell">
                                {wedding.guestCount > 0
                                  ? <span className="text-sm text-stone-600">{wedding.guestCount.toLocaleString()}</span>
                                  : <span className="text-stone-300 text-sm">—</span>}
                              </td>

                              {/* Budget */}
                              <td className="px-6 py-5 hidden lg:table-cell">
                                {wedding.budget?.estimated > 0
                                  ? <span className="text-sm font-medium text-stone-900">{formatCurrency(wedding.budget.estimated)}</span>
                                  : <span className="text-stone-300 text-sm">—</span>}
                              </td>

                              {/* Progress */}
                              <td className="px-6 py-5 hidden sm:table-cell">
                                <div className="w-24 space-y-2">
                                  <div className="flex justify-between text-[10px] font-bold tracking-[0.1em] text-stone-400">
                                    <span>Allocated</span>
                                    <span>{prog}%</span>
                                  </div>
                                  <div className="h-[2px] w-full bg-stone-100/60 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-1000 ease-out ${m.bar}`}
                                      style={{ width: `${prog}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="px-6 py-5">
                                <StatusPill status={wedding.status} />
                              </td>

                              {/* Arrow */}
                              <td className="px-6 py-5 text-right">
                                <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-900 transition-colors inline-block" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ════════════════════
          WEDDING MODAL
      ════════════════════ */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingWedding ? 'Edit Wedding Details' : 'Create New Wedding'}>
        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="grid grid-cols-2 gap-5">
            <Field label="Wedding Name">
              <input type="text" value={form.name} placeholder="e.g. Sharma-Gupta Wedding" required
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Primary Client Name">
              <input type="text" value={form.clientName} placeholder="Client's full name" required
                onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Client Email">
              <input type="email" value={form.clientEmail} placeholder="client@email.com"
                onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Client Phone">
              <input type="tel" value={form.clientPhone} placeholder="+91 98765 43210"
                onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-5 border-t border-stone-100/60 pt-5">
            <Field label="Target Wedding Date">
              <input type="date" value={form.weddingDate} required
                onChange={e => setForm(f => ({ ...f, weddingDate: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="End Date (Multi-day)">
              <input type="date" value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-5 border-t border-stone-100/60 pt-5">
            <Field label="Primary Venue">
              <input type="text" value={form.venue.name} placeholder="Venue name"
                onChange={e => setForm(f => ({ ...f, venue: { ...f.venue, name: e.target.value } }))} className={inputCls} />
            </Field>
            <Field label="Address">
              <input type="text" value={form.venue.address} placeholder="Street address"
                onChange={e => setForm(f => ({ ...f, venue: { ...f.venue, address: e.target.value } }))} className={inputCls} />
            </Field>
            <Field label="City">
              <input type="text" value={form.venue.city} placeholder="City"
                onChange={e => setForm(f => ({ ...f, venue: { ...f.venue, city: e.target.value } }))} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <Field label="Estimated Guests">
              <input type="number" value={form.guestCount} placeholder="200"
                onChange={e => setForm(f => ({ ...f, guestCount: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Total Budget Target">
              <input type="number" value={form.budget.estimated} placeholder="500000"
                onChange={e => setForm(f => ({ ...f, budget: { ...f.budget, estimated: e.target.value } }))} className={inputCls} />
            </Field>
            <Field label="Assigned Planner">
              <select value={form.relationshipManager}
                onChange={e => setForm(f => ({ ...f, relationshipManager: e.target.value }))}
                className={`${inputCls} appearance-none`}>
                <option value="">Select planner</option>
                {userOpts.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Internal Notes">
            <textarea value={form.notes} placeholder="Aesthetic preferences, family details, priorities..." rows={3}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className={`${inputCls} resize-none`} />
          </Field>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-stone-200/60 mt-4">
            <button type="button" onClick={closeModal}
              className="px-6 py-3 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 border border-stone-200/60 hover:border-stone-400 transition-all duration-300">
              Cancel
            </button>
            <button type="submit"
              className="px-8 py-3 rounded-full text-sm font-medium bg-stone-900 text-[#faf9f7] hover:bg-stone-800 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              {editingWedding ? 'Save Changes' : 'Create Wedding'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}