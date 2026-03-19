import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Clock, AlertTriangle, CheckCircle, Circle } from 'lucide-react';
import { Card, Badge, Select, EmptyState } from '../components/common';
import { PageHeader } from '../components/layout/PageHeader';
import { formatDate, taskCategories, isOverdue } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const statusConfig = {
  pending: { variant: 'default', label: 'Pending' },
  in_progress: { variant: 'warning', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
  verified: { variant: 'success', label: 'Verified' }
};

function StatCard({ label, value, icon: Icon, active, onClick, variant = 'default' }) {
  const variantClasses = {
    default: 'text-gray-900',
    warning: 'text-amber-500',
    success: 'text-emerald-600',
    error: 'text-red-600'
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between p-4 bg-white rounded-lg border transition-all ${
        active ? 'border-blue-600 shadow-sm' : 'border-gray-200 hover:border-gray-400'
      }`}
    >
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className={`text-2xl font-semibold ${variantClasses[variant]}`}>{value}</p>
      </div>
      <Icon className={`h-6 w-6 ${variantClasses[variant]}`} />
    </button>
  );
}

function TaskItem({ task, onStatusChange, canVerify }) {
  const overdue = isOverdue(task.dueDate) && task.status !== 'completed' && task.status !== 'verified';
  const isCompleted = task.status === 'completed' || task.status === 'verified';
  
  const getNextStatus = (current) => {
    if (current === 'pending') return 'in_progress';
    if (current === 'in_progress') return 'completed';
    if (current === 'completed' && canVerify) return 'verified';
    return null;
  };

  const nextStatus = getNextStatus(task.status);
  const category = taskCategories.find(c => c.value === task.category);

  return (
    <div className={`flex items-center gap-4 p-4 border-b border-gray-200 last:border-0 ${
      overdue ? 'bg-red-50' : 'hover:bg-gray-100'
    } transition-colors`}>
      <button
        onClick={() => nextStatus && onStatusChange(task._id, nextStatus)}
        disabled={!nextStatus}
        className="flex-shrink-0"
      >
        {isCompleted ? (
          <CheckCircle className={`h-5 w-5 ${task.status === 'verified' ? 'text-emerald-600' : 'text-gray-400'}`} />
        ) : (
          <Circle className="h-5 w-5 text-gray-400 hover:text-blue-600" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-medium ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {task.title}
          </p>
          {task.priority === 'high' && <Badge variant="warning" size="sm">High</Badge>}
          {task.status === 'verified' && <Badge variant="success" size="sm">Verified</Badge>}
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
          <Link 
            to={`/weddings/${task.wedding?._id}`} 
            className="hover:text-blue-600"
            onClick={(e) => e.stopPropagation()}
          >
            {task.wedding?.name}
          </Link>
          {task.assignedTo && (
            <>
              <span>•</span>
              <span>{task.assignedTo.name}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {task.dueDate && (
          <span className={`text-sm ${overdue ? 'text-red-600' : 'text-gray-400'}`}>
            {formatDate(task.dueDate)}
          </span>
        )}
        <Badge variant="default" size="sm">
          {category?.label || task.category}
        </Badge>
      </div>
    </div>
  );
}

export default function Tasks() {
  const { user, isAdmin, isManager } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: '', wedding: '' });
  const [weddings, setWeddings] = useState([]);
  // Team members default to "My Tasks" view
  const [view, setView] = useState(isManager ? 'all' : 'my');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Team members only fetch their tasks
      const tasksEndpoint = isManager ? '/tasks' : '/tasks/my-tasks';
      const [tasksRes, weddingsRes] = await Promise.all([
        api.get(tasksEndpoint),
        api.get('/weddings')
      ]);
      setTasks(tasksRes.data.tasks || []);
      setWeddings(weddingsRes.data.weddings || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      loadData();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter.category && task.category !== filter.category) return false;
    if (filter.wedding && task.wedding?._id !== filter.wedding) return false;
    if (view === 'my' && task.assignedTo?._id !== user._id) return false;
    if (view === 'overdue') {
      return isOverdue(task.dueDate) && task.status !== 'completed' && task.status !== 'verified';
    }
    if (view === 'pending') return task.status === 'pending' || task.status === 'in_progress';
    if (view === 'completed') return task.status === 'completed' || task.status === 'verified';
    return true;
  });

  // Group tasks by category
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const cat = task.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(task);
    return acc;
  }, {});

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed' || t.status === 'verified').length,
    overdue: tasks.filter(t => (t.status === 'pending' || t.status === 'in_progress') && isOverdue(t.dueDate)).length
  };

  const categoryOptions = taskCategories.map(c => ({ value: c.value, label: c.label }));
  const weddingOptions = weddings.map(w => ({ value: w._id, label: w.name }));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader 
        title="Tasks"
        description="Manage all tasks across weddings"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          label={isManager ? "Total Tasks" : "My Tasks"}
          value={stats.total}
          icon={CheckSquare}
          active={view === 'all' || view === 'my'}
          onClick={() => setView(isManager ? 'all' : 'my')}
        />
        <StatCard 
          label="Pending"
          value={stats.pending}
          icon={Clock}
          variant="warning"
          active={view === 'pending'}
          onClick={() => setView('pending')}
        />
        <StatCard 
          label="Completed"
          value={stats.completed}
          icon={CheckCircle}
          variant="success"
          active={view === 'completed'}
          onClick={() => setView('completed')}
        />
        <StatCard 
          label="Overdue"
          value={stats.overdue}
          icon={AlertTriangle}
          variant="error"
          active={view === 'overdue'}
          onClick={() => setView('overdue')}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-1">
          {(isManager ? ['all', 'my', 'pending', 'completed', 'overdue'] : ['my', 'pending', 'completed', 'overdue']).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === v
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {v === 'all' ? 'All' : v === 'my' ? 'My Tasks' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            options={[{ value: '', label: 'All Categories' }, ...categoryOptions]}
            className="w-40"
          />
          <Select
            value={filter.wedding}
            onChange={(e) => setFilter({ ...filter, wedding: e.target.value })}
            options={[{ value: '', label: 'All Weddings' }, ...weddingOptions]}
            className="w-48"
          />
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="No tasks match your current filters"
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([category, categoryTasks]) => {
            const catInfo = taskCategories.find(c => c.value === category);
            return (
              <div key={category}>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {catInfo?.label || category} ({categoryTasks.length})
                </h3>
                <div className="bg-white rounded-lg border border-gray-200">
                  {categoryTasks.map(task => (
                    <TaskItem
                      key={task._id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      canVerify={isAdmin}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
