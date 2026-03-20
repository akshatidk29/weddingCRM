import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, MapPin, Users, DollarSign,
  Plus, CheckCircle, Circle, Clock, UserPlus, Store, Edit, Check,
  ChevronDown, ChevronRight, Trash2, Phone, X, AlertCircle, Mail,
  PartyPopper, Target
} from 'lucide-react';
import { PageContainer, PageHeader, PageSection, SectionCard, StatCard, EmptyState } from '../components/layout/PageContainer';
import { formatDate, formatCurrency, categoryColors, taskCategories, vendorCategories, daysUntil, isOverdue } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Local design components matching the design system
const Button = ({ children, variant = 'primary', size = 'md', className = '', icon: Icon, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200';
  const sizeClasses = { sm: 'px-3 py-1.5 text-xs rounded-lg', md: 'px-5 py-2.5 text-sm rounded-full' };
  const variants = {
    primary: 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm',
    secondary: 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50',
    ghost: 'text-stone-500 hover:bg-stone-100 hover:text-stone-700',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
    outline: 'border border-stone-200 text-stone-700 hover:bg-stone-50',
  };
  return (
    <button className={`${baseClasses} ${sizeClasses[size]} ${variants[variant]} ${className}`} {...props}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

const Input = ({ label, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="block text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase mb-2">{label}</label>}
    <input
      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5 outline-none transition-all"
      {...props}
    />
  </div>
);

const Textarea = ({ label, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="block text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase mb-2">{label}</label>}
    <textarea
      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5 outline-none transition-all resize-none"
      {...props}
    />
  </div>
);

const Select = ({ label, options = [], placeholder, className = '', ...props }) => (
  <div className={className}>
    {label && <label className="block text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase mb-2">{label}</label>}
    <select
      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5 outline-none transition-all appearance-none cursor-pointer"
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-stone-400" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const Avatar = ({ name, size = 'md' }) => {
  const sizes = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  return (
    <div className={`${sizes[size]} rounded-full bg-stone-200 flex items-center justify-center font-semibold text-stone-600`}>
      {initials}
    </div>
  );
};

const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold uppercase tracking-wide rounded-full';
  const sizeClasses = { sm: 'px-2 py-0.5 text-[9px]', md: 'px-2.5 py-1 text-[10px]' };
  const variants = {
    default: 'bg-stone-100 text-stone-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600',
    secondary: 'bg-stone-100 text-stone-500',
    outline: 'border border-stone-200 text-stone-600 bg-transparent',
  };
  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default function WeddingDetail() {
  const { id } = useParams();
  const { user, isManager, isAdmin } = useAuth();
  const [wedding, setWedding] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksByCategory, setTasksByCategory] = useState({});
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventTeamModal, setShowEventTeamModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEventForTask, setSelectedEventForTask] = useState(null);
  const [selectedEventForTeam, setSelectedEventForTeam] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({});
  const [expandedEvents, setExpandedEvents] = useState({});

  const [taskForm, setTaskForm] = useState({
    title: '', description: '', category: 'other', priority: 'medium',
    assignedTo: '', dueDate: '', notes: '', event: '',
    subtasks: [],
    taskVendors: []
  });

  const [eventForm, setEventForm] = useState({
    name: '', description: '', eventDate: '', endDate: '',
    venue: { name: '', address: '', city: '' }, notes: ''
  });
  const [eventTeamForm, setEventTeamForm] = useState({ userId: '', role: '' });

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskAmount, setNewSubtaskAmount] = useState('');
  const [newVendor, setNewVendor] = useState({ name: '', phone: '', email: '', address: '', city: '', category: 'other', amount: '' });

  const [teamForm, setTeamForm] = useState({ userId: '', role: '' });
  const [vendorForm, setVendorForm] = useState({ vendorId: '', category: '', amount: '', notes: '' });

  useEffect(() => {
    loadWedding();
    loadUsers();
    loadVendors();
  }, [id]);

  const loadWedding = async () => {
    try {
      const res = await api.get(`/weddings/${id}`);
      setWedding(res.data.wedding);
      setTasks(res.data.tasks);
      setTasksByCategory(res.data.tasksByCategory);
      setEvents(res.data.events || []);

      const expanded = {};
      Object.keys(res.data.tasksByCategory).forEach(cat => { expanded[cat] = true; });
      setExpandedCategories(expanded);

      const evExpanded = {};
      (res.data.events || []).forEach(ev => { evExpanded[ev._id] = true; });
      setExpandedEvents(evExpanded);
    } catch (error) {
      console.error('Failed to load wedding:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadVendors = async () => {
    try {
      const res = await api.get('/vendors');
      setVendors(res.data.vendors);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        category: taskForm.category,
        priority: taskForm.priority,
        assignedTo: taskForm.assignedTo || undefined,
        dueDate: taskForm.dueDate || undefined,
        notes: taskForm.notes,
        subtasks: taskForm.subtasks,
        taskVendors: taskForm.taskVendors.map(v => {
          if (v.vendor && typeof v.vendor === 'object' && v.vendor._id) {
            return { vendor: v.vendor._id, status: v.status || 'pending' };
          }
          return v;
        })
      };

      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, payload);
      } else {
        const createPayload = { ...payload, wedding: id };
        if (taskForm.event) createPayload.event = taskForm.event;
        if (selectedEventForTask) createPayload.event = selectedEventForTask;
        await api.post('/tasks', createPayload);
      }
      loadWedding();
      loadVendors();
      closeTaskModal();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      loadWedding();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update task';
      alert(msg);
    }
  };

  const handleToggleSubtask = async (taskId, subId) => {
    try {
      await api.put(`/tasks/${taskId}/subtasks/${subId}`);
      loadWedding();
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
    }
  };

  const handleDeleteSubtask = async (taskId, subId) => {
    try {
      await api.delete(`/tasks/${taskId}/subtasks/${subId}`);
      loadWedding();
    } catch (error) {
      console.error('Failed to delete subtask:', error);
    }
  };

  const handleUpdateVendorStatus = async (taskId, tvId, status) => {
    try {
      await api.put(`/tasks/${taskId}/vendors/${tvId}`, { status });
      loadWedding();
    } catch (error) {
      console.error('Failed to update vendor status:', error);
    }
  };

  const handleDeleteTaskVendor = async (taskId, tvId) => {
    try {
      await api.delete(`/tasks/${taskId}/vendors/${tvId}`);
      loadWedding();
    } catch (error) {
      console.error('Failed to delete vendor:', error);
    }
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/weddings/${id}/team`, teamForm);
      loadWedding();
      setShowTeamModal(false);
      setTeamForm({ userId: '', role: '' });
    } catch (error) {
      console.error('Failed to add team member:', error);
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/weddings/${id}/vendors`, vendorForm);
      loadWedding();
      setShowVendorModal(false);
      setVendorForm({ vendorId: '', category: '', amount: '', notes: '' });
    } catch (error) {
      console.error('Failed to add vendor:', error);
    }
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    setSelectedEventForTask(null);
    setTaskForm({
      title: '', description: '', category: 'other', priority: 'medium',
      assignedTo: '', dueDate: '', notes: '', event: '',
      subtasks: [], taskVendors: []
    });
    setNewSubtaskTitle('');
    setNewSubtaskAmount('');
    setNewVendor({ name: '', phone: '', email: '', address: '', city: '', category: 'other', amount: '' });
  };

  // ===== EVENT HANDLERS =====
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...eventForm, wedding: id };
      if (editingEvent) {
        await api.put(`/events/${editingEvent._id}`, payload);
      } else {
        await api.post('/events', payload);
      }
      loadWedding();
      closeEventModal();
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setEventForm({ name: '', description: '', eventDate: '', endDate: '', venue: { name: '', address: '', city: '' }, notes: '' });
  };

  const openEditEvent = (event) => {
    setEditingEvent(event);
    setEventForm({
      name: event.name,
      description: event.description || '',
      eventDate: event.eventDate ? event.eventDate.split('T')[0] : '',
      endDate: event.endDate ? event.endDate.split('T')[0] : '',
      venue: event.venue || { name: '', address: '', city: '' },
      notes: event.notes || ''
    });
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Delete this event and all its tasks?')) return;
    try {
      await api.delete(`/events/${eventId}`);
      loadWedding();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleAddEventTeam = async (e) => {
    e.preventDefault();
    if (!selectedEventForTeam) return;
    try {
      await api.post(`/events/${selectedEventForTeam}/team`, eventTeamForm);
      loadWedding();
      setShowEventTeamModal(false);
      setEventTeamForm({ userId: '', role: '' });
      setSelectedEventForTeam(null);
    } catch (error) {
      console.error('Failed to add team member to event:', error);
    }
  };

  const handleRemoveEventTeam = async (eventId, userId) => {
    try {
      await api.delete(`/events/${eventId}/team/${userId}`);
      loadWedding();
    } catch (error) {
      console.error('Failed to remove team member:', error);
    }
  };

  const openAddTaskToEvent = (eventId) => {
    setSelectedEventForTask(eventId);
    setTaskForm({ ...taskForm, event: eventId });
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      assignedTo: task.assignedTo?._id || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      notes: task.notes || '',
      event: task.event?._id || '',
      subtasks: task.subtasks || [],
      taskVendors: task.taskVendors || []
    });
    setShowTaskModal(true);
  };

  const addSubtaskToForm = () => {
    if (!newSubtaskTitle.trim()) return;
    setTaskForm({
      ...taskForm,
      subtasks: [...taskForm.subtasks, { title: newSubtaskTitle.trim(), completed: false, amount: Number(newSubtaskAmount) || 0 }]
    });
    setNewSubtaskTitle('');
    setNewSubtaskAmount('');
  };

  const removeSubtaskFromForm = (index) => {
    setTaskForm({ ...taskForm, subtasks: taskForm.subtasks.filter((_, i) => i !== index) });
  };

  const addVendorToForm = () => {
    if (!newVendor.name.trim()) return;
    setTaskForm({
      ...taskForm,
      taskVendors: [...taskForm.taskVendors, { ...newVendor, status: 'pending', amount: Number(newVendor.amount) || 0 }]
    });
    setNewVendor({ name: '', phone: '', email: '', address: '', city: '', category: 'other', amount: '' });
  };

  const selectExistingVendor = (vendorId) => {
    const v = vendors.find(ven => ven._id === vendorId);
    if (!v) return;
    // Check if already added
    const alreadyAdded = taskForm.taskVendors.some(tv =>
      (tv.vendor && (tv.vendor._id === v._id || tv.vendor === v._id)) ||
      tv.name?.toLowerCase() === v.name.toLowerCase()
    );
    if (alreadyAdded) return;
    setTaskForm({
      ...taskForm,
      taskVendors: [...taskForm.taskVendors, { vendor: v._id, status: 'pending' }]
    });
  };

  const removeVendorFromForm = (index) => {
    setTaskForm({ ...taskForm, taskVendors: taskForm.taskVendors.filter((_, i) => i !== index) });
  };

  const getVendorDisplayName = (tv) => {
    if (tv.vendor && typeof tv.vendor === 'object') return tv.vendor.name;
    if (tv.name) return tv.name;
    return 'Unknown Vendor';
  };

  const getVendorDisplayPhone = (tv) => {
    if (tv.vendor && typeof tv.vendor === 'object') return tv.vendor.phone;
    return tv.phone || tv.contactNumber || '';
  };

  const getVendorDisplayEmail = (tv) => {
    if (tv.vendor && typeof tv.vendor === 'object') return tv.vendor.email;
    return tv.email || '';
  };

  const toggleTaskExpand = (taskId) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-stone-900 border-t-transparent rounded-full" />
        </div>
      </PageContainer>
    );
  }
  
  if (!wedding) {
    return (
      <PageContainer>
        <div className="text-center py-12 text-stone-500">Wedding not found</div>
      </PageContainer>
    );
  }

  const days = daysUntil(wedding.weddingDate);

  const getStatusIcon = (status) => {
    if (status === 'verified') return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (status === 'done') return <Check className="w-5 h-5 text-blue-500" />;
    if (status === 'not_needed') return <Circle className="w-5 h-5 text-stone-400" />;
    return <Circle className="w-5 h-5 text-stone-300" />;
  };

  const getCompletionInfo = (task) => {
    const subtasksDone = task.subtasks?.filter(s => s.completed).length || 0;
    const subtasksTotal = task.subtasks?.length || 0;
    const vendorsDone = task.taskVendors?.filter(v => v.status === 'completed').length || 0;
    const vendorsTotal = task.taskVendors?.length || 0;
    const hasSubtasks = subtasksTotal > 0;
    const hasVendors = vendorsTotal > 0;
    const allSubtasksDone = !hasSubtasks || subtasksDone === subtasksTotal;
    const allVendorsDone = !hasVendors || vendorsDone === vendorsTotal;
    return {
      subtasksDone, subtasksTotal, vendorsDone, vendorsTotal,
      hasSubtasks, hasVendors, allSubtasksDone, allVendorsDone,
      pendingVendors: vendorsTotal - vendorsDone,
      pendingSubtasks: subtasksTotal - subtasksDone,
      canAutoComplete: allSubtasksDone && allVendorsDone
    };
  };

  return (
    <PageContainer>
      {/* Back Link */}
      <Link to="/weddings" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Weddings
      </Link>

      {/* Wedding Header */}
      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-stone-900 mb-1">{wedding.name}</h1>
            <p className="text-stone-500">{wedding.clientName}</p>
          </div>
          <div className="text-right">
            {days !== null && days >= 0 && (
              <div className={`text-3xl font-bold ${days <= 7 ? 'text-amber-500' : 'text-stone-900'}`}>
                {days === 0 ? 'Today!' : `${days} days`}
              </div>
            )}
            <p className="text-sm text-stone-500">until the big day</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
            <Calendar className="w-5 h-5 text-stone-600 mb-2" />
            <p className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Date</p>
            <p className="text-stone-900 font-medium">{formatDate(wedding.weddingDate)}</p>
          </div>
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
            <MapPin className="w-5 h-5 text-stone-600 mb-2" />
            <p className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Venue</p>
            <p className="text-stone-900 font-medium">{wedding.venue?.name || 'TBD'}</p>
          </div>
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
            <Users className="w-5 h-5 text-stone-600 mb-2" />
            <p className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Guests</p>
            <p className="text-stone-900 font-medium">{wedding.guestCount || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
            <DollarSign className="w-5 h-5 text-stone-600 mb-2" />
            <p className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Budget</p>
            <p className="text-stone-900 font-medium">{formatCurrency(wedding.budget?.estimated)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-stone-500">Overall Progress</span>
            <span className="text-sm text-stone-900 font-medium">{wedding.progress || 0}%</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-3">
            <div 
              className="bg-stone-900 h-3 rounded-full transition-all" 
              style={{ width: `${wedding.progress || 0}%` }} 
            />
          </div>
          <div className="flex gap-4 mt-2 text-sm text-stone-500">
            <span>{wedding.taskStats?.completed || 0} completed</span>
            <span>{wedding.taskStats?.pending || 0} pending</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* EVENTS SECTION */}
          <SectionCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                <PartyPopper className="h-5 w-5 text-indigo-500" />
                Wedding Events
              </h2>
              {(isAdmin || isManager) && (
                <Button onClick={() => setShowEventModal(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Event
                </Button>
              )}
            </div>

            {events.length === 0 ? (
              <div className="bg-stone-50 border border-stone-100 rounded-xl p-8 text-center">
                <PartyPopper className="h-12 w-12 mx-auto mb-3 text-stone-300" />
                <p className="text-stone-500">No events planned yet.</p>
                {(isAdmin || isManager) && (
                  <Button variant="outline" className="mt-4" onClick={() => setShowEventModal(true)}>
                    Create First Event
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event._id} className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                    <div
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-stone-50 border-b border-stone-100 cursor-pointer hover:bg-stone-100 transition-colors"
                      onClick={() => setExpandedEvents({ ...expandedEvents, [event._id]: !expandedEvents[event._id] })}
                    >
                      <div className="flex items-center flex-1">
                        {expandedEvents[event._id] ? (
                          <ChevronDown className="h-5 w-5 text-stone-400 mr-2" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-stone-400 mr-2" />
                        )}
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-stone-900">{event.name}</h3>
                            <Badge variant={
                              event.status === 'completed' ? 'success' :
                                event.status === 'in_progress' ? 'warning' : 'secondary'
                            }>
                              {event.status === 'completed' ? 'Completed' :
                                event.status === 'in_progress' ? 'In Progress' : 'Pending'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-stone-500">
                            <span className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1" /> {formatDate(event.eventDate)}</span>
                            {event.venue?.name && <span className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1" /> {event.venue.name}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-6 sm:w-1/3">
                        <div className="text-right">
                          <div className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase mb-1">Progress</div>
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 h-2 bg-stone-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${event.progress === 100 ? 'bg-emerald-500' : 'bg-stone-700'}`}
                                style={{ width: `${event.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-stone-900">{event.progress || 0}%</span>
                          </div>
                        </div>

                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          {(isAdmin || isManager) && (
                            <>
                              <button className="p-2 hover:bg-stone-200 rounded-lg transition-colors" onClick={() => openEditEvent(event)}>
                                <Edit className="h-4 w-4 text-stone-500" />
                              </button>
                              <button className="p-2 hover:bg-rose-100 rounded-lg transition-colors" onClick={() => handleDeleteEvent(event._id)}>
                                <Trash2 className="h-4 w-4 text-rose-500" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedEvents[event._id] && (
                      <div className="p-4 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2">
                            {event.description && (
                              <div className="mb-4">
                                <h4 className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase mb-1">Details</h4>
                                <p className="text-sm text-stone-600">{event.description}</p>
                              </div>
                            )}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase flex items-center">
                                  <Target className="h-4 w-4 mr-1" /> Event Tasks
                                </h4>
                                {(isAdmin || isManager) && (
                                  <Button variant="outline" size="sm" onClick={() => openAddTaskToEvent(event._id)}>
                                    <Plus className="h-3 w-3 mr-1" /> Add Task
                                  </Button>
                                )}
                              </div>

                              {tasks.filter(t => t.event?._id === event._id || t.event === event._id).length === 0 ? (
                                <div className="text-sm text-stone-400 italic py-2">No tasks assigned to this event yet.</div>
                              ) : (
                                <div className="space-y-2">
                                  {tasks.filter(t => t.event?._id === event._id || t.event === event._id).map(task => (
                                    <div key={task._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-stone-100 rounded-xl hover:bg-stone-50 transition-colors">
                                      <div className="flex items-center gap-3">
                                        <div onClick={() => (isAdmin || isManager) && toggleTaskStatus(task._id, task.status)} className={`${(isAdmin || isManager) ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                                          {task.status === 'done' || task.status === 'verified' ? (
                                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                                          ) : task.status === 'in_progress' ? (
                                            <Clock className="h-5 w-5 text-amber-500" />
                                          ) : (
                                            <Circle className="h-5 w-5 text-stone-300" />
                                          )}
                                        </div>
                                        <div className="cursor-pointer" onClick={() => toggleTaskExpand(task._id)}>
                                          <div className={`font-medium ${task.status === 'done' || task.status === 'verified' ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                                            {task.title}
                                          </div>
                                          {task.dueDate && (
                                            <div className={`text-xs ${isOverdue(task.dueDate) && task.status !== 'done' && task.status !== 'verified' ? 'text-rose-500 font-medium flex items-center' : 'text-stone-500'}`}>
                                              {isOverdue(task.dueDate) && task.status !== 'done' && task.status !== 'verified' && <AlertCircle className="h-3 w-3 mr-1 inline" />}
                                              Due: {formatDate(task.dueDate)}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3 mt-2 sm:mt-0">
                                        {task.assignedTo && (
                                          <div className="flex items-center" title={`Assigned to ${task.assignedTo.name}`}>
                                            <Avatar name={task.assignedTo.name} size="xs" />
                                          </div>
                                        )}
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 uppercase">
                                          {categoryColors[task.category]?.icon} {task.category}
                                        </span>
                                        {(isAdmin || isManager) && (
                                          <button className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors" onClick={() => openEditTask(task)}>
                                            <Edit className="h-4 w-4 text-stone-400" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase flex items-center">
                                <Users className="h-4 w-4 mr-1" /> Event Team
                              </h4>
                              {(isAdmin || isManager) && (
                                <button
                                  onClick={() => { setSelectedEventForTeam(event._id); setShowEventTeamModal(true); }}
                                  className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
                                >
                                  <Plus className="h-3 w-3 text-stone-600" />
                                </button>
                              )}
                            </div>

                            {(!event.assignedTeam || event.assignedTeam.length === 0) ? (
                              <div className="text-sm text-stone-400 italic">No specific team assigned.</div>
                            ) : (
                              <div className="space-y-2">
                                {event.assignedTeam.map((member, index) => (
                                  <div key={index} className="flex items-center justify-between bg-stone-50 p-2 rounded-xl border border-stone-100">
                                    <div className="flex items-center gap-2">
                                      <Avatar name={member.user?.name} size="sm" />
                                      <div>
                                        <p className="text-sm font-medium text-stone-800">{member.user?.name}</p>
                                        <p className="text-xs text-stone-500 capitalize">{member.role || 'Member'}</p>
                                      </div>
                                    </div>
                                    {(isAdmin || isManager) && (
                                      <button
                                        onClick={() => handleRemoveEventTeam(event._id, member.user?._id)}
                                        className="text-stone-400 hover:text-rose-500 transition-colors"
                                        title="Remove from event"
                                      >
                                        <X className="h-4 w-4" />
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
                ))}
              </div>
            )}
          </SectionCard>

          {/* General Tasks Section */}
          <SectionCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-stone-600" />
                Tasks & Checklist
              </h2>
              {(isAdmin || isManager) && (
                <Button icon={Plus} size="sm" onClick={() => setShowTaskModal(true)}>Add Task</Button>
              )}
            </div>

            {Object.keys(tasksByCategory).length === 0 ? (
              <div className="text-center py-8 text-stone-500">No tasks yet. Add your first task to get started.</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(tasksByCategory).map(([category, categoryTasks]) => {
                  const catInfo = categoryColors[category] || categoryColors.other;
                  const completed = categoryTasks.filter(t => t.status === 'done' || t.status === 'verified').length;

                  return (
                    <div key={category} className="border border-stone-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                        className="w-full p-4 flex items-center justify-between bg-stone-50 hover:bg-stone-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{catInfo.icon}</span>
                          <span className="font-medium text-stone-900 capitalize">{category.replace('_', ' ')}</span>
                        </div>
                        <span className="text-sm text-stone-500">{completed}/{categoryTasks.length} done</span>
                      </button>

                      {expandedCategories[category] && (
                        <div className="divide-y divide-stone-100">
                          {categoryTasks.map(task => {
                            const info = getCompletionInfo(task);
                            const isExpanded = expandedTasks[task._id];

                            return (
                              <div key={task._id}>
                                <div className="p-4 flex items-center gap-4 hover:bg-stone-50 transition-colors">
                                  <button
                                    disabled={!isAdmin && !isManager}
                                    onClick={() => {
                                      if (task.status === 'pending') {
                                        if ((info.hasSubtasks || info.hasVendors) && !info.canAutoComplete) {
                                          setExpandedTasks(prev => ({ ...prev, [task._id]: true }));
                                        } else {
                                          handleTaskStatusChange(task._id, 'done');
                                        }
                                      } else if (task.status === 'done' && (isAdmin || isManager)) {
                                        handleTaskStatusChange(task._id, 'verified');
                                      } else if (task.status === 'verified' || task.status === 'done') {
                                        handleTaskStatusChange(task._id, 'pending');
                                      }
                                    }}
                                    className={`shrink-0 ${(!isAdmin && !isManager) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    {getStatusIcon(task.status)}
                                  </button>

                                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleTaskExpand(task._id)}>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className={`font-medium ${task.status === 'done' || task.status === 'verified' ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
                                        {task.title}
                                      </p>
                                      {task.priority === 'high' && <Badge variant="danger" size="sm">High</Badge>}
                                      {task.priority === 'urgent' && <Badge variant="danger" size="sm">Urgent</Badge>}
                                      {task.status === 'verified' && <Badge variant="success" size="sm">Verified ✓</Badge>}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-stone-500 flex-wrap">
                                      {task.dueDate && (
                                        <span className={isOverdue(task.dueDate) && task.status === 'pending' ? 'text-rose-500' : ''}>
                                          <Clock className="w-3 h-3 inline mr-1" />{formatDate(task.dueDate)}
                                        </span>
                                      )}
                                      {task.assignedTo && <span>{task.assignedTo.name}</span>}
                                      {info.hasSubtasks && (
                                        <span className={info.allSubtasksDone ? 'text-emerald-600' : 'text-amber-600'}>
                                          {info.subtasksDone}/{info.subtasksTotal} subtasks
                                        </span>
                                      )}
                                      {info.hasVendors && (
                                        <span className={info.allVendorsDone ? 'text-emerald-600' : 'text-orange-600'}>
                                          {info.vendorsDone}/{info.vendorsTotal} vendors
                                        </span>
                                      )}
                                    </div>
                                    {task.status === 'pending' && !info.canAutoComplete && (info.hasSubtasks || info.hasVendors) && (
                                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>
                                          {info.pendingSubtasks > 0 && `${info.pendingSubtasks} subtask(s)`}
                                          {info.pendingSubtasks > 0 && info.pendingVendors > 0 && ' & '}
                                          {info.pendingVendors > 0 && `${info.pendingVendors} vendor(s)`} remaining
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {(info.hasSubtasks || info.hasVendors) && (
                                      <button onClick={() => toggleTaskExpand(task._id)} className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700 transition-colors">
                                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                      </button>
                                    )}
                                    {(isAdmin || isManager) && (
                                      <button onClick={() => openEditTask(task)} className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700 transition-colors">
                                        <Edit className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="px-4 pb-4 ml-14 space-y-3 bg-stone-50/50">
                                    {info.hasSubtasks && (
                                      <div className="space-y-2">
                                        <p className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Subtasks</p>
                                        {task.subtasks.map(sub => (
                                          <div key={sub._id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white border border-stone-100 hover:border-stone-200 group transition-colors">
                                            <button
                                              disabled={!isAdmin && !isManager}
                                              onClick={() => handleToggleSubtask(task._id, sub._id)}
                                              className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${sub.completed ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300 hover:border-stone-500'} ${(!isAdmin && !isManager) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                              {sub.completed && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </button>
                                            <span className={`text-sm flex-1 ${sub.completed ? 'text-stone-400 line-through' : 'text-stone-700'}`}>{sub.title}</span>
                                            {sub.amount !== 0 && (
                                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sub.paymentStatus === 'completed' ? 'bg-emerald-50 text-emerald-600' : sub.paymentStatus === 'partial' ? 'bg-amber-50 text-amber-600' : 'bg-stone-100 text-stone-600'}`}>
                                                ${Math.abs(sub.amount)} {sub.amount < 0 ? 'Receivable' : 'Payable'}
                                              </span>
                                            )}
                                            {(isAdmin || isManager) && (
                                              <button onClick={() => handleDeleteSubtask(task._id, sub._id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-100 rounded text-stone-400 hover:text-rose-500 transition-all">
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {info.hasVendors && (
                                      <div className="space-y-2 mt-3">
                                        <p className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Vendors</p>
                                        {task.taskVendors.map(tv => (
                                          <div key={tv._id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white border border-stone-100 hover:border-stone-200 group transition-colors">
                                            <button
                                              disabled={!isAdmin && !isManager}
                                              onClick={() => handleUpdateVendorStatus(task._id, tv._id, tv.status === 'completed' ? 'pending' : 'completed')}
                                              className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${tv.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300 hover:border-stone-500'} ${(!isAdmin && !isManager) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                              {tv.status === 'completed' && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </button>
                                            <div className="flex-1">
                                              <span className={`text-sm ${tv.status === 'completed' ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                                                {tv.vendor?.name || 'Unknown'}
                                              </span>
                                              {tv.vendor?.phone && <span className="text-xs text-stone-400 ml-2"><Phone className="w-2.5 h-2.5 inline mr-0.5" />{tv.vendor.phone}</span>}
                                              {tv.vendor?.email && <span className="text-xs text-stone-400 ml-2"><Mail className="w-2.5 h-2.5 inline mr-0.5" />{tv.vendor.email}</span>}
                                              {tv.amount !== 0 && (
                                                <span className="text-xs ml-2 text-blue-600">
                                                  Pay: ${Math.abs(tv.amount)} ({tv.paymentStatus || 'pending'})
                                                </span>
                                              )}
                                            </div>
                                            <Badge size="sm" variant={tv.status === 'completed' ? 'success' : 'warning'}>{tv.status}</Badge>
                                            {(isAdmin || isManager) && (
                                              <button onClick={() => handleDeleteTaskVendor(task._id, tv._id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-100 rounded text-stone-400 hover:text-rose-500 transition-all">
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
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Section */}
          <SectionCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Team</h3>
              {isManager && (
                <button onClick={() => setShowTeamModal(true)} className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors">
                  <UserPlus className="w-4 h-4 text-stone-500" />
                </button>
              )}
            </div>
            
            {wedding.relationshipManager && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100 mb-3">
                <Avatar name={wedding.relationshipManager.name} size="md" />
                <div>
                  <p className="text-stone-900 font-medium">{wedding.relationshipManager.name}</p>
                  <p className="text-xs text-indigo-600">Relationship Manager</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {wedding.assignedTeam?.map((member, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <Avatar name={member.user?.name} size="sm" />
                  <div>
                    <p className="text-stone-900 text-sm font-medium">{member.user?.name}</p>
                    <p className="text-xs text-stone-500">{member.role || 'Team Member'}</p>
                  </div>
                </div>
              ))}
            </div>
            {!wedding.assignedTeam?.length && !wedding.relationshipManager && (
              <p className="text-sm text-stone-400 text-center py-4">No team assigned</p>
            )}
          </SectionCard>

          {/* Vendors Section */}
          <SectionCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Vendors</h3>
              {isManager && (
                <button onClick={() => setShowVendorModal(true)} className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors">
                  <Store className="w-4 h-4 text-stone-500" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {wedding.vendors?.map((v, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="flex items-center justify-between">
                    <p className="text-stone-900 font-medium">{v.vendor?.name}</p>
                    {v.confirmed && <Badge variant="success" size="sm">Confirmed</Badge>}
                  </div>
                  <p className="text-sm text-stone-500 capitalize">{v.category}</p>
                  {v.amount > 0 && <p className="text-sm text-emerald-600 mt-1">{formatCurrency(v.amount)}</p>}
                </div>
              ))}
            </div>
            {!wedding.vendors?.length && (
              <p className="text-sm text-stone-400 text-center py-4">No vendors assigned</p>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Task Modal */}
      <Modal isOpen={showTaskModal} onClose={closeTaskModal} title={editingTask ? 'Edit Task' : 'Add Task'} size="lg">
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <Input label="Title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
          <Textarea label="Description" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={taskForm.category} onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })} options={taskCategories} />
            <Select label="Priority" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Assign To" value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })} options={users.map(u => ({ value: u._id, label: u.name }))} placeholder="Select..." />
            <Input label="Due Date" type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
          </div>

          <Select
            label="Belongs to Event (Optional)"
            value={taskForm.event}
            onChange={(e) => setTaskForm({ ...taskForm, event: e.target.value })}
            options={events.map(ev => ({ value: ev._id, label: `${ev.name} (${formatDate(ev.eventDate)})` }))}
            placeholder="Select Event..."
          />

          {/* Subtasks */}
          <div className="space-y-2">
            <label className="block text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Subtasks</label>
            <div className="space-y-2">
              {taskForm.subtasks.map((sub, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl">
                  <div className={`w-3.5 h-3.5 rounded border ${sub.completed ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300'}`} />
                  <span className={`text-sm flex-1 ${sub.completed ? 'text-stone-400 line-through' : 'text-stone-700'}`}>{sub.title}</span>
                  {sub.amount !== 0 && (
                    <span className="text-xs text-emerald-600 mr-2">${Math.abs(sub.amount)}</span>
                  )}
                  <button type="button" onClick={() => removeSubtaskFromForm(idx)} className="p-1 hover:bg-rose-100 rounded text-stone-400 hover:text-rose-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Add a subtask..." value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtaskToForm(); } }} className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5" />
              <input type="number" placeholder="Amt" value={newSubtaskAmount} onChange={(e) => setNewSubtaskAmount(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtaskToForm(); } }} className="w-24 px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5" />
              <button type="button" onClick={addSubtaskToForm} className="px-3 py-2 bg-stone-100 text-stone-600 rounded-xl text-sm hover:bg-stone-200 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Vendors */}
          <div className="space-y-2">
            <label className="block text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Vendors</label>
            <div className="space-y-2">
              {taskForm.taskVendors.map((tv, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl">
                  <Store className="w-3.5 h-3.5 text-stone-500" />
                  <span className="text-sm text-stone-700 flex-1">{getVendorDisplayName(tv)}</span>
                  {getVendorDisplayPhone(tv) && <span className="text-xs text-stone-500"><Phone className="w-2.5 h-2.5 inline mr-0.5" />{getVendorDisplayPhone(tv)}</span>}
                  {getVendorDisplayEmail(tv) && <span className="text-xs text-stone-500"><Mail className="w-2.5 h-2.5 inline mr-0.5" />{getVendorDisplayEmail(tv)}</span>}
                  {tv.amount !== 0 && (
                    <span className="text-xs text-emerald-600 mr-2">${Math.abs(tv.amount)}</span>
                  )}
                  <button type="button" onClick={() => removeVendorFromForm(idx)} className="p-1 hover:bg-rose-100 rounded text-stone-400 hover:text-rose-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Select existing vendor */}
            <Select
              placeholder="Select existing vendor..."
              value=""
              onChange={(e) => selectExistingVendor(e.target.value)}
              options={vendors.map(v => ({ value: v._id, label: `${v.name} (${v.category})` }))}
            />

            {/* Or add new vendor with full details */}
            <div className="border border-stone-200 rounded-xl p-3 space-y-2">
              <p className="text-xs text-stone-500 font-medium">Or add new vendor</p>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Vendor name *" value={newVendor.name} onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })} className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5" />
                <input type="text" placeholder="Phone" value={newVendor.phone} onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })} className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="email" placeholder="Email" value={newVendor.email} onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })} className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5" />
                <select value={newVendor.category} onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })} className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5">
                  {vendorCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Address" value={newVendor.address} onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })} className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5" />
                <input type="text" placeholder="City" value={newVendor.city} onChange={(e) => setNewVendor({ ...newVendor, city: e.target.value })} className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Budget Amount (Optional)" value={newVendor.amount} onChange={(e) => setNewVendor({ ...newVendor, amount: e.target.value })} className="col-span-2 px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5" />
              </div>
              <button type="button" onClick={addVendorToForm} className="w-full px-3 py-2 bg-stone-100 text-stone-600 rounded-xl text-sm hover:bg-stone-200 transition-colors flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> Add Vendor
              </button>
            </div>
          </div>

          <Textarea label="Notes" value={taskForm.notes} onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })} rows={2} />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeTaskModal}>Cancel</Button>
            <Button type="submit" className="flex-1">{editingTask ? 'Update' : 'Create'} Task</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showTeamModal} onClose={() => setShowTeamModal(false)} title="Add Team Member" size="sm">
        <form onSubmit={handleAddTeam} className="space-y-4">
          <Select label="Team Member" value={teamForm.userId} onChange={(e) => setTeamForm({ ...teamForm, userId: e.target.value })} options={users.map(u => ({ value: u._id, label: `${u.name} (${u.role.replace('_', ' ')})` }))} required />
          <Input label="Role" value={teamForm.role} onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })} placeholder="e.g., Decor Lead, F&B Coordinator" />
          <Button type="submit" className="w-full">Add Member</Button>
        </form>
      </Modal>

      <Modal isOpen={showVendorModal} onClose={() => setShowVendorModal(false)} title="Add Vendor" size="sm">
        <form onSubmit={handleAddVendor} className="space-y-4">
          <Select label="Vendor" value={vendorForm.vendorId} onChange={(e) => setVendorForm({ ...vendorForm, vendorId: e.target.value })} options={vendors.map(v => ({ value: v._id, label: `${v.name} (${v.category})` }))} required />
          <Input label="Amount" type="number" value={vendorForm.amount} onChange={(e) => setVendorForm({ ...vendorForm, amount: e.target.value })} />
          <Textarea label="Notes" value={vendorForm.notes} onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })} rows={2} />
          <Button type="submit" className="w-full">Add Vendor</Button>
        </form>
      </Modal>

      {/* Event Modal */}
      <Modal isOpen={showEventModal} onClose={closeEventModal} title={editingEvent ? 'Edit Event' : 'Add Event'} size="md">
        <form onSubmit={handleEventSubmit} className="space-y-4">
          <Input label="Event Name" value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} required placeholder="e.g. Mehendi, Sangeet, Reception" />
          <Textarea label="Description" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date/Time" type="datetime-local" value={eventForm.eventDate} onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })} required />
            <Input label="End Date/Time (Optional)" type="datetime-local" value={eventForm.endDate} onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })} />
          </div>
          <div className="space-y-2 border border-stone-200 rounded-xl p-3 bg-stone-50/50">
            <label className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Venue Info</label>
            <Input placeholder="Venue Name" value={eventForm.venue.name} onChange={(e) => setEventForm({ ...eventForm, venue: { ...eventForm.venue, name: e.target.value } })} />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Input placeholder="Address" value={eventForm.venue.address} onChange={(e) => setEventForm({ ...eventForm, venue: { ...eventForm.venue, address: e.target.value } })} />
              <Input placeholder="City" value={eventForm.venue.city} onChange={(e) => setEventForm({ ...eventForm, venue: { ...eventForm.venue, city: e.target.value } })} />
            </div>
          </div>
          <Textarea label="Notes" value={eventForm.notes} onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })} rows={2} />

          {/* For new events, we can optionally assign team immediately if desired, but we'll stick to basic fields for simplicity, and allow team adding via the event card later */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeEventModal}>Cancel</Button>
            <Button type="submit" className="flex-1">{editingEvent ? 'Update' : 'Create'} Event</Button>
          </div>
        </form>
      </Modal>

      {/* Event Team Modal */}
      <Modal isOpen={showEventTeamModal} onClose={() => setShowEventTeamModal(false)} title="Add Team Member to Event" size="sm">
        <form onSubmit={handleAddEventTeam} className="space-y-4">
          <Select
            label="Team Member"
            value={eventTeamForm.userId}
            onChange={(e) => setEventTeamForm({ ...eventTeamForm, userId: e.target.value })}
            options={(wedding.assignedTeam || []).map(member => ({ value: member.user?._id, label: `${member.user?.name} (${member.role || 'Member'})` }))}
            required
            placeholder="Select from wedding team..."
          />
          <Input label="Event Specific Role (Optional)" value={eventTeamForm.role} onChange={(e) => setEventTeamForm({ ...eventTeamForm, role: e.target.value })} placeholder="e.g., Stage Manager, Guest Greeter" />
          <Button type="submit" className="w-full">Assign to Event</Button>
        </form>
      </Modal>
    </PageContainer>
  );
}
