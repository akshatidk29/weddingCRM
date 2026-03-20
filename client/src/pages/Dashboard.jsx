import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Clock, AlertCircle,
  ArrowUpRight, Calendar, CheckSquare, Heart, Users
} from 'lucide-react';
import { formatDate, formatRelative, daysUntil } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

/* ─────────────────────────────────────────
   SVG PROGRESS RING
───────────────────────────────────────── */
function ProgressRing({ pct = 0, size = 52, stroke = 3, color = '#a8a29e' }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f5f5f4" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </svg>
  );
}

/* ─────────────────────────────────────────
   URGENCY CONFIG (Editorial / Minimalist Premium)
───────────────────────────────────────── */
function urgency(days) {
  // Empty State: Whisper-thin, almost invisible
  if (days === null || days === undefined) {
    return { label: '—', ring: '#e7e5e4', badge: 'bg-white text-stone-300 border border-stone-100', dot: 'bg-stone-200' };
  }
  
  if (days < 0) {
    return { label: 'Past', ring: '#9f1239', badge: 'bg-rose-50/50 text-rose-800 border border-rose-200/60', dot: 'bg-rose-800' };
  }
  if (days === 0) {
    return { label: 'Today', ring: '#9f1239', badge: 'bg-rose-50/50 text-rose-800 border border-rose-200/60', dot: 'bg-rose-800' };
  }
  if (days <= 3) {
    return { label: `${days}d`, ring: '#b45309', badge: 'bg-amber-50/40 text-amber-700 border border-amber-200/60', dot: 'bg-amber-700' };
  }
  if (days <= 7) {
    return { label: `${days}d`, ring: '#1c1917', badge: 'bg-stone-50 text-stone-900 border border-stone-200/80', dot: 'bg-stone-900' };
  }
  return { label: `${days}d`, ring: '#a8a29e', badge: 'bg-white text-stone-500 border border-stone-200/60', dot: 'bg-stone-300' };
}

/* ─────────────────────────────────────────
   STATUS BADGE (inline, no box)
───────────────────────────────────────── */
function Dot({ stage }) {
  const colors = {
    inquiry:     'bg-stone-300',
    proposal:    'bg-amber-700',
    negotiation: 'bg-indigo-600',
    booked:      'bg-teal-700',
    lost:        'bg-rose-800',
  };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors[stage] || 'bg-stone-300'} flex-shrink-0`} />;
}

/* ─────────────────────────────────────────
   SKELETON
───────────────────────────────────────── */
function Sk({ className = '' }) {
  return <div className={`bg-stone-200/60 animate-pulse rounded-2xl ${className}`} />;
}

/* ─────────────────────────────────────────
   SECTION LABEL
───────────────────────────────────────── */
function SectionLabel({ children, action, actionHref }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <p className="text-[10px] font-bold tracking-[0.25em] text-stone-400 uppercase">{children}</p>
      </div>
      {action && actionHref && (
        <Link to={actionHref} className="text-xs font-medium text-stone-400 hover:text-stone-900 flex items-center gap-1.5 transition-colors">
          {action} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   LEAD FUNNEL
───────────────────────────────────────── */
function LeadFunnel({ stages }) {
  if (!stages || Object.keys(stages).length === 0) {
    return <p className="text-sm text-stone-400 text-center py-8">No leads yet</p>;
  }
  const order = ['inquiry', 'proposal', 'negotiation', 'booked', 'lost'];
  const colors = {
    inquiry:     { bar: 'bg-stone-200',   text: 'text-stone-500' },
    proposal:    { bar: 'bg-amber-600/90',text: 'text-amber-800' },
    negotiation: { bar: 'bg-indigo-500/90',text: 'text-indigo-800' },
    booked:      { bar: 'bg-teal-600/90', text: 'text-teal-800' },
    lost:        { bar: 'bg-rose-700/90', text: 'text-rose-800' },
  };
  const max = Math.max(...Object.values(stages));
  const rows = order.filter(s => stages[s] !== undefined);

  return (
    <div className="space-y-4">
      {rows.map((stage, i) => {
        const count = stages[stage] || 0;
        const pct   = max ? (count / max) * 100 : 0;
        const { bar, text } = colors[stage] || { bar: 'bg-stone-200', text: 'text-stone-500' };
        return (
          <div key={stage}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-500 capitalize font-medium">{stage}</span>
              <span className={`text-xs font-bold ${text}`}>{count}</span>
            </div>
            <div className="relative h-2 bg-stone-100/80 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${bar} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {i < rows.length - 1 && count > 0 && stages[rows[i + 1]] && (
              <div className="flex justify-end mt-1.5">
                <span className="text-[10px] text-stone-400 font-medium">
                  {Math.round((stages[rows[i + 1]] / count) * 100)}% conversion
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   WEDDING HEALTH CARD
───────────────────────────────────────── */
function WeddingCard({ wedding }) {
  const days = daysUntil(wedding.weddingDate);
  const urg  = urgency(days);

  const totalTasks     = wedding.taskStats?.total || 0;
  const completedTasks = wedding.taskStats?.completed || 0;
  const taskPct        = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalVendors = wedding.vendorCount || 0;

  return (
    <Link
      to={`/weddings/${wedding._id}`}
      className="group bg-white rounded-2xl border border-stone-200/60 p-6 shadow-sm hover:shadow-xl hover:shadow-stone-900/5 hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-stone-900 truncate text-[15px] leading-tight group-hover:text-stone-700 transition-colors">{wedding.name}</p>
          <p className="text-xs text-stone-400 mt-1 truncate font-medium">{wedding.clientName || wedding.client?.name}</p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md flex-shrink-0 ${urg.badge}`}>
          {urg.label}
        </span>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <ProgressRing pct={taskPct} size={48} stroke={3} color={urg.ring} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-stone-800">{taskPct}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1 min-w-0">
          <div>
            <p className="text-[9px] tracking-[0.2em] uppercase text-stone-400 font-bold mb-0.5">Tasks</p>
            <p className="text-sm font-semibold text-stone-800">{completedTasks}<span className="text-stone-400 font-medium">/{totalTasks}</span></p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.2em] uppercase text-stone-400 font-bold mb-0.5">Vendors</p>
            <p className="text-sm font-semibold text-stone-800">{totalVendors}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[9px] tracking-[0.2em] uppercase text-stone-400 font-bold mb-0.5">Date</p>
            <p className="text-xs text-stone-600 font-medium">{formatDate(wedding.weddingDate)}</p>
          </div>
        </div>
      </div>

      {wedding.budget > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] tracking-[0.2em] uppercase text-stone-400 font-bold">Budget paid</span>
            <span className="text-[10px] text-stone-500 font-medium">
              ₹{((wedding.paidAmount || 0) / 1000).toFixed(0)}k <span className="text-stone-300 mx-0.5">/</span> ₹{(wedding.budget / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-teal-700/90 transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, ((wedding.paidAmount || 0) / wedding.budget) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-stone-400 group-hover:text-stone-900 transition-colors mt-auto pt-2 font-medium">
        <span className="text-xs">View details</span>
        <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────
   URGENCY TIMELINE 
───────────────────────────────────────── */
function UrgencyTimeline({ weddings }) {
  const soon = (weddings || []).filter(w => {
    const d = daysUntil(w.weddingDate);
    return d !== null && d >= 0 && d <= 14;
  }).sort((a, b) => daysUntil(a.weddingDate) - daysUntil(b.weddingDate));

  if (soon.length === 0) return (
    <p className="text-sm text-stone-400 py-2 font-medium">No weddings in the next 14 days.</p>
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-2 -mt-2 px-1 -mx-1 scrollbar-hide">
      {soon.map(w => {
        const d   = daysUntil(w.weddingDate);
        const urg = urgency(d);
        return (
          <Link
            key={w._id}
            to={`/weddings/${w._id}`}
            className="flex-shrink-0 bg-white rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-md transition-all px-6 py-5 min-w-[180px] group"
          >
            <div className={`h-0.5 w-8 rounded-full mb-4 group-hover:w-full transition-all duration-500`}
              style={{ backgroundColor: urg.ring }} />
            <p className="text-sm font-bold text-stone-900 truncate">{w.name}</p>
            <p className="text-xs text-stone-400 mt-1 font-medium">{formatDate(w.weddingDate)}</p>
            <p className="text-[10px] font-bold mt-4 tracking-widest uppercase" style={{ color: urg.ring }}>
              {d === 0 ? 'Today' : `In ${d} day${d !== 1 ? 's' : ''}`}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   ACTIVITY FEED (With Timeline line)
───────────────────────────────────────── */
function ActivityFeed({ leads = [], tasks = [] }) {
  const items = [
    ...leads.map(l => ({
      id: l._id,
      time: l.createdAt,
      text: `New lead `,
      bold: l.name,
      suffix: ` moved to ${l.stage}`,
      dot: 'bg-amber-700',
    })),
    ...tasks.map(t => ({
      id: t._id,
      time: t.updatedAt || t.createdAt,
      text: `Task ${t.status === 'completed' ? 'completed' : 'updated'}: `,
      bold: t.title,
      suffix: t.wedding?.name ? ` for ${t.wedding.name}` : '',
      dot: t.status === 'completed' ? 'bg-teal-700' : 'bg-stone-300',
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

  if (items.length === 0) return <p className="text-sm text-stone-400 py-4">No recent activity.</p>;

  return (
    <div className="relative space-y-0 pl-2">
      {/* The elegant vertical timeline line */}
      <div className="absolute left-[11px] top-4 bottom-4 w-[1px] bg-stone-100" />
      
      {items.map((item, i) => (
        <div key={item.id + i} className="relative flex items-start gap-4 py-4 group">
          <div className="flex flex-col items-center flex-shrink-0 mt-1.5 relative z-10">
            {/* Added a white ring to cut out the timeline background gracefully */}
            <div className={`w-2 h-2 rounded-full ${item.dot} ring-4 ring-white`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-stone-500 leading-relaxed truncate">
              {item.text}
              <span className="font-semibold text-stone-900">{item.bold}</span>
              <span>{item.suffix}</span>
            </p>
            <p className="text-[11px] font-medium text-stone-400 mt-0.5">{formatRelative(item.time)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════
   TEAM MEMBER DASHBOARD
═══════════════════════════════════════ */
function TeamMemberDashboard({ user, myTasks }) {
  const pending   = myTasks.filter(t => ['pending','in_progress'].includes(t.status));
  const completed = myTasks.filter(t => ['completed','verified'].includes(t.status));
  const overdue   = myTasks.filter(t =>
    new Date(t.dueDate) < new Date() && !['completed','verified'].includes(t.status)
  );
  const completionPct = myTasks.length ? Math.round((completed.length / myTasks.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-12">
      <div className="mb-14">
        <p className="text-[10px] font-bold tracking-[0.25em] text-stone-400 uppercase mb-3">Workspace</p>
        <h1 className="font-display text-4xl sm:text-6xl font-medium text-stone-900 tracking-tight">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="italic text-stone-600">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-stone-400 font-medium text-sm mt-3">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/60 p-8 mb-12 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="relative flex-shrink-0">
            <ProgressRing pct={completionPct} size={80} stroke={4} color="#0f766e" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-stone-900">{completionPct}%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="font-display text-3xl font-medium text-stone-900">Task Progress</p>
            <p className="text-stone-500 font-medium text-sm mt-2">
              {completed.length} completed <span className="text-stone-300 mx-2">|</span> {pending.length} pending
              {overdue.length > 0 && <span className="text-rose-700 font-bold ml-2">· {overdue.length} overdue</span>}
            </p>
          </div>
        </div>
      </div>

      <div>
        <SectionLabel action="View all" actionHref="/tasks">My Tasks</SectionLabel>
        <div className="bg-white rounded-2xl border border-stone-200/60 overflow-hidden shadow-sm">
          {myTasks.length > 0 ? (
            <div className="divide-y divide-stone-100/80">
              {myTasks.slice(0, 15).map(task => {
                const isOverdue = new Date(task.dueDate) < new Date() &&
                  !['completed','verified'].includes(task.status);
                return (
                  <Link key={task._id} to={`/weddings/${task.wedding?._id}`}
                    className="flex items-center justify-between px-8 py-5 hover:bg-stone-50/50 transition-colors group">
                    <div className="flex items-center gap-5 min-w-0">
                      <div className={`w-1 h-8 rounded-full flex-shrink-0 ${isOverdue ? 'bg-rose-700' : task.status === 'in_progress' ? 'bg-amber-600' : 'bg-stone-200'}`} />
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-stone-900 truncate group-hover:text-stone-700 transition-colors">{task.title}</p>
                        <p className="text-xs font-medium text-stone-400 mt-1 truncate">{task.wedding?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                      <div className={`text-xs font-medium ${isOverdue ? 'text-rose-700' : 'text-stone-400'} hidden sm:flex items-center gap-1.5`}>
                        <Clock className="h-3.5 w-3.5" /> {formatDate(task.dueDate)}
                      </div>
                      <ArrowRight className="h-4 w-4 text-stone-300 group-hover:text-stone-900 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center text-stone-400 font-medium text-sm">No tasks assigned yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MANAGER DASHBOARD
═══════════════════════════════════════ */
function ManagerDashboard({ user, stats, activity, monthlyData }) {
  const weddings = activity?.recentWeddings || [];

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-12 space-y-16">

      {/* ── Header ── */}
      <div>
        <p className="text-[10px] font-bold tracking-[0.25em] text-stone-400 uppercase mb-3">Overview</p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl sm:text-6xl font-medium text-stone-900 tracking-tight">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span className="italic text-stone-600">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-stone-400 font-medium text-sm mt-3">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2.5 bg-white border border-stone-200/60 rounded-xl shadow-sm px-5 py-3 self-start sm:self-auto">
            <div className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            <span className="text-xs text-stone-500 font-medium tracking-wide">
              <span className="font-bold text-stone-900">{stats?.activeWeddings || 0}</span> active weddings
            </span>
          </div>
        </div>
      </div>

      {/* ── Zone 1: Urgency Timeline ── */}
      <div>
        <SectionLabel action="View all weddings" actionHref="/weddings">
          Coming Up
        </SectionLabel>
        <UrgencyTimeline weddings={weddings} />
      </div>

      {/* ── Zone 2: Key Numbers (Separated Cards) ── */}
      <div>
        <SectionLabel>Performance</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Leads',      value: stats?.totalLeads || 0,        sub: `+${stats?.newLeadsThisMonth || 0} this month`, bar: 'bg-stone-300' },
            { label: 'Active Weddings',  value: stats?.activeWeddings || 0,    sub: 'Currently planning',                           bar: 'bg-stone-800' },
            { label: 'Pending Tasks',    value: stats?.pendingTasks || 0,      sub: stats?.overdueTasks ? `${stats.overdueTasks} overdue` : 'On track', bar: stats?.overdueTasks > 0 ? 'bg-rose-800' : 'bg-amber-700' },
            { label: 'Conversion Rate',  value: `${stats?.conversionRate || 0}%`, sub: `${stats?.conversions || 0} bookings`,       bar: 'bg-teal-700' },
          ].map(m => (
            <div key={m.label} className="bg-white px-7 py-8 rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow">
              <div className={`h-0.5 w-8 rounded-full ${m.bar} mb-5`} />
              <p className="font-display text-4xl sm:text-5xl font-medium text-stone-900 leading-none">{m.value}</p>
              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mt-4">{m.label}</p>
              <p className="text-xs text-stone-500 font-medium mt-1.5">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Zone 3: Wedding Health Board + Activity Feed ── */}
      <div>
        <SectionLabel action="All weddings" actionHref="/weddings">Wedding Health</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {weddings.length > 0 ? (
              weddings.map(w => <WeddingCard key={w._id} wedding={w} />)
            ) : (
              <div className="sm:col-span-2 xl:col-span-3 bg-white rounded-2xl border border-stone-200/60 py-24 text-center shadow-sm">
                <p className="text-sm font-medium text-stone-400">No active weddings yet</p>
                <Link to="/weddings" className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors">
                  Create one <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/60 p-7 shadow-sm lg:sticky lg:top-6">
            <h3 className="font-display text-2xl font-medium text-stone-900 mb-1">Activity Feed</h3>
            <p className="text-xs font-medium text-stone-400 mb-8">Latest updates across your pipeline</p>
            <ActivityFeed
              leads={activity?.recentLeads || []}
              tasks={activity?.upcomingTasks || []}
            />
          </div>
        </div>
      </div>

      {/* ── Zone 4: Lead Funnel + Recent Leads ── */}
      <div>
        <SectionLabel>Lead Pipeline</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 items-start">

          <div className="bg-white rounded-2xl border border-stone-200/60 p-8 shadow-sm">
            <h3 className="font-display text-2xl font-medium text-stone-900 mb-1">Funnel</h3>
            <p className="text-xs font-medium text-stone-400 mb-10">Conversion at each stage</p>
            <LeadFunnel stages={stats?.leadsByStage} />
            {stats?.conversionRate > 0 && (
              <div className="mt-10 pt-8 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Inquiry → Booked</p>
                  <p className="text-lg font-bold text-teal-700">{stats.conversionRate}%</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/60 overflow-hidden shadow-sm">
            <div className="px-8 pt-8 pb-6 border-b border-stone-100/80 flex items-end justify-between">
              <div>
                <h3 className="font-display text-2xl font-medium text-stone-900">Recent Leads</h3>
                <p className="text-xs font-medium text-stone-400 mt-1.5">Newly added to the pipeline</p>
              </div>
              <Link to="/leads" className="text-xs font-bold text-stone-400 hover:text-stone-900 flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {activity?.recentLeads?.length > 0 ? (
              <div className="divide-y divide-stone-100/80">
                {activity.recentLeads.map(lead => (
                  <Link key={lead._id} to={`/leads/${lead._id}`}
                    className="flex items-center justify-between px-8 py-6 hover:bg-stone-50/50 transition-colors group">
                    <div className="flex items-center gap-5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#faf9f7] border border-stone-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-stone-600">
                          {lead.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-stone-900 truncate group-hover:text-stone-700 transition-colors">{lead.name}</p>
                        <p className="text-xs font-medium text-stone-400 mt-1">{formatRelative(lead.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                      <div className="flex items-center gap-2.5">
                        <Dot stage={lead.stage} />
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-widest hidden sm:block">{lead.stage}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-stone-300 group-hover:text-stone-900 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-stone-400 font-medium text-sm">No leads yet</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Zone 5: Overdue tasks callout ── */}
      {stats?.overdueTasks > 0 && (
        <div>
          <SectionLabel action="View all tasks" actionHref="/tasks">Needs Attention</SectionLabel>
          <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-2xl px-8 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
            <div>
              <p className="font-display text-2xl font-medium text-rose-900">{stats.overdueTasks} task{stats.overdueTasks > 1 ? 's are' : ' is'} overdue</p>
              <p className="text-sm font-medium text-rose-700/80 mt-1.5">These are past their due date and need immediate action.</p>
            </div>
            <Link to="/tasks?filter=overdue"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-rose-900 text-white rounded-xl text-sm font-bold hover:bg-rose-950 transition-all flex-shrink-0 shadow-sm hover:shadow-md hover:-translate-y-0.5">
              Review now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

/* ═══════════════════════════════════════
   ROOT EXPORT
═══════════════════════════════════════ */
export default function Dashboard() {
  const { user, isManager } = useAuth();
  const [stats, setStats]         = useState(null);
  const [activity, setActivity]   = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [myTasks, setMyTasks]     = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      if (!isManager) {
        const { data } = await api.get('/tasks/my-tasks');
        setMyTasks(data.tasks || []);
      } else {
        const [s, a, m] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/activity'),
          api.get('/dashboard/monthly'),
        ]);
        setStats(s.data.stats);
        setActivity(a.data);
        setMonthlyData(m.data);
      }
    } catch (e) {
      console.error('Dashboard error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-body    { font-family: 'Inter', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="font-body min-h-screen bg-[#faf9f7] text-stone-800">
        {loading ? (
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-12 space-y-12">
            <div><Sk className="h-4 w-24 mb-4" /><Sk className="h-14 w-80" /></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><Sk key={i} className="h-36"/>)}</div>
            <div className="grid lg:grid-cols-3 gap-8">{[...Array(3)].map((_,i)=><Sk key={i} className="h-64"/>)}</div>
            <div className="grid lg:grid-cols-2 gap-8">{[...Array(2)].map((_,i)=><Sk key={i} className="h-80"/>)}</div>
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