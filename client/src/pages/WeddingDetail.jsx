import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Clock, UserPlus, Edit, Check,
  ChevronDown, ChevronRight, Trash2, Phone, X, AlertCircle, Mail,
  MapPin, Calendar, IndianRupee, Users, Heart, Building2, Star, FileText, Palette, Image, Video
} from 'lucide-react';
import { formatDate, formatCurrency, taskCategories, vendorCategories, daysUntil, isOverdue } from '../utils/helpers';
import useAuthStore from '../stores/authStore';
import api from '../utils/api';
import DocumentsDrawer from '../components/shared/DocumentsDrawer';

/* ─────────────────────────────────────────
   DESIGN TOKENS (matches Dashboard / Leads)
   Font: Cormorant Garamond (display) + Inter (body)
───────────────────────────────────────── */

const inputCls = "w-full px-4 py-3 bg-white border border-stone-200/60 shadow-sm rounded-xl text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all duration-300";
const labelCls = "block text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2";

function Field({ label, children }) {
  return <div>{label && <label className={labelCls}>{label}</label>}{children}</div>;
}

/* ── Modal ── */
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;
  const maxW = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }[size] || 'sm:max-w-lg';
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-[#faf9f7] rounded-t-2xl sm:rounded-2xl shadow-sm border border-stone-200/60 w-full ${maxW} max-h-[92vh] flex flex-col overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200/60 flex-shrink-0">
          <h2 className="font-display text-xl font-medium text-stone-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-200/50 text-stone-400 hover:text-stone-900 transition-all duration-300">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ── Checkbox ── */
function Checkbox({ checked, onChange, size = 'md' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <button type="button" onClick={onChange}
      className={`${sz} rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        checked ? 'bg-[#5a8f72] border-[#5a8f72]' : 'border-stone-300 hover:border-stone-500'
      }`}>
      {checked && (
        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

/* ── Progress Ring ── */
function ProgressRing({ pct = 0, size = 36, stroke = 3, color = '#a8a29e' }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="rotate-[-90deg] flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0ede8" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ - (pct/100)*circ} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
    </svg>
  );
}

/* ── Skeleton ── */
function Sk({ className = '' }) {
  return <div className={`bg-stone-200/50 animate-pulse rounded-2xl ${className}`} />;
}

/* ── Helpers ── */
function getCompletionInfo(task) {
  const sDone  = task.subtasks?.filter(s => s.completed).length || 0;
  const sTotal = task.subtasks?.length || 0;
  const vDone  = task.taskVendors?.filter(v => v.status === 'completed').length || 0;
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

/* ── Priority styles ── */
const PRIORITY = {
  low:    { bar: 'bg-stone-300',    label: null },
  medium: { bar: 'bg-stone-400',    label: null },
  high:   { bar: 'bg-[#b07d46]',   label: 'text-[#b07d46]' },
  urgent: { bar: 'bg-[#c0604a]',   label: 'text-[#c0604a]' },
};

/* ─────────────────────────────────────────
   TASK ROW  (flat row · click opens drawer)
───────────────────────────────────────── */
function TaskRow({ task, onStatusChange, onSelect, onEdit, isManager, isAdmin }) {
  const info    = getCompletionInfo(task);
  const done    = task.status === 'done' || task.status === 'verified';
  const overdue = task.status === 'pending' && isOverdue(task.dueDate);
  const pri     = PRIORITY[task.priority] || PRIORITY.medium;

  return (
    <div
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#faf9f7] transition-colors cursor-pointer group"
      onClick={() => onSelect(task)}
    >
      <div className={`w-[2px] h-8 rounded-full flex-shrink-0 ${done ? 'bg-stone-200' : overdue ? 'bg-amber-700' : pri.bar}`} />
      <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
        <Checkbox checked={done} onChange={() => {
          if (done) { onStatusChange(task._id, 'pending'); return; }
          if ((info.hasSubtasks || info.hasVendors) && !info.canAutoComplete) { onSelect(task); return; }
          onStatusChange(task._id, task.status === 'done' && (isAdmin || isManager) ? 'verified' : 'done');
        }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm truncate ${done ? 'text-stone-300 line-through' : 'font-medium text-stone-900'}`}>{task.title}</p>
        {task.dueDate && (
          <p className={`text-xs mt-0.5 italic truncate ${overdue ? 'text-amber-700' : 'text-stone-400'}`}>
            {formatDate(task.dueDate)}{task.assignedTo ? ` · ${task.assignedTo.name}` : ''}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {task.status === 'verified' && <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-teal-700">Verified</span>}
        {(info.hasSubtasks || info.hasVendors) && !done && (
          <span className="text-[10px] text-stone-400">{info.subtasksDone + info.vendorsDone}/{info.subtasksTotal + info.vendorsTotal}</span>
        )}
        {(isAdmin || isManager) && (
          <button onClick={e => { e.stopPropagation(); onEdit(task); }} className="p-1 rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-all opacity-0 group-hover:opacity-100">
            <Edit className="w-3.5 h-3.5" />
          </button>
        )}
        <ChevronRight className="w-4 h-4 text-stone-300" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   TASK DETAIL DRAWER  (slides in from right)
───────────────────────────────────────── */
function TaskDetailDrawer({ task, onClose, onStatusChange, onToggleSubtask, onUpdateVendorStatus, onDeleteSubtask, onDeleteVendor, onEdit, isManager, isAdmin, onOpenDocs }) {
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
              <button onClick={() => { onStatusChange(task._id, (isAdmin || isManager) ? 'verified' : 'done'); handleClose(); }}
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
            {(isAdmin || isManager) && (
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
                    {(isAdmin || isManager) && (
                      <button onClick={() => onDeleteSubtask(task._id, sub._id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-300 hover:text-[#c0604a] transition-all"><Trash2 className="w-3 h-3" /></button>
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
                      <p className={`text-[13px] ${tv.status === 'completed' ? 'text-stone-300 line-through' : 'text-stone-600'}`}>{getVName(tv)}</p>
                      {(getVPhone(tv) || getVEmail(tv)) && (
                        <p className="text-[11px] text-stone-400 mt-0.5 truncate">{getVPhone(tv)}{getVPhone(tv) && getVEmail(tv) && ' · '}{getVEmail(tv)}</p>
                      )}
                    </div>
                    {tv.amount !== 0 && (
                      <span className={`text-[11px] font-medium flex-shrink-0 ${
                        tv.paymentStatus === 'completed' ? 'text-teal-700' : tv.paymentStatus === 'partial' ? 'text-amber-700' : 'text-stone-400'
                      }`}>₹{Math.abs(tv.amount).toLocaleString()}</span>
                    )}
                    {(isAdmin || isManager) && (
                      <button onClick={() => onDeleteVendor(task._id, tv._id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-300 hover:text-[#c0604a] transition-all"><Trash2 className="w-3 h-3" /></button>
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
export default function WeddingDetailWrapper() {
  const { id }      = useParams();
  const isManager   = useAuthStore(s => s.user?.role === 'relationship_manager' || s.user?.role === 'admin');
  const isAdmin     = useAuthStore(s => s.user?.role === 'admin');

  const [wedding, setWedding]                 = useState(null);
  const [tasks, setTasks]                     = useState([]);
  const [tasksByCategory, setTasksByCategory] = useState({});
  const [events, setEvents]                   = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [users, setUsers]                     = useState([]);
  const [vendors, setVendors]                 = useState([]);

  const [expandedCats, setExpandedCats]       = useState({});
  const [expandedEvents, setExpandedEvents]   = useState({});

  const [showTaskModal, setShowTaskModal]               = useState(false);
  const [showTeamModal, setShowTeamModal]               = useState(false);
  const [showVendorModal, setShowVendorModal]           = useState(false);
  const [showEventModal, setShowEventModal]             = useState(false);
  const [showEventTeamModal, setShowEventTeamModal]     = useState(false);
  const [editingTask, setEditingTask]                   = useState(null);
  const [editingEvent, setEditingEvent]                 = useState(null);
  const [selectedEventForTask, setSelectedEventForTask] = useState(null);
  const [selectedEventForTeam, setSelectedEventForTeam] = useState(null);
  const [selectedTask, setSelectedTask]                 = useState(null);
  const [docsSettings, setDocsSettings]                 = useState({ isOpen: false, entityId: null, entityType: null, title: '' });
  const [eventMoodItems, setEventMoodItems]             = useState({});
  const [moodDetailItem, setMoodDetailItem]             = useState(null);

  const emptyTask  = { title: '', description: '', category: 'other', priority: 'medium', assignedTo: '', dueDate: '', notes: '', event: '', subtasks: [], taskVendors: [] };
  const emptyEvent = { name: '', description: '', eventDate: '', endDate: '', venue: { name: '', address: '', city: '' }, notes: '' };
  const [taskForm, setTaskForm]     = useState(emptyTask);
  const [eventForm, setEventForm]   = useState(emptyEvent);
  const [teamForm, setTeamForm]     = useState({ userId: '', role: '' });
  const [vendorForm, setVendorForm] = useState({ vendorId: '', category: '', amount: '', notes: '' });
  const [eventTeamForm, setEventTeamForm] = useState({ userId: '', role: '' });

  const [newSubtaskTitle, setNewSubtaskTitle]   = useState('');
  const [newSubtaskAmount, setNewSubtaskAmount] = useState('');
  const emptyVendor = { name: '', phone: '', email: '', address: '', city: '', category: 'other', amount: '' };
  const [newVendor, setNewVendor] = useState(emptyVendor);

  useEffect(() => { loadWedding(); loadUsers(); loadVendors(); }, [id]);

  const loadWedding = async () => {
    try {
      const r = await api.get(`/weddings/${id}`);
      setWedding(r.data.wedding);
      setTasks(r.data.tasks);
      setTasksByCategory(r.data.tasksByCategory);
      setEvents(r.data.events || []);
      /* Keep drawer data fresh if open */
      setSelectedTask(prev => prev ? r.data.tasks.find(t => t._id === prev._id) || null : null);
      /* Start collapsed — user clicks to expand */
      setExpandedCats(prev => Object.keys(prev).length ? prev : {});
      setExpandedEvents(prev => Object.keys(prev).length ? prev : {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadUsers   = async () => { try { const r = await api.get('/auth/users'); setUsers(r.data.users); } catch {} };
  const loadVendors = async () => { try { const r = await api.get('/vendors'); setVendors(r.data.vendors); } catch {} };
  const loadEventMoodItems = async (eventId) => {
    try { const r = await api.get(`/moodboard/event/${eventId}`); setEventMoodItems(prev => ({ ...prev, [eventId]: r.data.items })); } catch {}
  };

  const handleTaskStatus    = async (taskId, status) => { try { await api.put(`/tasks/${taskId}/status`, { status }); loadWedding(); } catch {} };
  const handleToggleSubtask = async (taskId, subId)  => { try { await api.put(`/tasks/${taskId}/subtasks/${subId}`); loadWedding(); } catch {} };
  const handleDeleteSubtask = async (taskId, subId)  => { try { await api.delete(`/tasks/${taskId}/subtasks/${subId}`); loadWedding(); } catch {} };
  const handleVendorStatus  = async (taskId, tvId, status) => { try { await api.put(`/tasks/${taskId}/vendors/${tvId}`, { status }); loadWedding(); } catch {} };
  const handleDeleteVendor  = async (taskId, tvId)   => { try { await api.delete(`/tasks/${taskId}/vendors/${tvId}`); loadWedding(); } catch {} };

  const handleAddTeam   = async (e) => { e.preventDefault(); try { await api.post(`/weddings/${id}/team`, teamForm); loadWedding(); setShowTeamModal(false); setTeamForm({ userId: '', role: '' }); } catch {} };
  const handleAddVendor = async (e) => { e.preventDefault(); try { await api.post(`/weddings/${id}/vendors`, vendorForm); loadWedding(); setShowVendorModal(false); setVendorForm({ vendorId: '', category: '', amount: '', notes: '' }); } catch {} };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) await api.put(`/events/${editingEvent._id}`, { ...eventForm, wedding: id });
      else await api.post('/events', { ...eventForm, wedding: id });
      loadWedding(); closeEventModal();
    } catch {}
  };
  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Delete this event and all its tasks?')) return;
    try { await api.delete(`/events/${eventId}`); loadWedding(); } catch {}
  };
  const handleAddEventTeam = async (e) => {
    e.preventDefault();
    if (!selectedEventForTeam) return;
    try { await api.post(`/events/${selectedEventForTeam}/team`, eventTeamForm); loadWedding(); setShowEventTeamModal(false); setEventTeamForm({ userId: '', role: '' }); setSelectedEventForTeam(null); } catch {}
  };
  const handleRemoveEventTeam = async (eventId, userId) => { try { await api.delete(`/events/${eventId}/team/${userId}`); loadWedding(); } catch {} };

  const handleOpenDocs = (type, id, title) => {
    setDocsSettings({ isOpen: true, entityId: id, entityType: type, title });
  };
  const handleDocsUpdate = () => { loadWedding(); };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...taskForm,
        assignedTo: taskForm.assignedTo || undefined,
        dueDate: taskForm.dueDate || undefined,
        event: taskForm.event || undefined,
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
    } catch {}
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

  const closeTaskModal  = () => { setShowTaskModal(false); setEditingTask(null); setSelectedEventForTask(null); setTaskForm(emptyTask); setNewSubtaskTitle(''); setNewSubtaskAmount(''); setNewVendor(emptyVendor); };
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

  const taskHandlers = { onStatusChange: handleTaskStatus, onSelect: setSelectedTask, onEdit: openEditTask, isManager, isAdmin };

  /* ── Loading ── */
  if (loading) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap'); .font-display{font-family:'Cormorant Garamond',serif;letter-spacing:-0.02em} .font-body{font-family:'Inter',sans-serif}`}</style>
        <div className="font-body min-h-screen bg-[#faf9f7]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-10 space-y-6">
            <Sk className="h-4 w-28" />
            <Sk className="h-52" />
            <div className="grid lg:grid-cols-3 gap-6"><Sk className="lg:col-span-2 h-96" /><Sk className="h-56" /></div>
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

  const daysColor = days === null ? 'text-stone-900'
    : days === 0   ? 'text-[#c0604a]'
    : days <= 7    ? 'text-[#c0604a]'
    : days <= 30   ? 'text-[#b07d46]'
    : 'text-stone-900';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Cormorant Garamond', serif; letter-spacing: -0.02em; }
        .font-body    { font-family: 'Inter', sans-serif; }
        @keyframes slideReveal { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .anim-reveal { animation: slideReveal 0.3s ease-out forwards; }
        .anim-stagger > * { opacity: 0; animation: slideReveal 0.25s ease-out forwards; }
      `}</style>

      <div className="font-body min-h-screen bg-[#faf9f7]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-6 sm:py-8">

          {/* Back */}
          <Link to="/weddings" className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-700 text-sm transition-colors mb-5 group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Weddings
          </Link>

          {/* ── HERO BANNER (compact) ── */}
          <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-6 py-5">
              <div className="flex items-center gap-4 min-w-0">
                {/* Progress ring inline */}
                <div className="relative flex-shrink-0">
                  <ProgressRing pct={prog} size={52} stroke={4} color={prog === 100 ? '#5a8f72' : '#1c1917'} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-stone-600">{prog}%</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-0.5">Wedding</p>
                  <h1 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 leading-tight truncate">{wedding.name}</h1>
                  <p className="text-stone-400 text-xs mt-0.5 italic truncate">{wedding.clientName} · {formatDate(wedding.weddingDate)}</p>
                </div>
              </div>
              {days !== null && days >= 0 && (
                <div className="flex-shrink-0 flex items-center gap-3 sm:gap-4 bg-stone-50 rounded-xl px-4 py-3 border border-stone-100/60">
                  <div className="text-center">
                    <span className={`font-display text-3xl sm:text-4xl font-medium leading-none ${daysColor}`}>{days}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.15em] text-stone-400 uppercase">Days</p>
                    <p className="text-[10px] font-bold tracking-[0.15em] text-stone-400 uppercase">Left</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── STAT CARDS ROW ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            {[
              { label: 'Venue', value: wedding.venue?.name || 'TBD', icon: MapPin, bar: 'bg-stone-300' },
              { label: 'Guests', value: wedding.guestCount || '—', icon: Users, bar: 'bg-stone-400' },
              { label: 'Budget', value: wedding.budget?.estimated > 0 ? formatCurrency(wedding.budget.estimated) : '—', icon: IndianRupee, bar: 'bg-amber-700' },
              { label: 'Tasks', value: `${wedding.taskStats?.completed || 0}/${wedding.taskStats?.total || 0}`, icon: Check, bar: 'bg-teal-700' },
              { label: 'Events', value: events.length, icon: Calendar, bar: 'bg-stone-900' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white p-4 rounded-2xl border border-stone-200/60 shadow-sm group hover:-translate-y-0.5 transition-all duration-300">
                  <div className={`h-[1px] w-5 ${s.bar} mb-3 group-hover:w-8 transition-all duration-300`} />
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3 text-stone-300" />
                    <p className="text-[9px] font-bold tracking-[0.2em] text-stone-400 uppercase">{s.label}</p>
                  </div>
                  <p className="text-sm font-medium text-stone-800 truncate">{s.value}</p>
                </div>
              );
            })}
          </div>

          {/* ── MAIN GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* LEFT: Events + Tasks */}
            <div className="lg:col-span-2 space-y-5">

              {/* Events */}
              <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100/60">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-0.5">Schedule</p>
                    <h2 className="font-display text-lg font-medium text-stone-900">Events</h2>
                  </div>
                  {(isAdmin || isManager) && (
                    <button onClick={() => setShowEventModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-full text-[11px] font-semibold hover:bg-stone-800 transition-all">
                      <Plus className="h-3 w-3" /> Add Event
                    </button>
                  )}
                </div>

                {events.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <Calendar className="w-6 h-6 text-stone-200 mx-auto mb-2" />
                    <p className="text-sm text-stone-400 italic">No events planned yet</p>
                    {(isAdmin || isManager) && (
                      <button onClick={() => setShowEventModal(true)}
                        className="inline-flex items-center gap-1.5 mt-3 text-xs text-stone-400 hover:text-stone-700 transition-colors">
                        <Plus className="h-3 w-3" /> Create first event
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100/60">
                    {events.map(ev => {
                      const evTasks = tasks.filter(t => t.event?._id === ev._id || t.event === ev._id);
                      const isExp   = expandedEvents[ev._id];
                      const evProg  = ev.progress || 0;
                      return (
                        <div key={ev._id}>
                          <div
                            className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-[#faf9f7] transition-colors group"
                            onClick={() => {
                              const toggled = !expandedEvents[ev._id];
                              setExpandedEvents(p => ({ ...p, [ev._id]: toggled }));
                              if (toggled && !eventMoodItems[ev._id]) loadEventMoodItems(ev._id);
                            }}
                          >
                            <div className={`w-[2px] h-8 rounded-full flex-shrink-0 ${evProg === 100 ? 'bg-teal-700' : 'bg-stone-300'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-stone-900 truncate">{ev.name}</p>
                              <p className="text-xs text-stone-400 mt-0.5 italic truncate">
                                {formatDate(ev.eventDate)}{ev.venue?.name && ` · ${ev.venue.name}`} · {evTasks.length} task{evTasks.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
                              <span className="text-[10px] text-stone-400 hidden sm:block">{evProg}%</span>
                              <button onClick={(e) => { e.stopPropagation(); handleOpenDocs('event', ev._id, ev.name); }} 
                                className="p-1 rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-all opacity-0 group-hover:opacity-100"
                                title="Documents">
                                <FileText className="h-3.5 w-3.5" />
                              </button>
                              {(isAdmin || isManager) && (
                                <>
                                  <button onClick={() => openEditEvent(ev)} className="p-1 rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-all opacity-0 group-hover:opacity-100"><Edit className="h-3.5 w-3.5" /></button>
                                  <button onClick={() => handleDeleteEvent(ev._id)} className="p-1 rounded-lg text-stone-300 hover:text-[#c0604a] hover:bg-stone-100 transition-all opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                                </>
                              )}
                              <ChevronRight className={`w-4 h-4 text-stone-300 transition-transform duration-200 ${isExp ? 'rotate-90' : ''}`} />
                            </div>
                          </div>

                          {isExp && (
                            <div className="px-5 pb-4 pt-2 anim-reveal">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Event tasks */}
                                <div className="md:col-span-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">Tasks</p>
                                    {(isAdmin || isManager) && (
                                      <button onClick={() => openAddTaskToEvent(ev._id)}
                                        className="inline-flex items-center gap-1 text-[10px] text-stone-400 hover:text-stone-700 transition-colors">
                                        <Plus className="h-3 w-3" /> Add
                                      </button>
                                    )}
                                  </div>
                                  {evTasks.length === 0 ? (
                                    <p className="text-xs text-stone-400 italic py-2">No tasks for this event</p>
                                  ) : (
                                    <div className="bg-stone-50/40 rounded-xl border border-stone-200/60 overflow-hidden">
                                      <table className="w-full">
                                        <tbody className="divide-y divide-stone-100/60">
                                          {evTasks.map(task => {
                                            const info    = getCompletionInfo(task);
                                            const isDone  = task.status === 'done' || task.status === 'verified';
                                            const overdue = task.status === 'pending' && isOverdue(task.dueDate);
                                            return (
                                              <tr key={task._id} onClick={() => setSelectedTask(task)} className="cursor-pointer hover:bg-[#faf9f7] transition-all group">
                                                <td className="px-4 py-2.5">
                                                  <div className="flex items-center gap-2.5">
                                                    <div onClick={e => e.stopPropagation()}>
                                                      <Checkbox checked={isDone} onChange={() => {
                                                        if (isDone) { taskHandlers.onStatusChange(task._id, 'pending'); return; }
                                                        if ((info.hasSubtasks || info.hasVendors) && !info.canAutoComplete) { setSelectedTask(task); return; }
                                                        taskHandlers.onStatusChange(task._id, 'done');
                                                      }} />
                                                    </div>
                                                    <span className={`text-[13px] truncate ${isDone ? 'text-stone-300 line-through' : 'font-medium text-stone-800'}`}>{task.title}</span>
                                                  </div>
                                                </td>
                                                <td className="px-3 py-2.5 hidden sm:table-cell whitespace-nowrap">
                                                  {task.dueDate && <span className={`text-[11px] ${overdue ? 'text-amber-700' : 'text-stone-400'}`}>{formatDate(task.dueDate)}</span>}
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                  <ChevronRight className="h-3.5 w-3.5 text-stone-300 group-hover:text-stone-600 transition-colors inline-block" />
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>

                                {/* Event team */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">Team</p>
                                    {(isAdmin || isManager) && (
                                      <button onClick={() => { setSelectedEventForTeam(ev._id); setShowEventTeamModal(true); }}
                                        className="p-1 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors">
                                        <Plus className="h-3 w-3 text-stone-500" />
                                      </button>
                                    )}
                                  </div>
                                  {!ev.assignedTeam?.length ? (
                                    <p className="text-xs text-stone-400 italic">No team assigned</p>
                                  ) : (
                                    <div className="divide-y divide-stone-100/60">
                                      {ev.assignedTeam.map((m, i) => (
                                        <div key={i} className="flex items-center justify-between py-2.5 group">
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                                              <span className="text-[9px] font-bold text-stone-500">{m.user?.name?.[0]?.toUpperCase()}</span>
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-[13px] font-medium text-stone-800 truncate">{m.user?.name}</p>
                                              <p className="text-[10px] text-stone-400 truncate">{m.role || 'Member'}</p>
                                            </div>
                                          </div>
                                          {(isAdmin || isManager) && (
                                            <button onClick={() => handleRemoveEventTeam(ev._id, m.user?._id)}
                                              className="p-1 text-stone-300 hover:text-[#c0604a] transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                                              <X className="h-3 w-3" />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Event Hotels */}
                                {ev.hotels && ev.hotels.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-stone-200/60">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">Linked Hotels</p>
                                    </div>
                                    <div className="space-y-3">
                                      {ev.hotels.map((h, i) => (
                                        <div key={i} className="flex gap-3 bg-white p-2.5 rounded-xl border border-stone-200/60 shadow-sm">
                                          <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                                            {h.photoUrl ? (
                                              <img src={h.photoUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center">
                                                <Building2 className="w-5 h-5 text-stone-300" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-semibold text-stone-900 truncate">{h.title}</p>
                                            <p className="text-[10px] text-stone-500 truncate">{h.secondaryInfo || `${h.roomsSelected} Room(s)`}</p>
                                            <div className="flex items-center justify-between mt-1">
                                              {h.rating && (
                                                <div className="flex items-center gap-0.5">
                                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                                  <span className="text-[10px] font-bold text-stone-600">{h.rating}</span>
                                                </div>
                                              )}
                                              {h.externalUrl && (
                                                <a href={h.externalUrl} target="_blank" rel="noreferrer" className="text-[10px] font-medium text-[#b07d46] hover:underline">
                                                  Details
                                                </a>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Inspiration Items */}
                                {eventMoodItems[ev._id] && eventMoodItems[ev._id].length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-stone-200/60 col-span-full">
                                    <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2">Inspiration</p>
                                    <div className="flex gap-2.5 overflow-x-auto pb-1">
                                      {eventMoodItems[ev._id].map(mi => {
                                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                                        const ROOT = API_URL.replace('/api', '');
                                        return (
                                          <div key={mi._id} onClick={() => setMoodDetailItem(mi)} className="flex-shrink-0 w-20 cursor-pointer group">
                                            {mi.type === 'image' && mi.mediaUrl ? (
                                              <div className="w-20 h-20 rounded-xl overflow-hidden border border-stone-200/60 shadow-sm group-hover:shadow-md transition-all">
                                                <img src={`${ROOT}${mi.mediaUrl}`} alt={mi.title} className="w-full h-full object-cover" />
                                              </div>
                                            ) : mi.type === 'color' ? (
                                              <div className="w-20 h-20 rounded-xl border border-stone-200/60 shadow-sm group-hover:shadow-md transition-all" style={{ backgroundColor: mi.colorHex }} />
                                            ) : (
                                              <div className="w-20 h-20 rounded-xl border border-stone-200/60 bg-purple-50 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                                                <Video className="w-5 h-5 text-purple-300" />
                                              </div>
                                            )}
                                            <p className="text-[10px] text-stone-500 mt-1 truncate text-center">{mi.title}</p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* General Tasks */}
              <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100/60">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-0.5">Checklist</p>
                    <h2 className="font-display text-lg font-medium text-stone-900">Tasks</h2>
                  </div>
                  <button onClick={() => setShowTaskModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 text-white rounded-full text-[11px] font-semibold hover:bg-stone-800 transition-all">
                    <Plus className="h-3 w-3" /> Add Task
                  </button>
                </div>

                {Object.keys(tasksByCategory).length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <Check className="w-6 h-6 text-stone-200 mx-auto mb-2" />
                    <p className="text-sm text-stone-400 italic">No tasks yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone-100/60 bg-[#faf9f7]/50">
                          <th className="text-left px-5 py-3 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">Task</th>
                          <th className="text-left px-5 py-3 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase hidden md:table-cell">Due Date</th>
                          <th className="text-left px-5 py-3 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase hidden md:table-cell">Assigned</th>
                          <th className="text-left px-5 py-3 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase hidden sm:table-cell">Status</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100/60">
                        {Object.entries(tasksByCategory).map(([category, catTasks]) => {
                          const done  = catTasks.filter(t => t.status === 'done' || t.status === 'verified').length;
                          const isExp = expandedCats[category];
                          const pct   = catTasks.length ? Math.round((done / catTasks.length) * 100) : 0;

                          return (
                            <React.Fragment key={category}>
                              {/* Category header row */}
                              <tr
                                className="cursor-pointer hover:bg-[#faf9f7] transition-colors group"
                                onClick={() => setExpandedCats(p => ({ ...p, [category]: !p[category] }))}
                              >
                                <td className="px-5 py-3.5" colSpan={3}>
                                  <div className="flex items-center gap-3">
                                    <ChevronRight className={`w-4 h-4 text-stone-300 transition-transform duration-200 ${isExp ? 'rotate-90' : ''}`} />
                                    <span className="text-sm font-semibold text-stone-900 capitalize">{category.replace('_', ' ')}</span>
                                    <span className="text-[10px] text-stone-400">{done}/{catTasks.length}</span>
                                    <div className="hidden sm:block w-14 h-[2px] bg-stone-100 rounded-full overflow-hidden ml-2">
                                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct === 100 ? '#115e59' : '#a8a29e' }} />
                                    </div>
                                  </div>
                                </td>
                                <td className="hidden sm:table-cell"></td>
                                <td></td>
                              </tr>

                              {/* Task sub-rows */}
                              {isExp && catTasks.map(task => {
                                const info    = getCompletionInfo(task);
                                const isDone  = task.status === 'done' || task.status === 'verified';
                                const overdue = task.status === 'pending' && isOverdue(task.dueDate);

                                return (
                                  <tr
                                    key={task._id}
                                    onClick={() => setSelectedTask(task)}
                                    className="cursor-pointer hover:bg-[#faf9f7] transition-all group bg-stone-50/40"
                                  >
                                    <td className="px-5 py-3 pl-12">
                                      <div className="flex items-center gap-3">
                                        <div onClick={e => e.stopPropagation()}>
                                          <Checkbox checked={isDone} onChange={() => {
                                            if (isDone) { taskHandlers.onStatusChange(task._id, 'pending'); return; }
                                            if ((info.hasSubtasks || info.hasVendors) && !info.canAutoComplete) { setSelectedTask(task); return; }
                                            taskHandlers.onStatusChange(task._id, 'done');
                                          }} />
                                        </div>
                                        <div className="min-w-0">
                                          <span className={`text-sm ${isDone ? 'text-stone-300 line-through' : 'font-medium text-stone-900'}`}>{task.title}</span>
                                          {info.hasSubtasks && <p className="text-[11px] text-stone-400 mt-0.5">{info.subtasksDone}/{info.subtasksTotal} subtasks</p>}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-5 py-3 hidden md:table-cell whitespace-nowrap">
                                      {task.dueDate ? (
                                        <span className={`text-sm ${overdue ? 'text-amber-700 font-medium' : 'text-stone-500'}`}>{formatDate(task.dueDate)}</span>
                                      ) : <span className="text-stone-300 text-sm">—</span>}
                                    </td>
                                    <td className="px-5 py-3 hidden md:table-cell">
                                      {task.assignedTo ? (
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full border border-stone-200/60 bg-stone-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-[10px] font-medium text-stone-600">{task.assignedTo.name?.charAt(0)?.toUpperCase()}</span>
                                          </div>
                                          <span className="text-xs text-stone-500 truncate max-w-[60px]">{task.assignedTo.name?.split(' ')[0]}</span>
                                        </div>
                                      ) : <span className="text-stone-300 text-xs">—</span>}
                                    </td>
                                    <td className="px-5 py-3 hidden sm:table-cell">
                                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] bg-white border border-stone-200/60 ${
                                        isDone ? 'text-teal-700' : overdue ? 'text-amber-700' : 'text-stone-400'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-teal-700' : overdue ? 'bg-amber-700' : 'bg-stone-300'}`} />
                                        {isDone ? 'Done' : overdue ? 'Overdue' : 'Pending'}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                      <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-600 transition-colors inline-block" />
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Sidebar */}
            <div className="space-y-3">

              {/* Quick Stats (dark card) */}
              <div className="bg-stone-900 text-[#faf9f7] rounded-2xl p-4 relative overflow-hidden">
                <h4 className="font-display italic text-sm mb-3">Overview</h4>
                <div className="space-y-2 text-[13px]">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Days Left</span>
                    <span className="font-medium">{days !== null && days >= 0 ? days : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Tasks Done</span>
                    <span className="font-medium">{wedding.taskStats?.completed || 0} / {wedding.taskStats?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Vendors</span>
                    <span className="font-medium">{wedding.vendors?.filter(v => v.confirmed).length || 0} / {wedding.vendors?.length || 0} confirmed</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Budget</span>
                    <span className="font-medium">{wedding.budget?.estimated > 0 ? formatCurrency(wedding.budget.estimated) : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Events</span>
                    <span className="font-medium">{events.length} planned</span>
                  </div>
                </div>
              </div>

              {/* Task Completion Donut */}
              {(wedding.taskStats?.total > 0) && (() => {
                const total = wedding.taskStats?.total || 0;
                const done = wedding.taskStats?.completed || 0;
                const pending = wedding.taskStats?.pending || 0;
                const pct = total ? Math.round((done / total) * 100) : 0;
                const size = 90;
                const strokeWidth = 16;
                const radius = (size - strokeWidth) / 2;
                const circumference = 2 * Math.PI * radius;
                return (
                  <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-4">
                    <p className={labelCls}>Task Progress</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="relative" style={{ width: size, height: size }}>
                        <svg width={size} height={size} className="-rotate-90">
                          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f0ede8" strokeWidth={strokeWidth} />
                          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={pct === 100 ? '#5a8f72' : '#1c1917'} strokeWidth={strokeWidth}
                            strokeDasharray={circumference} strokeDashoffset={circumference - (pct/100)*circumference} strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="font-display text-xl font-medium text-stone-900">{pct}%</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full bg-stone-900" />
                          <span className="text-stone-600">Completed</span>
                          <span className="text-stone-400 ml-auto">{done}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full bg-stone-200" />
                          <span className="text-stone-600">Pending</span>
                          <span className="text-stone-400 ml-auto">{pending}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Budget by Category */}
              {wedding.vendors?.length > 0 && (() => {
                const catData = {};
                (wedding.vendors || []).forEach(v => {
                  const cat = v.category || 'other';
                  catData[cat] = (catData[cat] || 0) + (v.amount || 0);
                });
                const entries = Object.entries(catData).filter(([, amt]) => amt > 0).sort((a, b) => b[1] - a[1]);
                const maxAmt = Math.max(...entries.map(([, a]) => a), 1);
                const totalSpent = entries.reduce((s, [, a]) => s + a, 0);
                if (entries.length === 0) return null;
                const catColors = { catering: 'bg-stone-900', decor: 'bg-amber-700', photography: 'bg-stone-600', videography: 'bg-stone-400', music: 'bg-teal-700', makeup: 'bg-rose-400', venue: 'bg-stone-700', transport: 'bg-stone-300', invitation: 'bg-stone-500', other: 'bg-stone-200' };
                return (
                  <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-4">
                    <p className={labelCls}>Vendor Budget</p>
                    <p className="font-display text-lg font-medium text-stone-900 mt-0.5 mb-3">{formatCurrency(totalSpent)}</p>
                    <div className="space-y-2">
                      {entries.slice(0, 6).map(([cat, amt]) => {
                        const widthPct = Math.max((amt / maxAmt) * 100, 8);
                        return (
                          <div key={cat}>
                            <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                              <span className="capitalize font-bold tracking-wider uppercase">{cat}</span>
                              <span>{formatCurrency(amt)}</span>
                            </div>
                            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${catColors[cat] || 'bg-stone-300'}`} style={{ width: `${widthPct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Client Contact */}
              {(wedding.clientPhone || wedding.clientEmail) && (
                <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-4">
                  <p className={labelCls}>Client</p>
                  <p className="text-sm font-medium text-stone-800 mt-0.5 mb-2">{wedding.clientName}</p>
                  <div className="space-y-2">
                    {wedding.clientPhone && (
                      <a href={`tel:${wedding.clientPhone}`} className="flex items-center gap-2.5 text-xs text-stone-500 hover:text-stone-900 transition-colors">
                        <Phone className="w-3 h-3 text-stone-300" /> {wedding.clientPhone}
                      </a>
                    )}
                    {wedding.clientEmail && (
                      <a href={`mailto:${wedding.clientEmail}`} className="flex items-center gap-2.5 text-xs text-stone-500 hover:text-stone-900 transition-colors">
                        <Mail className="w-3 h-3 text-stone-300" /> {wedding.clientEmail}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Team */}
              <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className={labelCls}>Team</p>
                  {isManager && (
                    <button onClick={() => setShowTeamModal(true)}
                      className="p-1.5 rounded-full hover:bg-stone-100 text-stone-300 hover:text-stone-600 transition-all">
                      <UserPlus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {wedding.relationshipManager && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100 mb-3">
                    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-stone-600">{wedding.relationshipManager.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-stone-800 truncate">{wedding.relationshipManager.name}</p>
                      <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-stone-400">Relationship Manager</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  {wedding.assignedTeam?.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-100">
                      <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-semibold text-stone-600">{m.user?.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-stone-800 truncate">{m.user?.name}</p>
                        <p className="text-[10px] text-stone-400 truncate">{m.role || 'Team Member'}</p>
                      </div>
                    </div>
                  ))}
                  {!wedding.assignedTeam?.length && !wedding.relationshipManager && (
                    <p className="text-[11px] text-stone-400 text-center py-4">No team assigned</p>
                  )}
                </div>
              </div>

              {/* Vendors */}
              <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className={labelCls}>Vendors</p>
                  {isManager && (
                    <button onClick={() => setShowVendorModal(true)}
                      className="p-1.5 rounded-full hover:bg-stone-100 text-stone-300 hover:text-stone-600 transition-all">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {wedding.vendors?.map((v, i) => (
                    <div key={i} className="px-3 py-3 rounded-xl bg-stone-50 border border-stone-100">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-semibold text-stone-800">{v.vendor?.name}</p>
                        {v.confirmed && (
                          <span className="text-[10px] font-bold text-[#5a8f72] flex-shrink-0 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Confirmed
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 capitalize mt-0.5">{v.category}</p>
                      {v.amount > 0 && <p className="text-[11px] font-semibold text-stone-600 mt-1">{formatCurrency(v.amount)}</p>}
                    </div>
                  ))}
                  {!wedding.vendors?.length && (
                    <p className="text-[11px] text-stone-400 text-center py-4">No vendors assigned</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════ MODALS ════ */}

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
            <div className="space-y-1.5 mb-2">
              {taskForm.subtasks.map((sub, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2.5 bg-white border border-stone-100 rounded-xl">
                  <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${sub.completed ? 'bg-[#5a8f72] border-[#5a8f72]' : 'border-stone-300'}`} />
                  <span className="text-[13px] text-stone-700 flex-1">{sub.title}</span>
                  {sub.amount > 0 && <span className="text-[11px] text-stone-400">₹{sub.amount.toLocaleString()}</span>}
                  <button type="button" onClick={() => setTaskForm(f => ({ ...f, subtasks: f.subtasks.filter((_,j)=>j!==i) }))}
                    className="p-1 rounded hover:bg-red-50 text-stone-300 hover:text-[#c0604a] transition-all"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Add subtask..." value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)} onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();addSubtask();}}}
                className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-300 focus:outline-none focus:border-stone-400" />
              <input type="number" placeholder="₹" value={newSubtaskAmount} onChange={e => setNewSubtaskAmount(e.target.value)}
                className="w-24 px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white placeholder-stone-300 focus:outline-none focus:border-stone-400" />
              <button type="button" onClick={addSubtask}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Vendors */}
          <div>
            <label className={labelCls}>Vendors</label>
            <div className="space-y-1.5 mb-2">
              {taskForm.taskVendors.map((tv, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2.5 bg-white border border-stone-100 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-300 flex-shrink-0" />
                  <span className="text-[13px] text-stone-700 flex-1 truncate">{getVName(tv)}</span>
                  <button type="button" onClick={() => setTaskForm(f => ({ ...f, taskVendors: f.taskVendors.filter((_,j)=>j!==i) }))}
                    className="p-1 rounded hover:bg-red-50 text-stone-300 hover:text-[#c0604a] transition-all"><X className="w-3 h-3" /></button>
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
              <button type="button" onClick={addNewVendor}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Vendor
              </button>
            </div>
          </div>

          <Field label="Notes">
            <textarea value={taskForm.notes} rows={2} onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} resize-none`} />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button type="button" onClick={closeTaskModal} className="px-5 py-2.5 rounded-full text-sm text-stone-500 border border-stone-200 hover:border-stone-400 transition-all">Cancel</button>
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

      {/* Task detail drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={handleTaskStatus}
        onToggleSubtask={handleToggleSubtask}
        onUpdateVendorStatus={handleVendorStatus}
        onDeleteSubtask={handleDeleteSubtask}
        onDeleteVendor={handleDeleteVendor}
        onEdit={openEditTask}
        isManager={isManager}
        isAdmin={isAdmin}
        onOpenDocs={handleOpenDocs}
      />
      <DocumentsDrawer
        isOpen={docsSettings.isOpen}
        onClose={() => setDocsSettings(s => ({ ...s, isOpen: false }))}
        entityId={docsSettings.entityId}
        entityType={docsSettings.entityType}
        title={docsSettings.title}
        documents={[
          ...tasks.filter(t => t._id === docsSettings.entityId).flatMap(t => t.documents || []),
          ...events.filter(e => e._id === docsSettings.entityId).flatMap(e => e.documents || [])
        ]}
        onUpload={() => loadWedding()}
        onDelete={() => loadWedding()}
      />

      {/* Mood Board Detail Modal */}
      <Modal isOpen={!!moodDetailItem} onClose={() => setMoodDetailItem(null)} title={moodDetailItem?.title || 'Inspiration'}>
        {moodDetailItem && (() => {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const ROOT = API_URL.replace('/api', '');
          
          return (
            <div className="space-y-4">
              {moodDetailItem.type === 'image' && moodDetailItem.mediaUrl && (
                <img src={`${ROOT}${moodDetailItem.mediaUrl}`} alt={moodDetailItem.title} className="w-full rounded-xl border border-stone-200/60" />
              )}
              {moodDetailItem.type === 'video' && moodDetailItem.mediaUrl && (
                <video controls className="w-full rounded-xl border border-stone-200/60">
                  <source src={`${ROOT}${moodDetailItem.mediaUrl}`} />
                </video>
              )}
              {moodDetailItem.type === 'color' && (
                <div className="h-40 rounded-xl border border-stone-200/60" style={{ backgroundColor: moodDetailItem.colorHex }}>
                  <div className="h-full flex items-end p-4">
                    <span className="bg-white/90 backdrop-blur-sm text-sm font-bold tracking-wider font-mono text-stone-700 px-3 py-1.5 rounded-lg">{moodDetailItem.colorHex}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-50/50 rounded-xl border border-stone-100 p-3">
                  <p className="block text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2 font-body">Type</p>
                  <div className="flex items-center gap-1.5">
                    {moodDetailItem.type === 'image' && <Image className="w-3.5 h-3.5 text-sky-700" />}
                    {moodDetailItem.type === 'video' && <Video className="w-3.5 h-3.5 text-purple-700" />}
                    {moodDetailItem.type === 'color' && <Palette className="w-3.5 h-3.5 text-amber-700" />}
                    <span className="text-sm text-stone-700 capitalize">{moodDetailItem.type}</span>
                  </div>
                </div>
              </div>

              {moodDetailItem.tags && moodDetailItem.tags.length > 0 && (
                <div>
                  <p className="block text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2 font-body">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {moodDetailItem.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-bold tracking-wider uppercase bg-stone-100 text-stone-500 px-2.5 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {moodDetailItem.notes && (
                <div className="bg-stone-50/50 rounded-xl border border-stone-100 p-3">
                  <p className="block text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-2 font-body">Notes</p>
                  <p className="text-sm text-stone-600 whitespace-pre-wrap">{moodDetailItem.notes}</p>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </>
  );
}