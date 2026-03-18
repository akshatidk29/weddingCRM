import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, MapPin, Users, DollarSign, 
  Plus, CheckCircle, Circle, Clock, UserPlus, Store, Edit, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { PageLoader } from '../components/ui/Loader';
import { Avatar } from '../components/ui/Avatar';
import { formatDate, formatCurrency, categoryColors, taskCategories, daysUntil, isOverdue } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function WeddingDetail() {
  const { id } = useParams();
  const { user, isManager, isAdmin } = useAuth();
  const [wedding, setWedding] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksByCategory, setTasksByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', category: 'other', priority: 'medium',
    assignedTo: '', dueDate: '', notes: ''
  });
  
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
      
      const expanded = {};
      Object.keys(res.data.tasksByCategory).forEach(cat => { expanded[cat] = true; });
      setExpandedCategories(expanded);
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
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, taskForm);
      } else {
        await api.post('/tasks', { ...taskForm, wedding: id });
      }
      loadWedding();
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
      console.error('Failed to update task:', error);
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
    setTaskForm({
      title: '', description: '', category: 'other', priority: 'medium',
      assignedTo: '', dueDate: '', notes: ''
    });
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
      notes: task.notes || ''
    });
    setShowTaskModal(true);
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

  return (
    <div className="space-y-6">
      <Link to="/weddings" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Weddings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">{wedding.name}</h1>
                  <p className="text-gray-400">{wedding.clientName}</p>
                </div>
                <div className="text-right">
                  {days !== null && days >= 0 && (
                    <div className={`text-3xl font-bold ${days <= 7 ? 'text-yellow-400' : 'text-purple-400'}`}>
                      {days === 0 ? 'Today!' : `${days} days`}
                    </div>
                  )}
                  <p className="text-sm text-gray-500">until the big day</p>
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
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Progress</span>
                  <span className="text-sm text-white font-medium">{wedding.progress || 0}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-violet-500 h-3 rounded-full transition-all"
                    style={{ width: `${wedding.progress || 0}%` }}
                  />
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
              <Button icon={Plus} size="sm" onClick={() => setShowTaskModal(true)}>
                Add Task
              </Button>
            </CardHeader>
            <CardContent>
              {Object.keys(tasksByCategory).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tasks yet. Add your first task to get started.
                </div>
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
                          <span className="text-sm text-gray-400">
                            {completed}/{categoryTasks.length} done
                          </span>
                        </button>
                        
                        {expandedCategories[category] && (
                          <div className="divide-y divide-white/[0.06]">
                            {categoryTasks.map(task => (
                              <div
                                key={task._id}
                                className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
                              >
                                <button
                                  onClick={() => {
                                    if (task.status === 'pending') {
                                      handleTaskStatusChange(task._id, 'done');
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
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={`font-medium ${
                                      task.status === 'done' || task.status === 'verified' 
                                        ? 'text-gray-500 line-through' 
                                        : 'text-white'
                                    }`}>
                                      {task.title}
                                    </p>
                                    {task.priority === 'high' && <Badge variant="danger" size="sm">High</Badge>}
                                    {task.priority === 'urgent' && <Badge variant="danger" size="sm">Urgent</Badge>}
                                    {task.status === 'verified' && <Badge variant="success" size="sm">Verified</Badge>}
                                  </div>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                    {task.dueDate && (
                                      <span className={isOverdue(task.dueDate) && task.status === 'pending' ? 'text-red-400' : ''}>
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {formatDate(task.dueDate)}
                                      </span>
                                    )}
                                    {task.assignedTo && (
                                      <span>
                                        {task.assignedTo.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => openEditTask(task)}
                                  className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
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
              {isManager && (
                <Button icon={UserPlus} size="sm" variant="ghost" onClick={() => setShowTeamModal(true)} />
              )}
            </CardHeader>
            <CardContent>
              {wedding.relationshipManager && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 mb-3">
                  <Avatar name={wedding.relationshipManager.name} size="md" />
                  <div>
                    <p className="text-white font-medium">{wedding.relationshipManager.name}</p>
                    <p className="text-xs text-purple-400">Relationship Manager</p>
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
              {isManager && (
                <Button icon={Store} size="sm" variant="ghost" onClick={() => setShowVendorModal(true)} />
              )}
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

      <Modal isOpen={showTaskModal} onClose={closeTaskModal} title={editingTask ? 'Edit Task' : 'Add Task'} size="md">
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

      <Modal isOpen={showTeamModal} onClose={() => setShowTeamModal(false)} title="Add Team Member" size="sm">
        <form onSubmit={handleAddTeam} className="space-y-4">
          <Select
            label="Team Member"
            value={teamForm.userId}
            onChange={(e) => setTeamForm({ ...teamForm, userId: e.target.value })}
            options={users.map(u => ({ value: u._id, label: `${u.name} (${u.role.replace('_', ' ')})` }))}
            required
          />
          <Input
            label="Role"
            value={teamForm.role}
            onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
            placeholder="e.g., Decor Lead, F&B Coordinator"
          />
          <Button type="submit" className="w-full">Add Member</Button>
        </form>
      </Modal>

      <Modal isOpen={showVendorModal} onClose={() => setShowVendorModal(false)} title="Add Vendor" size="sm">
        <form onSubmit={handleAddVendor} className="space-y-4">
          <Select
            label="Vendor"
            value={vendorForm.vendorId}
            onChange={(e) => setVendorForm({ ...vendorForm, vendorId: e.target.value })}
            options={vendors.map(v => ({ value: v._id, label: `${v.name} (${v.category})` }))}
            required
          />
          <Input
            label="Amount"
            type="number"
            value={vendorForm.amount}
            onChange={(e) => setVendorForm({ ...vendorForm, amount: e.target.value })}
          />
          <Textarea
            label="Notes"
            value={vendorForm.notes}
            onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
            rows={2}
          />
          <Button type="submit" className="w-full">Add Vendor</Button>
        </form>
      </Modal>
    </div>
  );
}
