import { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Phone, Mail, MapPin, Star,
  Edit, Trash, ChevronRight, X, Check
} from 'lucide-react';
import { vendorCategories } from '../utils/helpers';
import useAuthStore from '../stores/authStore';
import useVendorStore from '../stores/vendorStore';

/* ─────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────── */
const inputCls = "w-full px-4 py-3 bg-white border border-stone-200/60 rounded-xl text-sm font-body text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all shadow-sm";
const labelCls = "block text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2 font-body";

function Field({ label, children }) {
  return <div>{label && <label className={labelCls}>{label}</label>}{children}</div>;
}

/* ─────────────────────────────────────────
   CATEGORY META — Stone palette
───────────────────────────────────────── */
const categoryMeta = {
  catering: { bar: 'bg-stone-700', label: 'Catering' },
  decor: { bar: 'bg-stone-500', label: 'Decor' },
  photography: { bar: 'bg-stone-800', label: 'Photography' },
  videography: { bar: 'bg-stone-600', label: 'Videography' },
  music: { bar: 'bg-stone-400', label: 'Music' },
  makeup: { bar: 'bg-stone-500', label: 'Makeup' },
  venue: { bar: 'bg-stone-900', label: 'Venue' },
  transport: { bar: 'bg-stone-600', label: 'Transport' },
  invitation: { bar: 'bg-stone-400', label: 'Invitation' },
  other: { bar: 'bg-stone-300', label: 'Other' },
};


/* ─────────────────────────────────────────
   STAR DISPLAY
───────────────────────────────────────── */
function StarRating({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < value ? 'bg-amber-700' : 'bg-stone-200'}`} />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)} className="p-0.5">
          <Star className={`w-5 h-5 transition-colors ${s <= value ? 'text-amber-700 fill-amber-700' : 'text-stone-200 hover:text-stone-300'}`} />
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
      <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#faf9f7] rounded-t-2xl sm:rounded-2xl shadow-sm border border-stone-200/60 w-full sm:max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200/60 flex-shrink-0">
          <h2 className="font-display text-2xl font-medium tracking-tight text-stone-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-200/50 text-stone-400 hover:text-stone-900 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 font-body">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   VENDOR DETAIL DRAWER
───────────────────────────────────────── */
function VendorDrawer({ vendor, onClose, onEdit, onDelete, isManager }) {
  const [visible, setVisible] = useState(false);
  const { vendorTasks, vendorEvents, loadVendorDetails } = useVendorStore();
  const [loadingTasks, setLoadingTasks] = useState(false);

  const tasks = vendor ? vendorTasks[vendor._id] : undefined;
  const events = vendor ? (vendorEvents[vendor._id] || []) : [];

  useEffect(() => {
    if (vendor) {
      requestAnimationFrame(() => setVisible(true));
      if (vendorTasks[vendor._id] === undefined) {
        setLoadingTasks(true);
        loadVendorDetails(vendor._id).finally(() => setLoadingTasks(false));
      }
    }
  }, [vendor]);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 300); };

  if (!vendor) return null;

  const totalAmt = (tasks || []).reduce((s, t) => s + Math.abs(t.taskVendors?.find(tv => tv.vendor?._id === vendor._id)?.amount || 0), 0);
  const paidAmt = (tasks || []).reduce((s, t) => s + Math.abs(t.taskVendors?.find(tv => tv.vendor?._id === vendor._id)?.paidAmount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className={`absolute inset-0 transition-opacity duration-300 ${visible ? 'bg-stone-950/20 backdrop-blur-[2px]' : 'bg-transparent'}`} onClick={handleClose} />
      <div className={`relative w-full max-w-md bg-[#faf9f7] shadow-2xl transition-transform duration-300 ease-out overflow-y-auto ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="sticky top-0 bg-[#faf9f7] border-b border-stone-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1">Vendor Detail</p>
            <h3 className="font-display text-lg font-medium text-stone-900 leading-tight">{vendor.name}</h3>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0 ml-3">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Contact info */}
          <div className="grid grid-cols-2 gap-3">
            {vendor.contactPerson && (
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1">Contact</p>
                <p className="text-sm text-stone-700">{vendor.contactPerson}</p>
              </div>
            )}
            {vendor.phone && (
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1">Phone</p>
                <p className="text-sm text-stone-700 flex items-center gap-1.5"><Phone className="w-3 h-3 text-stone-300" />{vendor.phone}</p>
              </div>
            )}
            {vendor.email && (
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1">Email</p>
                <p className="text-sm text-stone-700 flex items-center gap-1.5"><Mail className="w-3 h-3 text-stone-300" />{vendor.email}</p>
              </div>
            )}
            {vendor.city && (
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1">City</p>
                <p className="text-sm text-stone-700 flex items-center gap-1.5"><MapPin className="w-3 h-3 text-stone-300" />{vendor.city}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1">Rating</p>
              <StarRating value={vendor.rating} />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1">Price Range</p>
            </div>
          </div>

          {/* Category pill + events */}
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] bg-white border border-stone-200/60 text-stone-500 shadow-sm">
              {(categoryMeta[vendor.category] || categoryMeta.other).label}
            </span>
            {events.map(ev => (
              <span key={ev._id} className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] bg-stone-100 text-stone-400">
                {ev.name}
              </span>
            ))}
          </div>

          {/* Notes */}
          {vendor.notes && (
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2">Notes</p>
              <p className="text-sm text-stone-500 italic leading-relaxed">{vendor.notes}</p>
            </div>
          )}

          {/* Actions */}
          {isManager && (
            <div className="flex gap-2">
              <button onClick={() => { onEdit(vendor); handleClose(); }}
                className="flex-1 px-4 py-2.5 border border-stone-200 text-stone-600 rounded-full text-[11px] font-semibold hover:bg-stone-50 transition-all text-center">
                Edit Vendor
              </button>
              <button onClick={() => { onDelete(vendor._id); handleClose(); }}
                className="px-4 py-2.5 border border-stone-200 text-stone-400 rounded-full text-[11px] font-semibold hover:bg-stone-50 hover:text-[#c0604a] transition-all">
                Delete
              </button>
            </div>
          )}

          {/* Linked tasks */}
          {loadingTasks && <div className="h-1 w-16 bg-stone-100 animate-pulse rounded-full" />}
          {tasks && tasks.length > 0 && (
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-3">
                Linked Tasks <span className="text-stone-300 ml-1">{tasks.length}</span>
              </p>
              {totalAmt > 0 && (
                <div className="flex items-center gap-4 mb-3 px-4 py-3 bg-white rounded-xl border border-stone-200/60 text-xs">
                  <div className="flex items-center gap-2"><span className="text-stone-400">Total</span><span className="font-semibold text-stone-800">₹{totalAmt.toLocaleString()}</span></div>
                  <div className="flex items-center gap-2"><span className="text-stone-400">Paid</span><span className="font-semibold text-teal-700">₹{paidAmt.toLocaleString()}</span></div>
                  <div className="flex-1 h-[2px] bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-700 rounded-full" style={{ width: `${Math.min(100, totalAmt ? (paidAmt / totalAmt) * 100 : 0)}%` }} />
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl border border-stone-200/60 divide-y divide-stone-100/60 overflow-hidden">
                {tasks.map(task => {
                  const ve = task.taskVendors?.find(tv => tv.vendor?._id === vendor._id);
                  if (!ve) return null;
                  const done = ve.status === 'completed';
                  return (
                    <div key={task._id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#faf9f7] transition-colors">
                      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${done ? 'bg-stone-900 border-stone-900' : 'border-stone-300'}`}>
                        {done && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className={`text-[13px] flex-1 ${done ? 'text-stone-300 line-through' : 'text-stone-600'}`}>{task.title}</span>
                      {task.wedding?.name && <span className="text-[10px] text-stone-400 truncate max-w-[80px] italic">{task.wedding.name}</span>}
                      {ve.amount > 0 && (
                        <span className={`text-[11px] font-medium flex-shrink-0 ${ve.paymentStatus === 'completed' ? 'text-teal-700' : ve.paymentStatus === 'partial' ? 'text-amber-700' : 'text-stone-400'
                          }`}>₹{Math.abs(ve.amount).toLocaleString()}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {tasks && tasks.length === 0 && (
            <p className="text-xs text-stone-300 italic">No tasks linked to this vendor</p>
          )}
        </div>
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
export default function Vendors() {
  const isManager = useAuthStore((s) => s.user?.role === 'relationship_manager' || s.user?.role === 'admin');
  const { vendors, loading, fetchVendors, createVendor, updateVendor, deleteVendor } = useVendorStore();
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  const emptyForm = {
    name: '', category: 'other', contactPerson: '', email: '', phone: '',
    address: '', city: '', rating: 3, priceRange: 'moderate', notes: ''
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setAnimKey(k => k + 1); // triggers re-animation
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingVendor) await updateVendor(editingVendor._id, form);
    else await createVendor(form);
    closeModal();
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
    await deleteVendor(id);
  };

  const closeModal = () => { setShowModal(false); setEditingVendor(null); setForm(emptyForm); };

  /* ── Category counts ── */
  const categoryCounts = vendors.reduce((acc, v) => {
    acc[v.category] = (acc[v.category] || 0) + 1;
    return acc;
  }, {});

  const activeCategories = vendorCategories.filter(c => categoryCounts[c.value]);

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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Cormorant Garamond', serif; letter-spacing: -0.02em; }
        .font-body    { font-family: 'Inter', sans-serif; }
        @keyframes rowReveal { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .anim-rows > tbody > tr { opacity: 0; animation: rowReveal 0.25s ease-out forwards; }
      `}</style>

      <div className="font-body min-h-screen bg-[#faf9f7] text-stone-900 selection:bg-stone-200">

        {/* ── Hero Header ── */}
        <div className="bg-stone-900 py-12 sm:py-16 px-5 sm:px-8 lg:px-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#b07d46] uppercase mb-2">Directory</p>
              <h1 className="font-display text-4xl sm:text-5xl font-medium text-white">Vendors</h1>
              <p className="text-stone-400 text-sm mt-2">Manage your trusted vendor network.</p>
            </div>
            {isManager && (
              <button onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#faf9f7] text-stone-900 rounded-lg text-sm font-medium hover:bg-white transition-all self-start sm:self-auto flex-shrink-0">
                <Plus className="h-4 w-4" /> Add Vendor
              </button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-8">

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
              <div className="space-y-2">{[...Array(7)].map((_, i) => <Sk key={i} className="h-12" />)}</div>
              <div className="space-y-3"><Sk className="h-14" />{[...Array(5)].map((_, i) => <Sk key={i} className="h-16" />)}</div>
            </div>
          ) : vendors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm py-20 text-center">
              <p className="text-stone-400 text-sm italic">No vendors yet</p>
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
              <nav className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden lg:sticky lg:top-6">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-sm transition-colors border-b border-stone-100/60 ${selectedCategory === 'all'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-[#faf9f7]'
                    }`}
                >
                  <span className="font-medium">All Vendors</span>
                  <span className={`text-xs font-semibold ${selectedCategory === 'all' ? 'text-white/60' : 'text-stone-400'}`}>
                    {vendors.length}
                  </span>
                </button>

                {activeCategories.map(cat => {
                  const m = categoryMeta[cat.value] || categoryMeta.other;
                  const count = categoryCounts[cat.value] || 0;
                  const active = selectedCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => handleCategoryChange(cat.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-stone-100/60 last:border-0 ${active
                          ? 'bg-[#faf9f7] text-stone-900'
                          : 'text-stone-400 hover:text-stone-700 hover:bg-[#faf9f7]/60'
                        }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.bar}`} />
                      <span className={`flex-1 text-left ${active ? 'font-semibold' : 'font-medium'}`}>{m.label}</span>
                      <span className={`text-xs ${active ? 'text-stone-500 font-semibold' : 'text-stone-300'}`}>{count}</span>
                    </button>
                  );
                })}
              </nav>

              {/* ── RIGHT: Vendor table ── */}
              <div>
                {/* Search + heading */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300 pointer-events-none" />
                    <input
                      type="text" placeholder="Search vendors..."
                      value={search} onChange={e => setSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 text-sm rounded-lg bg-white shadow-sm border border-stone-200/60 placeholder-stone-300 focus:outline-none focus:border-stone-400 transition-all"
                    />
                  </div>
                  {currentMeta && (
                    <div className="flex items-center gap-2">
                      <div className={`h-[2px] w-6 rounded-full ${currentMeta.bar}`} />
                      <span className="text-sm font-semibold text-stone-900 capitalize">{currentMeta.label}</span>
                    </div>
                  )}
                  <p className="text-xs text-stone-400 sm:ml-auto flex-shrink-0 italic">
                    {filtered.length} vendor{filtered.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Vendor table */}
                {filtered.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm py-14 text-center">
                    <p className="text-stone-400 text-sm italic">No vendors match your search</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table key={animKey} className="w-full anim-rows">
                        <thead>
                          <tr className="border-b border-stone-100/60 bg-[#faf9f7]/50">
                            <th className="text-left px-5 py-4 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">Vendor</th>
                            <th className="text-left px-5 py-4 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase hidden sm:table-cell">Contact</th>
                            <th className="text-left px-5 py-4 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase hidden md:table-cell">City</th>
                            <th className="text-left px-5 py-4 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase hidden md:table-cell">Category</th>
                            <th className="text-left px-5 py-4 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase hidden lg:table-cell">Rating</th>
                            <th className="text-left px-5 py-4 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase hidden lg:table-cell">Price</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100/60">
                          {filtered.map((vendor, i) => (
                            <tr
                              key={vendor._id}
                              onClick={() => setSelectedVendor(vendor)}
                              className="cursor-pointer hover:bg-[#faf9f7] transition-all group"
                              style={{ animationDelay: `${i * 40}ms` }}
                            >
                              {/* Vendor name */}
                              <td className="px-5 py-4">
                                <span className="text-sm font-medium text-stone-900">{vendor.name}</span>
                                {vendor.contactPerson && (
                                  <p className="text-[11px] text-stone-400 mt-0.5">{vendor.contactPerson}</p>
                                )}
                              </td>

                              {/* Contact */}
                              <td className="px-5 py-4 hidden sm:table-cell">
                                <div className="space-y-0.5">
                                  {vendor.phone && <p className="text-sm text-stone-600">{vendor.phone}</p>}
                                  {vendor.email && <p className="text-xs text-stone-400 truncate max-w-[150px]">{vendor.email}</p>}
                                </div>
                              </td>

                              {/* City */}
                              <td className="px-5 py-4 text-sm text-stone-600 hidden md:table-cell whitespace-nowrap">
                                {vendor.city || <span className="text-stone-300">—</span>}
                              </td>

                              {/* Category */}
                              <td className="px-5 py-4 hidden md:table-cell">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] bg-white border border-stone-200/60 text-stone-500 shadow-sm">
                                  <span className={`w-1.5 h-1.5 rounded-full ${(categoryMeta[vendor.category] || categoryMeta.other).bar}`} />
                                  {(categoryMeta[vendor.category] || categoryMeta.other).label}
                                </span>
                              </td>

                              {/* Rating */}
                              <td className="px-5 py-4 hidden lg:table-cell">
                                <StarRating value={vendor.rating} />
                              </td>

                              {/* Arrow */}
                              <td className="px-5 py-4 text-right">
                                <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-900 transition-colors inline-block" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════ VENDOR DRAWER ════════════ */}
      <VendorDrawer
        vendor={selectedVendor}
        onClose={() => setSelectedVendor(null)}
        onEdit={openEdit}
        onDelete={handleDelete}
        isManager={isManager}
      />

      {/* ════════════ MODAL ════════════ */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingVendor ? 'Edit Vendor' : 'Add Vendor'}>
        <form onSubmit={handleSubmit} className="space-y-5">
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
              <select
                value={form.priceRange}
                onChange={e => setForm(f => ({ ...f, priceRange: e.target.value }))}
                className={`${inputCls} appearance-none rounded-xl px-4`}
              >
                <option value="budget">Budget</option>
                <option value="moderate">Moderate</option>
                <option value="premium">Premium</option>
                <option value="luxury">Luxury</option>
              </select>
            </Field>
          </div>

          <Field label="Notes">
            <textarea value={form.notes} placeholder="Additional notes..." rows={3}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className={`${inputCls} resize-none`} />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-stone-200/60">
            <button type="button" onClick={closeModal}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-900 border border-stone-200/60 hover:border-stone-400 transition-all">
              Cancel
            </button>
            <button type="submit"
              className="px-7 py-2.5 rounded-lg text-sm font-medium bg-stone-900 text-[#faf9f7] hover:bg-stone-800 transition-all">
              {editingVendor ? 'Update Vendor' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}