import { useState, useEffect, useRef } from 'react';
import { Plus, Search, X, Image, Video, Palette, Tag, Link2, Unlink, Trash2, Edit, Eye, ChevronDown, Filter } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';
import useToastStore from '../stores/toastStore';

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const inputCls = "w-full px-4 py-3 bg-white border border-stone-200/60 shadow-sm rounded-xl text-sm font-body text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all duration-300";
const labelCls = "block text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2 font-body";

const FUNCTIONS = [
  { value: '', label: 'All Functions' },
  { value: 'mehendi', label: 'Mehendi' },
  { value: 'sangeet', label: 'Sangeet' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'reception', label: 'Reception' },
  { value: 'haldi', label: 'Haldi' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'cocktail', label: 'Cocktail' },
  { value: 'welcome_party', label: 'Welcome Party' },
  { value: 'farewell', label: 'Farewell' },
  { value: 'other', label: 'Other' }
];

const TYPE_META = {
  image: { icon: Image, label: 'Image', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200/60' },
  video: { icon: Video, label: 'Video', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/60' },
  color: { icon: Palette, label: 'Color', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60' }
};

/* ─────────────────────────────────────────
   SHARED COMPONENTS
───────────────────────────────────────── */
function Field({ label, children }) {
  return <div>{label && <label className={labelCls}>{label}</label>}{children}</div>;
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#faf9f7] rounded-t-2xl sm:rounded-2xl shadow-sm border border-stone-200/60 w-full sm:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
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

function Sk({ className = '' }) {
  return <div className={`bg-stone-200/50 animate-pulse rounded-2xl ${className}`} />;
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function MoodBoard() {
  const isManager = useAuthStore(s => s.user?.role === 'relationship_manager' || s.user?.role === 'admin');

  const [items, setItems]       = useState([]);
  const [weddings, setWeddings] = useState([]);
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [pixabayItems, setPixabayItems] = useState([]);
  const [loadingPixabay, setLoadingPixabay] = useState(false);
  const fileRef = useRef(null);

  // Filters
  const [filterWedding, setFilterWedding]   = useState('');
  const [filterType, setFilterType]         = useState('');
  const [filterFunction, setFilterFunction] = useState('');
  const [filterTag, setFilterTag]           = useState('');

  // Create/Edit modal
  const [showModal, setShowModal]   = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    title: '', type: 'image', colorHex: '#E8C4A0', tags: '', notes: '', weddingFunction: 'other', wedding: '', linkedEvents: [], externalMediaUrl: ''
  });
  const [file, setFile] = useState(null);

  // Detail modal
  const [detailItem, setDetailItem] = useState(null);

  // Link modal
  const [linkItem, setLinkItem] = useState(null);
  const [linkEvents, setLinkEvents] = useState([]);

  useEffect(() => { loadItems(); loadWeddings(); }, []);

  const loadItems = async () => {
    try {
      const params = new URLSearchParams();
      if (filterWedding) params.set('wedding', filterWedding);
      if (filterType) params.set('type', filterType);
      if (filterFunction) params.set('weddingFunction', filterFunction);
      if (filterTag) params.set('tag', filterTag);
      const res = await api.get(`/moodboard?${params}`);
      setItems(res.data.items);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadWeddings = async () => {
    try { const r = await api.get('/weddings'); setWeddings(r.data.weddings); } catch {}
  };

  const loadEventsForWedding = async (weddingId) => {
    if (!weddingId) { setEvents([]); return; }
    try { const r = await api.get(`/events/wedding/${weddingId}`); setEvents(r.data.events || []); } catch {}
  };

  useEffect(() => { loadItems(); }, [filterWedding, filterType, filterFunction, filterTag]);

  // Pixabay search effect
  useEffect(() => {
    if (!search) {
      setPixabayItems([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setLoadingPixabay(true);
        const res = await api.get(`/moodboard/pixabay?q=${encodeURIComponent(search)}`);
        const formatted = (res.data.hits || []).map(h => ({
          _id: `pixabay_${h.id}`,
          title: h.tags,
          type: 'image',
          mediaUrl: h.largeImageURL,
          tags: h.tags.split(',').map(t => t.trim()).slice(0, 5),
          notes: `Photo by ${h.user} on Pixabay.`,
          weddingFunction: 'other',
          isPixabay: true
        }));
        setPixabayItems(formatted);
      } catch (err) {
        console.error('Pixabay search failed', err);
      } finally {
        setLoadingPixabay(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // CRUD
  const openCreate = () => {
    setEditingItem(null);
    setForm({ title: '', type: 'image', colorHex: '#E8C4A0', tags: '', notes: '', weddingFunction: 'other', wedding: '', linkedEvents: [], externalMediaUrl: '' });
    setFile(null);
    setShowModal(true);
  };

  const openCreateFromPixabay = (item) => {
    setEditingItem(null);
    setForm({ 
      title: item.title, type: 'image', colorHex: '#E8C4A0', 
      tags: (item.tags || []).join(', '), notes: item.notes, 
      weddingFunction: 'other', wedding: '', linkedEvents: [],
      externalMediaUrl: item.mediaUrl
    });
    setFile(null);
    setDetailItem(null);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title, type: item.type, colorHex: item.colorHex || '#E8C4A0',
      title: item.title, type: item.type, colorHex: item.colorHex || '#E8C4A0',
      tags: (item.tags || []).join(', '), notes: item.notes || '',
      weddingFunction: item.weddingFunction || 'other',
      wedding: item.wedding?._id || '', linkedEvents: (item.linkedEvents || []).map(e => e._id || e),
      externalMediaUrl: ''
    });
    if (item.wedding?._id) loadEventsForWedding(item.wedding._id);
    setFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('type', form.type);
      fd.append('weddingFunction', form.weddingFunction);
      fd.append('wedding', form.wedding);
      fd.append('notes', form.notes);
      fd.append('tags', form.tags);
      fd.append('linkedEvents', JSON.stringify(form.linkedEvents));
      if (form.type === 'color') {
        fd.append('colorHex', form.colorHex);
      } else if (file) {
        fd.append('media', file);
      } else if (form.externalMediaUrl) {
        fd.append('externalMediaUrl', form.externalMediaUrl);
      }

      if (editingItem) {
        await api.put(`/moodboard/${editingItem._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/moodboard', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowModal(false);
      loadItems();
    } catch (err) {
      useToastStore.getState().error(err.response?.data?.message || 'Failed to save item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inspiration item?')) return;
    try { await api.delete(`/moodboard/${id}`); setDetailItem(null); loadItems(); } catch {}
  };

  // Link/Unlink
  const openLink = async (item) => {
    setLinkItem(item);
    if (item.wedding?._id) {
      try { const r = await api.get(`/events/wedding/${item.wedding._id}`); setLinkEvents(r.data.events || []); } catch {}
    }
  };

  const toggleLink = async (eventId) => {
    if (!linkItem) return;
    const isLinked = (linkItem.linkedEvents || []).some(e => (e._id || e) === eventId);
    try {
      if (isLinked) await api.delete(`/moodboard/${linkItem._id}/link/${eventId}`);
      else await api.post(`/moodboard/${linkItem._id}/link/${eventId}`);
      const r = await api.get(`/moodboard/${linkItem._id}`);
      setLinkItem(r.data.item);
      loadItems();
    } catch {}
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const ROOT = API_URL.replace('/api', '');
  const resolveMediaUrl = (mediaUrl) => {
    if (!mediaUrl) return '';
    const url = String(mediaUrl).trim();
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    if (url.startsWith('/')) return `${ROOT}${url}`;
    return `${ROOT}/${url}`;
  };

  // Collect all unique tags for filter
  const allTags = [...new Set(items.flatMap(i => i.tags || []))].sort();

  // Local search
  const filtered = items.filter(i => {
    if (!search) return true;
    const s = search.toLowerCase();
    return i.title.toLowerCase().includes(s) || (i.tags || []).some(t => t.toLowerCase().includes(s)) || (i.notes || '').toLowerCase().includes(s);
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Cormorant Garamond', serif; letter-spacing: -0.02em; }
        .font-body    { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="font-body min-h-screen bg-[#faf9f7] text-stone-900 selection:bg-stone-200">

        {/* ── Hero Header ── */}
        <div className="bg-stone-900 py-12 sm:py-16 px-5 sm:px-8 lg:px-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#b07d46] uppercase mb-2">Visual Planning</p>
              <h1 className="font-display text-4xl sm:text-5xl font-medium text-white">Mood Board</h1>
              <p className="text-stone-400 text-sm mt-2">{items.length} inspiration items</p>
            </div>
            {isManager && (
              <button onClick={openCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#faf9f7] text-stone-900 rounded-lg text-sm font-medium hover:bg-white transition-all self-start sm:self-auto flex-shrink-0">
                <Plus className="h-4 w-4" /> Add Inspiration
              </button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-8 sm:py-12">

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'All Items', count: items.length, bar: 'bg-stone-300', onClick: () => setFilterType('') },
              { label: 'Images', count: items.filter(i => i.type === 'image').length, bar: 'bg-sky-600', onClick: () => setFilterType(filterType === 'image' ? '' : 'image') },
              { label: 'Videos', count: items.filter(i => i.type === 'video').length, bar: 'bg-purple-600', onClick: () => setFilterType(filterType === 'video' ? '' : 'video') },
              { label: 'Colors', count: items.filter(i => i.type === 'color').length, bar: 'bg-amber-600', onClick: () => setFilterType(filterType === 'color' ? '' : 'color') }
            ].map(s => (
              <button key={s.label} onClick={s.onClick}
                className={`bg-white p-5 sm:p-6 rounded-2xl shadow-sm border text-left transition-all duration-300 hover:-translate-y-0.5 group ${
                  (s.label === 'Images' && filterType === 'image') || (s.label === 'Videos' && filterType === 'video') || (s.label === 'Colors' && filterType === 'color') || (s.label === 'All Items' && !filterType)
                    ? 'border-stone-400 ring-1 ring-stone-400/20' : 'border-stone-200/60'}`}>
                <div className={`h-[1px] w-6 ${s.bar} mb-4 transition-all duration-500 group-hover:w-12`} />
                <p className="font-display text-2xl sm:text-3xl font-medium text-stone-900 leading-none">{s.count}</p>
                <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mt-3">{s.label}</p>
              </button>
            ))}
          </div>

          {/* ── Filters ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300 pointer-events-none" />
              <input type="text" placeholder="Search inspiration..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-sm rounded-lg bg-white border border-stone-200/60 shadow-sm placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all" />
            </div>
            <select value={filterWedding} onChange={e => { setFilterWedding(e.target.value); loadEventsForWedding(e.target.value); }}
              className="px-4 py-2.5 text-sm rounded-lg bg-white border border-stone-200/60 shadow-sm text-stone-600 focus:outline-none focus:border-stone-400 appearance-none cursor-pointer">
              <option value="">All Weddings</option>
              {weddings.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
            <select value={filterFunction} onChange={e => setFilterFunction(e.target.value)}
              className="px-4 py-2.5 text-sm rounded-lg bg-white border border-stone-200/60 shadow-sm text-stone-600 focus:outline-none focus:border-stone-400 appearance-none cursor-pointer">
              {FUNCTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            {allTags.length > 0 && (
              <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
                className="px-4 py-2.5 text-sm rounded-lg bg-white border border-stone-200/60 shadow-sm text-stone-600 focus:outline-none focus:border-stone-400 appearance-none cursor-pointer">
                <option value="">All Tags</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>

          {/* ── Pinterest Grid ── */}
          {loading ? (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {[...Array(8)].map((_, i) => <Sk key={i} className={`h-${[40, 56, 48, 64, 44, 52, 60, 36][i]}`} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm py-20 text-center">
              <Palette className="w-8 h-8 text-stone-200 mx-auto mb-3" />
              <p className="text-stone-400 text-sm italic">No inspiration items found.</p>
              {isManager && (
                <button onClick={openCreate} className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold tracking-[0.1em] text-stone-400 uppercase hover:text-stone-900 transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Add your first item
                </button>
              )}
            </div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {filtered.map(item => {
                const meta = TYPE_META[item.type] || TYPE_META.image;
                const TypeIcon = meta.icon;
                return (
                  <div key={item._id} className="break-inside-avoid bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden group cursor-pointer hover:-translate-y-0.5 transition-all duration-300"
                    onClick={() => setDetailItem(item)}>
                    {/* Media preview */}
                    {item.type === 'image' && item.mediaUrl && (
                      <div className="relative overflow-hidden">
                        <img src={resolveMediaUrl(item.mediaUrl)} alt={item.title} className="w-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    {item.type === 'video' && item.mediaUrl && (
                      <div className="relative h-40 bg-stone-100 flex items-center justify-center">
                        <Video className="w-10 h-10 text-stone-300" />
                        <div className="absolute bottom-2 right-2 bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Video</div>
                      </div>
                    )}
                    {item.type === 'color' && (
                      <div className="h-32 rounded-t-2xl" style={{ backgroundColor: item.colorHex || '#E8C4A0' }}>
                        <div className="h-full flex items-end p-3">
                          <span className="bg-white/90 backdrop-blur-sm text-[10px] font-bold tracking-wider text-stone-700 px-2 py-1 rounded-full uppercase">{item.colorHex}</span>
                        </div>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-lg ${meta.bg} border ${meta.border} flex items-center justify-center flex-shrink-0`}>
                          <TypeIcon className={`w-3 h-3 ${meta.text}`} />
                        </div>
                        <p className="text-sm font-medium text-stone-900 leading-tight flex-1">{item.title}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pixabay Grid ── */}
          {pixabayItems.length > 0 && (
            <div className="mt-12 pt-8 border-t border-stone-200/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-2xl font-medium text-stone-900">Pixabay Inspiration</h2>
                  <p className="text-sm text-stone-400 mt-1">Found {pixabayItems.length} free images matching "{search}"</p>
                </div>
                <img src="https://pixabay.com/static/img/logo.svg" alt="Pixabay" className="h-6 opacity-60 grayscale hover:grayscale-0 transition-all cursor-help" title="Images provided by Pixabay API" />
              </div>
              
              {loadingPixabay ? (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                  {[...Array(8)].map((_, i) => <Sk key={i} className={`h-${[40, 56, 48, 64, 44, 52, 60, 36][i]}`} />)}
                </div>
              ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                  {pixabayItems.map(item => {
                    const meta = TYPE_META.image;
                    const TypeIcon = meta.icon;
                    return (
                      <div key={item._id} className="break-inside-avoid bg-white rounded-2xl border border-sky-100 ring-1 ring-sky-100/50 shadow-sm overflow-hidden group cursor-pointer hover:-translate-y-0.5 transition-all duration-300"
                        onClick={() => setDetailItem(item)}>
                        <div className="relative overflow-hidden">
                          <img src={item.mediaUrl} alt={item.title} className="w-full object-cover" loading="lazy" />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-900/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-white/90 truncate block">{item.notes}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════
          CREATE / EDIT MODAL
      ════════════════════ */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? 'Edit Inspiration' : 'Add Inspiration'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Title">
              <input type="text" value={form.title} placeholder="e.g. Blush mandap inspiration" required
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Type">
              <div className="flex gap-2">
                {['image', 'video', 'color'].map(t => {
                  const m = TYPE_META[t];
                  const Icon = m.icon;
                  return (
                    <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-semibold transition-all ${
                        form.type === t ? `${m.bg} ${m.border} ${m.text}` : 'bg-white border-stone-200/60 text-stone-400 hover:bg-stone-50'}`}>
                      <Icon className="w-3.5 h-3.5" /> {m.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>

          {form.type === 'color' ? (
            <Field label="Color">
              <div className="flex items-center gap-4">
                <input type="color" value={form.colorHex} onChange={e => setForm(f => ({ ...f, colorHex: e.target.value }))}
                  className="w-14 h-14 rounded-xl border border-stone-200/60 cursor-pointer p-1" />
                <input type="text" value={form.colorHex} onChange={e => setForm(f => ({ ...f, colorHex: e.target.value }))}
                  className={`${inputCls} max-w-[140px] font-mono`} placeholder="#E8C4A0" />
                <div className="w-14 h-14 rounded-xl border border-stone-200/60" style={{ backgroundColor: form.colorHex }} />
              </div>
            </Field>
          ) : (
            <Field label={`${form.type === 'image' ? 'Image' : 'Video'} File`}>
              <input type="file" ref={fileRef} onChange={e => setFile(e.target.files[0])}
                accept={form.type === 'image' ? 'image/*' : 'video/mp4,video/webm'}
                className="w-full text-sm text-stone-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 transition-all" />
            </Field>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-stone-100/60 pt-5">
            <Field label="Wedding">
              <select value={form.wedding} onChange={e => { setForm(f => ({ ...f, wedding: e.target.value, linkedEvents: [] })); loadEventsForWedding(e.target.value); }}
                required className={`${inputCls} appearance-none`}>
                <option value="">Select wedding...</option>
                {weddings.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </Field>
            <Field label="Function">
              <select value={form.weddingFunction} onChange={e => setForm(f => ({ ...f, weddingFunction: e.target.value }))}
                className={`${inputCls} appearance-none`}>
                {FUNCTIONS.filter(f => f.value).map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </Field>
          </div>

          {events.length > 0 && (
            <Field label="Link to Events">
              <div className="flex flex-wrap gap-2">
                {events.map(ev => {
                  const linked = form.linkedEvents.includes(ev._id);
                  return (
                    <button key={ev._id} type="button" onClick={() => {
                      setForm(f => ({
                        ...f, linkedEvents: linked ? f.linkedEvents.filter(e => e !== ev._id) : [...f.linkedEvents, ev._id]
                      }));
                    }} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                      linked ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200/60 hover:border-stone-400'}`}>
                      {ev.name}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          <Field label="Tags (comma separated)">
            <input type="text" value={form.tags} placeholder="e.g. floral, pink, elegant"
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className={inputCls} />
          </Field>

          <Field label="Notes">
            <textarea value={form.notes} placeholder="Design notes, references, preferences..." rows={3}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} resize-none`} />
          </Field>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-stone-200/60">
            <button type="button" onClick={() => setShowModal(false)}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-900 border border-stone-200/60 hover:border-stone-400 transition-all">Cancel</button>
            <button type="submit"
              className="px-7 py-2.5 rounded-lg text-sm font-medium bg-stone-900 text-[#faf9f7] hover:bg-stone-800 transition-all hover:shadow-md">
              {editingItem ? 'Save Changes' : 'Add to Board'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ════════════════════
          DETAIL MODAL
      ════════════════════ */}
      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title={detailItem?.title || 'Inspiration'}>
        {detailItem && (() => {
          const meta = TYPE_META[detailItem.type] || TYPE_META.image;
          const TypeIcon = meta.icon;
          return (
            <div className="space-y-5">
              {/* Media */}
              {detailItem.type === 'image' && detailItem.mediaUrl && (
                <img src={resolveMediaUrl(detailItem.mediaUrl)} alt={detailItem.title} className="w-full rounded-xl border border-stone-200/60" />
              )}
              {detailItem.type === 'video' && detailItem.mediaUrl && (
                <video controls className="w-full rounded-xl border border-stone-200/60">
                  <source src={resolveMediaUrl(detailItem.mediaUrl)} />
                </video>
              )}
              {detailItem.type === 'color' && (
                <div className="h-40 rounded-xl border border-stone-200/60" style={{ backgroundColor: detailItem.colorHex }}>
                  <div className="h-full flex items-end p-4">
                    <span className="bg-white/90 backdrop-blur-sm text-sm font-bold tracking-wider font-mono text-stone-700 px-3 py-1.5 rounded-lg">{detailItem.colorHex}</span>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-50/50 rounded-xl border border-stone-100 p-3">
                  <p className={labelCls}>Type</p>
                  <div className="flex items-center gap-1.5">
                    <TypeIcon className={`w-3.5 h-3.5 ${meta.text}`} />
                    <span className="text-sm text-stone-700">{meta.label}</span>
                  </div>
                </div>
                <div className="bg-stone-50/50 rounded-xl border border-stone-100 p-3">
                  <p className={labelCls}>Function</p>
                  <span className="text-sm text-stone-700">{FUNCTIONS.find(f => f.value === detailItem.weddingFunction)?.label || 'Other'}</span>
                </div>
              </div>

              {detailItem.wedding?.name && (
                <div className="bg-stone-50/50 rounded-xl border border-stone-100 p-3">
                  <p className={labelCls}>Wedding</p>
                  <span className="text-sm text-stone-700">{detailItem.wedding.name}</span>
                </div>
              )}

              {detailItem.tags && detailItem.tags.length > 0 && (
                <div>
                  <p className={labelCls}>Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailItem.tags.map((tag, idx) => (
                      <span key={`${tag}-${idx}`} className="text-[10px] font-bold tracking-wider uppercase bg-stone-100 text-stone-500 px-2.5 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {detailItem.notes && (
                <div className="bg-stone-50/50 rounded-xl border border-stone-100 p-3">
                  <p className={labelCls}>Notes</p>
                  <p className="text-sm text-stone-600 whitespace-pre-wrap">{detailItem.notes}</p>
                </div>
              )}

              {detailItem.linkedEvents && detailItem.linkedEvents.length > 0 && (
                <div>
                  <p className={labelCls}>Linked Events</p>
                  <div className="flex flex-wrap gap-2">
                    {detailItem.linkedEvents.map(ev => (
                      <span key={ev._id || ev} className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-stone-900 text-white">
                        {ev.name || ev}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {isManager && (
                <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                  {detailItem.isPixabay ? (
                    <button onClick={() => openCreateFromPixabay(detailItem)}
                      className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-sm">
                      <Plus className="w-4 h-4" /> Save to Board
                    </button>
                  ) : (
                    <>
                      <button onClick={() => { setDetailItem(null); openEdit(detailItem); }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold border border-stone-200/60 text-stone-600 hover:bg-stone-50 transition-all">
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => { setDetailItem(null); openLink(detailItem); }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold border border-stone-200/60 text-stone-600 hover:bg-stone-50 transition-all">
                        <Link2 className="w-3.5 h-3.5" /> Link Events
                      </button>
                      <button onClick={() => handleDelete(detailItem._id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold border border-rose-200/60 text-[#c0604a] hover:bg-rose-50 transition-all ml-auto">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* ════════════════════
          LINK EVENTS MODAL
      ════════════════════ */}
      <Modal isOpen={!!linkItem} onClose={() => setLinkItem(null)} title={`Link to Events — ${linkItem?.title || ''}`}>
        {linkItem && (
          <div className="space-y-3">
            {linkEvents.length === 0 ? (
              <p className="text-sm text-stone-400 italic">No events found for this wedding.</p>
            ) : linkEvents.map(ev => {
              const isLinked = (linkItem.linkedEvents || []).some(e => (e._id || e) === ev._id);
              return (
                <button key={ev._id} onClick={() => toggleLink(ev._id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    isLinked ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200/60 hover:border-stone-400'}`}>
                  <span className="text-sm font-medium">{ev.name}</span>
                  {isLinked ? <Unlink className="w-4 h-4" /> : <Link2 className="w-4 h-4 text-stone-300" />}
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </>
  );
}
