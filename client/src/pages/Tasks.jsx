import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare, Clock, AlertTriangle, ChevronRight,
  Phone, Mail, AlertCircle, Plus, X, Edit, Trash2, Calendar
} from 'lucide-react';
import { formatDate, taskCategories, vendorCategories, isOverdue } from '../utils/helpers';
import useAuthStore from '../stores/authStore';
import useTaskStore from '../stores/taskStore';
import useToastStore from '../stores/toastStore';
import DocumentsDrawer from '../components/shared/DocumentsDrawer';

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
   PRIORITY META — Stone Palette
───────────────────────────────────────── */
const PRIORITY = {
  low:    { bar: 'bg-stone-300',  text: 'text-stone-400'  },
  medium: { bar: 'bg-stone-400',  text: 'text-stone-500'  },
  high:   { bar: 'bg-amber-700',  text: 'text-amber-700'  },
  urgent: { bar: 'bg-[#c0604a]',  text: 'text-[#c0604a]'  },
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

/* ─────────────────────────────────────────
   TASK DETAIL DRAWER  (slides in from right)
───────────────────────────────────────── */
function TaskDetailDrawer({ task, onClose, onStatusChange, onToggleSubtask, onUpdateVendorStatus, onEdit, isManager, onOpenDocs }) {
  const [visible, setVisible] = useState(false);
  const info = task ? getCompletionInfo(task) : {};
  const done = task && (task.status === 'done' || task.status === 'verified');
  const overdue = task && task.status === 'pending' && isOverdue(task.dueDate);

  useEffect(() => {
    if (task) {
      requestAnimationFrame(() => setVisible(true));
    }
  }, [task]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className={`absolute inset-0 transition-opacity duration-300 ${visible ? 'bg-stone-950/20 backdrop-blur-[2px]' : 'bg-transparent'}`} onClick={handleClose} />
      <div className={`relative w-full max-w-md bg-[#faf9f7] shadow-2xl transition-transform duration-300 ease-out overflow-y-auto ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="sticky top-0 bg-[#faf9f7] border-b border-stone-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1">Task Detail</p>
            <h3 className={`font-display text-lg font-medium leading-tight ${done ? 'text-stone-300 line-through' : 'text-stone-900'}`}>{task.title}</h3>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0 ml-3">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {task.wedding && (
              <div className="col-span-2">
                <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1">Wedding</p>
                <Link to={`/weddings/${task.wedding._id}`} className="text-sm text-stone-700 hover:text-stone-900 transition-colors italic">{task.wedding.name}</Link>
              </div>
            )}
            {task.dueDate && (
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1">Due Date</p>
                <p className={`text-sm ${overdue ? 'text-amber-700 font-medium' : 'text-stone-700'}`}>{formatDate(task.dueDate)}</p>
              </div>
            )}
            {task.assignedTo && (
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1">Assigned To</p>
                <p className="text-sm text-stone-700">{task.assignedTo.name}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1">Priority</p>
              <p className={`text-sm font-medium capitalize ${task.priority === 'urgent' ? 'text-[#c0604a]' : task.priority === 'high' ? 'text-amber-700' : 'text-stone-700'}`}>{task.priority}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1">Status</p>
              <p className={`text-sm font-medium capitalize ${done ? 'text-teal-700' : overdue ? 'text-amber-700' : 'text-stone-700'}`}>{task.status?.replace('_', ' ')}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {!done && (
              <button onClick={() => { onStatusChange(task._id, 'done'); handleClose(); }}
                className="flex-1 px-4 py-2.5 bg-stone-900 text-white rounded-full text-[11px] font-semibold hover:bg-stone-800 transition-all text-center">
                Mark Complete
              </button>
            )}
            {done && (
              <button onClick={() => { onStatusChange(task._id, 'pending'); handleClose(); }}
                className="flex-1 px-4 py-2.5 border border-stone-200 text-stone-600 rounded-full text-[11px] font-semibold hover:bg-stone-50 transition-all text-center">
                Reopen
              </button>
            )}
            {isManager && (
              <button onClick={() => { onEdit(task); handleClose(); }}
                className="px-4 py-2.5 border border-stone-200 text-stone-600 rounded-full text-[11px] font-semibold hover:bg-stone-50 transition-all">
                Edit
              </button>
            )}
            <button onClick={() => { onOpenDocs('task', task._id, task.title, task.documents); }}
              className="px-4 py-2.5 border border-stone-200 text-stone-600 rounded-full text-[11px] font-semibold hover:bg-stone-50 transition-all">
              Docs {task.documents?.length ? `(${task.documents.length})` : ''}
            </button>
          </div>

          {/* Subtasks */}
          {info.hasSubtasks && (
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-3">
                Subtasks <span className="text-stone-300 ml-1">{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
              </p>
              <div className="bg-white rounded-xl border border-stone-200/60 divide-y divide-stone-100/60 overflow-hidden">
                {task.subtasks.map(sub => (
                  <div key={sub._id} className="group flex items-center gap-3 px-4 py-3 hover:bg-[#faf9f7] transition-colors">
                    <Checkbox size="sm" checked={sub.completed} onChange={() => onToggleSubtask(task._id, sub._id)} />
                    <span className={`text-[13px] flex-1 ${sub.completed ? 'text-stone-300 line-through' : 'text-stone-600'}`}>{sub.title}</span>
                    {sub.amount !== 0 && (
                      <span className={`text-[11px] font-medium flex-shrink-0 ${
                        sub.paymentStatus === 'completed' ? 'text-teal-700' : sub.paymentStatus === 'partial' ? 'text-amber-700' : 'text-stone-400'
                      }`}>₹{Math.abs(sub.amount).toLocaleString()}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vendors */}
          {info.hasVendors && (
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-3">
                Vendors <span className="text-stone-300 ml-1">{task.taskVendors.filter(v => v.status === 'completed').length}/{task.taskVendors.length}</span>
              </p>
              <div className="bg-white rounded-xl border border-stone-200/60 divide-y divide-stone-100/60 overflow-hidden">
                {task.taskVendors.map(tv => (
                  <div key={tv._id} className="group flex items-center gap-3 px-4 py-3 hover:bg-[#faf9f7] transition-colors">
                    <Checkbox size="sm" checked={tv.status === 'completed'}
                      onChange={() => onUpdateVendorStatus(task._id, tv._id, tv.status === 'completed' ? 'pending' : 'completed')} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] ${tv.status === 'completed' ? 'text-stone-300 line-through' : 'text-stone-600'}`}>{getVendorName(tv)}</p>
                      {(getVendorPhone(tv) || getVendorEmail(tv)) && (
                        <p className="text-[11px] text-stone-400 mt-0.5 truncate">{getVendorPhone(tv)}{getVendorPhone(tv) && getVendorEmail(tv) && ' · '}{getVendorEmail(tv)}</p>
                      )}
                    </div>
                    {tv.amount !== 0 && (
                      <span className={`text-[11px] font-medium flex-shrink-0 ${
                        tv.paymentStatus === 'completed' ? 'text-teal-700' : tv.paymentStatus === 'partial' ? 'text-amber-700' : 'text-stone-400'
                      }`}>₹{Math.abs(tv.amount).toLocaleString()}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function Tasks() {
  const user = useAuthStore((s) => s.user);
  const isManager = useAuthStore((s) => s.user?.role === 'relationship_manager' || s.user?.role === 'admin');
  const {
    tasks, weddings, events, users, vendors, loading,
    fetchTasks, fetchEventsForWedding, updateTaskStatus, toggleSubtask,
    updateTaskVendorStatus, createTask, updateTask
  } = useTaskStore();
  const [filter, setFilter]     = useState({ status: '', category: '', wedding: '', event: '' });
  const [filterEvents, setFilterEvents] = useState([]);
  const [view, setView]         = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [docsSettings, setDocsSettings] = useState({ isOpen: false, entityId: null, entityType: null, title: '' });

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

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  /* Keep drawer data fresh */
  useEffect(() => {
    if (selectedTask) {
      const fresh = tasks.find(t => t._id === selectedTask._id);
      if (fresh) setSelectedTask(fresh);
      else setSelectedTask(null);
    }
  }, [tasks]);

  const handleStatus = async (taskId, newStatus) => {
    await updateTaskStatus(taskId, newStatus);
  };

  const handleToggleSubtask = async (taskId, subId) => {
    await toggleSubtask(taskId, subId);
  };

  const handleVendorStatus = async (taskId, vendorId, status) => {
    await updateTaskVendorStatus(taskId, vendorId, status);
  };

  const handleOpenDocs = (type, id, title) => {
    setDocsSettings({ isOpen: true, entityId: id, entityType: type, title });
  };
  const handleDocsUpdate = () => { fetchTasks(); };

  const loadEventsForWedding = async (weddingId) => {
    if (!weddingId) { return; }
    await fetchEventsForWedding(weddingId);
  };

  const handleFilterWedding = async (weddingId) => {
    setFilter(f => ({ ...f, wedding: weddingId, event: '' }));
    if (weddingId) {
      await fetchEventsForWedding(weddingId);
      setFilterEvents(events);
    } else setFilterEvents([]);
  };

  const handleWeddingChange = (weddingId) => {
    setForm(f => ({ ...f, wedding: weddingId, event: '' }));
    loadEventsForWedding(weddingId);
  };

  const openCreate = () => { setEditingTask(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (task) => {
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
    if (!form.wedding) { useToastStore.getState().warning('Please select a wedding'); return; }
    const payload = {
      ...form,
      assignedTo: form.assignedTo || undefined,
      dueDate: form.dueDate || undefined,
      event: form.event || undefined,
      taskVendors: form.taskVendors.map(v =>
        v.vendor && typeof v.vendor === 'object' && v.vendor._id
          ? { vendor: v.vendor._id, status: v.status || 'pending' }
          : v
      )
    };
    if (editingTask) await updateTask(editingTask._id, payload);
    else await createTask(payload);
    closeModal();
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

        {/* ── Hero Header ── */}
        <div className="bg-stone-900 py-12 sm:py-16 px-5 sm:px-8 lg:px-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#b07d46] uppercase mb-2">Operations</p>
              <h1 className="font-display text-4xl sm:text-5xl font-medium text-white">Task Directory</h1>
              <p className="text-stone-400 text-sm mt-2">Master checklist across all events.</p>
            </div>
            {isManager && (
              <button onClick={openCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#faf9f7] text-stone-900 rounded-lg text-sm font-medium hover:bg-white transition-all self-start sm:self-auto flex-shrink-0">
                <Plus className="h-4 w-4" /> New Task
              </button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-12">

          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Sk key={i} className="h-28" />)}</div>
              <Sk className="h-16" />
              <Sk className="h-[500px]" />
            </div>
          ) : (
            <>
              {/* ── Analytics: Stats + Bar Chart ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                {/* Stats cards - 2x2 grid */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                  {[
                    { label: 'All Tasks', value: stats.total, bar: 'bg-stone-300', onClick: () => { setView('all'); setFilter(f => ({ ...f, status: '' })); } },
                    { label: 'Pending', value: stats.pending, bar: 'bg-amber-700', onClick: () => { setView('all'); setFilter(f => ({ ...f, status: 'pending' })); } },
                    { label: 'Completed', value: stats.done, bar: 'bg-teal-700', onClick: () => { setView('all'); setFilter(f => ({ ...f, status: 'done' })); } },
                    { label: 'Overdue', value: stats.overdue, bar: stats.overdue > 0 ? 'bg-[#c0604a]' : 'bg-stone-200', onClick: () => setView('overdue') },
                  ].map(m => (
                    <button key={m.label} onClick={m.onClick}
                      className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/60 text-left transition-all duration-300 hover:-translate-y-0.5 group">
                      <div className={`h-[1px] w-8 ${m.bar} mb-3 transition-all duration-300 group-hover:w-12`} />
                      <p className="font-display text-3xl font-medium text-stone-900 leading-none">{m.value}</p>
                      <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mt-2">{m.label}</p>
                    </button>
                  ))}
                </div>

                {/* Bar chart - Top weddings by task count */}
                <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-sm">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-4">Top Weddings by Tasks</h3>
                  {(() => {
                    const weddingCounts = {};
                    tasks.forEach(t => {
                      if (t.wedding) {
                        const wName = t.wedding.name || 'Unknown';
                        weddingCounts[wName] = (weddingCounts[wName] || 0) + 1;
                      }
                    });
                    const sorted = Object.entries(weddingCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5);
                    const maxCount = sorted.length > 0 ? sorted[0][1] : 1;

                    if (sorted.length === 0) return <p className="text-sm text-stone-400 italic text-center py-6">No data yet</p>;

                    return (
                      <div className="space-y-3">
                        {sorted.map(([name, count]) => {
                          const widthPct = Math.max((count / maxCount) * 100, 8);
                          return (
                            <div key={name} className="flex items-center gap-3">
                              <div className="w-20 flex-shrink-0 truncate">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 truncate">{name.length > 10 ? name.slice(0, 10) + '…' : name}</span>
                              </div>
                              <div className="flex-1 h-7 bg-stone-100 rounded-lg overflow-hidden relative">
                                <div
                                  className="h-full bg-stone-700 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                                  style={{ width: `${widthPct}%` }}
                                >
                                  {count > 0 && <span className="text-[10px] font-bold text-white">{count}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* ── Filters ── */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4 mb-6">
                <div className="flex gap-1 p-1 bg-white border border-stone-200/60 shadow-sm rounded-lg self-start">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'my', label: 'Mine' },
                    { id: 'overdue', label: 'Overdue' },
                  ].map(t => (
                    <button key={t.id} onClick={() => setView(t.id)}
                      className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-300 ${
                        view === t.id ? 'bg-stone-900 text-[#faf9f7]' : 'text-stone-400 hover:text-stone-900'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 sm:ml-auto">
                  <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
                    className="py-2.5 px-4 text-sm rounded-lg bg-white border border-stone-200/60 shadow-sm text-stone-700 focus:outline-none focus:border-stone-400 appearance-none transition-all w-full sm:w-44">
                    <option value="">All Categories</option>
                    {taskCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>

                  <select value={filter.wedding} onChange={e => handleFilterWedding(e.target.value)}
                    className="py-2.5 px-4 text-sm rounded-lg bg-white border border-stone-200/60 shadow-sm text-stone-700 focus:outline-none focus:border-stone-400 appearance-none transition-all w-full sm:w-48">
                    <option value="">All Weddings</option>
                    {weddings.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>

                  {filter.wedding && filterEvents.length > 0 && (
                    <select value={filter.event} onChange={e => setFilter(f => ({ ...f, event: e.target.value }))}
                      className="py-2.5 px-4 text-sm rounded-lg bg-white border border-stone-200/60 shadow-sm text-stone-700 focus:outline-none focus:border-stone-400 appearance-none transition-all w-full sm:w-48">
                      <option value="">All Events</option>
                      {filterEvents.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* ── Task Table ── */}
              {filteredTasks.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm py-20 text-center">
                  <p className="text-stone-400 text-sm italic">No tasks match your current filters.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone-100/60 bg-[#faf9f7]/50">
                          {['', 'Task', 'Wedding', 'Due Date', 'Category', 'Assigned', 'Status', ''].map(h => (
                            <th key={h || Math.random()} className={`text-left px-5 py-4 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase whitespace-nowrap
                              ${h === 'Due Date' || h === 'Category' ? 'hidden md:table-cell' : ''}
                              ${h === 'Assigned' ? 'hidden lg:table-cell' : ''}
                            `}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100/60">
                        {filteredTasks.map(task => {
                          const info    = getCompletionInfo(task);
                          const overdue = task.status === 'pending' && isOverdue(task.dueDate);
                          const done    = task.status === 'done' || task.status === 'verified';

                          return (
                            <tr
                              key={task._id}
                              onClick={() => setSelectedTask(task)}
                              className="cursor-pointer hover:bg-[#faf9f7] transition-all group"
                            >
                              {/* Checkbox */}
                              <td className="px-5 py-4 w-10" onClick={e => e.stopPropagation()}>
                                <Checkbox checked={done} onChange={() => {
                                  if (done) { handleStatus(task._id, 'pending'); return; }
                                  if ((info.hasSubtasks || info.hasVendors) && !info.canAutoComplete) { setSelectedTask(task); return; }
                                  handleStatus(task._id, 'done');
                                }} />
                              </td>

                              {/* Task name */}
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${done ? 'text-stone-300 line-through' : 'text-stone-900'}`}>{task.title}</span>
                                  {task.priority === 'urgent' && <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#c0604a]">Urgent</span>}
                                  {task.priority === 'high' && <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-700">High</span>}
                                </div>
                                {info.hasSubtasks && (
                                  <p className="text-[11px] text-stone-400 mt-0.5">{info.subtasksDone}/{info.subtasksTotal} subtasks</p>
                                )}
                              </td>

                              {/* Wedding */}
                              <td className="px-5 py-4">
                                {task.wedding ? (
                                  <span className="text-sm text-stone-600 italic">{task.wedding.name}</span>
                                ) : <span className="text-stone-300">—</span>}
                              </td>

                              {/* Due Date */}
                              <td className="px-5 py-4 hidden md:table-cell whitespace-nowrap">
                                {task.dueDate ? (
                                  <span className={`text-sm ${overdue ? 'text-amber-700 font-medium' : 'text-stone-600'}`}>{formatDate(task.dueDate)}</span>
                                ) : <span className="text-stone-300">—</span>}
                              </td>

                              {/* Category */}
                              <td className="px-5 py-4 hidden md:table-cell">
                                <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-stone-400">{task.category}</span>
                              </td>

                              {/* Assigned */}
                              <td className="px-5 py-4 hidden lg:table-cell">
                                {task.assignedTo ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full border border-stone-200/60 bg-stone-100 flex items-center justify-center flex-shrink-0">
                                      <span className="text-[10px] font-medium text-stone-600">{task.assignedTo.name?.charAt(0)?.toUpperCase()}</span>
                                    </div>
                                    <span className="text-xs text-stone-500 truncate max-w-[80px]">{task.assignedTo.name?.split(' ')[0]}</span>
                                  </div>
                                ) : <span className="text-stone-300 text-xs">—</span>}
                              </td>

                              {/* Status */}
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] bg-white border border-stone-200/60 shadow-sm ${
                                  done ? 'text-teal-700' : overdue ? 'text-amber-700' : 'text-stone-500'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-teal-700' : overdue ? 'bg-amber-700' : 'bg-stone-300'}`} />
                                  {done ? 'Done' : overdue ? 'Overdue' : 'Pending'}
                                </span>
                              </td>

                              {/* Arrow */}
                              <td className="px-5 py-4 text-right">
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
                  <button type="button" onClick={() => setForm(f => ({ ...f, subtasks: f.subtasks.filter((_, j) => j !== i) }))}
                    className="p-1 rounded-full hover:bg-stone-100 text-stone-300 hover:text-[#c0604a] transition-all">
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
                  <button type="button" onClick={() => setForm(f => ({ ...f, taskVendors: f.taskVendors.filter((_, j) => j !== i) }))}
                    className="p-1 rounded-full hover:bg-stone-100 text-stone-300 hover:text-[#c0604a] transition-all">
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

      {/* ═══ Task Detail Drawer ═══ */}
      <TaskDetailDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={handleStatus}
        onToggleSubtask={handleToggleSubtask}
        onUpdateVendorStatus={handleVendorStatus}
        onEdit={openEdit}
        isManager={isManager}
        onOpenDocs={handleOpenDocs}
      />
      <DocumentsDrawer 
        isOpen={docsSettings.isOpen} 
        onClose={() => setDocsSettings(s => ({ ...s, isOpen: false }))}
        entityId={docsSettings.entityId}
        entityType={docsSettings.entityType}
        title={docsSettings.title}
        documents={tasks.find(t => t._id === docsSettings.entityId)?.documents || []}
        onUpload={handleDocsUpdate}
        onDelete={handleDocsUpdate}
      />
    </>
  );
}