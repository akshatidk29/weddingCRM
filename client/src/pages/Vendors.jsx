import { useState, useEffect } from 'react';
import {
  Plus, Search, Phone, Mail, MapPin, Star,
  Edit, Trash, ChevronDown, ChevronRight, X, Check
} from 'lucide-react';
import { vendorCategories } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

/* ─────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────── */
const inputCls = "w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5 transition-all";
const labelCls = "block text-[10px] font-semibold tracking-[0.18em] text-stone-400 uppercase mb-2";

function Field({ label, children }) {
  return <div>{label && <label className={labelCls}>{label}</label>}{children}</div>;
}

/* ─────────────────────────────────────────
   CATEGORY META
───────────────────────────────────────── */
const categoryMeta = {
  catering:     { bar: 'bg-amber-400',   label: 'Catering' },
  decor:        { bar: 'bg-rose-400',    label: 'Decor' },
  photography:  { bar: 'bg-stone-600',   label: 'Photography' },
  videography:  { bar: 'bg-stone-400',   label: 'Videography' },
  music:        { bar: 'bg-violet-400',  label: 'Music' },
  makeup:       { bar: 'bg-pink-400',    label: 'Makeup' },
  venue:        { bar: 'bg-sky-400',     label: 'Venue' },
  transport:    { bar: 'bg-emerald-400', label: 'Transport' },
  invitation:   { bar: 'bg-orange-400',  label: 'Invitation' },
  other:        { bar: 'bg-stone-300',   label: 'Other' },
};

const priceLabels = { budget: '₹', moderate: '₹₹', premium: '₹₹₹', luxury: '₹₹₹₹' };
const priceColors = { budget: 'text-stone-400', moderate: 'text-amber-500', premium: 'text-orange-500', luxury: 'text-rose-500' };

/* ─────────────────────────────────────────
   STAR DISPLAY
───────────────────────────────────────── */
function StarRating({ value }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < value ? 'bg-amber-400' : 'bg-stone-200'}`} />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)} className="p-0.5">
          <Star className={`w-5 h-5 transition-colors ${s <= value ? 'text-amber-400 fill-amber-400' : 'text-stone-200 hover:text-stone-300'}`} />
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   MODAL
───────────────────────────────────────── */
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#faf9f7] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 flex-shrink-0">
          <h2 className="font-display text-xl font-bold text-stone-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   VENDOR ROW (expanded detail)
───────────────────────────────────────── */
function VendorRow({ vendor, onEdit, onDelete, isManager }) {
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks]       = useState(null); // null = not loaded
  const [events, setEvents]     = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const m = categoryMeta[vendor.category] || categoryMeta.other;

  const loadTasks = async () => {
    if (tasks !== null) return;
    setLoadingTasks(true);
    try {
      const [tr, er] = await Promise.all([
        api.get(`/tasks/by-vendor/${vendor._id}`),
        api.get(`/vendors/${vendor._id}/linked-events`),
      ]);
      setTasks(tr.data.tasks || []);
      setEvents(er.data.events || []);
    } catch { setTasks([]); }
    finally { setLoadingTasks(false); }
  };

  const toggleExpand = () => {
    if (!expanded) loadTasks();
    setExpanded(e => !e);
  };

  const totalAmt = (tasks || []).reduce((s, t) => s + Math.abs(t.taskVendors?.find(tv => tv.vendor?._id === vendor._id)?.amount || 0), 0);
  const paidAmt  = (tasks || []).reduce((s, t) => s + Math.abs(t.taskVendors?.find(tv => tv.vendor?._id === vendor._id)?.paidAmount || 0), 0);

  return (
    <div className={`border-b border-stone-50 last:border-0 transition-colors ${expanded ? 'bg-stone-50/40' : 'hover:bg-stone-50/60'}`}>
      {/* ── Main row ── */}
      <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={toggleExpand}>
        {/* Expand toggle */}
        <div className="flex-shrink-0 text-stone-300">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>

        {/* Name + contact */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-stone-900 text-sm">{vendor.name}</p>
            {vendor.contactPerson && (
              <span className="text-xs text-stone-400">· {vendor.contactPerson}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {vendor.phone && (
              <span className="text-xs text-stone-400 flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" />{vendor.phone}
              </span>
            )}
            {vendor.city && (
              <span className="text-xs text-stone-400 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />{vendor.city}
              </span>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="hidden sm:block flex-shrink-0">
          <StarRating value={vendor.rating} />
        </div>

        {/* Price */}
        <span className={`text-sm font-bold flex-shrink-0 hidden sm:block ${priceColors[vendor.priceRange] || 'text-stone-400'}`}>
          {priceLabels[vendor.priceRange]}
        </span>

        {/* Payment pill (if has tasks) */}
        {totalAmt > 0 && (
          <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
            <div className="w-12 h-0.5 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full"
                style={{ width: `${Math.min(100, totalAmt ? (paidAmt / totalAmt) * 100 : 0)}%` }} />
            </div>
            <span className="text-[10px] text-stone-400">₹{paidAmt.toLocaleString()}/₹{totalAmt.toLocaleString()}</span>
          </div>
        )}

        {/* Actions */}
        {isManager && (
          <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => onEdit(vendor)}
              className="p-1.5 rounded-lg text-stone-300 hover:text-stone-700 hover:bg-stone-100 transition-all">
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(vendor._id)}
              className="p-1.5 rounded-lg text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
              <Trash className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="px-5 pb-5 ml-8 space-y-4">
          {/* Contact + events strip */}
          <div className="flex flex-wrap gap-4">
            {vendor.email && (
              <span className="text-xs text-stone-500 flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-stone-300" />{vendor.email}
              </span>
            )}
            {vendor.address && (
              <span className="text-xs text-stone-500 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-stone-300" />{vendor.address}
              </span>
            )}
            {events.map(ev => (
              <span key={ev._id} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-stone-100 text-stone-500">
                {ev.name}
              </span>
            ))}
          </div>

          {/* Notes */}
          {vendor.notes && (
            <p className="text-xs text-stone-400 italic leading-relaxed">{vendor.notes}</p>
          )}

          {/* Tasks */}
          {loadingTasks ? (
            <div className="h-1 w-16 bg-stone-100 animate-pulse rounded-full" />
          ) : tasks && tasks.length > 0 ? (
            <div>
              <p className={`${labelCls} mb-3`}>Linked Tasks</p>

              {/* Payment summary */}
              {totalAmt > 0 && (
                <div className="flex items-center gap-4 mb-3 px-4 py-3 bg-white rounded-xl border border-stone-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400">Total</span>
                    <span className="font-semibold text-stone-800">₹{totalAmt.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400">Paid</span>
                    <span className="font-semibold text-emerald-600">₹{paidAmt.toLocaleString()}</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${Math.min(100, totalAmt ? (paidAmt / totalAmt) * 100 : 0)}%` }} />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {tasks.map(task => {
                  const ve = task.taskVendors?.find(tv => tv.vendor?._id === vendor._id);
                  if (!ve) return null;
                  const done = ve.status === 'completed';
                  return (
                    <div key={task._id} className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-stone-100">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-400 border-emerald-400' : 'border-stone-300'}`}>
                        {done && <Check className="w-2 h-2 text-white" />}
                      </div>
                      <span className={`text-xs flex-1 ${done ? 'text-stone-300 line-through' : 'text-stone-700'}`}>{task.title}</span>
                      {task.wedding?.name && <span className="text-[10px] text-stone-400 truncate max-w-[100px]">{task.wedding.name}</span>}
                      {ve.amount > 0 && (
                        <span className={`text-[10px] font-semibold flex-shrink-0 ${
                          ve.paymentStatus === 'completed' ? 'text-emerald-500' :
                          ve.paymentStatus === 'partial' ? 'text-amber-500' : 'text-stone-400'
                        }`}>₹{Math.abs(ve.amount).toLocaleString()}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : tasks && tasks.length === 0 ? (
            <p className="text-xs text-stone-300">No tasks linked to this vendor</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   SKELETON
───────────────────────────────────────── */
function Sk({ className = '' }) {
  return <div className={`bg-stone-100 animate-pulse rounded-xl ${className}`} />;
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function Vendors() {
  const { isManager }               = useAuth();
  const [vendors, setVendors]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [search, setSearch]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const emptyForm = {
    name: '', category: 'other', contactPerson: '', email: '', phone: '',
    address: '', city: '', rating: 3, priceRange: 'moderate', notes: ''
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadVendors(); }, []);

  const loadVendors = async () => {
    try { const r = await api.get('/vendors'); setVendors(r.data.vendors); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) await api.put(`/vendors/${editingVendor._id}`, form);
      else await api.post('/vendors', form);
      loadVendors(); closeModal();
    } catch (e) { console.error(e); }
  };

  const openEdit = (vendor) => {
    setEditingVendor(vendor);
    setForm({
      name: vendor.name, category: vendor.category,
      contactPerson: vendor.contactPerson || '', email: vendor.email || '',
      phone: vendor.phone || '', address: vendor.address || '',
      city: vendor.city || '', rating: vendor.rating || 3,
      priceRange: vendor.priceRange || 'moderate', notes: vendor.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this vendor?')) return;
    try { await api.delete(`/vendors/${id}`); loadVendors(); } catch {}
  };

  const closeModal = () => { setShowModal(false); setEditingVendor(null); setForm(emptyForm); };

  /* ── Category counts ── */
  const categoryCounts = vendors.reduce((acc, v) => {
    acc[v.category] = (acc[v.category] || 0) + 1;
    return acc;
  }, {});

  /* Active categories (ones that have vendors) */
  const activeCategories = vendorCategories.filter(c => categoryCounts[c.value]);

  /* Filtered vendors for selected category + search */
  const filtered = vendors.filter(v => {
    const matchCat = selectedCategory === 'all' || v.category === selectedCategory;
    const matchSearch = !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
      v.city?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const currentMeta = selectedCategory !== 'all' ? (categoryMeta[selectedCategory] || categoryMeta.other) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=Outfit:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-body    { font-family: 'Outfit', sans-serif; }
      `}</style>

      <div className="font-body min-h-screen bg-[#faf9f7]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-10">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.22em] text-rose-400 uppercase mb-2">Directory</p>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-stone-900">Vendors</h1>
              <p className="text-stone-400 text-sm mt-2">Manage your trusted vendor network.</p>
            </div>
            {isManager && (
              <button onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full text-sm font-semibold hover:bg-stone-800 transition-all hover:shadow-lg hover:shadow-stone-900/20 self-start sm:self-auto flex-shrink-0">
                <Plus className="h-4 w-4" /> Add Vendor
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
              <div className="space-y-2">{[...Array(7)].map((_,i)=><Sk key={i} className="h-12"/>)}</div>
              <div className="space-y-3"><Sk className="h-14"/>{[...Array(5)].map((_,i)=><Sk key={i} className="h-16"/>)}</div>
            </div>
          ) : vendors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-100 py-20 text-center">
              <p className="text-stone-300 text-sm">No vendors yet</p>
              {isManager && (
                <button onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-1.5 mt-3 text-xs text-stone-400 hover:text-stone-700 transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Add your first vendor
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">

              {/* ── LEFT: Category sidebar ── */}
              <nav className="bg-white rounded-2xl border border-stone-100 overflow-hidden lg:sticky lg:top-6">
                {/* All */}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-sm transition-colors border-b border-stone-50 ${
                    selectedCategory === 'all'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <span className="font-medium">All Vendors</span>
                  <span className={`text-xs font-semibold ${selectedCategory === 'all' ? 'text-white/60' : 'text-stone-400'}`}>
                    {vendors.length}
                  </span>
                </button>

                {/* Per category */}
                {activeCategories.map(cat => {
                  const m     = categoryMeta[cat.value] || categoryMeta.other;
                  const count = categoryCounts[cat.value] || 0;
                  const active = selectedCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-stone-50 last:border-0 ${
                        active
                          ? 'bg-stone-50 text-stone-900'
                          : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50/60'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.bar}`} />
                      <span className={`flex-1 text-left ${active ? 'font-semibold' : 'font-medium'}`}>{m.label}</span>
                      <span className={`text-xs ${active ? 'text-stone-500 font-semibold' : 'text-stone-300'}`}>{count}</span>
                    </button>
                  );
                })}
              </nav>

              {/* ── RIGHT: Vendor list ── */}
              <div>
                {/* Search + heading */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300 pointer-events-none" />
                    <input
                      type="text" placeholder="Search vendors..."
                      value={search} onChange={e => setSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl bg-white border border-stone-200 placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5 transition-all"
                    />
                  </div>
                  <p className="text-xs text-stone-400 flex-shrink-0">
                    {filtered.length} vendor{filtered.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Category heading with accent bar */}
                {currentMeta && (
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-stone-100">
                    <div className={`h-0.5 w-8 rounded-full ${currentMeta.bar}`} />
                    <span className="font-display text-2xl font-bold text-stone-900">{currentMeta.label}</span>
                  </div>
                )}

                {/* Vendor rows */}
                {filtered.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-stone-100 py-14 text-center">
                    <p className="text-stone-300 text-sm">No vendors match your search</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden group">
                    {filtered.map(vendor => (
                      <VendorRow
                        key={vendor._id}
                        vendor={vendor}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        isManager={isManager}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════ MODAL ════════════ */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingVendor ? 'Edit Vendor' : 'Add Vendor'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vendor Name">
              <input type="text" value={form.name} required placeholder="e.g. Royal Caterers"
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className={`${inputCls} appearance-none`}>
                {vendorCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact Person">
              <input type="text" value={form.contactPerson} placeholder="Primary contact"
                onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Phone">
              <input type="tel" value={form.phone} placeholder="+91 98765 43210"
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
            </Field>
          </div>

          <Field label="Email">
            <input type="email" value={form.email} placeholder="vendor@email.com"
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Address">
              <input type="text" value={form.address} placeholder="Street address"
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="City">
              <input type="text" value={form.city} placeholder="City"
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Rating">
              <div className="py-2.5">
                <StarPicker value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
              </div>
            </Field>
            <Field label="Price Range">
              <select value={form.priceRange} onChange={e => setForm(f => ({ ...f, priceRange: e.target.value }))}
                className={`${inputCls} appearance-none`}>
                <option value="budget">Budget (₹)</option>
                <option value="moderate">Moderate (₹₹)</option>
                <option value="premium">Premium (₹₹₹)</option>
                <option value="luxury">Luxury (₹₹₹₹)</option>
              </select>
            </Field>
          </div>

          <Field label="Notes">
            <textarea value={form.notes} placeholder="Additional notes..." rows={3}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className={`${inputCls} resize-none`} />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button type="button" onClick={closeModal}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-400 transition-all">
              Cancel
            </button>
            <button type="submit"
              className="px-7 py-2.5 rounded-full text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-all hover:shadow-md">
              {editingVendor ? 'Update Vendor' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}