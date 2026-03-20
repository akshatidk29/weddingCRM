import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { formatDate, formatRelative, daysUntil } from '../utils/helpers';
import useAuthStore from '../stores/authStore';
import useDashboardStore from '../stores/dashboardStore';

/* ─────────────────────────────────────────
   PROGRESS BAR (inline, horizontal)
───────────────────────────────────────── */
function ProgressBar({ pct = 0, color = 'bg-stone-800' }) {
  return (
    <div className="w-full h-0.5 bg-stone-100 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────
   URGENCY
───────────────────────────────────────── */
function urgency(days) {
  if (days === null || days === undefined) return { color: 'text-stone-300', dot: 'bg-stone-200', label: '—' };
  if (days < 0) return { color: 'text-stone-400', dot: 'bg-stone-300', label: 'Past' };
  if (days === 0) return { color: 'text-rose-700', dot: 'bg-rose-600', label: 'Today' };
  if (days <= 3) return { color: 'text-amber-700', dot: 'bg-amber-600', label: `${days}d` };
  if (days <= 7) return { color: 'text-stone-700', dot: 'bg-stone-600', label: `${days}d` };
  if (days <= 30) return { color: 'text-stone-500', dot: 'bg-stone-400', label: `${days}d` };
  return { color: 'text-stone-400', dot: 'bg-stone-300', label: `${days}d` };
}

/* ─────────────────────────────────────────
   LEAD STAGE DOT
───────────────────────────────────────── */
function StageDot({ stage }) {
  const c = {
    inquiry: 'bg-stone-400',
    proposal: 'bg-amber-600',
    negotiation: 'bg-sky-600',
    booked: 'bg-teal-600',
    lost: 'bg-rose-700',
  };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${c[stage] || 'bg-stone-300'} flex-shrink-0`} />;
}

/* ─────────────────────────────────────────
   LEAD FUNNEL
───────────────────────────────────────── */
function LeadFunnel({ stages }) {
  if (!stages || Object.keys(stages).length === 0)
    return <p className="text-sm text-stone-400 py-6 text-center">No leads yet</p>;

  const order = ['inquiry', 'proposal', 'negotiation', 'booked', 'lost'];
  const colors = {
    inquiry: 'bg-stone-300',
    proposal: 'bg-amber-500',
    negotiation: 'bg-sky-500',
    booked: 'bg-teal-600',
    lost: 'bg-rose-600',
  };
  const max = Math.max(...Object.values(stages), 1);
  const rows = order.filter(s => stages[s] !== undefined);

  return (
    <div className="space-y-3.5">
      {rows.map((stage, i) => {
        const count = stages[stage] || 0;
        const pct = (count / max) * 100;
        const next = rows[i + 1];
        return (
          <div key={stage}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <StageDot stage={stage} />
                <span className="text-xs font-medium text-stone-600 capitalize">{stage}</span>
              </div>
              <span className="text-xs font-bold text-stone-800">{count}</span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div className={`h-full ${colors[stage]} rounded-full transition-all duration-700`}
                style={{ width: `${pct}%` }} />
            </div>
            {next && count > 0 && stages[next] && (
              <p className="text-right text-[10px] text-stone-400 mt-1">
                → {Math.round((stages[next] / count) * 100)}% to {next}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   ACTIVITY FEED — text only, timeline line
───────────────────────────────────────── */
function ActivityFeed({ leads = [], tasks = [] }) {
  const items = [
    ...leads.map(l => ({
      id: l._id, time: l.createdAt,
      label: l.name, sub: `lead · ${l.stage}`,
      dot: 'bg-amber-500',
    })),
    ...tasks.map(t => ({
      id: t._id, time: t.updatedAt || t.createdAt,
      label: t.title, sub: `${t.status === 'completed' ? 'completed' : 'updated'}${t.wedding?.name ? ` · ${t.wedding.name}` : ''}`,
      dot: t.status === 'completed' ? 'bg-teal-600' : 'bg-stone-300',
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

  if (!items.length) return <p className="text-sm text-stone-400 py-4">No recent activity.</p>;

  return (
    <div className="relative pl-4">
      {/* Timeline line */}
      <div className="absolute left-[7px] top-3 bottom-3 w-px bg-stone-100" />
      <div className="space-y-0">
        {items.map((item, i) => (
          <div key={item.id + i} className="flex items-start gap-3 py-3.5 relative">
            <div className={`w-2 h-2 rounded-full ${item.dot} ring-2 ring-white flex-shrink-0 mt-1.5 relative z-10`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate leading-tight">{item.label}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">{item.sub} · {formatRelative(item.time)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   URGENCY TIMELINE (horizontal scroll)
───────────────────────────────────────── */
function UrgencyTimeline({ weddings }) {
  const soon = (weddings || [])
    .filter(w => { const d = daysUntil(w.weddingDate); return d !== null && d >= 0 && d <= 14; })
    .sort((a, b) => daysUntil(a.weddingDate) - daysUntil(b.weddingDate));

  if (!soon.length)
    return <p className="text-sm text-stone-400 py-2">No weddings in the next 14 days.</p>;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {soon.map(w => {
        const d = daysUntil(w.weddingDate);
        const urg = urgency(d);
        return (
          <Link key={w._id} to={`/weddings/${w._id}`}
            className="group flex-shrink-0 bg-white border border-stone-100 rounded-2xl px-5 py-4 min-w-[160px] hover:border-stone-300 hover:shadow-md transition-all">
            <div className={`w-1.5 h-1.5 rounded-full ${urg.dot} mb-3`} />
            <p className="text-sm font-semibold text-stone-900 truncate">{w.name}</p>
            <p className="text-xs text-stone-400 mt-0.5">{formatDate(w.weddingDate)}</p>
            <p className={`text-xs font-bold mt-2.5 ${urg.color}`}>
              {d === 0 ? 'Today' : `In ${d} day${d !== 1 ? 's' : ''}`}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   WEDDING HEALTH — table/list rows (not cards)
───────────────────────────────────────── */
function WeddingHealthList({ weddings }) {
  if (!weddings?.length)
    return (
      <div className="bg-white rounded-2xl border border-stone-100 py-14 text-center">
        <p className="text-sm text-stone-300">No active weddings</p>
        <Link to="/weddings" className="inline-flex items-center gap-1 mt-3 text-xs text-stone-400 hover:text-stone-700 transition-colors">
          Create one <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_80px_80px_80px_60px] gap-4 items-center px-5 py-3 border-b border-stone-50">
        {['Wedding', 'Progress', 'Tasks', 'Date', ''].map((h, i) => (
          <p key={h + i} className="text-[10px] font-semibold tracking-[0.18em] text-stone-400 uppercase">{h}</p>
        ))}
      </div>

      <div className="divide-y divide-stone-50">
        {weddings.map(w => {
          const days = daysUntil(w.weddingDate);
          const urg = urgency(days);
          const total = w.taskStats?.total || 0;
          const done = w.taskStats?.completed || 0;
          const pct = total ? Math.round((done / total) * 100) : 0;

          const barColor =
            days !== null && days <= 7 ? 'bg-rose-500' :
              days !== null && days <= 30 ? 'bg-amber-500' : 'bg-teal-600';

          return (
            <Link key={w._id} to={`/weddings/${w._id}`}
              className="grid grid-cols-[1fr_80px_80px_80px_60px] gap-4 items-center px-5 py-4 hover:bg-stone-50/70 transition-colors group">

              {/* Name */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urg.dot}`} />
                  <p className="text-sm font-semibold text-stone-900 truncate">{w.name}</p>
                </div>
                <p className="text-xs text-stone-400 mt-0.5 truncate ml-3.5">{w.clientName || w.client?.name}</p>
              </div>

              {/* Progress bar + pct */}
              <div>
                <p className="text-xs font-bold text-stone-800 mb-1.5">{pct}%</p>
                <ProgressBar pct={pct} color={barColor} />
              </div>

              {/* Tasks */}
              <p className="text-sm text-stone-600">
                <span className="font-semibold text-stone-900">{done}</span>
                <span className="text-stone-300">/{total}</span>
              </p>

              {/* Date */}
              <div>
                <p className={`text-xs font-medium ${urg.color}`}>{formatDate(w.weddingDate)}</p>
              </div>

              {/* Arrow */}
              <ChevronRight className="h-4 w-4 text-stone-200 group-hover:text-stone-500 transition-colors justify-self-end" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SKELETON
───────────────────────────────────────── */
function Sk({ className = '' }) {
  return <div className={`bg-stone-100 animate-pulse rounded-2xl ${className}`} />;
}

/* ─────────────────────────────────────────
   SECTION LABEL
───────────────────────────────────────── */
function SectionLabel({ children, action, actionHref }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <p className="text-[10px] font-semibold tracking-[0.22em] text-stone-400 uppercase">{children}</p>
      {action && actionHref && (
        <Link to={actionHref} className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1 transition-colors">
          {action} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   TEAM MEMBER DASHBOARD
═══════════════════════════════════════ */
function TeamMemberDashboard({ user, myTasks }) {
  const pending = myTasks.filter(t => ['pending', 'in_progress'].includes(t.status));
  const completed = myTasks.filter(t => ['completed', 'verified'].includes(t.status));
  const overdue = myTasks.filter(t =>
    new Date(t.dueDate) < new Date() && !['completed', 'verified'].includes(t.status)
  );

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-10">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[10px] font-semibold tracking-[0.22em] text-stone-400 uppercase mb-2">Dashboard</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-stone-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="italic">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-stone-400 text-sm mt-2">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Progress summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone-100 rounded-2xl overflow-hidden border border-stone-100 mb-8">
        {[
          { label: 'Total', value: myTasks.length, bar: 'bg-stone-400' },
          { label: 'Completed', value: completed.length, bar: 'bg-teal-600' },
          { label: 'Pending', value: pending.length, bar: 'bg-amber-500' },
          { label: 'Overdue', value: overdue.length, bar: overdue.length > 0 ? 'bg-rose-600' : 'bg-stone-300' },
        ].map(m => (
          <div key={m.label} className="bg-white px-5 py-5">
            <div className={`h-0.5 w-6 rounded-full ${m.bar} mb-3`} />
            <p className="font-display text-3xl font-bold text-stone-900 leading-none">{m.value}</p>
            <p className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase mt-2">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <SectionLabel action="View all" actionHref="/tasks">My Tasks</SectionLabel>
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {myTasks.length > 0 ? (
          <div className="divide-y divide-stone-50">
            {myTasks.slice(0, 15).map(task => {
              const isOverdue = new Date(task.dueDate) < new Date() &&
                !['completed', 'verified'].includes(task.status);
              return (
                <Link key={task._id} to={`/weddings/${task.wedding?._id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-stone-50/70 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-1 h-6 rounded-full flex-shrink-0 ${isOverdue ? 'bg-rose-600' : task.status === 'in_progress' ? 'bg-amber-500' : 'bg-stone-200'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{task.title}</p>
                      <p className="text-xs text-stone-400 mt-0.5 truncate">{task.wedding?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    {task.dueDate && (
                      <span className={`text-xs hidden sm:block ${isOverdue ? 'text-rose-600 font-semibold' : 'text-stone-400'}`}>
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-stone-200 group-hover:text-stone-500 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-stone-300 text-sm">No tasks assigned yet</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MANAGER DASHBOARD
═══════════════════════════════════════ */
function ManagerDashboard({ user, stats, activity }) {
  const weddings = activity?.recentWeddings || [];

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-10 space-y-12">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.22em] text-stone-400 uppercase mb-2">Dashboard</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-stone-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="italic">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-stone-400 text-sm mt-2">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {/* Live pill */}
        <div className="flex items-center gap-2 bg-white border border-stone-100 rounded-full px-4 py-2 self-start sm:self-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-xs text-stone-500">
            <span className="font-semibold text-stone-900">{stats?.activeWeddings || 0}</span> active weddings
          </span>
        </div>
      </div>

      {/* ── Coming Up ── */}
      <div>
        <SectionLabel action="View all" actionHref="/weddings">Coming Up</SectionLabel>
        <UrgencyTimeline weddings={weddings} />
      </div>

      {/* ── Metrics strip ── */}
      <div>
        <SectionLabel>At a Glance</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone-100 rounded-2xl overflow-hidden border border-stone-100">
          {[
            { label: 'Total Leads', value: stats?.totalLeads || 0, sub: `+${stats?.newLeadsThisMonth || 0} this month`, bar: 'bg-stone-500' },
            { label: 'Active Weddings', value: stats?.activeWeddings || 0, sub: 'Currently planning', bar: 'bg-stone-800' },
            { label: 'Pending Tasks', value: stats?.pendingTasks || 0, sub: stats?.overdueTasks ? `${stats.overdueTasks} overdue` : 'On track', bar: stats?.overdueTasks > 0 ? 'bg-rose-600' : 'bg-amber-500' },
            { label: 'Conversion', value: `${stats?.conversionRate || 0}%`, sub: `${stats?.conversions || 0} bookings`, bar: 'bg-teal-600' },
          ].map(m => (
            <div key={m.label} className="bg-white px-5 sm:px-7 py-6">
              <div className={`h-0.5 w-6 rounded-full ${m.bar} mb-4`} />
              <p className="font-display text-3xl sm:text-4xl font-bold text-stone-900 leading-none">{m.value}</p>
              <p className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase mt-3">{m.label}</p>
              <p className="text-xs text-stone-400 mt-1">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Wedding Health + Activity ── */}
      <div>
        <SectionLabel action="All weddings" actionHref="/weddings">Wedding Health</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

          {/* Wedding list — rows not cards */}
          <WeddingHealthList weddings={weddings} />

          {/* Activity feed — sticky on desktop */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5 lg:sticky lg:top-6">
            <p className="text-[10px] font-semibold tracking-[0.22em] text-stone-400 uppercase mb-1">Activity</p>
            <p className="text-xs text-stone-400 mb-5">Latest updates across your pipeline</p>
            <ActivityFeed
              leads={activity?.recentLeads || []}
              tasks={activity?.upcomingTasks || []}
            />
          </div>
        </div>
      </div>

      {/* ── Lead Pipeline ── */}
      <div>
        <SectionLabel>Lead Pipeline</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">

          {/* Funnel */}
          <div className="bg-white rounded-2xl border border-stone-100 p-6">
            <p className="text-sm font-semibold text-stone-900 mb-0.5">Funnel</p>
            <p className="text-xs text-stone-400 mb-6">Conversion at each stage</p>
            <LeadFunnel stages={stats?.leadsByStage} />
            {stats?.conversionRate > 0 && (
              <div className="mt-6 pt-5 border-t border-stone-50 flex items-center justify-between">
                <p className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Inquiry → Booked</p>
                <p className="text-base font-bold text-teal-700">{stats.conversionRate}%</p>
              </div>
            )}
          </div>

          {/* Recent leads */}
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-50 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-900">Recent Leads</p>
                <p className="text-xs text-stone-400 mt-0.5">Newly added to the pipeline</p>
              </div>
              <Link to="/leads" className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {activity?.recentLeads?.length > 0 ? (
              <div className="divide-y divide-stone-50">
                {activity.recentLeads.map(lead => (
                  <Link key={lead._id} to={`/leads/${lead._id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-stone-50/70 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-bold text-stone-600">
                          {lead.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-900 truncate">{lead.name}</p>
                        <p className="text-[11px] text-stone-400 mt-0.5">{formatRelative(lead.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <div className="flex items-center gap-1.5">
                        <StageDot stage={lead.stage} />
                        <span className="text-[11px] font-medium text-stone-500 capitalize hidden sm:block">{lead.stage}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-stone-200 group-hover:text-stone-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-14 text-center text-stone-300 text-sm">No leads yet</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Overdue callout ── */}
      {stats?.overdueTasks > 0 && (
        <div>
          <SectionLabel action="View tasks" actionHref="/tasks">Needs Attention</SectionLabel>
          <div className="bg-stone-900 rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-white">
                {stats.overdueTasks} task{stats.overdueTasks > 1 ? 's are' : ' is'} overdue
              </p>
              <p className="text-sm text-stone-400 mt-0.5">Past their due date and need immediate action.</p>
            </div>
            <Link to="/tasks?filter=overdue"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-stone-900 rounded-full text-sm font-semibold hover:bg-stone-100 transition-all flex-shrink-0">
              Review now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

/* ═══════════════════════════════════════
   ROOT
═══════════════════════════════════════ */
export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const isManager = useAuthStore((s) => s.user?.role === 'relationship_manager' || s.user?.role === 'admin');
  const { stats, activity, monthlyData, myTasks, loading, fetchDashboard } = useDashboardStore();

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=Outfit:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-body    { font-family: 'Outfit', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="font-body min-h-screen bg-[#faf9f7]">
        {loading ? (
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-10 space-y-8">
            <div><Sk className="h-4 w-20 mb-3" /><Sk className="h-12 w-64" /></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Sk key={i} className="h-28" />)}</div>
            <div className="grid lg:grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <Sk key={i} className="h-52" />)}</div>
            <div className="grid lg:grid-cols-2 gap-6">{[...Array(2)].map((_, i) => <Sk key={i} className="h-64" />)}</div>
          </div>
        ) : !isManager ? (
          <TeamMemberDashboard user={user} myTasks={myTasks} />
        ) : (
          <ManagerDashboard user={user} stats={stats} activity={activity} monthlyData={monthlyData} />
        )}
      </div>
    </>
  );
}