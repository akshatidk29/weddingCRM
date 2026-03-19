import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Heart, CheckSquare, TrendingUp, 
  Calendar, ArrowRight, Clock, AlertCircle
} from 'lucide-react';
import { PageContainer, PageHeader, PageSection, SectionCard, StatCard, EmptyState } from '../components/layout/PageContainer';
import { formatDate, formatRelative, daysUntil } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

function SectionHeader({ title, action, actionHref }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="font-display text-lg font-semibold text-stone-900">{title}</h3>
      {action && (
        <Link 
          to={actionHref} 
          className="text-sm text-stone-500 hover:text-stone-900 flex items-center gap-1.5 transition-colors"
        >
          {action}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    pending: { bg: 'bg-stone-100', text: 'text-stone-600' },
    in_progress: { bg: 'bg-amber-50', text: 'text-amber-600' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    verified: { bg: 'bg-blue-50', text: 'text-blue-600' },
    inquiry: { bg: 'bg-stone-100', text: 'text-stone-600' },
    proposal: { bg: 'bg-amber-50', text: 'text-amber-600' },
    negotiation: { bg: 'bg-blue-50', text: 'text-blue-600' },
    booked: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    lost: { bg: 'bg-rose-50', text: 'text-rose-600' }
  };
  const { bg, text } = config[status] || config.pending;
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${bg} ${text}`}>
      {status.replace('_', ' ')}
    </span>
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
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-stone-900 border-t-transparent rounded-full" />
        </div>
      </PageContainer>
    );
  }

  const chartData = monthlyData?.leadsPerMonth?.map(item => ({
    month: new Date(item._id.year, item._id.month - 1).toLocaleDateString('en', { month: 'short' }),
    leads: item.count,
    conversions: monthlyData?.conversionsPerMonth?.find(
      c => c._id.year === item._id.year && c._id.month === item._id.month
    )?.count || 0
  })) || [];

  // Team Member Dashboard
  if (!isManager) {
    const pendingTasks = myTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    const completedTasks = myTasks.filter(t => t.status === 'completed' || t.status === 'verified');
    const overdueTasks = myTasks.filter(t => 
      new Date(t.dueDate) < new Date() && t.status !== 'completed' && t.status !== 'verified'
    );

    return (
      <PageContainer>
        <PageHeader 
          title={`Welcome back, ${user?.name?.split(' ')[0]}`}
          subtitle="Here are your assigned tasks and progress for today."
        />

        {/* Task Summary Stats */}
        <PageSection>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard 
              label="Pending Tasks"
              value={pendingTasks.length}
              sublabel="Needs your attention"
              icon={CheckSquare}
            />
            <StatCard 
              label="Completed"
              value={completedTasks.length}
              sublabel="Good progress!"
              icon={TrendingUp}
              trend="up"
            />
            <StatCard 
              label="Overdue"
              value={overdueTasks.length}
              sublabel={overdueTasks.length > 0 ? "Action required" : "All on track"}
              icon={AlertCircle}
              trend={overdueTasks.length > 0 ? "down" : undefined}
            />
          </div>
        </PageSection>

        {/* My Tasks */}
        <PageSection title="My Tasks" action={
          <Link to="/tasks" className="text-sm text-stone-500 hover:text-stone-900 flex items-center gap-1.5 transition-colors">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }>
          <SectionCard padding="none">
            {myTasks.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {myTasks.slice(0, 10).map((task) => {
                  const isOverdue = new Date(task.dueDate) < new Date() && 
                    task.status !== 'completed' && task.status !== 'verified';
                  
                  return (
                    <Link
                      key={task._id}
                      to={`/weddings/${task.wedding?._id}`}
                      className="flex items-center justify-between p-4 sm:p-5 hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isOverdue ? 'bg-rose-50' : 'bg-stone-100'
                        }`}>
                          <CheckSquare className={`h-5 w-5 ${
                            isOverdue ? 'text-rose-500' : 'text-stone-400'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-900">{task.title}</p>
                          <p className="text-xs text-stone-400 mt-0.5">{task.wedding?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={task.status} />
                        <div className={`hidden sm:flex items-center gap-1.5 text-xs ${
                          isOverdue ? 'text-rose-500' : 'text-stone-400'
                        }`}>
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(task.dueDate)}
                        </div>
                        <ArrowRight className="h-4 w-4 text-stone-300" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState 
                icon={CheckSquare}
                title="No tasks yet"
                description="Tasks assigned to you will appear here"
              />
            )}
          </SectionCard>
        </PageSection>
      </PageContainer>
    );
  }

  // Manager/Admin Dashboard
  return (
    <PageContainer>
      <PageHeader 
        title={`Welcome back, ${user?.name?.split(' ')[0]}`}
        subtitle="Here's what's happening with your weddings today."
      />

      {/* Key Metrics */}
      <PageSection>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Total Leads"
            value={stats?.totalLeads || 0}
            sublabel={`+${stats?.newLeadsThisMonth || 0} this month`}
            icon={Users}
            trend="up"
          />
          <StatCard 
            label="Active Weddings"
            value={stats?.activeWeddings || 0}
            sublabel="Currently planning"
            icon={Heart}
          />
          <StatCard 
            label="Pending Tasks"
            value={stats?.pendingTasks || 0}
            sublabel={stats?.overdueTasks ? `${stats.overdueTasks} overdue` : 'All on track'}
            icon={CheckSquare}
          />
          <StatCard 
            label="Conversion Rate"
            value={`${stats?.conversionRate || 0}%`}
            sublabel={`${stats?.conversions || 0} bookings`}
            icon={TrendingUp}
            trend="up"
          />
        </div>
      </PageSection>

      {/* Charts & Pipeline */}
      <PageSection>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trends Chart */}
          <SectionCard className="lg:col-span-2">
            <SectionHeader title="Lead & Conversion Trends" />
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#78716c" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#78716c" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#a8a29e" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#a8a29e" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e7e5e4',
                        borderRadius: '0.75rem',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="leads" 
                      stroke="#78716c" 
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
                <div className="flex items-center justify-center h-full text-stone-400">
                  No data available yet
                </div>
              )}
            </div>
          </SectionCard>

          {/* Pipeline Overview */}
          <SectionCard>
            <SectionHeader title="Pipeline Overview" />
            <div className="space-y-3">
              {Object.entries(stats?.leadsByStage || {}).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between py-2.5 border-b border-stone-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      stage === 'inquiry' ? 'bg-stone-400' :
                      stage === 'proposal' ? 'bg-amber-500' :
                      stage === 'negotiation' ? 'bg-blue-500' :
                      stage === 'booked' ? 'bg-emerald-500' :
                      'bg-rose-500'
                    }`} />
                    <span className="text-sm text-stone-600 capitalize">{stage}</span>
                  </div>
                  <span className="text-sm font-semibold text-stone-900">{count}</span>
                </div>
              ))}
              {Object.keys(stats?.leadsByStage || {}).length === 0 && (
                <p className="text-sm text-stone-400 text-center py-4">No leads yet</p>
              )}
            </div>
          </SectionCard>
        </div>
      </PageSection>

      {/* Recent Activity */}
      <PageSection>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <SectionCard>
            <SectionHeader title="Recent Leads" action="View all" actionHref="/leads" />
            <div className="space-y-1">
              {activity?.recentLeads?.length > 0 ? (
                activity.recentLeads.map((lead) => (
                  <div 
                    key={lead._id} 
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-stone-900">{lead.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{formatRelative(lead.createdAt)}</p>
                    </div>
                    <StatusBadge status={lead.stage} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-400 text-center py-8">No recent leads</p>
              )}
            </div>
          </SectionCard>

          {/* Upcoming Tasks */}
          <SectionCard>
            <SectionHeader title="Upcoming Tasks" action="View all" actionHref="/tasks" />
            <div className="space-y-1">
              {activity?.upcomingTasks?.length > 0 ? (
                activity.upcomingTasks.map((task) => (
                  <div 
                    key={task._id} 
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center">
                        <CheckSquare className="h-4 w-4 text-stone-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-900">{task.title}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{task.wedding?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-stone-400">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(task.dueDate)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-400 text-center py-8">No upcoming tasks</p>
              )}
            </div>
          </SectionCard>
        </div>
      </PageSection>

      {/* Upcoming Weddings */}
      <PageSection title="Upcoming Weddings" action={
        <Link to="/weddings" className="text-sm text-stone-500 hover:text-stone-900 flex items-center gap-1.5 transition-colors">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      }>
        {activity?.recentWeddings?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activity.recentWeddings.map((wedding) => {
              const days = daysUntil(wedding.weddingDate);
              const isUrgent = days !== null && days >= 0 && days <= 7;
              
              return (
                <Link 
                  key={wedding._id} 
                  to={`/weddings/${wedding._id}`}
                  className="block p-5 bg-white rounded-2xl border border-stone-200/60 hover:border-stone-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold text-stone-900">{wedding.name}</p>
                      <p className="text-sm text-stone-400 mt-0.5">{wedding.clientName}</p>
                    </div>
                    {isUrgent && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-600">
                        {days === 0 ? 'Today' : `${days}d left`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-500">
                    <Calendar className="h-4 w-4" />
                    {formatDate(wedding.weddingDate)}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <SectionCard>
            <EmptyState 
              icon={Heart}
              title="No upcoming weddings"
              description="Weddings you're planning will appear here"
            />
          </SectionCard>
        )}
      </PageSection>
    </PageContainer>
  );
}
