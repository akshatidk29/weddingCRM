import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, MapPin, Users, DollarSign, 
  Plus, CheckCircle, Circle, Clock, UserPlus, Store, Edit, Check,
  ChevronDown, ChevronRight, Trash2, Phone, X, AlertCircle, Mail,
  PartyPopper, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { PageLoader } from '../components/ui/Loader';
import { Avatar } from '../components/ui/Avatar';
import { formatDate, formatCurrency, categoryColors, taskCategories, vendorCategories, daysUntil, isOverdue } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const statusConfig = {
  planning: { variant: 'primary', label: 'Planning' },
  in_progress: { variant: 'warning', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'error', label: 'Cancelled' }
};

const taskStatusConfig = {
  pending: { variant: 'default', label: 'Pending' },
  in_progress: { variant: 'warning', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
  verified: { variant: 'success', label: 'Verified' }
};

function Section({ title, action, children }) {
  return (
    <section className="py-8 border-b border-gray-200 last:border-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-md bg-gray-100">
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function TaskItem({ task, onStatusChange, canVerify, isManager }) {
  const overdue = isOverdue(task.dueDate) && task.status !== 'completed' && task.status !== 'verified';
  
  const getNextStatus = (current) => {
    if (current === 'pending') return 'in_progress';
    if (current === 'in_progress') return 'completed';
    if (current === 'completed' && canVerify) return 'verified';
    return null;
  };

  const nextStatus = getNextStatus(task.status);

  return (
    <div className={`flex items-center gap-4 p-4 rounded-md border ${
      overdue ? 'border-red-600/30 bg-red-50' : 'border-gray-200 bg-white'
    }`}>
      <button
        onClick={() => nextStatus && onStatusChange(task._id, nextStatus)}
        disabled={!nextStatus}
        className="flex-shrink-0"
      >
        {task.status === 'completed' || task.status === 'verified' ? (
          <CheckCircle className={`h-5 w-5 ${task.status === 'verified' ? 'text-emerald-600' : 'text-gray-400'}`} />
        ) : (
          <Circle className="h-5 w-5 text-gray-400 hover:text-blue-600" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${task.status === 'completed' || task.status === 'verified' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-1">
          {task.assignedTo && (
            <span className="text-xs text-gray-400">
              {task.assignedTo.name}
            </span>
          )}
          {task.dueDate && (
            <span className={`text-xs ${overdue ? 'text-red-600' : 'text-gray-400'}`}>
              Due {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
      
      <Badge variant={taskStatusConfig[task.status]?.variant || 'default'} size="sm">
        {taskStatusConfig[task.status]?.label || task.status}
      </Badge>
    </div>
  );
}

export default function WeddingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isManager, isAdmin } = useAuth();
  const [wedding, setWedding] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksByCategory, setTasksByCategory] = useState({});
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  
  // Modal states
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
  
  // Form states
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
    loadData();
  }, [id]);

  const loadData = async () => {
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
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
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

  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/weddings/${id}/team`, teamForm);
      loadData();
      setShowTeamModal(false);
      setTeamForm({ userId: '', role: '' });
    } catch (error) {
      console.error('Failed to add team member:', error);
    }
  };

  const handleRemoveTeamMember = async (userId) => {
    try {
      await api.delete(`/weddings/${id}/team/${userId}`);
      loadData();
    } catch (error) {
      console.error('Failed to remove team member:', error);
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/weddings/${id}/vendors`, vendorForm);
      loadData();
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

  if (loading) return <PageLoader />;
  if (!wedding) return <div className="text-center py-12 text-gray-400">Wedding not found</div>;

  const days = daysUntil(wedding.weddingDate);

  const getStatusIcon = (status) => {
    if (status === 'verified') return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (status === 'done') return <Check className="w-5 h-5 text-blue-400" />;
    if (status === 'not_needed') return <Circle className="w-5 h-5 text-gray-500" />;
    return <Circle className="w-5 h-5 text-gray-600" />;
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
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/weddings')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Weddings
      </button>

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">{wedding.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-gray-600">Client: {wedding.clientName}</p>
            {days !== null && days >= 0 && (
              <p className={`text-sm mt-1 ${days <= 7 ? 'text-amber-500' : 'text-gray-400'}`}>
                {days === 0 ? 'Wedding is today!' : `${days} days until the wedding`}
              </p>
            )}
          </div>
        </div>
      </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02]">
                  <Calendar className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="text-white font-medium">{formatDate(wedding.weddingDate)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02]">
                  <MapPin className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-sm text-gray-500">Venue</p>
                  <p className="text-white font-medium">{wedding.venue?.name || 'TBD'}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02]">
                  <Users className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-sm text-gray-500">Guests</p>
                  <p className="text-white font-medium">{wedding.guestCount || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02]">
                  <DollarSign className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="text-white font-medium">{formatCurrency(wedding.budget?.estimated)}</p>
                </div>
              </div>

              <div className="mt-6">
                {/* EVENTS SECTION */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <PartyPopper className="h-5 w-5 mr-2 text-indigo-500" />
              Wedding Events
            </h2>
            {(isAdmin || isManager) && (
              <Button onClick={() => setShowEventModal(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            )}
          </div>
          
          {events.length === 0 ? (
            <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
              <PartyPopper className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No events planned yet.</p>
              {(isAdmin || isManager) && (
                <Button variant="outline" className="mt-4" onClick={() => setShowEventModal(true)}>
                  Create First Event
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event._id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <div 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedEvents({...expandedEvents, [event._id]: !expandedEvents[event._id]})}
                  >
                    <div className="flex items-center flex-1">
                      {expandedEvents[event._id] ? (
                        <ChevronDown className="h-5 w-5 text-gray-400 mr-2" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400 mr-2" />
                      )}
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg text-gray-900">{event.name}</h3>
                          <Badge variant={
                            event.status === 'completed' ? 'success' : 
                            event.status === 'in_progress' ? 'warning' : 'secondary'
                          }>
                            {event.status === 'completed' ? 'Completed' : 
                             event.status === 'in_progress' ? 'In Progress' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1" /> {formatDate(event.eventDate)}</span>
                          {event.venue?.name && <span className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1" /> {event.venue.name}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-6 sm:w-1/3">
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Task Progress</div>
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${event.progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                              style={{ width: `${event.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{event.progress || 0}%</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        {(isAdmin || isManager) && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => openEditEvent(event)}>
                              <Edit className="h-4 w-4 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event._id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {expandedEvents[event._id] && (
                    <div className="p-4 border-b bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                          {event.description && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-1">Details</h4>
                              <p className="text-sm text-gray-600">{event.description}</p>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                                <Target className="h-4 w-4 mr-1 text-gray-400" /> Event Tasks
                              </h4>
                              <Button variant="outline" size="sm" onClick={() => openAddTaskToEvent(event._id)} className="h-7 text-xs">
                                <Plus className="h-3 w-3 mr-1" /> Add Task
                              </Button>
                            </div>
                            
                            {tasks.filter(t => t.event?._id === event._id || t.event === event._id).length === 0 ? (
                              <div className="text-sm text-gray-500 italic py-2">No tasks assigned to this event yet.</div>
                            ) : (
                              <div className="space-y-2">
                                {tasks.filter(t => t.event?._id === event._id || t.event === event._id).map(task => (
                                  <div key={task._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                      <div onClick={() => toggleTaskStatus(task._id, task.status)} className="cursor-pointer">
                                        {task.status === 'done' || task.status === 'verified' ? (
                                          <CheckCircle className="h-5 w-5 text-green-500" />
                                        ) : task.status === 'in_progress' ? (
                                          <Clock className="h-5 w-5 text-yellow-500" />
                                        ) : (
                                          <Circle className="h-5 w-5 text-gray-300" />
                                        )}
                                      </div>
                                      <div className="cursor-pointer" onClick={() => toggleTaskExpand(task._id)}>
                                        <div className={`font-medium ${task.status === 'done' || task.status === 'verified' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                          {task.title}
                                        </div>
                                        {task.dueDate && (
                                          <div className={`text-xs ${isOverdue(task.dueDate) && task.status !== 'done' && task.status !== 'verified' ? 'text-red-500 font-medium flex items-center' : 'text-gray-500'}`}>
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
                                      <Badge variant="outline" className={categoryColors[task.category]?.text || 'text-gray-500'}>
                                        {categoryColors[task.category]?.icon} {taskCategories.find(c => c.value === task.category)?.label || task.category}
                                      </Badge>
                                      {(isAdmin || isManager) && (
                                        <Button variant="ghost" size="sm" onClick={() => openEditTask(task)} className="h-8 w-8 p-0">
                                          <Edit className="h-4 w-4 text-gray-400" />
                                        </Button>
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
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                              <Users className="h-4 w-4 mr-1 text-gray-400" /> Event Team
                            </h4>
                            {(isAdmin || isManager) && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setSelectedEventForTeam(event._id); setShowEventTeamModal(true); }}
                                className="h-7 w-7 p-0 rounded-full bg-gray-100 hover:bg-gray-200"
                              >
                                <Plus className="h-3 w-3 text-gray-600" />
                              </Button>
                            )}
                          </div>
                          
                          {(!event.assignedTeam || event.assignedTeam.length === 0) ? (
                            <div className="text-sm text-gray-500 italic">No specific team assigned.</div>
                          ) : (
                            <div className="space-y-3">
                              {event.assignedTeam.map((member, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                                  <div className="flex items-center gap-2">
                                    <Avatar name={member.user?.name} size="sm" src={member.user?.avatar} />
                                    <div>
                                      <p className="text-sm font-medium text-gray-800">{member.user?.name}</p>
                                      <p className="text-xs text-gray-500 capitalize">{member.role || 'Member'}</p>
                                    </div>
                                  </div>
                                  {(isAdmin || isManager) && (
                                    <button 
                                      onClick={() => handleRemoveEventTeam(event._id, member.user?._id)}
                                      className="text-gray-400 hover:text-red-500 transition-colors"
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
        </div>

        {/* GENERAL TASKS SECTION */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-indigo-500" />
            General Tasks (Not in Events)
          </h2>
          <Button icon={Plus} size="sm" onClick={() => openAddTaskToEvent('')}>Add Task</Button>
        </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Progress</span>
                  <span className="text-sm text-white font-medium">{wedding.progress || 0}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div className="bg-gradient-to-r from-purple-500 to-violet-500 h-3 rounded-full transition-all" style={{ width: `${wedding.progress || 0}%` }} />
                </div>
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span>{wedding.taskStats?.completed || 0} completed</span>
                  <span>{wedding.taskStats?.pending || 0} pending</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tasks & Checklist</CardTitle>
              <Button icon={Plus} size="sm" onClick={() => setShowTaskModal(true)}>Add Task</Button>
            </CardHeader>
            <CardContent>
              {Object.keys(tasksByCategory).length === 0 ? (
                <div className="text-center py-8 text-gray-500">No tasks yet. Add your first task to get started.</div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(tasksByCategory).map(([category, categoryTasks]) => {
                    const catInfo = categoryColors[category] || categoryColors.other;
                    const completed = categoryTasks.filter(t => t.status === 'done' || t.status === 'verified').length;
                    
                    return (
                      <div key={category} className="border border-white/[0.06] rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                          className={`w-full p-4 flex items-center justify-between ${catInfo.bg} hover:opacity-90 transition-opacity`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{catInfo.icon}</span>
                            <span className={`font-medium ${catInfo.text} capitalize`}>{category.replace('_', ' ')}</span>
                          </div>
                          <span className="text-sm text-gray-400">{completed}/{categoryTasks.length} done</span>
                        </button>
                        
                        {expandedCategories[category] && (
                          <div className="divide-y divide-white/[0.06]">
                            {categoryTasks.map(task => {
                              const info = getCompletionInfo(task);
                              const isExpanded = expandedTasks[task._id];

                              return (
                                <div key={task._id}>
                                  <div className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                                    <button
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
                                      className="flex-shrink-0"
                                    >
                                      {getStatusIcon(task.status)}
                                    </button>
                                    
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleTaskExpand(task._id)}>
                                      <div className="flex items-center gap-2">
                                        <p className={`font-medium ${task.status === 'done' || task.status === 'verified' ? 'text-gray-500 line-through' : 'text-white'}`}>
                                          {task.title}
                                        </p>
                                        {task.priority === 'high' && <Badge variant="danger" size="sm">High</Badge>}
                                        {task.priority === 'urgent' && <Badge variant="danger" size="sm">Urgent</Badge>}
                                        {task.status === 'verified' && <Badge variant="success" size="sm">Verified ✓</Badge>}
                                      </div>
                                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                        {task.dueDate && (
                                          <span className={isOverdue(task.dueDate) && task.status === 'pending' ? 'text-red-400' : ''}>
                                            <Clock className="w-3 h-3 inline mr-1" />{formatDate(task.dueDate)}
                                          </span>
                                        )}
                                        {task.assignedTo && <span>{task.assignedTo.name}</span>}
                                        {info.hasSubtasks && (
                                          <span className={info.allSubtasksDone ? 'text-green-400' : 'text-yellow-400'}>
                                            {info.subtasksDone}/{info.subtasksTotal} subtasks
                                          </span>
                                        )}
                                        {info.hasVendors && (
                                          <span className={info.allVendorsDone ? 'text-green-400' : 'text-orange-400'}>
                                            {info.vendorsDone}/{info.vendorsTotal} vendors
                                          </span>
                                        )}
                                      </div>
                                      {task.status === 'pending' && !info.canAutoComplete && (info.hasSubtasks || info.hasVendors) && (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-amber-400">
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
                                        <button onClick={() => toggleTaskExpand(task._id)} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </button>
                                      )}
                                      <button onClick={() => openEditTask(task)} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                                        <Edit className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div className="px-4 pb-4 ml-14 space-y-3">
                                      {info.hasSubtasks && (
                                        <div className="space-y-1">
                                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Subtasks</p>
                                          {task.subtasks.map(sub => (
                                            <div key={sub._id} className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-white/[0.03] group">
                                              <button
                                                onClick={() => handleToggleSubtask(task._id, sub._id)}
                                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${sub.completed ? 'bg-green-500 border-green-500' : 'border-gray-600 hover:border-purple-500'}`}
                                              >
                                                {sub.completed && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                              </button>
                                              <span className={`text-sm flex-1 ${sub.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{sub.title}</span>
                                              {sub.amount !== 0 && (
                                                <Badge size="sm" variant={sub.paymentStatus === 'completed' ? 'success' : sub.paymentStatus === 'partial' ? 'warning' : 'secondary'}>
                                                  ${Math.abs(sub.amount)} {sub.amount < 0 ? 'Receivable' : 'Payable'}
                                                </Badge>
                                              )}
                                              <button onClick={() => handleDeleteSubtask(task._id, sub._id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-all">
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {info.hasVendors && (
                                        <div className="space-y-1">
                                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-3">Vendors</p>
                                          {task.taskVendors.map(tv => (
                                            <div key={tv._id} className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-white/[0.03] group">
                                              <button
                                                onClick={() => handleUpdateVendorStatus(task._id, tv._id, tv.status === 'completed' ? 'pending' : 'completed')}
                                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${tv.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-600 hover:border-purple-500'}`}
                                              >
                                                {tv.status === 'completed' && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                              </button>
                                              <div className="flex-1">
                                                <span className={`text-sm ${tv.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                                  {tv.vendor?.name || 'Unknown'}
                                                </span>
                                                {tv.vendor?.phone && <span className="text-xs text-gray-500 ml-2"><Phone className="w-2.5 h-2.5 inline mr-0.5" />{tv.vendor.phone}</span>}
                                                {tv.vendor?.email && <span className="text-xs text-gray-500 ml-2"><Mail className="w-2.5 h-2.5 inline mr-0.5" />{tv.vendor.email}</span>}
                                                {tv.amount !== 0 && (
                                                  <span className="text-xs ml-2 text-blue-400">
                                                    Pay: ${Math.abs(tv.amount)} ({tv.paymentStatus || 'pending'})
                                                  </span>
                                                )}
                                              </div>
                                              <Badge size="sm" variant={tv.status === 'completed' ? 'success' : 'warning'}>{tv.status}</Badge>
                                              <button onClick={() => handleDeleteTaskVendor(task._id, tv._id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-all">
                                                <Trash2 className="w-3 h-3" />
                                              </button>
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
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Team</CardTitle>
              {isManager && <Button icon={UserPlus} size="sm" variant="ghost" onClick={() => setShowTeamModal(true)} />}
            </CardHeader>
            <CardContent>
              {wedding.relationshipManager && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 mb-3">
                  <Avatar name={wedding.relationshipManager.name} size="md" />
                  <div>
                    <p className="font-medium text-gray-900">{weddingVendor.vendor.name}</p>
                    <p className="text-xs text-gray-400">
                      {weddingVendor.category} {weddingVendor.amount ? `• ${formatCurrency(weddingVendor.amount)}` : ''}
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {wedding.assignedTeam?.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                    <Avatar name={member.user?.name} size="sm" />
                    <div>
                      <p className="text-white text-sm">{member.user?.name}</p>
                      <p className="text-xs text-gray-500">{member.role || 'Team Member'}</p>
                    </div>
                  </div>
                ))}
              </div>
              {!wedding.assignedTeam?.length && !wedding.relationshipManager && (
                <p className="text-sm text-gray-500 text-center py-4">No team assigned</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vendors</CardTitle>
              {isManager && <Button icon={Store} size="sm" variant="ghost" onClick={() => setShowVendorModal(true)} />}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {wedding.vendors?.map((v, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium">{v.vendor?.name}</p>
                      {v.confirmed && <Badge variant="success" size="sm">Confirmed</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 capitalize">{v.category}</p>
                    {v.amount > 0 && <p className="text-sm text-green-400 mt-1">{formatCurrency(v.amount)}</p>}
                  </div>
                ))}
              </div>
              {!wedding.vendors?.length && (
                <p className="text-sm text-gray-500 text-center py-4">No vendors assigned</p>
              )}
            </CardContent>
          </Card>
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
            <label className="block text-sm font-medium text-gray-400">Subtasks</label>
            <div className="space-y-1.5">
              {taskForm.subtasks.map((sub, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-lg">
                  <div className={`w-3.5 h-3.5 rounded border ${sub.completed ? 'bg-green-500 border-green-500' : 'border-gray-600'}`} />
                  <span className={`text-sm flex-1 ${sub.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{sub.title}</span>
                  {sub.amount !== 0 && (
                    <span className="text-xs text-blue-400 mr-2">${Math.abs(sub.amount)}</span>
                  )}
                  <button type="button" onClick={() => removeSubtaskFromForm(idx)} className="p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Add a subtask..." value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtaskToForm(); } }} className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
              <input type="number" placeholder="Amt (optional)" value={newSubtaskAmount} onChange={(e) => setNewSubtaskAmount(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtaskToForm(); } }} className="w-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
              <button type="button" onClick={addSubtaskToForm} className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Vendors */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Vendors</label>
            <div className="space-y-1.5">
              {taskForm.taskVendors.map((tv, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-lg">
                  <Store className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-sm text-gray-300 flex-1">{getVendorDisplayName(tv)}</span>
                  {getVendorDisplayPhone(tv) && <span className="text-xs text-gray-500"><Phone className="w-2.5 h-2.5 inline mr-0.5" />{getVendorDisplayPhone(tv)}</span>}
                  {getVendorDisplayEmail(tv) && <span className="text-xs text-gray-500"><Mail className="w-2.5 h-2.5 inline mr-0.5" />{getVendorDisplayEmail(tv)}</span>}
                  {tv.amount !== 0 && (
                    <span className="text-xs text-blue-400 mr-2">${Math.abs(tv.amount)}</span>
                  )}
                  <button type="button" onClick={() => removeVendorFromForm(idx)} className="p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-colors">
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
            <div className="border border-white/[0.06] rounded-lg p-3 space-y-2">
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

          <Textarea label="Notes" value={taskForm.notes} onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })} rows={2} />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeTaskModal}>Cancel</Button>
            <Button type="submit" className="flex-1">{editingTask ? 'Update' : 'Create'} Task</Button>
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setShowTaskModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Task</Button>
          </ModalFooter>
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
          <div className="space-y-2 border border-gray-100 rounded-lg p-3 bg-gray-50/50">
            <label className="text-sm font-medium text-gray-700">Venue Info</label>
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
    </div>
  );
}
