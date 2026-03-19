import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Clock, AlertTriangle, ChevronDown, ChevronRight, Phone, AlertCircle, Plus, X, Store, Mail, PartyPopper } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { PageLoader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate, categoryColors, taskCategories, vendorCategories, isOverdue } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

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

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-gray-400">Manage all tasks across weddings</p>
        </div>
        <Button icon={Plus} onClick={() => setShowTaskModal(true)}>
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card hover onClick={() => { setView('all'); setFilter({ ...filter, status: '' }); }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card hover onClick={() => { setView('all'); setFilter({ ...filter, status: 'pending' }); }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card hover onClick={() => { setView('all'); setFilter({ ...filter, status: 'done' }); }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-400">{stats.done}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card hover onClick={() => setView('overdue')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Overdue</p>
                <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setView('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'all' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setView('my')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'my' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            My Tasks
          </button>
          <button
            onClick={() => setView('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'overdue' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            Overdue
          </button>
        </div>

        <div className="flex gap-2 ml-auto">
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

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="No tasks match your current filters"
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-white/6">
              {filteredTasks.map(task => {
                const catInfo = categoryColors[task.category] || categoryColors.other;
                const overdue = task.status === 'pending' && isOverdue(task.dueDate);
                const info = getCompletionInfo(task);
                const isExpanded = expandedTasks[task._id];

                return (
                  <div key={task._id} className="transition-colors">
                    <div className="p-4 flex items-center gap-4 hover:bg-white/2">
                      <button
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
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.status === 'done' || task.status === 'verified'
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-600 hover:border-purple-500'
                        }`}
                      >
                        {(task.status === 'done' || task.status === 'verified') && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${catInfo.bg}`}>
                        {catInfo.icon}
                      </div>

                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => (info.hasSubtasks || info.hasVendors) && toggleTaskExpand(task._id)}>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${
                            task.status === 'done' || task.status === 'verified'
                              ? 'text-gray-500 line-through'
                              : 'text-white'
                          }`}>
                            {task.title}
                          </p>
                          {task.priority === 'high' && <Badge variant="warning" size="sm">High</Badge>}
                          {task.priority === 'urgent' && <Badge variant="danger" size="sm">Urgent</Badge>}
                          {task.status === 'verified' && <Badge variant="success" size="sm">Verified ✓</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <Link to={`/weddings/${task.wedding?._id}`} className="hover:text-purple-400" onClick={(e) => e.stopPropagation()}>
                            {task.wedding?.name}
                          </Link>
                          {task.event && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-medium">
                              <PartyPopper className="w-3 h-3" />
                              {task.event.name}
                            </span>
                          )}
                          {task.assignedTo && (
                            <span>• {task.assignedTo.name}</span>
                          )}
                          {info.hasSubtasks && (
                            <span className={info.allSubtasksDone ? 'text-green-400' : 'text-yellow-400'}>
                              • {info.subtasksDone}/{info.subtasksTotal} subtasks
                            </span>
                          )}
                          {info.hasVendors && (
                            <span className={info.allVendorsDone ? 'text-green-400' : 'text-orange-400'}>
                              • {info.vendorsDone}/{info.vendorsTotal} vendors
                            </span>
                          )}
                        </div>
                        {task.status === 'pending' && (info.hasSubtasks || info.hasVendors) && !info.canAutoComplete && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-amber-400">
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

                      <div className="text-right flex items-center gap-2">
                        {task.dueDate && (
                          <p className={`text-sm ${overdue ? 'text-red-400' : 'text-gray-400'}`}>
                            {formatDate(task.dueDate)}
                          </p>
                        )}
                        <Badge size="sm" className={catInfo.bg}>
                          <span className={catInfo.text}>{task.category}</span>
                        </Badge>
                        {(info.hasSubtasks || info.hasVendors) && (
                          <button
                            onClick={() => toggleTaskExpand(task._id)}
                            className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded subtask + vendor details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 ml-20 space-y-3 border-t border-white/3 pt-3">
                        {/* Subtasks */}
                        {info.hasSubtasks && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Subtasks</p>
                            {task.subtasks.map(sub => (
                              <div key={sub._id} className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-white/3 group">
                                <button
                                  onClick={() => handleToggleSubtask(task._id, sub._id)}
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    sub.completed
                                      ? 'bg-green-500 border-green-500'
                                      : 'border-gray-600 hover:border-purple-500'
                                  }`}
                                >
                                  {sub.completed && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                                <span className={`text-sm flex-1 ${sub.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                  {sub.title}
                                </span>
                                {sub.amount !== 0 && (
                                  <Badge size="sm" variant={sub.paymentStatus === 'completed' ? 'success' : sub.paymentStatus === 'partial' ? 'warning' : 'secondary'}>
                                    ${Math.abs(sub.amount)} {sub.amount < 0 ? 'Receivable' : 'Payable'}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Vendors */}
                        {info.hasVendors && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">Vendors</p>
                            {task.taskVendors.map(v => (
                              <div key={v._id} className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-white/3">
                                <button
                                  onClick={() => handleUpdateVendorStatus(task._id, v._id, v.status === 'completed' ? 'pending' : 'completed')}
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    v.status === 'completed'
                                      ? 'bg-green-500 border-green-500'
                                      : 'border-gray-600 hover:border-purple-500'
                                  }`}
                                >
                                  {v.status === 'completed' && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                                <div className="flex-1">
                                  <span className={`text-sm ${v.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                    {getVendorDisplayName(v)}
                                  </span>
                                  {getVendorDisplayPhone(v) && (
                                    <span className="text-xs text-gray-500 ml-2">
                                      <Phone className="w-2.5 h-2.5 inline mr-0.5" />{getVendorDisplayPhone(v)}
                                    </span>
                                  )}
                                  {getVendorDisplayEmail(v) && (
                                    <span className="text-xs text-gray-500 ml-2">
                                      <Mail className="w-2.5 h-2.5 inline mr-0.5" />{getVendorDisplayEmail(v)}
                                    </span>
                                  )}
                                  {v.amount !== 0 && (
                                    <span className="text-xs ml-2 text-blue-400">
                                      Pay: ${Math.abs(v.amount)} ({v.paymentStatus || 'pending'})
                                    </span>
                                  )}
                                </div>
                                <Badge size="sm" variant={v.status === 'completed' ? 'success' : 'warning'}>
                                  {v.status}
                                </Badge>
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
          </CardContent>
        </Card>
      )}

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
            <label className="block text-sm font-medium text-gray-400">Subtasks</label>
            <div className="space-y-1.5">
              {taskForm.subtasks.map((sub, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white/3 rounded-lg">
                  <div className={`w-3.5 h-3.5 rounded border ${sub.completed ? 'bg-green-500 border-green-500' : 'border-gray-600'}`} />
                  <span className={`text-sm flex-1 ${sub.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{sub.title}</span>
                  {sub.amount !== 0 && (
                    <span className="text-xs text-blue-400 mr-2">${Math.abs(sub.amount)}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeSubtaskFromForm(idx)}
                    className="p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-colors"
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
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
              <input
                type="number"
                placeholder="Amount (optional)"
                value={newSubtaskAmount}
                onChange={(e) => setNewSubtaskAmount(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtaskToForm(); } }}
                className="w-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
              <button
                type="button"
                onClick={addSubtaskToForm}
                className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Task Vendors Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Vendors</label>
            <div className="space-y-1.5">
              {taskForm.taskVendors.map((v, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white/3 rounded-lg">
                  <Store className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-sm text-gray-300 flex-1">{getVendorDisplayName(v)}</span>
                  {getVendorDisplayPhone(v) && (
                    <span className="text-xs text-gray-500">
                      <Phone className="w-2.5 h-2.5 inline mr-0.5" />{getVendorDisplayPhone(v)}
                    </span>
                  )}
                  {getVendorDisplayEmail(v) && (
                    <span className="text-xs text-gray-500">
                      <Mail className="w-2.5 h-2.5 inline mr-0.5" />{getVendorDisplayEmail(v)}
                    </span>
                  )}
                  {v.amount !== 0 && (
                    <span className="text-xs text-blue-400 mr-2">${Math.abs(v.amount)}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeVendorFromForm(idx)}
                    className="p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-colors"
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

            <div className="border border-white/6 rounded-lg p-3 space-y-2">
              <p className="text-xs text-gray-400 font-medium">Or add new vendor</p>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Vendor name *" value={newVendor.name} onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
                <input type="text" placeholder="Phone" value={newVendor.phone} onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="email" placeholder="Email" value={newVendor.email} onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
                <select value={newVendor.category} onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50">
                  {vendorCategories.map(c => <option key={c.value} value={c.value} className="bg-gray-900">{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Address" value={newVendor.address} onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
                <input type="text" placeholder="City" value={newVendor.city} onChange={(e) => setNewVendor({ ...newVendor, city: e.target.value })} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Budget Amount (Optional)" value={newVendor.amount} onChange={(e) => setNewVendor({ ...newVendor, amount: e.target.value })} className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
              </div>
              <button type="button" onClick={addVendorToForm} className="w-full px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-1">
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
    </div>
  );
}
