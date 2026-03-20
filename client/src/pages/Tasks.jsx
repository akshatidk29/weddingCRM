import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Clock, AlertTriangle, ChevronDown, ChevronRight, Phone, AlertCircle, Plus, X, Store, Mail, PartyPopper } from 'lucide-react';
import { PageContainer, PageHeader, PageSection, SectionCard, StatCard, EmptyState } from '../components/layout/PageContainer';
import { formatDate, categoryColors, taskCategories, vendorCategories, isOverdue } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Local design components matching the design system
const Button = ({ children, variant = 'primary', className = '', icon: Icon, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-full px-5 py-2.5 text-sm';
  const variants = {
    primary: 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm',
    secondary: 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
  };
  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
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

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-amber-50 text-amber-600',
    done: 'bg-emerald-50 text-emerald-600',
    verified: 'bg-blue-50 text-blue-600',
    completed: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${styles[status] || 'bg-stone-100 text-stone-600'}`}>
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const styles = {
    low: 'bg-stone-100 text-stone-500',
    medium: 'bg-blue-50 text-blue-600',
    high: 'bg-amber-50 text-amber-600',
    urgent: 'bg-rose-50 text-rose-600',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${styles[priority] || 'bg-stone-100 text-stone-500'}`}>
      {priority}
    </span>
  );
};

export default function Tasks() {
  const { user, isManager, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', category: '', wedding: '', event: '' });
  const [weddings, setWeddings] = useState([]);
  const [events, setEvents] = useState([]);
  const [filterEvents, setFilterEvents] = useState([]);
  const [view, setView] = useState('all');
  const [expandedTasks, setExpandedTasks] = useState({});
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);

  // Task modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', category: 'other', priority: 'medium',
    assignedTo: '', dueDate: '', notes: '', wedding: '', event: '',
    subtasks: [],
    taskVendors: []
  });
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskAmount, setNewSubtaskAmount] = useState('');
  const [newVendor, setNewVendor] = useState({ name: '', phone: '', email: '', address: '', city: '', category: 'other', amount: '' });

  useEffect(() => {
    loadTasks();
    loadWeddings();
    loadUsers();
    loadVendors();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeddings = async () => {
    try {
      const res = await api.get('/weddings');
      setWeddings(res.data.weddings);
    } catch (error) {
      console.error('Failed to load weddings:', error);
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

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      loadTasks();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update task';
      alert(msg);
    }
  };

  const handleToggleSubtask = async (taskId, subId) => {
    try {
      await api.put(`/tasks/${taskId}/subtasks/${subId}`);
      loadTasks();
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
    }
  };

  const handleUpdateVendorStatus = async (taskId, vendorId, status) => {
    try {
      await api.put(`/tasks/${taskId}/vendors/${vendorId}`, { status });
      loadTasks();
    } catch (error) {
      console.error('Failed to update vendor status:', error);
    }
  };

  const toggleTaskExpand = (taskId) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
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

  // Task form helpers
  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    setTaskForm({
      title: '', description: '', category: 'other', priority: 'medium',
      assignedTo: '', dueDate: '', notes: '', wedding: '',
      subtasks: [], taskVendors: []
    });
    setNewSubtaskTitle('');
    setNewSubtaskAmount('');
    setNewVendor({ name: '', phone: '', email: '', address: '', city: '', category: 'other', amount: '' });
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
    setTaskForm({
      ...taskForm,
      subtasks: taskForm.subtasks.filter((_, i) => i !== index)
    });
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
    setTaskForm({
      ...taskForm,
      taskVendors: taskForm.taskVendors.filter((_, i) => i !== index)
    });
  };

  const getVendorDisplayName = (tv) => {
    if (tv.vendor && typeof tv.vendor === 'object') return tv.vendor.name;
    return tv.name || 'Unknown Vendor';
  };

  const getVendorDisplayPhone = (tv) => {
    if (tv.vendor && typeof tv.vendor === 'object') return tv.vendor.phone;
    return tv.phone || tv.contactNumber || '';
  };

  const getVendorDisplayEmail = (tv) => {
    if (tv.vendor && typeof tv.vendor === 'object') return tv.vendor.email;
    return tv.email || '';
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.wedding) {
      alert('Please select a wedding for this task');
      return;
    }
    try {
      const payload = {
        ...taskForm,
        assignedTo: taskForm.assignedTo || undefined,
        dueDate: taskForm.dueDate || undefined,
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
        await api.post('/tasks', payload);
      }
      loadTasks();
      loadVendors();
      closeTaskModal();
    } catch (error) {
      console.error('Failed to create/updatetask:', error);
    }
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    if (task.wedding?._id) loadEventsForWedding(task.wedding._id);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      assignedTo: task.assignedTo?._id || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      notes: task.notes || '',
      wedding: task.wedding?._id || '',
      event: task.event?._id || task.event || '',
      subtasks: task.subtasks || [],
      taskVendors: task.taskVendors || []
    });
    setShowTaskModal(true);
  };
  
  const loadEventsForWedding = async (weddingId) => {
    if (!weddingId) {
      setEvents([]);
      return;
    }
    try {
      const res = await api.get(`/events/wedding/${weddingId}`);
      setEvents(res.data.events || []);
    } catch (error) {
      console.error('Failed to load events', error);
      setEvents([]);
    }
  };

  const handleWeddingChange = (weddingId) => {
    setTaskForm({ ...taskForm, wedding: weddingId, event: '' });
    loadEventsForWedding(weddingId);
  };

  // Load events when a wedding is selected in the filter bar
  const handleFilterWeddingChange = async (weddingId) => {
    setFilter({ ...filter, wedding: weddingId, event: '' });
    if (weddingId) {
      try {
        const res = await api.get(`/events/wedding/${weddingId}`);
        setFilterEvents(res.data.events || []);
      } catch (error) {
        console.error('Failed to load filter events', error);
        setFilterEvents([]);
      }
    } else {
      setFilterEvents([]);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter.status && task.status !== filter.status) return false;
    if (filter.category && task.category !== filter.category) return false;
    if (filter.wedding && task.wedding?._id !== filter.wedding) return false;
    if (filter.event && (task.event?._id || task.event) !== filter.event) return false;
    if (view === 'my' && task.assignedTo?._id !== user._id) return false;
    if (view === 'overdue' && (!isOverdue(task.dueDate) || task.status !== 'pending')) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => t.status === 'pending' && isOverdue(t.dueDate)).length
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

  return (
    <PageContainer>
      <PageHeader 
        title="Tasks"
        subtitle="Manage all tasks across weddings"
        actions={
          (isAdmin || isManager) && (
            <Button icon={Plus} onClick={() => setShowTaskModal(true)}>
              New Task
            </Button>
          )
        }
      />

      {/* Stats Section */}
      <PageSection>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => { setView('all'); setFilter({ ...filter, status: '' }); }}
            className="cursor-pointer"
          >
            <StatCard label="Total Tasks" value={stats.total} icon={CheckSquare} />
          </div>
          <div 
            onClick={() => { setView('all'); setFilter({ ...filter, status: 'pending' }); }}
            className="cursor-pointer"
          >
            <StatCard label="Pending" value={stats.pending} icon={Clock} />
          </div>
          <div 
            onClick={() => { setView('all'); setFilter({ ...filter, status: 'done' }); }}
            className="cursor-pointer"
          >
            <StatCard label="Completed" value={stats.done} icon={CheckSquare} trend="up" />
          </div>
          <div 
            onClick={() => setView('overdue')}
            className="cursor-pointer"
          >
            <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} trend={stats.overdue > 0 ? 'down' : undefined} />
          </div>
        </div>
      </PageSection>

      {/* Filters Section */}
      <PageSection>
        <SectionCard padding="md">
          <div className="flex flex-wrap items-center gap-4">
            {/* View Tabs */}
            <div className="flex gap-1 p-1 bg-stone-100 rounded-xl">
              <button
                onClick={() => setView('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                All Tasks
              </button>
              <button
                onClick={() => setView('my')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === 'my' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                My Tasks
              </button>
              <button
                onClick={() => setView('overdue')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === 'overdue' ? 'bg-white text-rose-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                Overdue
              </button>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex gap-2 ml-auto flex-wrap">
              <Select
                value={filter.category}
                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                options={taskCategories}
                placeholder="All Categories"
                className="w-40"
              />
              <Select
                value={filter.wedding}
                onChange={(e) => handleFilterWeddingChange(e.target.value)}
                options={weddings.map(w => ({ value: w._id, label: w.name }))}
                placeholder="All Weddings"
                className="w-48"
              />
              {filter.wedding && filterEvents.length > 0 && (
                <Select
                  value={filter.event}
                  onChange={(e) => setFilter({ ...filter, event: e.target.value })}
                  options={filterEvents.map(ev => ({ value: ev._id, label: ev.name }))}
                  placeholder="All Events"
                  className="w-48"
                />
              )}
            </div>
          </div>
        </SectionCard>
      </PageSection>

      {/* Tasks List */}
      <PageSection title="Task List" subtitle={`${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''} found`}>
        <SectionCard padding="none">
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks found"
              description="No tasks match your current filters"
            />
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredTasks.map(task => {
                const catInfo = categoryColors[task.category] || categoryColors.other;
                const overdue = task.status === 'pending' && isOverdue(task.dueDate);
                const info = getCompletionInfo(task);
                const isExpanded = expandedTasks[task._id];

                return (
                  <div key={task._id} className="transition-colors">
                    <div className="p-4 flex items-center gap-4 hover:bg-stone-50">
                      {/* Completion Checkbox */}
                      <button
                        disabled={!isAdmin && !isManager}
                        onClick={() => {
                          if (task.status === 'pending') {
                            if ((info.hasSubtasks || info.hasVendors) && !info.canAutoComplete) {
                              setExpandedTasks(prev => ({ ...prev, [task._id]: true }));
                              return;
                            }
                            handleStatusChange(task._id, 'done');
                          } else if (task.status === 'done') {
                            handleStatusChange(task._id, 'pending');
                          }
                        }}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          task.status === 'done' || task.status === 'verified'
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-stone-300 hover:border-stone-500'
                        } ${(!isAdmin && !isManager) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {(task.status === 'done' || task.status === 'verified') && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      {/* Category Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-stone-100`}>
                        {catInfo.icon}
                      </div>

                      {/* Task Info */}
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => (info.hasSubtasks || info.hasVendors) && toggleTaskExpand(task._id)}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-medium ${
                            task.status === 'done' || task.status === 'verified'
                              ? 'text-stone-400 line-through'
                              : 'text-stone-900'
                          }`}>
                            {task.title}
                          </p>
                          {task.priority === 'high' && <PriorityBadge priority="high" />}
                          {task.priority === 'urgent' && <PriorityBadge priority="urgent" />}
                          {task.status === 'verified' && <StatusBadge status="verified" />}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-stone-500 flex-wrap">
                          <Link to={`/weddings/${task.wedding?._id}`} className="hover:text-stone-700" onClick={(e) => e.stopPropagation()}>
                            {task.wedding?.name}
                          </Link>
                          {task.event && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium">
                              <PartyPopper className="w-3 h-3" />
                              {task.event.name}
                            </span>
                          )}
                          {task.assignedTo && (
                            <span>• {task.assignedTo.name}</span>
                          )}
                          {info.hasSubtasks && (
                            <span className={info.allSubtasksDone ? 'text-emerald-600' : 'text-amber-600'}>
                              • {info.subtasksDone}/{info.subtasksTotal} subtasks
                            </span>
                          )}
                          {info.hasVendors && (
                            <span className={info.allVendorsDone ? 'text-emerald-600' : 'text-orange-600'}>
                              • {info.vendorsDone}/{info.vendorsTotal} vendors
                            </span>
                          )}
                        </div>
                        {task.status === 'pending' && (info.hasSubtasks || info.hasVendors) && !info.canAutoComplete && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                            <AlertCircle className="w-3 h-3" />
                            <span>
                              {info.pendingSubtasks > 0 && `${info.pendingSubtasks} subtask(s)`}
                              {info.pendingSubtasks > 0 && info.pendingVendors > 0 && ' & '}
                              {info.pendingVendors > 0 && `${info.pendingVendors} vendor(s)`}
                              {' remaining'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Side */}
                      <div className="text-right flex items-center gap-3">
                        {task.dueDate && (
                          <p className={`text-sm ${overdue ? 'text-rose-500 font-medium' : 'text-stone-500'}`}>
                            {formatDate(task.dueDate)}
                          </p>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-stone-100 text-stone-600`}>
                          {task.category}
                        </span>
                        {(isAdmin || isManager) && (
                          <button
                            onClick={() => openEditTask(task)}
                            className="p-2 hover:bg-stone-100 rounded-xl text-stone-400 hover:text-stone-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {(info.hasSubtasks || info.hasVendors) && (
                          <button
                            onClick={() => toggleTaskExpand(task._id)}
                            className="p-2 hover:bg-stone-100 rounded-xl text-stone-400 hover:text-stone-700 transition-colors"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded subtask + vendor details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 ml-20 space-y-4 border-t border-stone-100 pt-4 bg-stone-50/50">
                        {/* Subtasks */}
                        {info.hasSubtasks && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Subtasks</p>
                            {task.subtasks.map(sub => (
                              <div key={sub._id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white border border-stone-100 hover:border-stone-200 transition-colors">
                                <button
                                  disabled={!isAdmin && !isManager}
                                  onClick={() => handleToggleSubtask(task._id, sub._id)}
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                    sub.completed
                                      ? 'bg-emerald-500 border-emerald-500'
                                      : 'border-stone-300 hover:border-stone-500'
                                  } ${(!isAdmin && !isManager) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {sub.completed && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                                <span className={`text-sm flex-1 ${sub.completed ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                                  {sub.title}
                                </span>
                                {sub.amount !== 0 && (
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                    sub.paymentStatus === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                                    sub.paymentStatus === 'partial' ? 'bg-amber-50 text-amber-600' : 
                                    'bg-stone-100 text-stone-600'
                                  }`}>
                                    ${Math.abs(sub.amount)} {sub.amount < 0 ? 'Receivable' : 'Payable'}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Vendors */}
                        {info.hasVendors && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase mt-2">Vendors</p>
                            {task.taskVendors.map(v => (
                              <div key={v._id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white border border-stone-100 hover:border-stone-200 transition-colors">
                                <button
                                  disabled={!isAdmin && !isManager}
                                  onClick={() => handleUpdateVendorStatus(task._id, v._id, v.status === 'completed' ? 'pending' : 'completed')}
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                    v.status === 'completed'
                                      ? 'bg-emerald-500 border-emerald-500'
                                      : 'border-stone-300 hover:border-stone-500'
                                  } ${(!isAdmin && !isManager) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {v.status === 'completed' && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                                <div className="flex-1">
                                  <span className={`text-sm ${v.status === 'completed' ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                                    {getVendorDisplayName(v)}
                                  </span>
                                  {getVendorDisplayPhone(v) && (
                                    <span className="text-xs text-stone-400 ml-2">
                                      <Phone className="w-2.5 h-2.5 inline mr-0.5" />{getVendorDisplayPhone(v)}
                                    </span>
                                  )}
                                  {getVendorDisplayEmail(v) && (
                                    <span className="text-xs text-stone-400 ml-2">
                                      <Mail className="w-2.5 h-2.5 inline mr-0.5" />{getVendorDisplayEmail(v)}
                                    </span>
                                  )}
                                  {v.amount !== 0 && (
                                    <span className="text-xs ml-2 text-blue-600">
                                      Pay: ${Math.abs(v.amount)} ({v.paymentStatus || 'pending'})
                                    </span>
                                  )}
                                </div>
                                <StatusBadge status={v.status} />
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
        </SectionCard>
      </PageSection>

      {/* New/Edit Task Modal */}
      <Modal isOpen={showTaskModal} onClose={closeTaskModal} title={editingTask ? 'Edit Task' : 'New Task'} size="lg">
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <Input
            label="Title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Wedding *"
              value={taskForm.wedding}
              onChange={(e) => handleWeddingChange(e.target.value)}
              options={weddings.map(w => ({ value: w._id, label: w.name }))}
              placeholder="Select Wedding..."
              required
            />
            <Select
              label="Event (Optional)"
              value={taskForm.event}
              onChange={(e) => setTaskForm({ ...taskForm, event: e.target.value })}
              options={events.map(ev => ({ value: ev._id, label: ev.name }))}
              placeholder="Select Event..."
              disabled={!taskForm.wedding || events.length === 0}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={taskForm.category}
              onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
              options={taskCategories}
            />
            <Select
              label="Priority"
              value={taskForm.priority}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' }
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Assign To"
              value={taskForm.assignedTo}
              onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
              options={users.map(u => ({ value: u._id, label: u.name }))}
              placeholder="Select..."
            />
            <Input
              label="Due Date"
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            />
          </div>

          {/* Subtasks Section */}
          <div className="space-y-2">
            <label className="block text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Subtasks</label>
            <div className="space-y-2">
              {taskForm.subtasks.map((sub, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl">
                  <div className={`w-3.5 h-3.5 rounded border ${sub.completed ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300'}`} />
                  <span className={`text-sm flex-1 ${sub.completed ? 'text-stone-400 line-through' : 'text-stone-700'}`}>{sub.title}</span>
                  {sub.amount !== 0 && (
                    <span className="text-xs text-blue-600 mr-2">${Math.abs(sub.amount)}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeSubtaskFromForm(idx)}
                    className="p-1 hover:bg-rose-100 rounded text-stone-400 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtaskToForm(); } }}
                className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5"
              />
              <input
                type="number"
                placeholder="Amount"
                value={newSubtaskAmount}
                onChange={(e) => setNewSubtaskAmount(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtaskToForm(); } }}
                className="w-28 px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5"
              />
              <button
                type="button"
                onClick={addSubtaskToForm}
                className="px-4 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-sm hover:bg-stone-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Task Vendors Section */}
          <div className="space-y-2">
            <label className="block text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Vendors</label>
            <div className="space-y-2">
              {taskForm.taskVendors.map((v, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl">
                  <Store className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-sm text-stone-700 flex-1">{getVendorDisplayName(v)}</span>
                  {getVendorDisplayPhone(v) && (
                    <span className="text-xs text-stone-400">
                      <Phone className="w-2.5 h-2.5 inline mr-0.5" />{getVendorDisplayPhone(v)}
                    </span>
                  )}
                  {getVendorDisplayEmail(v) && (
                    <span className="text-xs text-stone-400">
                      <Mail className="w-2.5 h-2.5 inline mr-0.5" />{getVendorDisplayEmail(v)}
                    </span>
                  )}
                  {v.amount !== 0 && (
                    <span className="text-xs text-blue-600 mr-2">${Math.abs(v.amount)}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeVendorFromForm(idx)}
                    className="p-1 hover:bg-rose-100 rounded text-stone-400 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <Select
              placeholder="Select existing vendor..."
              value=""
              onChange={(e) => selectExistingVendor(e.target.value)}
              options={vendors.map(v => ({ value: v._id, label: `${v.name} (${v.category})` }))}
            />

            <div className="border border-stone-200 rounded-xl p-4 space-y-3 bg-stone-50/50">
              <p className="text-xs text-stone-500 font-medium">Or add new vendor</p>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Vendor name *" value={newVendor.name} onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 bg-white" />
                <input type="text" placeholder="Phone" value={newVendor.phone} onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="email" placeholder="Email" value={newVendor.email} onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 bg-white" />
                <select value={newVendor.category} onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-stone-400 bg-white">
                  {vendorCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Address" value={newVendor.address} onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 bg-white" />
                <input type="text" placeholder="City" value={newVendor.city} onChange={(e) => setNewVendor({ ...newVendor, city: e.target.value })} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 bg-white" />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <input type="number" placeholder="Budget Amount (Optional)" value={newVendor.amount} onChange={(e) => setNewVendor({ ...newVendor, amount: e.target.value })} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 bg-white" />
              </div>
              <button type="button" onClick={addVendorToForm} className="w-full px-4 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-sm hover:bg-stone-200 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Vendor
              </button>
            </div>
          </div>

          <Textarea
            label="Notes"
            value={taskForm.notes}
            onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
            rows={2}
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeTaskModal}>Cancel</Button>
            <Button type="submit" className="flex-1">{editingTask ? 'Update' : 'Create'} Task</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
