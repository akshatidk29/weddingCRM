import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, X, Plus, ArrowRight, CheckSquare } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';

/* ─────────────────────────────────────────
   SHARED PRIMITIVES
───────────────────────────────────────── */
const inputCls = "w-full px-4 py-3 bg-white border border-stone-200/60 shadow-sm rounded-lg text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 transition-all";
const labelCls = "block text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2";

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#faf9f7] rounded-t-lg sm:rounded-lg shadow-sm border border-stone-200/60 w-full sm:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200/60 flex-shrink-0">
          <h2 className="font-display text-2xl font-medium tracking-tight text-stone-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-200/50 text-stone-400 hover:text-stone-900 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Sk({ className = '' }) {
  return <div className={`bg-stone-200/50 animate-pulse rounded-lg ${className}`} />;
}

/* ─────────────────────────────────────────
   PRIORITY STYLING
───────────────────────────────────────── */
const PRIORITY_DOT = {
  urgent: 'bg-[#c0604a]',
  high:   'bg-amber-600',
  medium: 'bg-stone-400',
  low:    'bg-stone-300',
};

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function Templates() {
  const navigate = useNavigate();
  const userRole = useAuthStore(s => s.user?.role);
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'relationship_manager' || isAdmin;

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null); // single expanded template type
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
    setExpanded(prev => prev === type ? null : type);
    setExpandedEvents({});
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
        @keyframes rowSlideIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .row-slide-in { animation: rowSlideIn 0.35s ease-out both; }
      `}</style>

      <div className="font-body min-h-screen bg-[#faf9f7] text-stone-900">

        {/* ── Hero Header ── */}
        <div className="bg-stone-900 py-12 sm:py-16 px-5 sm:px-8 lg:px-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#b07d46] uppercase mb-2">Quick Start</p>
              <h1 className="font-display text-4xl sm:text-5xl font-medium text-white">Wedding Templates</h1>
              <p className="text-stone-400 text-sm mt-2">Choose a template and instantly create a full wedding with events & tasks.</p>
            </div>
            {isAdmin && (
              <button
                className="flex items-center gap-2 px-5 py-2.5 bg-[#faf9f7] text-stone-900 rounded-lg text-sm font-medium hover:bg-white transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Template
              </button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-8 sm:py-12">

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Sk key={i} className="h-16" />)}
            </div>
          ) : (
            <>
              {/* ── Stats row ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {templates.map(tpl => (
                  <div key={tpl.type} className="bg-white border border-stone-200/60 rounded-lg p-4">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">{tpl.label}</p>
                    <p className="font-display text-2xl font-medium text-stone-900 mt-1">{tpl.events.length}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">events · {totalTasks(tpl)} tasks</p>
                  </div>
                ))}
              </div>

              {/* ── Templates Table ── */}
              <div className="bg-white border border-stone-200/60 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200/60">
                      <th className="text-left px-5 py-3 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">Template</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase hidden sm:table-cell">Description</th>
                      <th className="text-center px-5 py-3 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase hidden md:table-cell">Events</th>
                      <th className="text-center px-5 py-3 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase hidden md:table-cell">Tasks</th>
                      <th className="px-5 py-3 text-right text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((tpl, tplIdx) => {
                      const isExp = expanded === tpl.type;
                      return (
                        <TemplateRow
                          key={tpl.type}
                          tpl={tpl}
                          isExp={isExp}
                          tplIdx={tplIdx}
                          isManager={isManager}
                          expandedEvents={expandedEvents}
                          onToggle={() => toggleTemplate(tpl.type)}
                          onToggleEvent={toggleEvent}
                          onConvert={() => openConvert(tpl)}
                          totalTasks={totalTasks(tpl)}
                        />
                      );
                    })}
                  </tbody>
                </table>
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
          <div className="bg-stone-50/50 rounded-lg border border-stone-100 p-4 mb-2">
            <p className="text-xs text-stone-600 leading-relaxed">
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

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-stone-200/60 mt-4">
            <button type="button" onClick={() => setShowConvert(false)}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-900 border border-stone-200/60 hover:border-stone-400 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={converting}
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-stone-900 text-[#faf9f7] hover:bg-stone-800 transition-all disabled:opacity-50">
              {converting ? 'Creating...' : 'Create Wedding'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}


/* ─────────────────────────────────────────
   TEMPLATE ROW (with nested animated table)
───────────────────────────────────────── */
function TemplateRow({ tpl, isExp, tplIdx, isManager, expandedEvents, onToggle, onToggleEvent, onConvert, totalTasks }) {
  return (
    <>
      {/* Main row */}
      <tr
        className={`border-b border-stone-100/60 cursor-pointer transition-colors hover:bg-stone-50/50 ${isExp ? 'bg-stone-50/30' : ''}`}
        onClick={onToggle}
      >
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-medium text-stone-900">{tpl.label}</span>
          </div>
        </td>
        <td className="px-5 py-4 hidden sm:table-cell">
          <p className="text-sm text-stone-400 truncate max-w-xs">{tpl.description}</p>
        </td>
        <td className="px-5 py-4 text-center hidden md:table-cell">
          <span className="text-sm text-stone-600">{tpl.events.length}</span>
        </td>
        <td className="px-5 py-4 text-center hidden md:table-cell">
          <span className="text-sm text-stone-600">{totalTasks}</span>
        </td>
        <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-2">
            {isManager && (
              <button
                onClick={onConvert}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-[#faf9f7] rounded-lg text-[11px] font-medium hover:bg-stone-800 transition-all"
              >
                <ArrowRight className="w-3 h-3" /> Convert
              </button>
            )}
            <ChevronRight className={`w-4 h-4 text-stone-300 transition-transform duration-200 ${isExp ? 'rotate-90' : ''}`} />
          </div>
        </td>
      </tr>

      {/* Expanded: animated sub-table */}
      {isExp && (
        <tr>
          <td colSpan="5" className="bg-stone-50/30 px-0">
            <div className="px-5 py-5 space-y-5">

              {/* Mobile convert */}
              {isManager && (
                <button
                  onClick={onConvert}
                  className="sm:hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 text-[#faf9f7] rounded-lg text-xs font-medium hover:bg-stone-800 transition-all"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Convert to Wedding
                </button>
              )}

              {/* Vendor notes */}
              {tpl.vendorNotes && (
                <div className="bg-white rounded-lg border border-stone-200/60 p-4 row-slide-in">
                  <p className={labelCls}>Vendor Notes</p>
                  <p className="text-xs text-stone-600 leading-relaxed">{tpl.vendorNotes}</p>
                </div>
              )}

              {/* Events sub-table */}
              <div className="bg-white rounded-lg border border-stone-200/60 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200/60">
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">Event</th>
                      <th className="text-center px-4 py-2.5 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase hidden sm:table-cell">Tasks</th>
                      <th className="w-8 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tpl.events.map((ev, idx) => {
                      const evKey = `${tpl.type}-${idx}`;
                      const evExp = expandedEvents[evKey];
                      return (
                        <EventRow
                          key={idx}
                          ev={ev}
                          evKey={evKey}
                          idx={idx}
                          evExp={evExp}
                          onToggle={() => onToggleEvent(evKey)}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Global tasks */}
              {tpl.globalTasks && tpl.globalTasks.length > 0 && (
                <div className="bg-white rounded-lg border border-stone-200/60 overflow-hidden row-slide-in"
                  style={{ animationDelay: `${tpl.events.length * 50 + 100}ms` }}>
                  <div className="px-4 py-3 border-b border-stone-200/60">
                    <p className={labelCls + ' mb-0'}>General Tasks <span className="text-stone-300 ml-1">{tpl.globalTasks.length}</span></p>
                  </div>
                  <div className="divide-y divide-stone-100/60">
                    {tpl.globalTasks.map((task, tidx) => (
                      <TaskItem key={tidx} task={task} delay={tidx * 40} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}


/* ─────────────────────────────────────────
   EVENT ROW (nested inside template)
───────────────────────────────────────── */
function EventRow({ ev, evKey, idx, evExp, onToggle }) {
  return (
    <>
      <tr
        className="border-b border-stone-100/60 last:border-0 cursor-pointer hover:bg-stone-50/40 transition-colors row-slide-in"
        style={{ animationDelay: `${idx * 50}ms` }}
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-[3px] h-5 rounded-full bg-stone-900/15 flex-shrink-0" />
            <span className="text-sm font-medium text-stone-800">{ev.name}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-center hidden sm:table-cell">
          <span className="text-xs text-stone-400">{ev.tasks.length}</span>
        </td>
        <td className="px-2 py-3 text-center">
          <ChevronDown className={`w-3.5 h-3.5 text-stone-300 transition-transform duration-200 mx-auto ${evExp ? 'rotate-180' : ''}`} />
        </td>
      </tr>

      {/* Expanded tasks */}
      {evExp && (
        <tr>
          <td colSpan="3" className="bg-stone-50/30 px-0">
            <div className="divide-y divide-stone-100/60">
              {ev.tasks.map((task, tidx) => (
                <TaskItem key={tidx} task={task} delay={tidx * 30} />
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}


/* ─────────────────────────────────────────
   TASK ITEM
───────────────────────────────────────── */
function TaskItem({ task, delay = 0 }) {
  return (
    <div
      className="flex items-start gap-2.5 px-5 py-3 row-slide-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CheckSquare className="w-3.5 h-3.5 text-stone-300 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-stone-700">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-stone-400">{task.category}</span>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority] || 'bg-stone-300'}`} />
            <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-stone-400">{task.priority}</span>
          </div>
        </div>
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-1.5 pl-3 border-l border-stone-200/60 space-y-0.5">
            {task.subtasks.map((st, si) => (
              <p key={si} className="text-[11px] text-stone-400">• {st}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
