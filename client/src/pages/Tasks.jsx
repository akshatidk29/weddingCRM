import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare, Clock, AlertTriangle, ChevronDown, ChevronRight,
  Phone, Mail, AlertCircle, Plus, X
} from 'lucide-react';
import { formatDate, categoryColors, taskCategories, vendorCategories, isOverdue } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

/* ─────────────────────────────────────────
   SHARED PRIMITIVES
───────────────────────────────────────── */
const inputCls = "w-full px-4 py-3 bg-white border border-stone-200/60 rounded-xl text-sm font-body text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all duration-300 shadow-sm";
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
   PRIORITY META — Premium Minimalist
───────────────────────────────────────── */
const priorityMeta = {
  low:    { bar: 'bg-stone-300',   text: 'text-stone-400',  label: 'Low' },
  medium: { bar: 'bg-amber-700',   text: 'text-amber-700',  label: 'Medium' },
  high:   { bar: 'bg-stone-900',   text: 'text-stone-900',  label: 'High' },
  urgent: { bar: 'bg-rose-800',    text: 'text-rose-800',   label: 'Urgent' },
};

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
   CHECKBOX
───────────────────────────────────────── */
function Checkbox({ checked, onChange, size = 'md' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const check = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`${sz} rounded-sm border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
        checked ? 'bg-stone-900 border-stone-900' : 'bg-white border-stone-300 hover:border-stone-500'
      }`}
    >
      {checked && (
        <svg className={`${check} text-[#faf9f7]`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────
   SKELETON
───────────────────────────────────────── */
function Sk({ className = '' }) {
  return <div className={`bg-stone-200/50 animate-pulse rounded-2xl ${className}`} />;
}

/* ─────────────────────────────────────────
   COMPLETION INFO HELPER
───────────────────────────────────────── */
function getCompletionInfo(task) {
  const subtasksDone  = task.subtasks?.filter(s => s.completed).length || 0;
  const subtasksTotal = task.subtasks?.length || 0;
  const vendorsDone   = task.taskVendors?.filter(v => v.status === 'completed').length || 0;
  const vendorsTotal  = task.taskVendors?.length || 0;
  const hasSubtasks   = subtasksTotal > 0;
  const hasVendors    = vendorsTotal > 0;
  return {
    subtasksDone, subtasksTotal, vendorsDone, vendorsTotal,
    hasSubtasks, hasVendors,
    allSubtasksDone: !hasSubtasks || subtasksDone === subtasksTotal,
    allVendorsDone:  !hasVendors  || vendorsDone  === vendorsTotal,
    pendingSubtasks: subtasksTotal - subtasksDone,
    pendingVendors:  vendorsTotal  - vendorsDone,
    canAutoComplete: (!hasSubtasks || subtasksDone === subtasksTotal) &&
                     (!hasVendors  || vendorsDone  === vendorsTotal),
  };
}

/* ─────────────────────────────────────────
   VENDOR DISPLAY HELPERS
───────────────────────────────────────── */
const getVendorName  = tv => (tv.vendor && typeof tv.vendor === 'object') ? tv.vendor.name  : (tv.name || 'Unknown Vendor');
const getVendorPhone = tv => (tv.vendor && typeof tv.vendor === 'object') ? tv.vendor.phone : (tv.phone || '');
const getVendorEmail = tv => (tv.vendor && typeof tv.vendor === 'object') ? tv.vendor.email : (tv.email || '');

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function Tasks() {
  const { user, isManager } = useAuth();
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState({ status: '', category: '', wedding: '', event: '' });
  const [weddings, setWeddings] = useState([]);
  const [events, setEvents]     = useState([]);
  const [filterEvents, setFilterEvents] = useState([]);
  const [view, setView]         = useState('all');
  const [expanded, setExpanded] = useState({});
  const [users, setUsers]       = useState([]);
  const [vendors, setVendors]   = useState([]);

  // Modal
  const [showModal, setShowModal]     = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const emptyForm = {
    title: '', description: '', category: 'other', priority: 'medium',
    assignedTo: '', dueDate: '', notes: '', wedding: '', event: '',
    subtasks: [], taskVendors: []
  };
  const [form, setForm]                   = useState(emptyForm);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskAmount, setNewSubtaskAmount] = useState('');
  const emptyVendor = { name: '', phone: '', email: '', address: '', city: '', category: 'other', amount: '' };
  const [newVendor, setNewVendor]         = useState(emptyVendor);

  useEffect(() => {
    loadTasks(); loadWeddings(); loadUsers(); loadVendors();
  }, []);

  const loadTasks    = async () => { try { const r = await api.get('/tasks');        setTasks(r.data.tasks);    } catch {} finally { setLoading(false); } };
  const loadWeddings = async () => { try { const r = await api.get('/weddings');     setWeddings(r.data.weddings); } catch {} };
  const loadUsers    = async () => { try { const r = await api.get('/auth/users');   setUsers(r.data.users);    } catch {} };
  const loadVendors  = async () => { try { const r = await api.get('/vendors');      setVendors(r.data.vendors); } catch {} };

  const handleStatus = async (taskId, newStatus) => {
    try { await api.put(`/tasks/${taskId}/status`, { status: newStatus }); loadTasks(); }
    catch (e) { alert(e.response?.data?.message || 'Failed to update'); }
  };

  const handleToggleSubtask = async (taskId, subId) => {
    try { await api.put(`/tasks/${taskId}/subtasks/${subId}`); loadTasks(); } catch {}
  };

  const handleVendorStatus = async (taskId, vendorId, status) => {
    try { await api.put(`/tasks/${taskId}/vendors/${vendorId}`, { status }); loadTasks(); } catch {}
  };

  const toggleExpand = (e, id) => {
    e.stopPropagation();
    setExpanded(p => ({ ...p, [id]: !p[id] }));
  }

  const loadEventsForWedding = async (weddingId) => {
    if (!weddingId) { setEvents([]); return; }
    try { const r = await api.get(`/events/wedding/${weddingId}`); setEvents(r.data.events || []); } catch { setEvents([]); }
  };

  const handleFilterWedding = async (weddingId) => {
    setFilter(f => ({ ...f, wedding: weddingId, event: '' }));
    if (weddingId) {
      try { const r = await api.get(`/events/wedding/${weddingId}`); setFilterEvents(r.data.events || []); }
      catch { setFilterEvents([]); }
    } else setFilterEvents([]);
  };

  const handleWeddingChange = (weddingId) => {
    setForm(f => ({ ...f, wedding: weddingId, event: '' }));
    loadEventsForWedding(weddingId);
  };

  const openCreate = () => { setEditingTask(null); setForm(emptyForm); setShowModal(true); };
  const openEdit   = (e, task) => {
    e.stopPropagation();
    setEditingTask(task);
    if (task.wedding?._id) loadEventsForWedding(task.wedding._id);
    setForm({
      title: task.title, description: task.description || '',
      category: task.category, priority: task.priority,
      assignedTo: task.assignedTo?._id || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      notes: task.notes || '',
      wedding: task.wedding?._id || '',
      event: task.event?._id || task.event || '',
      subtasks: task.subtasks || [],
      taskVendors: task.taskVendors || []
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setEditingTask(null); setForm(emptyForm);
    setNewSubtaskTitle(''); setNewSubtaskAmount(''); setNewVendor(emptyVendor);
  };

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setForm(f => ({ ...f, subtasks: [...f.subtasks, { title: newSubtaskTitle.trim(), completed: false, amount: Number(newSubtaskAmount) || 0 }] }));
    setNewSubtaskTitle(''); setNewSubtaskAmount('');
  };

  const addNewVendor = () => {
    if (!newVendor.name.trim()) return;
    setForm(f => ({ ...f, taskVendors: [...f.taskVendors, { ...newVendor, status: 'pending', amount: Number(newVendor.amount) || 0 }] }));
    setNewVendor(emptyVendor);
  };

  const selectExistingVendor = (vendorId) => {
    const v = vendors.find(vv => vv._id === vendorId);
    if (!v) return;
    const already = form.taskVendors.some(tv =>
      (tv.vendor && (tv.vendor._id === v._id || tv.vendor === v._id)) ||
      tv.name?.toLowerCase() === v.name.toLowerCase()
    );
    if (already) return;
    setForm(f => ({ ...f, taskVendors: [...f.taskVendors, { vendor: v._id, status: 'pending' }] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.wedding) { alert('Please select a wedding'); return; }
    try {
      const payload = {
        ...form,
        assignedTo: form.assignedTo || undefined,
        dueDate: form.dueDate || undefined,
        taskVendors: form.taskVendors.map(v =>
          v.vendor && typeof v.vendor === 'object' && v.vendor._id
            ? { vendor: v.vendor._id, status: v.status || 'pending' }
            : v
        )
      };
      if (editingTask) await api.put(`/tasks/${editingTask._id}`, payload);
      else await api.post('/tasks', payload);
      loadTasks(); loadVendors(); closeModal();
    } catch (e) { console.error(e); }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter.status   && task.status !== filter.status) return false;
    if (filter.category && task.category !== filter.category) return false;
    if (filter.wedding  && task.wedding?._id !== filter.wedding) return false;
    if (filter.event    && (task.event?._id || task.event) !== filter.event) return false;
    if (view === 'my'   && task.assignedTo?._id !== user._id) return false;
    if (view === 'overdue' && (!isOverdue(task.dueDate) || task.status !== 'pending')) return false;
    return true;
  });

  const stats = {
    total:   tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    done:    tasks.filter(t => t.status === 'done' || t.status === 'verified').length,
    overdue: tasks.filter(t => t.status === 'pending' && isOverdue(t.dueDate)).length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Cormorant Garamond', serif; letter-spacing: -0.02em; }
        .font-body    { font-family: 'Inter', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="font-body min-h-screen bg-[#faf9f7] text-stone-900 selection:bg-stone-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-12">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 border-b border-stone-200/60 pb-8">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-3">Operations</p>
              <h1 className="font-display text-4xl sm:text-5xl font-medium text-stone-900">Task Directory</h1>
              <p className="text-stone-400 text-sm mt-2 italic">Master checklist across all events.</p>
            </div>
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-[#faf9f7] rounded-full text-sm font-medium hover:bg-stone-800 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md self-start sm:self-auto flex-shrink-0">
              <Plus className="h-4 w-4" /> New Task
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><Sk key={i} className="h-28"/>)}</div>
              <Sk className="h-16" />
              <Sk className="h-[500px]" />
            </div>
          ) : (
            <>
              {/* ── Stats strip ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                  { label: 'All Tasks',  value: stats.total,   bar: 'bg-stone-300',  onClick: () => { setView('all'); setFilter(f => ({ ...f, status: '' })); } },
                  { label: 'Pending',    value: stats.pending, bar: 'bg-amber-700',  onClick: () => { setView('all'); setFilter(f => ({ ...f, status: 'pending' })); } },
                  { label: 'Completed',  value: stats.done,    bar: 'bg-teal-700',   onClick: () => { setView('all'); setFilter(f => ({ ...f, status: 'done' })); } },
                  { label: 'Overdue',    value: stats.overdue, bar: stats.overdue > 0 ? 'bg-rose-800' : 'bg-stone-200', onClick: () => setView('overdue') },
                ].map(m => (
                  <button key={m.label} onClick={m.onClick}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200/60 text-left transition-all duration-300 hover:-translate-y-0.5 group">
                    <div className={`h-[1px] w-8 ${m.bar} mb-4 transition-all duration-300 group-hover:w-12`} />
                    <p className="font-display text-3xl font-medium text-stone-900 leading-none">{m.value}</p>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mt-3">{m.label}</p>
                  </button>
                ))}
              </div>

              {/* ── Filters ── */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4 mb-8">
                {/* View tabs */}
                <div className="flex gap-1 p-1 bg-white border border-stone-200/60 shadow-sm rounded-full self-start">
                  {[
                    { id: 'all',     label: 'All' },
                    { id: 'my',      label: 'Mine' },
                    { id: 'overdue', label: 'Overdue' },
                  ].map(t => (
                    <button key={t.id} onClick={() => setView(t.id)}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                        view === t.id
                          ? t.id === 'overdue' ? 'bg-rose-50 text-rose-800' : 'bg-stone-900 text-[#faf9f7]'
                          : 'text-stone-400 hover:text-stone-900'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4 sm:ml-auto">
                  <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
                    className="py-3 px-4 text-sm rounded-full bg-white border border-stone-200/60 shadow-sm text-stone-700 focus:outline-none focus:border-stone-400 appearance-none transition-all duration-300 w-full sm:w-44">
                    <option value="">All Categories</option>
                    {taskCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>

                  <select value={filter.wedding} onChange={e => handleFilterWedding(e.target.value)}
                    className="py-3 px-4 text-sm rounded-full bg-white border border-stone-200/60 shadow-sm text-stone-700 focus:outline-none focus:border-stone-400 appearance-none transition-all duration-300 w-full sm:w-48">
                    <option value="">All Weddings</option>
                    {weddings.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>

                  {filter.wedding && filterEvents.length > 0 && (
                    <select value={filter.event} onChange={e => setFilter(f => ({ ...f, event: e.target.value }))}
                      className="py-3 px-4 text-sm rounded-full bg-white border border-stone-200/60 shadow-sm text-stone-700 focus:outline-none focus:border-stone-400 appearance-none transition-all duration-300 w-full sm:w-48">
                      <option value="">All Events</option>
                      {filterEvents.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* ── Count ── */}
              <p className="text-xs text-stone-400 mb-6 italic border-b border-stone-200/60 pb-4 inline-block">
                Displaying {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
              </p>

              {/* ── Task list ── */}
              {filteredTasks.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm py-20 text-center">
                  <p className="text-stone-400 text-sm italic">No tasks match your current filters.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 overflow-hidden">
                  <div className="divide-y divide-stone-100/60">
                    {filteredTasks.map(task => {
                      const info     = getCompletionInfo(task);
                      const overdue  = task.status === 'pending' && isOverdue(task.dueDate);
                      const isExp    = expanded[task._id];
                      const done     = task.status === 'done' || task.status === 'verified';
                      const pm       = priorityMeta[task.priority] || priorityMeta.medium;

                      return (
                        <div key={task._id} className="group transition-colors duration-300 hover:bg-[#faf9f7]/50">
                          {/* ── Task row ── */}
                          <div 
                            className={`flex items-start gap-5 px-6 py-5 cursor-pointer ${overdue ? 'border-l-[3px] border-rose-800 bg-rose-50/20' : ''}`}
                            onClick={(e) => (info.hasSubtasks || info.hasVendors) && toggleExpand(e, task._id)}
                          >

                            {/* Checkbox */}
                            <div className="mt-0.5 flex-shrink-0">
                              <Checkbox
                                checked={done}
                                onChange={() => {
                                  if (done) { handleStatus(task._id, 'pending'); return; }
                                  if ((info.hasSubtasks || info.hasVendors) && !info.canAutoComplete) {
                                    setExpanded(p => ({ ...p, [task._id]: true })); return;
                                  }
                                  handleStatus(task._id, 'done');
                                }}
                              />
                            </div>

                            {/* Main content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap mb-1">
                                <p className={`text-sm font-medium transition-colors duration-300 ${done ? 'text-stone-300 line-through' : 'text-stone-900 group-hover:text-stone-600'}`}>
                                  {task.title}
                                </p>
                                {/* Priority Indicator */}
                                {(task.priority === 'high' || task.priority === 'urgent') && (
                                  <span className={`text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 border border-stone-200/60 rounded-full bg-white ${pm.text}`}>
                                    {pm.label}
                                  </span>
                                )}
                                {task.status === 'verified' && (
                                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 border border-emerald-200/60 rounded-full bg-emerald-50 text-emerald-700">Verified</span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-400 flex-wrap">
                                {task.wedding && (
                                  <Link to={`/weddings/${task.wedding._id}`}
                                    className="hover:text-stone-900 transition-colors truncate italic"
                                    onClick={e => e.stopPropagation()}>
                                    {task.wedding.name}
                                  </Link>
                                )}
                                {task.event && (
                                  <span className="text-stone-300">| {task.event.name}</span>
                                )}
                                {task.assignedTo && <span>| Assigned: {task.assignedTo.name}</span>}
                                {info.hasSubtasks && (
                                  <span className={info.allSubtasksDone ? 'text-teal-700' : 'text-stone-500'}>
                                    | {info.subtasksDone}/{info.subtasksTotal} subtasks
                                  </span>
                                )}
                                {info.hasVendors && (
                                  <span className={info.allVendorsDone ? 'text-teal-700' : 'text-stone-500'}>
                                    | {info.vendorsDone}/{info.vendorsTotal} vendors
                                  </span>
                                )}
                              </div>

                              {/* Blocking warning */}
                              {task.status === 'pending' && (info.hasSubtasks || info.hasVendors) && !info.canAutoComplete && (
                                <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-amber-700 font-medium">
                                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                  <span>
                                    {info.pendingSubtasks > 0 && `${info.pendingSubtasks} subtask${info.pendingSubtasks > 1 ? 's' : ''}`}
                                    {info.pendingSubtasks > 0 && info.pendingVendors > 0 && ' & '}
                                    {info.pendingVendors > 0 && `${info.pendingVendors} vendor${info.pendingVendors > 1 ? 's' : ''}`}
                                    {' remaining'}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Right: date + category + actions */}
                            <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                              <span className="text-[9px] font-bold tracking-[0.2em] text-stone-400 uppercase hidden lg:block">
                                {task.category}
                              </span>
                              {task.dueDate && (
                                <span className={`text-[11px] hidden sm:block font-medium tracking-wide ${overdue ? 'text-rose-800' : 'text-stone-400'}`}>
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                              
                              <div className="flex items-center gap-1">
                                {isManager && (
                                  <button onClick={(e) => openEdit(e, task)}
                                    className="p-2 rounded-full text-stone-300 hover:text-stone-900 hover:bg-white border border-transparent hover:border-stone-200/60 shadow-sm transition-all duration-300 opacity-0 group-hover:opacity-100">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                )}
                                {(info.hasSubtasks || info.hasVendors) && (
                                  <button onClick={(e) => toggleExpand(e, task._id)}
                                    className="p-2 rounded-full text-stone-400 hover:text-stone-900 transition-all duration-300">
                                    {isExp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* ── Expanded: subtasks + vendors ── */}
                          {isExp && (
                            <div className="px-6 pb-6 pt-2 bg-[#faf9f7] border-t border-stone-100/60 space-y-6">
                              {/* Subtasks */}
                              {info.hasSubtasks && (
                                <div className="space-y-3 pl-10">
                                  <p className={labelCls}>Subtasks</p>
                                  {task.subtasks.map(sub => (
                                    <div key={sub._id} className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl shadow-sm border border-stone-200/60 transition-colors duration-300">
                                      <Checkbox size="sm" checked={sub.completed}
                                        onChange={() => handleToggleSubtask(task._id, sub._id)} />
                                      <span className={`text-sm font-medium flex-1 transition-colors duration-300 ${sub.completed ? 'text-stone-300 line-through' : 'text-stone-900'}`}>
                                        {sub.title}
                                      </span>
                                      {sub.amount !== 0 && (
                                        <span className={`text-[10px] font-bold tracking-wide ${
                                          sub.paymentStatus === 'completed' ? 'text-teal-700' :
                                          sub.paymentStatus === 'partial'   ? 'text-amber-700'   : 'text-stone-400'
                                        }`}>
                                          ₹{Math.abs(sub.amount).toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Vendors */}
                              {info.hasVendors && (
                                <div className={`space-y-3 pl-10 ${!info.hasSubtasks ? 'pt-2' : ''}`}>
                                  <p className={labelCls}>Vendors Assigned</p>
                                  {task.taskVendors.map(v => (
                                    <div key={v._id} className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl shadow-sm border border-stone-200/60 transition-colors duration-300">
                                      <Checkbox size="sm" checked={v.status === 'completed'}
                                        onChange={() => handleVendorStatus(task._id, v._id, v.status === 'completed' ? 'pending' : 'completed')} />
                                      <div className="flex-1 min-w-0">
                                        <span className={`text-sm font-medium transition-colors duration-300 ${v.status === 'completed' ? 'text-stone-300 line-through' : 'text-stone-900'}`}>
                                          {getVendorName(v)}
                                        </span>
                                        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                                          {getVendorPhone(v) && (
                                            <span className="text-[11px] text-stone-500 flex items-center gap-1.5 hover:text-stone-900 transition-colors">
                                              <Phone className="w-3 h-3 text-stone-300" />{getVendorPhone(v)}
                                            </span>
                                          )}
                                          {getVendorEmail(v) && (
                                            <span className="text-[11px] text-stone-500 flex items-center gap-1.5 hover:text-stone-900 transition-colors">
                                              <Mail className="w-3 h-3 text-stone-300" />{getVendorEmail(v)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {v.amount !== 0 && (
                                        <span className={`text-[10px] font-bold tracking-wide flex-shrink-0 ${
                                          v.paymentStatus === 'completed' ? 'text-teal-700' :
                                          v.paymentStatus === 'partial'   ? 'text-amber-700'   : 'text-stone-400'
                                        }`}>
                                          ₹{Math.abs(v.amount).toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ════════════════════
          TASK MODAL
      ════════════════════ */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingTask ? 'Edit Task' : 'Create Task'}>
        <form onSubmit={handleSubmit} className="space-y-6">

          <Field label="Task Title">
            <input type="text" value={form.title} placeholder="What needs to be done?" required
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
          </Field>

          <Field label="Details & Notes">
            <textarea value={form.description} placeholder="Additional context..." rows={3}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={`${inputCls} resize-none`} />
          </Field>

          <div className="grid grid-cols-2 gap-5 border-t border-stone-100/60 pt-5">
            <Field label="Wedding Client">
              <select value={form.wedding} onChange={e => handleWeddingChange(e.target.value)} required
                className={`${inputCls} appearance-none`}>
                <option value="">Select wedding...</option>
                {weddings.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </Field>
            <Field label="Specific Event">
              <select value={form.event} onChange={e => setForm(f => ({ ...f, event: e.target.value }))}
                disabled={!form.wedding || events.length === 0}
                className={`${inputCls} appearance-none disabled:bg-stone-50 disabled:text-stone-400 disabled:border-stone-100 disabled:shadow-none`}>
                <option value="">Select event...</option>
                {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Category">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className={`${inputCls} appearance-none`}>
                {taskCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Priority Level">
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className={`${inputCls} appearance-none`}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Assign Team Member">
              <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                className={`${inputCls} appearance-none`}>
                <option value="">Select member...</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </Field>
            <Field label="Target Due Date">
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className={inputCls} />
            </Field>
          </div>

          {/* ── Subtasks ── */}
          <div className="border-t border-stone-100/60 pt-5">
            <label className={labelCls}>Checklist / Subtasks</label>
            <div className="space-y-3 mb-4">
              {form.subtasks.map((sub, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white border border-stone-200/60 shadow-sm rounded-xl">
                  <div className={`w-3 h-3 rounded-sm border flex-shrink-0 ${sub.completed ? 'bg-stone-900 border-stone-900' : 'border-stone-300'}`} />
                  <span className={`text-sm font-medium flex-1 ${sub.completed ? 'text-stone-300 line-through' : 'text-stone-700'}`}>{sub.title}</span>
                  {sub.amount > 0 && <span className="text-[10px] font-bold tracking-wide text-stone-400">₹{sub.amount.toLocaleString()}</span>}
                  <button type="button" onClick={() => setForm(f => ({ ...f, subtasks: f.subtasks.filter((_,j)=>j!==i) }))}
                    className="p-1 rounded-full hover:bg-rose-50 text-stone-300 hover:text-rose-800 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <input type="text" placeholder="Add checklist item..." value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                className="flex-1 px-4 py-3 border border-stone-200/60 rounded-xl text-sm font-body text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 bg-white transition-all shadow-sm" />
              <input type="number" placeholder="₹ Amount" value={newSubtaskAmount}
                onChange={e => setNewSubtaskAmount(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                className="w-32 px-4 py-3 border border-stone-200/60 rounded-xl text-sm font-body text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 bg-white transition-all shadow-sm" />
              <button type="button" onClick={addSubtask}
                className="px-5 py-3 bg-[#faf9f7] border border-stone-200/60 hover:bg-stone-100 text-stone-700 rounded-xl transition-all shadow-sm flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Vendors ── */}
          <div className="border-t border-stone-100/60 pt-5">
            <label className={labelCls}>Associated Vendors</label>
            <div className="space-y-3 mb-4">
              {form.taskVendors.map((v, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white border border-stone-200/60 shadow-sm rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-stone-700 flex-1 truncate">{getVendorName(v)}</span>
                  {v.amount > 0 && <span className="text-[10px] font-bold tracking-wide text-stone-400">₹{v.amount.toLocaleString()}</span>}
                  <button type="button" onClick={() => setForm(f => ({ ...f, taskVendors: f.taskVendors.filter((_,j)=>j!==i) }))}
                    className="p-1 rounded-full hover:bg-rose-50 text-stone-300 hover:text-rose-800 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Select existing */}
            <select value="" onChange={e => { selectExistingVendor(e.target.value); e.target.value = ''; }}
              className={`${inputCls} appearance-none mb-4`}>
              <option value="">Select existing vendor...</option>
              {vendors.map(v => <option key={v._id} value={v._id}>{v.name} ({v.category})</option>)}
            </select>

            {/* Add new vendor inline */}
            <div className="bg-[#faf9f7] border border-stone-200/60 shadow-sm rounded-2xl p-5 space-y-4">
              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">Or Add New Vendor</p>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Vendor name" value={newVendor.name}
                  onChange={e => setNewVendor(v => ({ ...v, name: e.target.value }))}
                  className="px-4 py-3 border border-stone-200/60 rounded-xl text-sm bg-white placeholder-stone-300 focus:outline-none focus:border-stone-400 shadow-sm transition-all" />
                <input type="tel" placeholder="Phone" value={newVendor.phone}
                  onChange={e => setNewVendor(v => ({ ...v, phone: e.target.value }))}
                  className="px-4 py-3 border border-stone-200/60 rounded-xl text-sm bg-white placeholder-stone-300 focus:outline-none focus:border-stone-400 shadow-sm transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="email" placeholder="Email" value={newVendor.email}
                  onChange={e => setNewVendor(v => ({ ...v, email: e.target.value }))}
                  className="px-4 py-3 border border-stone-200/60 rounded-xl text-sm bg-white placeholder-stone-300 focus:outline-none focus:border-stone-400 shadow-sm transition-all" />
                <select value={newVendor.category} onChange={e => setNewVendor(v => ({ ...v, category: e.target.value }))}
                  className="px-4 py-3 border border-stone-200/60 rounded-xl text-sm bg-white focus:outline-none focus:border-stone-400 appearance-none shadow-sm transition-all text-stone-700">
                  {vendorCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="City" value={newVendor.city}
                  onChange={e => setNewVendor(v => ({ ...v, city: e.target.value }))}
                  className="px-4 py-3 border border-stone-200/60 rounded-xl text-sm bg-white placeholder-stone-300 focus:outline-none focus:border-stone-400 shadow-sm transition-all" />
                <input type="number" placeholder="₹ Budget amount" value={newVendor.amount}
                  onChange={e => setNewVendor(v => ({ ...v, amount: e.target.value }))}
                  className="px-4 py-3 border border-stone-200/60 rounded-xl text-sm bg-white placeholder-stone-300 focus:outline-none focus:border-stone-400 shadow-sm transition-all" />
              </div>
              <button type="button" onClick={addNewVendor}
                className="w-full py-3 bg-white border border-stone-200/60 hover:bg-stone-50 text-stone-900 text-sm font-medium rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add to Task
              </button>
            </div>
          </div>

          <Field label="Internal Task Notes">
            <textarea value={form.notes} placeholder="Additional instructions..." rows={3}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className={`${inputCls} resize-none`} />
          </Field>

          {/* Footer */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-stone-200/60 mt-4">
            <button type="button" onClick={closeModal}
              className="px-6 py-3 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 border border-stone-200/60 hover:border-stone-400 transition-all duration-300">
              Cancel
            </button>
            <button type="submit"
              className="px-8 py-3 rounded-full text-sm font-medium bg-stone-900 text-[#faf9f7] hover:bg-stone-800 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              {editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}