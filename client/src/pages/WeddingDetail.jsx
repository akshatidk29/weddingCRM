import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, MapPin, Users, Plus, 
  CheckCircle, Circle, Clock, User, Building2, Edit, Check, X
} from 'lucide-react';
import { 
  Button, Badge, Modal, ModalFooter, Input, Select, Textarea, 
  Card, ProgressBar, EmptyState
} from '../components/common';
import { PageHeader } from '../components/layout/PageHeader';
import { formatDate, formatCurrency, daysUntil, isOverdue, taskCategories } from '../utils/helpers';
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
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  
  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  
  // Form states
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', category: 'other', priority: 'medium',
    assignedTo: '', dueDate: '', notes: ''
  });
  const [teamForm, setTeamForm] = useState({ userId: '', role: '' });
  const [vendorForm, setVendorForm] = useState({ vendorId: '', category: '', amount: '', notes: '' });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [weddingRes, usersRes, vendorsRes] = await Promise.all([
        api.get(`/weddings/${id}`),
        api.get('/auth/users'),
        api.get('/vendors')
      ]);
      setWedding(weddingRes.data.wedding);
      setTasks(weddingRes.data.tasks);
      setTasksByCategory(weddingRes.data.tasksByCategory);
      setUsers(usersRes.data.users);
      setVendors(vendorsRes.data.vendors);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', { ...taskForm, wedding: id });
      loadData();
      setShowTaskModal(false);
      setTaskForm({
        title: '', description: '', category: 'other', priority: 'medium',
        assignedTo: '', dueDate: '', notes: ''
      });
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      loadData();
    } catch (error) {
      console.error('Failed to update task:', error);
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

  const handleRemoveVendor = async (vendorId) => {
    try {
      await api.delete(`/weddings/${id}/vendors/${vendorId}`);
      loadData();
    } catch (error) {
      console.error('Failed to remove vendor:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <EmptyState 
          title="Wedding not found"
          description="The wedding you're looking for doesn't exist."
          action={<Button onClick={() => navigate('/weddings')}>Back to Weddings</Button>}
        />
      </div>
    );
  }

  const days = daysUntil(wedding.weddingDate);
  const status = statusConfig[wedding.status] || statusConfig.planning;

  const categoryOptions = taskCategories.map(c => ({ value: c.value, label: c.label }));
  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];
  const userOptions = users.map(u => ({ value: u._id, label: u.name }));
  const vendorOptions = vendors.map(v => ({ value: v._id, label: v.name }));

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

      {/* Overview Section */}
      <Section title="Overview">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <InfoItem 
            icon={Calendar} 
            label="Wedding Date" 
            value={formatDate(wedding.weddingDate)} 
          />
          <InfoItem 
            icon={MapPin} 
            label="Venue" 
            value={wedding.venue?.name ? `${wedding.venue.name}${wedding.venue.city ? `, ${wedding.venue.city}` : ''}` : null} 
          />
          <InfoItem 
            icon={Users} 
            label="Guest Count" 
            value={wedding.guestCount ? wedding.guestCount.toString() : null} 
          />
          <InfoItem 
            icon={Calendar} 
            label="Budget" 
            value={wedding.budget?.estimated ? formatCurrency(wedding.budget.estimated) : null} 
          />
        </div>
      </Section>

      {/* Progress Section */}
      <Section title="Progress">
        <div className="max-w-md">
          <ProgressBar 
            value={wedding.progress || 0} 
            showLabel 
            size="lg"
            variant={wedding.progress >= 100 ? 'success' : 'primary'}
          />
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center p-4 bg-gray-100 rounded-md">
            <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
            <p className="text-xs text-gray-400">Total Tasks</p>
          </div>
          <div className="text-center p-4 bg-gray-100 rounded-md">
            <p className="text-2xl font-semibold text-gray-900">
              {tasks.filter(t => t.status === 'completed' || t.status === 'verified').length}
            </p>
            <p className="text-xs text-gray-400">Completed</p>
          </div>
          <div className="text-center p-4 bg-gray-100 rounded-md">
            <p className="text-2xl font-semibold text-gray-900">
              {tasks.filter(t => t.status === 'in_progress').length}
            </p>
            <p className="text-xs text-gray-400">In Progress</p>
          </div>
          <div className="text-center p-4 bg-gray-100 rounded-md">
            <p className="text-2xl font-semibold text-amber-500">
              {tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'completed' && t.status !== 'verified').length}
            </p>
            <p className="text-xs text-gray-400">Overdue</p>
          </div>
        </div>
      </Section>

      {/* Tasks Section */}
      <Section 
        title="Tasks"
        action={
          isManager && (
            <Button size="sm" icon={Plus} onClick={() => setShowTaskModal(true)}>
              Add Task
            </Button>
          )
        }
      >
        {Object.keys(tasksByCategory).length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="No tasks yet"
            description={isManager ? "Add tasks to track your wedding planning progress" : "No tasks have been assigned yet"}
            action={
              isManager && (
                <Button size="sm" icon={Plus} onClick={() => setShowTaskModal(true)}>
                  Add First Task
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {taskCategories.find(c => c.value === category)?.label || category} ({categoryTasks.length})
                </h3>
                <div className="space-y-2">
                  {categoryTasks.map(task => (
                    <TaskItem
                      key={task._id}
                      task={task}
                      onStatusChange={handleTaskStatusChange}
                      canVerify={isAdmin}
                      isManager={isManager}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Team Section */}
      <Section 
        title="Team"
        action={
          isManager && (
            <Button size="sm" variant="secondary" icon={Plus} onClick={() => setShowTeamModal(true)}>
              Add Member
            </Button>
          )
        }
      >
        {wedding.team?.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No team members"
            description="Add team members to collaborate on this wedding"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {wedding.team?.map((member) => (
              <div 
                key={member.user._id}
                className="flex items-center justify-between p-4 bg-white rounded-md border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {member.user.name?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.user.name}</p>
                    <p className="text-xs text-gray-400">{member.role || member.user.role}</p>
                  </div>
                </div>
                {isManager && (
                  <button
                    onClick={() => handleRemoveTeamMember(member.user._id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Vendors Section */}
      <Section 
        title="Vendors"
        action={
          isManager && (
            <Button size="sm" variant="secondary" icon={Plus} onClick={() => setShowVendorModal(true)}>
              Add Vendor
            </Button>
          )
        }
      >
        {wedding.vendors?.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No vendors assigned"
            description="Add vendors working on this wedding"
          />
        ) : (
          <div className="space-y-3">
            {wedding.vendors?.map((weddingVendor) => (
              <div 
                key={weddingVendor.vendor._id}
                className="flex items-center justify-between p-4 bg-white rounded-md border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{weddingVendor.vendor.name}</p>
                    <p className="text-xs text-gray-400">
                      {weddingVendor.category} {weddingVendor.amount ? `• ${formatCurrency(weddingVendor.amount)}` : ''}
                    </p>
                  </div>
                </div>
                {isManager && (
                  <button
                    onClick={() => handleRemoveVendor(weddingVendor.vendor._id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Notes Section */}
      {wedding.notes && (
        <Section title="Notes">
          <p className="text-gray-600 whitespace-pre-wrap">{wedding.notes}</p>
        </Section>
      )}

      {/* Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Add Task"
        size="md"
      >
        <form onSubmit={handleTaskSubmit}>
          <div className="space-y-4">
            <Input
              label="Task Title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="Enter task title"
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Category"
                value={taskForm.category}
                onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                options={categoryOptions}
              />
              <Select
                label="Priority"
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                options={priorityOptions}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Assign To"
                value={taskForm.assignedTo}
                onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                options={[{ value: '', label: 'Unassigned' }, ...userOptions]}
              />
              <Input
                label="Due Date"
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>

            <Textarea
              label="Description"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="Task details..."
              rows={3}
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setShowTaskModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Task</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Team Modal */}
      <Modal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        title="Add Team Member"
        size="sm"
      >
        <form onSubmit={handleAddTeamMember}>
          <div className="space-y-4">
            <Select
              label="Team Member"
              value={teamForm.userId}
              onChange={(e) => setTeamForm({ ...teamForm, userId: e.target.value })}
              options={[{ value: '', label: 'Select member' }, ...userOptions]}
              required
            />
            <Input
              label="Role"
              value={teamForm.role}
              onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
              placeholder="e.g., Coordinator"
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setShowTeamModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Member</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Vendor Modal */}
      <Modal
        isOpen={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        title="Add Vendor"
        size="sm"
      >
        <form onSubmit={handleAddVendor}>
          <div className="space-y-4">
            <Select
              label="Vendor"
              value={vendorForm.vendorId}
              onChange={(e) => setVendorForm({ ...vendorForm, vendorId: e.target.value })}
              options={[{ value: '', label: 'Select vendor' }, ...vendorOptions]}
              required
            />
            <Input
              label="Category"
              value={vendorForm.category}
              onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
              placeholder="e.g., Catering"
            />
            <Input
              label="Amount"
              type="number"
              value={vendorForm.amount}
              onChange={(e) => setVendorForm({ ...vendorForm, amount: e.target.value })}
              placeholder="Contract amount"
            />
            <Textarea
              label="Notes"
              value={vendorForm.notes}
              onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setShowVendorModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Vendor</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
