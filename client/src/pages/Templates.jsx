import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, X, Plus, ArrowRight, Layers, CheckSquare } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';

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

function Sk({ className = '' }) {
  return <div className={`bg-stone-200/50 animate-pulse rounded-2xl ${className}`} />;
}

/* ─────────────────────────────────────────
   CATEGORY & PRIORITY styling
───────────────────────────────────────── */
const PRIORITY_COLORS = {
  urgent: 'text-[#c0604a]',
  high:   'text-amber-700',
  medium: 'text-stone-500',
  low:    'text-stone-400',
};

const TYPE_COLORS = {
  destination: { bg: 'bg-sky-50',    border: 'border-sky-200/60', accent: 'bg-sky-700',    text: 'text-sky-800' },
  local:       { bg: 'bg-emerald-50', border: 'border-emerald-200/60', accent: 'bg-emerald-700', text: 'text-emerald-800' },
  luxury:      { bg: 'bg-amber-50',   border: 'border-amber-200/60', accent: 'bg-amber-700',  text: 'text-amber-800' },
  intimate:    { bg: 'bg-rose-50',    border: 'border-rose-200/60', accent: 'bg-rose-700',   text: 'text-rose-800' },
};

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function Templates() {
  const navigate = useNavigate();
  const isManager = useAuthStore(s => s.user?.role === 'relationship_manager' || s.user?.role === 'admin');

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState({});
  const [expandedEvents, setExpandedEvents] = useState({});

  // Convert Modal
  const [showConvert, setShowConvert]   = useState(false);
  const [convertType, setConvertType]   = useState(null);
  const [converting, setConverting]     = useState(false);
  const [convertForm, setConvertForm]   = useState({
    name: '', clientName: '', clientPhone: '', clientEmail: '', weddingDate: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data.templates);
    } catch (e) {
      console.error('Failed to load templates', e);
    } finally {
      setLoading(false);
    }
  };

  const openConvert = (template) => {
    setConvertType(template);
    setConvertForm({ name: '', clientName: '', clientPhone: '', clientEmail: '', weddingDate: '' });
    setShowConvert(true);
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    if (!convertType) return;
    try {
      setConverting(true);
      const res = await api.post(`/templates/${convertType.type}/convert`, convertForm);
      setShowConvert(false);
      navigate(`/weddings/${res.data.wedding._id}`);
    } catch (err) {
      console.error('Conversion error:', err);
      alert(err.response?.data?.message || 'Failed to convert template');
    } finally {
      setConverting(false);
    }
  };

  const toggleTemplate = (type) => {
    setExpanded(p => ({ ...p, [type]: !p[type] }));
  };

  const toggleEvent = (key) => {
    setExpandedEvents(p => ({ ...p, [key]: !p[key] }));
  };

  const totalTasks = (tpl) => {
    let count = (tpl.globalTasks || []).length;
    tpl.events.forEach(ev => { count += ev.tasks.length; });
    return count;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Cormorant Garamond', serif; letter-spacing: -0.02em; }
        .font-body    { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="font-body min-h-screen bg-[#faf9f7] text-stone-900 selection:bg-stone-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-8 sm:py-12">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-8 border-b border-stone-200/60 pb-6 sm:pb-8">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2">Quick Start</p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium text-stone-900">Wedding Templates</h1>
              <p className="text-stone-400 text-sm mt-2 italic">
                Choose a template type and instantly generate a full wedding with events & tasks.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => <Sk key={i} className="h-64" />)}
            </div>
          ) : (
            <>
              {/* ── Summary Cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {templates.map(tpl => {
                  const c = TYPE_COLORS[tpl.type] || TYPE_COLORS.local;
                  return (
                    <button key={tpl.type} onClick={() => toggleTemplate(tpl.type)}
                      className={`${c.bg} p-5 sm:p-6 rounded-2xl shadow-sm border ${c.border} text-left transition-all duration-300 hover:-translate-y-0.5 group`}>
                      <div className={`h-[1px] w-6 ${c.accent} mb-4 transition-all duration-500 group-hover:w-12`} />
                      <p className="text-2xl mb-1">{tpl.emoji}</p>
                      <p className="font-display text-lg font-medium text-stone-900 leading-tight">{tpl.label}</p>
                      <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mt-2">
                        {tpl.events.length} events · {totalTasks(tpl)} tasks
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* ── Template Detail Sections ── */}
              <div className="space-y-6">
                {templates.map(tpl => {
                  const c = TYPE_COLORS[tpl.type] || TYPE_COLORS.local;
                  const isExp = expanded[tpl.type];

                  return (
                    <div key={tpl.type} className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
                      {/* Template Header */}
                      <div
                        className="flex items-center gap-4 px-6 py-5 cursor-pointer hover:bg-[#faf9f7] transition-colors group"
                        onClick={() => toggleTemplate(tpl.type)}
                      >
                        <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-lg">{tpl.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-xl font-medium text-stone-900">{tpl.label}</p>
                          <p className="text-xs text-stone-400 mt-0.5 italic truncate">{tpl.description}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          {isManager && (
                            <button
                              onClick={() => openConvert(tpl)}
                              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-[#faf9f7] rounded-full text-[11px] font-semibold hover:bg-stone-800 transition-all"
                            >
                              <ArrowRight className="w-3.5 h-3.5" /> Convert to Wedding
                            </button>
                          )}
                          <ChevronRight className={`w-4 h-4 text-stone-300 transition-transform duration-200 ${isExp ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExp && (
                        <div className="border-t border-stone-100/60 px-6 py-5 space-y-5">
                          {/* Mobile convert button */}
                          {isManager && (
                            <button
                              onClick={() => openConvert(tpl)}
                              className="sm:hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 text-[#faf9f7] rounded-full text-[11px] font-semibold hover:bg-stone-800 transition-all mb-4"
                            >
                              <ArrowRight className="w-3.5 h-3.5" /> Convert to Wedding
                            </button>
                          )}

                          {/* Vendor Notes */}
                          <div className="bg-stone-50/50 rounded-xl border border-stone-100 p-4">
                            <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2">Vendor Notes</p>
                            <p className="text-xs text-stone-600 leading-relaxed">{tpl.vendorNotes}</p>
                          </div>

                          {/* Events */}
                          <div>
                            <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-3">
                              Events <span className="text-stone-300 ml-1">{tpl.events.length}</span>
                            </p>
                            <div className="space-y-2">
                              {tpl.events.map((ev, idx) => {
                                const evKey = `${tpl.type}-${idx}`;
                                const evExp = expandedEvents[evKey];
                                return (
                                  <div key={idx} className="bg-stone-50/40 rounded-xl border border-stone-200/60 overflow-hidden">
                                    <div
                                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/60 transition-colors"
                                      onClick={() => toggleEvent(evKey)}
                                    >
                                      <div className={`w-[2px] h-6 rounded-full flex-shrink-0 ${c.accent}`} />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-stone-900">{ev.name}</p>
                                        <p className="text-[10px] text-stone-400">{ev.tasks.length} tasks</p>
                                      </div>
                                      <ChevronDown className={`w-3.5 h-3.5 text-stone-300 transition-transform duration-200 ${evExp ? 'rotate-180' : ''}`} />
                                    </div>

                                    {evExp && (
                                      <div className="border-t border-stone-100/60 px-4 py-3 space-y-2">
                                        {ev.tasks.map((task, tidx) => (
                                          <div key={tidx} className="flex items-start gap-2.5 py-1.5">
                                            <CheckSquare className="w-3.5 h-3.5 text-stone-300 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-[13px] text-stone-700">{task.title}</p>
                                              <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-stone-400">{task.category}</span>
                                                <span className={`text-[9px] font-bold tracking-[0.15em] uppercase ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                                              </div>
                                              {task.subtasks && task.subtasks.length > 0 && (
                                                <div className="mt-1.5 pl-3 border-l border-stone-100 space-y-0.5">
                                                  {task.subtasks.map((st, si) => (
                                                    <p key={si} className="text-[11px] text-stone-400">• {st}</p>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Global Tasks */}
                          {tpl.globalTasks && tpl.globalTasks.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-3">
                                General Tasks <span className="text-stone-300 ml-1">{tpl.globalTasks.length}</span>
                              </p>
                              <div className="bg-stone-50/40 rounded-xl border border-stone-200/60 divide-y divide-stone-100/60">
                                {tpl.globalTasks.map((task, tidx) => (
                                  <div key={tidx} className="flex items-start gap-2.5 px-4 py-3">
                                    <CheckSquare className="w-3.5 h-3.5 text-stone-300 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[13px] text-stone-700">{task.title}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-stone-400">{task.category}</span>
                                        <span className={`text-[9px] font-bold tracking-[0.15em] uppercase ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                                      </div>
                                      {task.subtasks && task.subtasks.length > 0 && (
                                        <div className="mt-1.5 pl-3 border-l border-stone-100 space-y-0.5">
                                          {task.subtasks.map((st, si) => (
                                            <p key={si} className="text-[11px] text-stone-400">• {st}</p>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ════════════════════
          CONVERT MODAL
      ════════════════════ */}
      <Modal isOpen={showConvert} onClose={() => setShowConvert(false)} title={`Create from ${convertType?.label || 'Template'}`}>
        <form onSubmit={handleConvert} className="space-y-5">
          <div className="bg-stone-50/50 rounded-xl border border-stone-100 p-4 mb-2">
            <p className="text-xs text-stone-600 leading-relaxed">
              <span className="text-lg mr-1">{convertType?.emoji}</span>
              This will create a new wedding with <strong>{convertType?.events?.length} events</strong> and <strong>{convertType ? totalTasks(convertType) : 0} tasks</strong> pre-configured.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Wedding Name">
              <input type="text" value={convertForm.name} placeholder="e.g. Sharma-Gupta Wedding" required
                onChange={e => setConvertForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Client Name">
              <input type="text" value={convertForm.clientName} placeholder="Client's full name" required
                onChange={e => setConvertForm(f => ({ ...f, clientName: e.target.value }))} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Client Email">
              <input type="email" value={convertForm.clientEmail} placeholder="client@email.com"
                onChange={e => setConvertForm(f => ({ ...f, clientEmail: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Client Phone">
              <input type="tel" value={convertForm.clientPhone} placeholder="9876543210"
                onChange={e => setConvertForm(f => ({ ...f, clientPhone: e.target.value }))} className={inputCls} />
            </Field>
          </div>

          <Field label="Wedding Date">
            <input type="date" value={convertForm.weddingDate} required
              onChange={e => setConvertForm(f => ({ ...f, weddingDate: e.target.value }))} className={inputCls} />
          </Field>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-stone-200/60 mt-4">
            <button type="button" onClick={() => setShowConvert(false)}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-900 border border-stone-200/60 hover:border-stone-400 transition-all duration-300">
              Cancel
            </button>
            <button type="submit" disabled={converting}
              className="px-7 py-2.5 rounded-lg text-sm font-medium bg-stone-900 text-[#faf9f7] hover:bg-stone-800 transition-all duration-300 hover:shadow-md disabled:opacity-50">
              {converting ? 'Creating...' : 'Create Wedding'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
