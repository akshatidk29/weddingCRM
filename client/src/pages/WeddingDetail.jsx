import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, MapPin, Users, DollarSign,
  Plus, Clock, UserPlus, Edit, Check,
  ChevronDown, ChevronRight, Trash2, Phone, X, AlertCircle, Mail
} from 'lucide-react';
import { formatDate, formatCurrency, taskCategories, vendorCategories, daysUntil, isOverdue } from '../utils/helpers';
import useAuthStore from '../stores/authStore';
import api from '../utils/api';

/* ─────────────────────────────────────────
   SHARED PRIMITIVES
───────────────────────────────────────── */
const inputCls = "w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5 transition-all";
const labelCls = "block text-[10px] font-semibold tracking-[0.18em] text-stone-400 uppercase mb-2";

function Field({ label, children }) {
  return <div>{label && <label className={labelCls}>{label}</label>}{children}</div>;
}

/* ─────────────────────────────────────────
   MODAL
───────────────────────────────────────── */
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;
  const maxW = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }[size] || 'sm:max-w-lg';
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-[#faf9f7] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full ${maxW} max-h-[92vh] flex flex-col overflow-hidden`}>
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
   CHECKBOX
───────────────────────────────────────── */
function Checkbox({ checked, onChange, size = 'md' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <button type="button" onClick={onChange}
      className={`${sz} rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        checked ? 'bg-emerald-400 border-emerald-400' : 'border-stone-300 hover:border-stone-500'
      }`}>
      {checked && (
        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────
   PROGRESS RING (small)
───────────────────────────────────────── */
function ProgressRing({ pct = 0, size = 36, stroke = 3, color = '#a8a29e' }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="rotate-[-90deg] flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f5f4f2" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ - (pct/100)*circ} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
    </svg>
  );
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function getCompletionInfo(task) {
  const sDone = task.subtasks?.filter(s => s.completed).length || 0;
  const sTotal = task.subtasks?.length || 0;
  const vDone = task.taskVendors?.filter(v => v.status === 'completed').length || 0;
  const vTotal = task.taskVendors?.length || 0;
  return {
    subtasksDone: sDone, subtasksTotal: sTotal,
    vendorsDone: vDone, vendorsTotal: vTotal,
    hasSubtasks: sTotal > 0, hasVendors: vTotal > 0,
    allSubtasksDone: !sTotal || sDone === sTotal,
    allVendorsDone: !vTotal || vDone === vTotal,
    pendingSubtasks: sTotal - sDone, pendingVendors: vTotal - vDone,
    canAutoComplete: (!sTotal || sDone === sTotal) && (!vTotal || vDone === vTotal),
  };
}

const getVName  = tv => (tv.vendor && typeof tv.vendor === 'object') ? tv.vendor.name  : (tv.name  || 'Unknown');
const getVPhone = tv => (tv.vendor && typeof tv.vendor === 'object') ? tv.vendor.phone : (tv.phone || '');
const getVEmail = tv => (tv.vendor && typeof tv.vendor === 'object') ? tv.vendor.email : (tv.email || '');

function Sk({ className = '' }) {
  return <div className={`bg-stone-100 animate-pulse rounded-xl ${className}`} />;
}

/* ─────────────────────────────────────────
   TASK ROW (reused in both general + event tasks)
───────────────────────────────────────── */
function TaskRow({ task, onStatusChange, onToggleSubtask, onUpdateVendorStatus, onDeleteSubtask, onDeleteVendor, onEdit, isManager, isAdmin }) {
  const [expanded, setExpanded] = useState(false);
  const info = getCompletionInfo(task);
  const done = task.status === 'done' || task.status === 'verified';
  const overdue = task.status === 'pending' && isOverdue(task.dueDate);

  const priorityBar = {
    low: 'bg-stone-300', medium: 'bg-amber-400', high: 'bg-orange-400', urgent: 'bg-rose-500'
  }[task.priority] || 'bg-stone-300';

  return (
    <div className={overdue ? 'border-l-2 border-rose-300' : ''}>
      <div className="flex items-start gap-3 px-5 py-4 hover:bg-stone-50/70 transition-colors">
        {/* Checkbox */}
        <div className="mt-0.5 flex-shrink-0">
          <Checkbox
            checked={done}
            onChange={() => {
              if (done) { onStatusChange(task._id, 'pending'); return; }
              if ((info.hasSubtasks || info.hasVendors) && !info.canAutoComplete) { setExpanded(true); return; }
              onStatusChange(task._id, task.status === 'done' && (isAdmin || isManager) ? 'verified' : 'done');
            }}
          />
        </div>

        {/* Priority bar */}
        <div className={`w-0.5 self-stretch rounded-full flex-shrink-0 ${priorityBar} opacity-60`} />

        {/* Content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => (info.hasSubtasks || info.hasVendors) && setExpanded(e => !e)}>
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-medium ${done ? 'text-stone-300 line-through' : 'text-stone-900'}`}>{task.title}</p>
            {(task.priority === 'high' || task.priority === 'urgent') && (
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${task.priority === 'urgent' ? 'text-rose-500' : 'text-orange-500'}`}>
                {task.priority}
              </span>
            )}
            {task.status === 'verified' && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Verified</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-stone-400 flex-wrap">
            {task.dueDate && (
              <span className={overdue ? 'text-rose-400 font-medium' : ''}>
                {formatDate(task.dueDate)}
              </span>
            )}
            {task.assignedTo && <span>· {task.assignedTo.name}</span>}
            {info.hasSubtasks && (
              <span className={info.allSubtasksDone ? 'text-emerald-500' : 'text-amber-500'}>
                · {info.subtasksDone}/{info.subtasksTotal} subtasks
              </span>
            )}
            {info.hasVendors && (
              <span className={info.allVendorsDone ? 'text-emerald-500' : 'text-orange-500'}>
                · {info.vendorsDone}/{info.vendorsTotal} vendors
              </span>
            )}
          </div>
          {task.status === 'pending' && !info.canAutoComplete && (info.hasSubtasks || info.hasVendors) && (
            <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
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

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {(isAdmin || isManager) && (
            <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-all">
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
          {(info.hasSubtasks || info.hasVendors) && (
            <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-all">
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-5 pb-4 bg-stone-50/50 border-t border-stone-50 space-y-3 ml-9">
          {info.hasSubtasks && (
            <div className="pt-4 space-y-2">
              <p className={labelCls}>Subtasks</p>
              {task.subtasks.map(sub => (
                <div key={sub._id} className="group flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-stone-100 hover:border-stone-200 transition-colors">
                  <Checkbox size="sm" checked={sub.completed} onChange={() => onToggleSubtask(task._id, sub._id)} />
                  <span className={`text-sm flex-1 ${sub.completed ? 'text-stone-300 line-through' : 'text-stone-700'}`}>{sub.title}</span>
                  {sub.amount !== 0 && (
                    <span className={`text-[10px] font-semibold flex-shrink-0 ${
                      sub.paymentStatus === 'completed' ? 'text-emerald-500' : sub.paymentStatus === 'partial' ? 'text-amber-500' : 'text-stone-400'
                    }`}>₹{Math.abs(sub.amount).toLocaleString()}</span>
                  )}
                  {(isAdmin || isManager) && (
                    <button onClick={() => onDeleteSubtask(task._id, sub._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 text-stone-300 hover:text-rose-400 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {info.hasVendors && (
            <div className={`${info.hasSubtasks ? '' : 'pt-4'} space-y-2`}>
              <p className={labelCls}>Vendors</p>
              {task.taskVendors.map(tv => (
                <div key={tv._id} className="group flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-stone-100 hover:border-stone-200 transition-colors">
                  <Checkbox size="sm" checked={tv.status === 'completed'}
                    onChange={() => onUpdateVendorStatus(task._id, tv._id, tv.status === 'completed' ? 'pending' : 'completed')} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm ${tv.status === 'completed' ? 'text-stone-300 line-through' : 'text-stone-700'}`}>{getVName(tv)}</span>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {getVPhone(tv) && <span className="text-[11px] text-stone-400 flex items-center gap-1"><Phone className="w-2.5 h-2.5"/>{getVPhone(tv)}</span>}
                      {getVEmail(tv) && <span className="text-[11px] text-stone-400 flex items-center gap-1"><Mail className="w-2.5 h-2.5"/>{getVEmail(tv)}</span>}
                    </div>
                  </div>
                  {tv.amount !== 0 && (
                    <span className={`text-[10px] font-semibold flex-shrink-0 ${
                      tv.paymentStatus === 'completed' ? 'text-emerald-500' : tv.paymentStatus === 'partial' ? 'text-amber-500' : 'text-stone-400'
                    }`}>₹{Math.abs(tv.amount).toLocaleString()}</span>
                  )}
                  {(isAdmin || isManager) && (
                    <button onClick={() => onDeleteVendor(task._id, tv._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 text-stone-300 hover:text-rose-400 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function WeddingDetail() {
  const { id } = useParams();
  const isManager = useAuthStore((s) => s.user?.role === 'relationship_manager' || s.user?.role === 'admin');
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  const [wedding, setWedding]               = useState(null);
  const [tasks, setTasks]                   = useState([]);
  const [tasksByCategory, setTasksByCategory] = useState({});
  const [events, setEvents]                 = useState([]);
  const [loading, setLoading]               = useState(true);
  const [users, setUsers]                   = useState([]);
  const [vendors, setVendors]               = useState([]);

  // Expand state
  const [expandedCats, setExpandedCats]     = useState({});
  const [expandedEvents, setExpandedEvents] = useState({});

  // Modals
  const [showTaskModal, setShowTaskModal]               = useState(false);
  const [showTeamModal, setShowTeamModal]               = useState(false);
  const [showVendorModal, setShowVendorModal]           = useState(false);
  const [showEventModal, setShowEventModal]             = useState(false);
  const [showEventTeamModal, setShowEventTeamModal]     = useState(false);
  const [editingTask, setEditingTask]                   = useState(null);
  const [editingEvent, setEditingEvent]                 = useState(null);
  const [selectedEventForTask, setSelectedEventForTask] = useState(null);
  const [selectedEventForTeam, setSelectedEventForTeam] = useState(null);

  // Forms
  const emptyTask = { title: '', description: '', category: 'other', priority: 'medium', assignedTo: '', dueDate: '', notes: '', event: '', subtasks: [], taskVendors: [] };
  const [taskForm, setTaskForm]   = useState(emptyTask);
  const emptyEvent = { name: '', description: '', eventDate: '', endDate: '', venue: { name: '', address: '', city: '' }, notes: '' };
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [teamForm, setTeamForm]   = useState({ userId: '', role: '' });
  const [vendorForm, setVendorForm] = useState({ vendorId: '', category: '', amount: '', notes: '' });
  const [eventTeamForm, setEventTeamForm] = useState({ userId: '', role: '' });

  // New subtask/vendor helpers
  const [newSubtaskTitle, setNewSubtaskTitle]   = useState('');
  const [newSubtaskAmount, setNewSubtaskAmount] = useState('');
  const emptyVendor = { name: '', phone: '', email: '', address: '', city: '', category: 'other', amount: '' };
  const [newVendor, setNewVendor]               = useState(emptyVendor);

  useEffect(() => { loadWedding(); loadUsers(); loadVendors(); }, [id]);

  const loadWedding = async () => {
    try {
      const r = await api.get(`/weddings/${id}`);
      setWedding(r.data.wedding);
      setTasks(r.data.tasks);
      setTasksByCategory(r.data.tasksByCategory);
      setEvents(r.data.events || []);
      const ce = {}; Object.keys(r.data.tasksByCategory).forEach(c => ce[c] = true);
      setExpandedCats(ce);
      const ee = {}; (r.data.events || []).forEach(ev => ee[ev._id] = true);
      setExpandedEvents(ee);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadUsers   = async () => { try { const r = await api.get('/auth/users'); setUsers(r.data.users); } catch { /* handled by interceptor */ } };
  const loadVendors = async () => { try { const r = await api.get('/vendors'); setVendors(r.data.vendors); } catch { /* handled by interceptor */ } };

  /* Task ops */
  const handleTaskStatus    = async (taskId, status) => { try { await api.put(`/tasks/${taskId}/status`, { status }); loadWedding(); } catch { /* handled by interceptor */ } };
  const handleToggleSubtask = async (taskId, subId) => { try { await api.put(`/tasks/${taskId}/subtasks/${subId}`); loadWedding(); } catch { /* handled by interceptor */ } };
  const handleDeleteSubtask = async (taskId, subId) => { try { await api.delete(`/tasks/${taskId}/subtasks/${subId}`); loadWedding(); } catch { /* handled by interceptor */ } };
  const handleVendorStatus  = async (taskId, tvId, status) => { try { await api.put(`/tasks/${taskId}/vendors/${tvId}`, { status }); loadWedding(); } catch { /* handled by interceptor */ } };
  const handleDeleteVendor  = async (taskId, tvId) => { try { await api.delete(`/tasks/${taskId}/vendors/${tvId}`); loadWedding(); } catch { /* handled by interceptor */ } };

  /* Team / Vendor ops */
  const handleAddTeam   = async (e) => { e.preventDefault(); try { await api.post(`/weddings/${id}/team`, teamForm); loadWedding(); setShowTeamModal(false); setTeamForm({ userId: '', role: '' }); } catch { /* handled by interceptor */ } };
  const handleAddVendor = async (e) => { e.preventDefault(); try { await api.post(`/weddings/${id}/vendors`, vendorForm); loadWedding(); setShowVendorModal(false); setVendorForm({ vendorId: '', category: '', amount: '', notes: '' }); } catch { /* handled by interceptor */ } };

  /* Event ops */
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) await api.put(`/events/${editingEvent._id}`, { ...eventForm, wedding: id });
      else await api.post('/events', { ...eventForm, wedding: id });
      loadWedding(); closeEventModal();
    } catch { /* handled by interceptor */ }
  };
  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Delete this event and all its tasks?')) return;
    try { await api.delete(`/events/${eventId}`); loadWedding(); } catch { /* handled by interceptor */ }
  };
  const handleAddEventTeam = async (e) => {
    e.preventDefault();
    if (!selectedEventForTeam) return;
    try { await api.post(`/events/${selectedEventForTeam}/team`, eventTeamForm); loadWedding(); setShowEventTeamModal(false); setEventTeamForm({ userId: '', role: '' }); setSelectedEventForTeam(null); } catch { /* handled by interceptor */ }
  };
  const handleRemoveEventTeam = async (eventId, userId) => { try { await api.delete(`/events/${eventId}/team/${userId}`); loadWedding(); } catch { /* handled by interceptor */ } };

  /* Task form ops */
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...taskForm,
        assignedTo: taskForm.assignedTo || undefined,
        dueDate: taskForm.dueDate || undefined,
        taskVendors: taskForm.taskVendors.map(v =>
          v.vendor && typeof v.vendor === 'object' && v.vendor._id ? { vendor: v.vendor._id, status: v.status || 'pending' } : v
        ),
      };
      if (editingTask) await api.put(`/tasks/${editingTask._id}`, payload);
      else {
        const cp = { ...payload, wedding: id };
        if (taskForm.event) cp.event = taskForm.event;
        if (selectedEventForTask) cp.event = selectedEventForTask;
        await api.post('/tasks', cp);
      }
      loadWedding(); loadVendors(); closeTaskModal();
    } catch { /* handled by interceptor */ }
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({ title: task.title, description: task.description || '', category: task.category, priority: task.priority, assignedTo: task.assignedTo?._id || '', dueDate: task.dueDate ? task.dueDate.split('T')[0] : '', notes: task.notes || '', event: task.event?._id || '', subtasks: task.subtasks || [], taskVendors: task.taskVendors || [] });
    setShowTaskModal(true);
  };

  const openAddTaskToEvent = (eventId) => {
    setSelectedEventForTask(eventId);
    setTaskForm({ ...emptyTask, event: eventId });
    setShowTaskModal(true);
  };

  const openEditEvent = (event) => {
    setEditingEvent(event);
    setEventForm({ name: event.name, description: event.description || '', eventDate: event.eventDate ? event.eventDate.split('T')[0] : '', endDate: event.endDate ? event.endDate.split('T')[0] : '', venue: event.venue || { name: '', address: '', city: '' }, notes: event.notes || '' });
    setShowEventModal(true);
  };

  const closeTaskModal = () => { setShowTaskModal(false); setEditingTask(null); setSelectedEventForTask(null); setTaskForm(emptyTask); setNewSubtaskTitle(''); setNewSubtaskAmount(''); setNewVendor(emptyVendor); };
  const closeEventModal = () => { setShowEventModal(false); setEditingEvent(null); setEventForm(emptyEvent); };

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setTaskForm(f => ({ ...f, subtasks: [...f.subtasks, { title: newSubtaskTitle.trim(), completed: false, amount: Number(newSubtaskAmount) || 0 }] }));
    setNewSubtaskTitle(''); setNewSubtaskAmount('');
  };
  const addNewVendor = () => {
    if (!newVendor.name.trim()) return;
    setTaskForm(f => ({ ...f, taskVendors: [...f.taskVendors, { ...newVendor, status: 'pending', amount: Number(newVendor.amount) || 0 }] }));
    setNewVendor(emptyVendor);
  };
  const selectExistingVendor = (vendorId) => {
    const v = vendors.find(vv => vv._id === vendorId);
    if (!v) return;
    const already = taskForm.taskVendors.some(tv => (tv.vendor && (tv.vendor._id === v._id || tv.vendor === v._id)) || tv.name?.toLowerCase() === v.name.toLowerCase());
    if (already) return;
    setTaskForm(f => ({ ...f, taskVendors: [...f.taskVendors, { vendor: v._id, status: 'pending' }] }));
  };

  /* Shared task row handlers passed down */
  const taskHandlers = { onStatusChange: handleTaskStatus, onToggleSubtask: handleToggleSubtask, onUpdateVendorStatus: handleVendorStatus, onDeleteSubtask: handleDeleteSubtask, onDeleteVendor: handleDeleteVendor, onEdit: openEditTask, isManager, isAdmin };

  if (loading) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Outfit:wght@300;400;500;600&display=swap'); .font-display{font-family:'Playfair Display',Georgia,serif} .font-body{font-family:'Outfit',sans-serif}`}</style>
        <div className="font-body min-h-screen bg-[#faf9f7]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-10 space-y-6">
            <Sk className="h-5 w-32" />
            <Sk className="h-48" />
            <div className="grid lg:grid-cols-3 gap-6"><Sk className="lg:col-span-2 h-96" /><Sk className="h-64" /></div>
          </div>
        </div>
      </>
    );
  }

  if (!wedding) return (
    <div className="font-body min-h-screen bg-[#faf9f7] flex items-center justify-center">
      <p className="text-stone-400 text-sm">Wedding not found</p>
    </div>
  );

  const days = daysUntil(wedding.weddingDate);
  const prog = wedding.progress || 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=Outfit:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-body    { font-family: 'Outfit', sans-serif; }
      `}</style>

      <div className="font-body min-h-screen bg-[#faf9f7]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-10">

          {/* ── Back ── */}
          <Link to="/weddings" className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-900 text-sm transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Weddings
          </Link>

          {/* ── Wedding header card ── */}
          <div className="bg-white rounded-2xl border border-stone-100 p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.22em] text-rose-400 uppercase mb-2">Wedding</p>
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">{wedding.name}</h1>
                <p className="text-stone-400 text-sm mt-1">{wedding.clientName}</p>
              </div>
              {days !== null && days >= 0 && (
                <div className="text-right flex-shrink-0">
                  <div className="flex items-end gap-1 sm:justify-end">
                    <span className={`font-display text-5xl font-bold leading-none ${days <= 7 ? 'text-rose-500' : 'text-stone-900'}`}>
                      {days === 0 ? '0' : days}
                    </span>
                    <span className="text-stone-400 text-sm mb-1">{days === 0 ? 'days' : 'days left'}</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">until the big day</p>
                </div>
              )}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone-100 rounded-xl overflow-hidden border border-stone-100 mb-8">
              {[
                { label: 'Date',    value: formatDate(wedding.weddingDate), bar: 'bg-rose-400' },
                { label: 'Venue',   value: wedding.venue?.name || 'TBD',    bar: 'bg-stone-400' },
                { label: 'Guests',  value: wedding.guestCount || '—',       bar: 'bg-amber-400' },
                { label: 'Budget',  value: wedding.budget?.estimated > 0 ? formatCurrency(wedding.budget.estimated) : '—', bar: 'bg-emerald-400' },
              ].map(item => (
                <div key={item.label} className="bg-white px-5 py-4">
                  <div className={`h-0.5 w-5 rounded-full ${item.bar} mb-3`} />
                  <p className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase mb-1">{item.label}</p>
                  <p className="text-sm font-medium text-stone-900">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-stone-400">Overall Progress</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400">{wedding.taskStats?.completed || 0} done · {wedding.taskStats?.pending || 0} pending</span>
                  <span className="text-sm font-bold text-stone-900">{prog}%</span>
                </div>
              </div>
              <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-400 rounded-full transition-all duration-700" style={{ width: `${prog}%` }} />
              </div>
            </div>
          </div>

          {/* ── Main content ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT: 2/3 — Events + Tasks */}
            <div className="lg:col-span-2 space-y-6">

              {/* ── Events ── */}
              <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-stone-50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.22em] text-rose-400 uppercase mb-1">Schedule</p>
                    <h2 className="font-display text-xl font-bold text-stone-900">Wedding Events</h2>
                  </div>
                  {(isAdmin || isManager) && (
                    <button onClick={() => setShowEventModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-full text-xs font-semibold hover:bg-stone-800 transition-all">
                      <Plus className="h-3.5 w-3.5" /> Add Event
                    </button>
                  )}
                </div>

                {events.length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <p className="text-stone-300 text-sm">No events planned yet</p>
                    {(isAdmin || isManager) && (
                      <button onClick={() => setShowEventModal(true)}
                        className="inline-flex items-center gap-1.5 mt-3 text-xs text-stone-400 hover:text-stone-700 transition-colors">
                        <Plus className="h-3.5 w-3.5" /> Create first event
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-stone-50">
                    {events.map(ev => {
                      const evTasks = tasks.filter(t => t.event?._id === ev._id || t.event === ev._id);
                      const isExp = expandedEvents[ev._id];
                      return (
                        <div key={ev._id}>
                          {/* Event header row */}
                          <div
                            className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-stone-50/70 transition-colors"
                            onClick={() => setExpandedEvents(p => ({ ...p, [ev._id]: !p[ev._id] }))}
                          >
                            {isExp ? <ChevronDown className="h-4 w-4 text-stone-300 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-stone-300 flex-shrink-0" />}

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-stone-900 text-sm">{ev.name}</p>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-stone-400">
                                <span>{formatDate(ev.eventDate)}</span>
                                {ev.venue?.name && <span>· {ev.venue.name}</span>}
                                <span className={evTasks.length ? 'text-stone-400' : 'text-stone-300'}>· {evTasks.length} task{evTasks.length !== 1 ? 's' : ''}</span>
                              </div>
                            </div>

                            {/* Progress ring */}
                            <div className="flex items-center gap-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
                              <div className="relative hidden sm:block">
                                <ProgressRing pct={ev.progress || 0} size={34} stroke={3} color={ev.progress === 100 ? '#34d399' : '#a8a29e'} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-[9px] font-bold text-stone-600">{ev.progress || 0}%</span>
                                </div>
                              </div>
                              {(isAdmin || isManager) && (
                                <div className="flex items-center gap-0.5">
                                  <button onClick={() => openEditEvent(ev)} className="p-1.5 rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-all"><Edit className="h-3.5 w-3.5" /></button>
                                  <button onClick={() => handleDeleteEvent(ev._id)} className="p-1.5 rounded-lg text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expanded event body */}
                          {isExp && (
                            <div className="bg-stone-50/50 border-t border-stone-50 px-6 pb-5 pt-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Tasks */}
                                <div className="md:col-span-2">
                                  <div className="flex items-center justify-between mb-3">
                                    <p className={labelCls}>Tasks</p>
                                    {(isAdmin || isManager) && (
                                      <button onClick={() => openAddTaskToEvent(ev._id)}
                                        className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors">
                                        <Plus className="h-3 w-3" /> Add Task
                                      </button>
                                    )}
                                  </div>
                                  {evTasks.length === 0 ? (
                                    <p className="text-xs text-stone-300 py-2">No tasks for this event</p>
                                  ) : (
                                    <div className="bg-white rounded-xl border border-stone-100 overflow-hidden divide-y divide-stone-50">
                                      {evTasks.map(task => <TaskRow key={task._id} task={task} {...taskHandlers} />)}
                                    </div>
                                  )}
                                </div>

                                {/* Event team */}
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <p className={labelCls}>Team</p>
                                    {(isAdmin || isManager) && (
                                      <button onClick={() => { setSelectedEventForTeam(ev._id); setShowEventTeamModal(true); }}
                                        className="p-1 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors">
                                        <Plus className="h-3 w-3 text-stone-500" />
                                      </button>
                                    )}
                                  </div>
                                  {!ev.assignedTeam?.length ? (
                                    <p className="text-xs text-stone-300">No team assigned</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {ev.assignedTeam.map((m, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-stone-100">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                                              <span className="text-[10px] font-bold text-rose-500">{m.user?.name?.[0]?.toUpperCase()}</span>
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-xs font-medium text-stone-800 truncate">{m.user?.name}</p>
                                              <p className="text-[10px] text-stone-400 truncate">{m.role || 'Member'}</p>
                                            </div>
                                          </div>
                                          {(isAdmin || isManager) && (
                                            <button onClick={() => handleRemoveEventTeam(ev._id, m.user?._id)}
                                              className="p-1 text-stone-300 hover:text-rose-400 transition-colors flex-shrink-0">
                                              <X className="h-3 w-3" />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── General Tasks by Category ── */}
              <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-stone-50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.22em] text-rose-400 uppercase mb-1">Checklist</p>
                    <h2 className="font-display text-xl font-bold text-stone-900">Tasks</h2>
                  </div>
                  <button onClick={() => setShowTaskModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-full text-xs font-semibold hover:bg-stone-800 transition-all">
                    <Plus className="h-3.5 w-3.5" /> Add Task
                  </button>
                </div>

                {Object.keys(tasksByCategory).length === 0 ? (
                  <div className="px-6 py-14 text-center text-stone-300 text-sm">No tasks yet</div>
                ) : (
                  <div className="divide-y divide-stone-50">
                    {Object.entries(tasksByCategory).map(([category, catTasks]) => {
                      const done = catTasks.filter(t => t.status === 'done' || t.status === 'verified').length;
                      const isExp = expandedCats[category];
                      const pct = catTasks.length ? Math.round((done / catTasks.length) * 100) : 0;

                      return (
                        <div key={category}>
                          <button
                            onClick={() => setExpandedCats(p => ({ ...p, [category]: !p[category] }))}
                            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-stone-50/70 transition-colors text-left"
                          >
                            {isExp ? <ChevronDown className="h-4 w-4 text-stone-300 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-stone-300 flex-shrink-0" />}
                            <span className="font-medium text-stone-800 text-sm capitalize flex-1">{category.replace('_', ' ')}</span>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="hidden sm:block w-16 h-0.5 bg-stone-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-stone-400">{done}/{catTasks.length}</span>
                            </div>
                          </button>

                          {isExp && (
                            <div className="divide-y divide-stone-50 border-t border-stone-50">
                              {catTasks.map(task => <TaskRow key={task._id} task={task} {...taskHandlers} />)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: sidebar ── */}
            <div className="space-y-5">

              {/* Team */}
              <div className="bg-white rounded-2xl border border-stone-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className={labelCls}>Team</p>
                  {isManager && (
                    <button onClick={() => setShowTeamModal(true)} className="p-1.5 rounded-full hover:bg-stone-100 text-stone-300 hover:text-stone-600 transition-all">
                      <UserPlus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {wedding.relationshipManager && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/50 border border-rose-100 mb-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-rose-500">{wedding.relationshipManager.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{wedding.relationshipManager.name}</p>
                      <p className="text-[10px] text-rose-400 font-semibold uppercase tracking-wide">Relationship Manager</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {wedding.assignedTeam?.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-semibold text-stone-600">{m.user?.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{m.user?.name}</p>
                        <p className="text-[10px] text-stone-400 truncate">{m.role || 'Team Member'}</p>
                      </div>
                    </div>
                  ))}
                  {!wedding.assignedTeam?.length && !wedding.relationshipManager && (
                    <p className="text-xs text-stone-300 text-center py-4">No team assigned</p>
                  )}
                </div>
              </div>

              {/* Vendors */}
              <div className="bg-white rounded-2xl border border-stone-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className={labelCls}>Vendors</p>
                  {isManager && (
                    <button onClick={() => setShowVendorModal(true)} className="p-1.5 rounded-full hover:bg-stone-100 text-stone-300 hover:text-stone-600 transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {wedding.vendors?.map((v, i) => (
                    <div key={i} className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-stone-800">{v.vendor?.name}</p>
                        {v.confirmed && (
                          <span className="text-[10px] font-semibold text-emerald-600 flex-shrink-0 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Confirmed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 capitalize mt-0.5">{v.category}</p>
                      {v.amount > 0 && <p className="text-xs font-medium text-emerald-600 mt-1">{formatCurrency(v.amount)}</p>}
                    </div>
                  ))}
                  {!wedding.vendors?.length && (
                    <p className="text-xs text-stone-300 text-center py-4">No vendors assigned</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════ MODALS ════════════════ */}

      {/* Task modal */}
      <Modal isOpen={showTaskModal} onClose={closeTaskModal} title={editingTask ? 'Edit Task' : 'Add Task'} size="lg">
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <Field label="Title">
            <input type="text" value={taskForm.title} placeholder="Task title" required onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Description">
            <textarea value={taskForm.description} rows={2} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} className={`${inputCls} resize-none`} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select value={taskForm.category} onChange={e => setTaskForm(f => ({ ...f, category: e.target.value }))} className={`${inputCls} appearance-none`}>
                {taskCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))} className={`${inputCls} appearance-none`}>
                {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Assign To">
              <select value={taskForm.assignedTo} onChange={e => setTaskForm(f => ({ ...f, assignedTo: e.target.value }))} className={`${inputCls} appearance-none`}>
                <option value="">Select...</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </Field>
            <Field label="Due Date">
              <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} className={inputCls} />
            </Field>
          </div>
          <Field label="Event (optional)">
            <select value={taskForm.event} onChange={e => setTaskForm(f => ({ ...f, event: e.target.value }))} className={`${inputCls} appearance-none`}>
              <option value="">No event</option>
              {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
            </select>
          </Field>

          {/* Subtasks */}
          <div>
            <label className={labelCls}>Subtasks</label>
            <div className="space-y-2 mb-2">
              {taskForm.subtasks.map((sub, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2.5 bg-white border border-stone-100 rounded-xl">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${sub.completed ? 'bg-emerald-400 border-emerald-400' : 'border-stone-300'}`} />
                  <span className="text-sm text-stone-700 flex-1">{sub.title}</span>
                  {sub.amount > 0 && <span className="text-xs text-stone-400">₹{sub.amount.toLocaleString()}</span>}
                  <button type="button" onClick={() => setTaskForm(f => ({ ...f, subtasks: f.subtasks.filter((_,j)=>j!==i) }))} className="p-1 rounded hover:bg-rose-50 text-stone-300 hover:text-rose-400 transition-all"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Add subtask..." value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)} onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();addSubtask();}}} className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-300 focus:outline-none focus:border-stone-400" />
              <input type="number" placeholder="₹" value={newSubtaskAmount} onChange={e => setNewSubtaskAmount(e.target.value)} className="w-24 px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-300 focus:outline-none focus:border-stone-400" />
              <button type="button" onClick={addSubtask} className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Vendors */}
          <div>
            <label className={labelCls}>Vendors</label>
            <div className="space-y-2 mb-2">
              {taskForm.taskVendors.map((tv, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2.5 bg-white border border-stone-100 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-400 flex-shrink-0" />
                  <span className="text-sm text-stone-700 flex-1 truncate">{getVName(tv)}</span>
                  <button type="button" onClick={() => setTaskForm(f => ({ ...f, taskVendors: f.taskVendors.filter((_,j)=>j!==i) }))} className="p-1 rounded hover:bg-rose-50 text-stone-300 hover:text-rose-400 transition-all"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <select value="" onChange={e => { selectExistingVendor(e.target.value); e.target.value=''; }} className={`${inputCls} appearance-none mb-3`}>
              <option value="">Select existing vendor...</option>
              {vendors.map(v => <option key={v._id} value={v._id}>{v.name} ({v.category})</option>)}
            </select>
            <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 space-y-3">
              <p className={`${labelCls} mb-0`}>Or add new vendor</p>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Vendor name" value={newVendor.name} onChange={e => setNewVendor(v => ({ ...v, name: e.target.value }))} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-300 focus:outline-none focus:border-stone-400" />
                <input type="tel" placeholder="Phone" value={newVendor.phone} onChange={e => setNewVendor(v => ({ ...v, phone: e.target.value }))} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-300 focus:outline-none focus:border-stone-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="email" placeholder="Email" value={newVendor.email} onChange={e => setNewVendor(v => ({ ...v, email: e.target.value }))} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-300 focus:outline-none focus:border-stone-400" />
                <select value={newVendor.category} onChange={e => setNewVendor(v => ({ ...v, category: e.target.value }))} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:border-stone-400 appearance-none">
                  {vendorCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <input type="number" placeholder="₹ Budget amount" value={newVendor.amount} onChange={e => setNewVendor(v => ({ ...v, amount: e.target.value }))} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-300 focus:outline-none focus:border-stone-400" />
              <button type="button" onClick={addNewVendor} className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Vendor
              </button>
            </div>
          </div>

          <Field label="Notes">
            <textarea value={taskForm.notes} rows={2} onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} resize-none`} />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button type="button" onClick={closeTaskModal} className="px-5 py-2.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-400 transition-all">Cancel</button>
            <button type="submit" className="px-7 py-2.5 rounded-full text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-all">{editingTask ? 'Update' : 'Create'} Task</button>
          </div>
        </form>
      </Modal>

      {/* Team modal */}
      <Modal isOpen={showTeamModal} onClose={() => setShowTeamModal(false)} title="Add Team Member" size="sm">
        <form onSubmit={handleAddTeam} className="space-y-4">
          <Field label="Team Member">
            <select value={teamForm.userId} onChange={e => setTeamForm(f => ({ ...f, userId: e.target.value }))} required className={`${inputCls} appearance-none`}>
              <option value="">Select member...</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role.replace('_',' ')})</option>)}
            </select>
          </Field>
          <Field label="Role">
            <input type="text" value={teamForm.role} placeholder="e.g. Decor Lead" onChange={e => setTeamForm(f => ({ ...f, role: e.target.value }))} className={inputCls} />
          </Field>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button type="button" onClick={() => setShowTeamModal(false)} className="px-5 py-2.5 rounded-full text-sm text-stone-500 border border-stone-200 hover:border-stone-400 transition-all">Cancel</button>
            <button type="submit" className="px-7 py-2.5 rounded-full text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-all">Add Member</button>
          </div>
        </form>
      </Modal>

      {/* Vendor modal */}
      <Modal isOpen={showVendorModal} onClose={() => setShowVendorModal(false)} title="Add Vendor" size="sm">
        <form onSubmit={handleAddVendor} className="space-y-4">
          <Field label="Vendor">
            <select value={vendorForm.vendorId} onChange={e => setVendorForm(f => ({ ...f, vendorId: e.target.value }))} required className={`${inputCls} appearance-none`}>
              <option value="">Select vendor...</option>
              {vendors.map(v => <option key={v._id} value={v._id}>{v.name} ({v.category})</option>)}
            </select>
          </Field>
          <Field label="Amount">
            <input type="number" value={vendorForm.amount} placeholder="₹0" onChange={e => setVendorForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Notes">
            <textarea value={vendorForm.notes} rows={2} onChange={e => setVendorForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} resize-none`} />
          </Field>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button type="button" onClick={() => setShowVendorModal(false)} className="px-5 py-2.5 rounded-full text-sm text-stone-500 border border-stone-200 hover:border-stone-400 transition-all">Cancel</button>
            <button type="submit" className="px-7 py-2.5 rounded-full text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-all">Add Vendor</button>
          </div>
        </form>
      </Modal>

      {/* Event modal */}
      <Modal isOpen={showEventModal} onClose={closeEventModal} title={editingEvent ? 'Edit Event' : 'Add Event'} size="md">
        <form onSubmit={handleEventSubmit} className="space-y-4">
          <Field label="Event Name">
            <input type="text" value={eventForm.name} placeholder="e.g. Mehendi, Sangeet, Reception" required onChange={e => setEventForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Description">
            <textarea value={eventForm.description} rows={2} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} className={`${inputCls} resize-none`} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date/Time">
              <input type="datetime-local" value={eventForm.eventDate} required onChange={e => setEventForm(f => ({ ...f, eventDate: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="End Date/Time">
              <input type="datetime-local" value={eventForm.endDate} onChange={e => setEventForm(f => ({ ...f, endDate: e.target.value }))} className={inputCls} />
            </Field>
          </div>
          <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 space-y-3">
            <label className={`${labelCls} mb-0`}>Venue</label>
            <input type="text" placeholder="Venue name" value={eventForm.venue.name} onChange={e => setEventForm(f => ({ ...f, venue: { ...f.venue, name: e.target.value } }))} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-300 focus:outline-none focus:border-stone-400" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Address" value={eventForm.venue.address} onChange={e => setEventForm(f => ({ ...f, venue: { ...f.venue, address: e.target.value } }))} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-300 focus:outline-none focus:border-stone-400" />
              <input type="text" placeholder="City" value={eventForm.venue.city} onChange={e => setEventForm(f => ({ ...f, venue: { ...f.venue, city: e.target.value } }))} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-300 focus:outline-none focus:border-stone-400" />
            </div>
          </div>
          <Field label="Notes">
            <textarea value={eventForm.notes} rows={2} onChange={e => setEventForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} resize-none`} />
          </Field>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button type="button" onClick={closeEventModal} className="px-5 py-2.5 rounded-full text-sm text-stone-500 border border-stone-200 hover:border-stone-400 transition-all">Cancel</button>
            <button type="submit" className="px-7 py-2.5 rounded-full text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-all">{editingEvent ? 'Update' : 'Create'} Event</button>
          </div>
        </form>
      </Modal>

      {/* Event team modal */}
      <Modal isOpen={showEventTeamModal} onClose={() => setShowEventTeamModal(false)} title="Assign to Event" size="sm">
        <form onSubmit={handleAddEventTeam} className="space-y-4">
          <Field label="Team Member">
            <select value={eventTeamForm.userId} onChange={e => setEventTeamForm(f => ({ ...f, userId: e.target.value }))} required className={`${inputCls} appearance-none`}>
              <option value="">Select from wedding team...</option>
              {(wedding.assignedTeam || []).map(m => <option key={m.user?._id} value={m.user?._id}>{m.user?.name} ({m.role || 'Member'})</option>)}
            </select>
          </Field>
          <Field label="Event Role (optional)">
            <input type="text" value={eventTeamForm.role} placeholder="e.g. Stage Manager" onChange={e => setEventTeamForm(f => ({ ...f, role: e.target.value }))} className={inputCls} />
          </Field>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button type="button" onClick={() => setShowEventTeamModal(false)} className="px-5 py-2.5 rounded-full text-sm text-stone-500 border border-stone-200 hover:border-stone-400 transition-all">Cancel</button>
            <button type="submit" className="px-7 py-2.5 rounded-full text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-all">Assign</button>
          </div>
        </form>
      </Modal>
    </>
  );
}