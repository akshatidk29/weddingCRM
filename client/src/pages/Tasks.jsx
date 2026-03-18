import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Clock, AlertTriangle, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Input';
import { PageLoader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate, categoryColors, taskCategories, isOverdue } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Tasks() {
  const { user, isManager } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', category: '', wedding: '' });
  const [weddings, setWeddings] = useState([]);
  const [view, setView] = useState('all');

  useEffect(() => {
    loadTasks();
    loadWeddings();
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

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter.status && task.status !== filter.status) return false;
    if (filter.category && task.category !== filter.category) return false;
    if (filter.wedding && task.wedding?._id !== filter.wedding) return false;
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
            onChange={(e) => setFilter({ ...filter, wedding: e.target.value })}
            options={weddings.map(w => ({ value: w._id, label: w.name }))}
            placeholder="All Weddings"
            className="w-48"
          />
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
            <div className="divide-y divide-white/[0.06]">
              {filteredTasks.map(task => {
                const catInfo = categoryColors[task.category] || categoryColors.other;
                const overdue = task.status === 'pending' && isOverdue(task.dueDate);

                return (
                  <div key={task._id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                    <button
                      onClick={() => {
                        if (task.status === 'pending') handleStatusChange(task._id, 'done');
                        else if (task.status === 'done') handleStatusChange(task._id, 'pending');
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

                    <div className="flex-1 min-w-0">
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
                        {task.status === 'verified' && <Badge variant="success" size="sm">Verified</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <Link to={`/weddings/${task.wedding?._id}`} className="hover:text-purple-400">
                          {task.wedding?.name}
                        </Link>
                        {task.assignedTo && (
                          <span>• {task.assignedTo.name}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {task.dueDate && (
                        <p className={`text-sm ${overdue ? 'text-red-400' : 'text-gray-400'}`}>
                          {formatDate(task.dueDate)}
                        </p>
                      )}
                      <Badge size="sm" className={catInfo.bg}>
                        <span className={catInfo.text}>{task.category}</span>
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
