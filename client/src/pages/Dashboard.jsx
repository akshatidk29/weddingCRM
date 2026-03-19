import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Heart, CheckSquare, TrendingUp, 
  Calendar, ArrowRight, Clock, AlertCircle
} from 'lucide-react';
import { Card, Badge } from '../components/common';
import { PageHeader } from '../components/layout/PageHeader';
import { formatDate, formatRelative, daysUntil } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

function MetricCard({ label, value, change, icon: Icon, trend }) {
  return (
    <div className="flex items-center gap-4 p-5 bg-white rounded-lg border border-gray-200">
      <div className="p-3 rounded-md bg-gray-100">
        <Icon className="h-5 w-5 text-gray-600" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {change && (
          <p className={`text-xs mt-0.5 ${trend === 'up' ? 'text-emerald-600' : 'text-gray-400'}`}>
            {change}
          </p>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, action, actionHref }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {action && (
        <Link 
          to={actionHref} 
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          {action}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, isManager } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Team members see limited dashboard
      if (!isManager) {
        const [tasksRes] = await Promise.all([
          api.get('/tasks/my-tasks')
        ]);
        setMyTasks(tasksRes.data.tasks || []);
      } else {
        const [statsRes, activityRes, monthlyRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/activity'),
          api.get('/dashboard/monthly')
        ]);
        setStats(statsRes.data.stats);
        setActivity(activityRes.data);
        setMonthlyData(monthlyRes.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
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

  const chartData = monthlyData?.leadsPerMonth?.map(item => ({
    month: new Date(item._id.year, item._id.month - 1).toLocaleDateString('en', { month: 'short' }),
    leads: item.count,
    conversions: monthlyData?.conversionsPerMonth?.find(
      c => c._id.year === item._id.year && c._id.month === item._id.month
    )?.count || 0
  })) || [];

  const getStageVariant = (stage) => {
    const variants = {
      inquiry: 'default',
      proposal: 'warning',
      negotiation: 'primary',
      booked: 'success',
      lost: 'error'
    };
    return variants[stage] || 'default';
  };

  const getStatusVariant = (status) => {
    const variants = {
      pending: 'default',
      in_progress: 'warning',
      completed: 'success',
      verified: 'primary'
    };
    return variants[status] || 'default';
  };

  // Team Member Dashboard - focused on their tasks
  if (!isManager) {
    const pendingTasks = myTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    const completedTasks = myTasks.filter(t => t.status === 'completed' || t.status === 'verified');
    const overdueTasks = myTasks.filter(t => 
      new Date(t.dueDate) < new Date() && t.status !== 'completed' && t.status !== 'verified'
    );

    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <PageHeader 
          title={`Welcome back, ${user?.name?.split(' ')[0]}`}
          description="Here are your assigned tasks and progress."
        />

        {/* Task Summary */}
        <section className="mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard 
              label="Pending Tasks"
              value={pendingTasks.length}
              change="Needs your attention"
              icon={CheckSquare}
            />
            <MetricCard 
              label="Completed"
              value={completedTasks.length}
              change="Good progress!"
              icon={TrendingUp}
              trend="up"
            />
            <MetricCard 
              label="Overdue"
              value={overdueTasks.length}
              change={overdueTasks.length > 0 ? "Action required" : "All on track"}
              icon={AlertCircle}
            />
          </div>
        </section>

        {/* My Tasks */}
        <section className="mb-12">
          <Card padding="md">
            <SectionHeader title="My Tasks" action="View all" actionHref="/tasks" />
            {myTasks.length > 0 ? (
              <div className="space-y-2">
                {myTasks.slice(0, 10).map((task) => {
                  const isOverdue = new Date(task.dueDate) < new Date() && 
                    task.status !== 'completed' && task.status !== 'verified';
                  
                  return (
                    <Link
                      key={task._id}
                      to={`/weddings/${task.wedding?._id}`}
                      className="flex items-center justify-between p-3 rounded-md hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                          isOverdue ? 'bg-red-50' : 'bg-gray-100'
                        }`}>
                          <CheckSquare className={`h-4 w-4 ${
                            isOverdue ? 'text-red-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          <p className="text-xs text-gray-400">{task.wedding?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusVariant(task.status)} size="sm">
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <div className={`flex items-center gap-1.5 text-xs ${
                          isOverdue ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(task.dueDate)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                No tasks assigned to you yet
              </p>
            )}
          </Card>
        </section>
      </div>
    );
  }

  // Manager/Admin Dashboard - full view
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <PageHeader 
        title={`Welcome back, ${user?.name?.split(' ')[0]}`}
        description="Here's what's happening with your weddings today."
      />

      {/* Key Metrics */}
      <section className="mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            label="Total Leads"
            value={stats?.totalLeads || 0}
            change={`+${stats?.newLeadsThisMonth || 0} this month`}
            icon={Users}
            trend="up"
          />
          <MetricCard 
            label="Active Weddings"
            value={stats?.activeWeddings || 0}
            change="Currently planning"
            icon={Heart}
          />
          <MetricCard 
            label="Pending Tasks"
            value={stats?.pendingTasks || 0}
            change={stats?.overdueTasks ? `${stats.overdueTasks} overdue` : 'All on track'}
            icon={CheckSquare}
          />
          <MetricCard 
            label="Conversion Rate"
            value={`${stats?.conversionRate || 0}%`}
            change={`${stats?.conversions || 0} bookings`}
            icon={TrendingUp}
            trend="up"
          />
        </div>
      </section>

      {/* Charts & Pipeline */}
      <section className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trends Chart */}
          <Card className="lg:col-span-2" padding="md">
            <SectionHeader title="Lead & Conversion Trends" />
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#9ca3af" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="leads" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorLeads)" 
                      name="Leads"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="conversions" 
                      stroke="#059669" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorConversions)" 
                      name="Conversions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No data available yet
                </div>
              )}
            </div>
          </Card>

          {/* Pipeline Overview */}
          <Card padding="md">
            <SectionHeader title="Pipeline Overview" />
            <div className="space-y-3">
              {Object.entries(stats?.leadsByStage || {}).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      stage === 'inquiry' ? 'bg-gray-400' :
                      stage === 'proposal' ? 'bg-amber-500' :
                      stage === 'negotiation' ? 'bg-blue-600' :
                      stage === 'booked' ? 'bg-emerald-600' :
                      'bg-red-600'
                    }`} />
                    <span className="text-sm text-gray-600 capitalize">{stage}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
              {Object.keys(stats?.leadsByStage || {}).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No leads yet</p>
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <Card padding="md">
            <SectionHeader title="Recent Leads" action="View all" actionHref="/leads" />
            <div className="space-y-2">
              {activity?.recentLeads?.length > 0 ? (
                activity.recentLeads.map((lead) => (
                  <div 
                    key={lead._id} 
                    className="flex items-center justify-between p-3 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                      <p className="text-xs text-gray-400">{formatRelative(lead.createdAt)}</p>
                    </div>
                    <Badge variant={getStageVariant(lead.stage)}>
                      {lead.stage}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No recent leads</p>
              )}
            </div>
          </Card>

          {/* Upcoming Tasks */}
          <Card padding="md">
            <SectionHeader title="Upcoming Tasks" action="View all" actionHref="/tasks" />
            <div className="space-y-2">
              {activity?.upcomingTasks?.length > 0 ? (
                activity.upcomingTasks.map((task) => (
                  <div 
                    key={task._id} 
                    className="flex items-center justify-between p-3 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center">
                        <CheckSquare className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-400">{task.wedding?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(task.dueDate)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No upcoming tasks</p>
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* Upcoming Weddings */}
      <section className="mb-12">
        <Card padding="md">
          <SectionHeader title="Upcoming Weddings" action="View all" actionHref="/weddings" />
          {activity?.recentWeddings?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activity.recentWeddings.map((wedding) => {
                const days = daysUntil(wedding.weddingDate);
                const isUrgent = days !== null && days >= 0 && days <= 7;
                
                return (
                  <Link 
                    key={wedding._id} 
                    to={`/weddings/${wedding._id}`}
                    className="block p-4 rounded-md border border-gray-200 hover:border-blue-600 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{wedding.name}</p>
                        <p className="text-sm text-gray-400">{wedding.clientName}</p>
                      </div>
                      {isUrgent && (
                        <Badge variant="warning" size="sm">
                          {days === 0 ? 'Today' : `${days}d left`}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {formatDate(wedding.weddingDate)}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No upcoming weddings</p>
          )}
        </Card>
      </section>
    </div>
  );
}
