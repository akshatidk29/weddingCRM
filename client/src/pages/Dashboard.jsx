import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Heart, CheckSquare, AlertTriangle, TrendingUp, 
  Calendar, ArrowUpRight, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Loader';
import { formatDate, formatRelative, daysUntil, formatCurrency } from '../utils/helpers';
import api from '../utils/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, activityRes, monthlyRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/activity'),
        api.get('/dashboard/monthly')
      ]);
      setStats(statsRes.data.stats);
      setActivity(activityRes.data);
      setMonthlyData(monthlyRes.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  const statCards = [
    { 
      label: 'Total Leads', 
      value: stats?.totalLeads || 0, 
      icon: Users, 
      color: 'from-blue-500 to-cyan-500',
      change: `+${stats?.newLeadsThisMonth || 0} this month`
    },
    { 
      label: 'Active Weddings', 
      value: stats?.activeWeddings || 0, 
      icon: Heart, 
      color: 'from-pink-500 to-rose-500',
      change: 'Currently planning'
    },
    { 
      label: 'Pending Tasks', 
      value: stats?.pendingTasks || 0, 
      icon: CheckSquare, 
      color: 'from-purple-500 to-violet-500',
      change: `${stats?.overdueTasks || 0} overdue`
    },
    { 
      label: 'Conversion Rate', 
      value: `${stats?.conversionRate || 0}%`, 
      icon: TrendingUp, 
      color: 'from-green-500 to-emerald-500',
      change: `${stats?.conversions || 0} bookings`
    }
  ];

  const chartData = monthlyData?.leadsPerMonth?.map(item => ({
    month: new Date(item._id.year, item._id.month - 1).toLocaleDateString('en', { month: 'short' }),
    leads: item.count,
    conversions: monthlyData?.conversionsPerMonth?.find(
      c => c._id.year === item._id.year && c._id.month === item._id.month
    )?.count || 0
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Welcome back! Here's what's happening.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} hover glow>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Lead & Conversion Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Area type="monotone" dataKey="leads" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorLeads)" />
                  <Area type="monotone" dataKey="conversions" stroke="#22c55e" fillOpacity={1} fill="url(#colorConversions)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats?.leadsByStage || {}).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      stage === 'inquiry' ? 'bg-blue-500' :
                      stage === 'proposal' ? 'bg-yellow-500' :
                      stage === 'negotiation' ? 'bg-purple-500' :
                      'bg-green-500'
                    }`} />
                    <span className="text-gray-400 capitalize">{stage}</span>
                  </div>
                  <span className="text-white font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Leads</CardTitle>
            <Link to="/leads" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity?.recentLeads?.length > 0 ? (
                activity.recentLeads.map((lead) => (
                  <div key={lead._id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                    <div>
                      <p className="text-white font-medium">{lead.name}</p>
                      <p className="text-sm text-gray-500">{formatRelative(lead.createdAt)}</p>
                    </div>
                    <Badge variant={
                      lead.stage === 'booked' ? 'success' :
                      lead.stage === 'negotiation' ? 'primary' :
                      lead.stage === 'proposal' ? 'warning' : 'info'
                    }>
                      {lead.stage}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent leads</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Tasks</CardTitle>
            <Link to="/tasks" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity?.upcomingTasks?.length > 0 ? (
                activity.upcomingTasks.map((task) => (
                  <div key={task._id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                        task.category === 'fnb' ? 'bg-orange-500/20' :
                        task.category === 'decor' ? 'bg-pink-500/20' :
                        task.category === 'logistics' ? 'bg-blue-500/20' :
                        'bg-purple-500/20'
                      }`}>
                        {task.category === 'fnb' ? '🍽️' :
                         task.category === 'decor' ? '🎨' :
                         task.category === 'logistics' ? '🚚' :
                         task.category === 'av' ? '🎬' : '📋'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{task.title}</p>
                        <p className="text-sm text-gray-500">{task.wedding?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      {formatDate(task.dueDate)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No upcoming tasks</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Weddings</CardTitle>
          <Link to="/weddings" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
            View all <ArrowUpRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activity?.recentWeddings?.length > 0 ? (
              activity.recentWeddings.map((wedding) => {
                const days = daysUntil(wedding.weddingDate);
                return (
                  <Link 
                    key={wedding._id} 
                    to={`/weddings/${wedding._id}`}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">{wedding.name}</p>
                        <p className="text-sm text-gray-500">{wedding.clientName}</p>
                      </div>
                      {days !== null && days >= 0 && days <= 7 && (
                        <Badge variant="warning">{days}d left</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {formatDate(wedding.weddingDate)}
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-gray-500 col-span-full text-center py-4">No upcoming weddings</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
