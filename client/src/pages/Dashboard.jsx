import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Heart,
  Users,
  CheckSquare,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Plus,
  LayoutDashboard,
  Clock,
  MapPin,
  AlertTriangle,
  X,
  IndianRupee,
  User
} from 'lucide-react';
import { formatDate, daysUntil, formatCurrency } from '../utils/helpers';
import useAuthStore from '../stores/authStore';
import useDashboardStore from '../stores/dashboardStore';

/* ─────────────────────────────────────────
   STAGE COLORS (matches Leads page)
───────────────────────────────────────── */
const stageMeta = {
  inquiry:     { bar: 'bg-stone-300', dot: 'bg-stone-300', text: 'text-stone-500' },
  proposal:    { bar: 'bg-amber-700', dot: 'bg-amber-700', text: 'text-amber-700' },
  negotiation: { bar: 'bg-stone-900', dot: 'bg-stone-900', text: 'text-stone-900' },
  booked:      { bar: 'bg-teal-700',  dot: 'bg-teal-700',  text: 'text-teal-700' },
  lost:        { bar: 'bg-stone-400', dot: 'bg-stone-400', text: 'text-stone-400' },
};

const statusMeta = {
  planning:  { bar: 'bg-stone-300', dot: 'bg-stone-300', text: 'text-stone-500' },
  completed: { bar: 'bg-teal-700',  dot: 'bg-teal-700',  text: 'text-teal-700' },
};

/* ─────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────── */
function Skeleton({ className = '' }) {
  return <div className={`bg-stone-200/50 animate-pulse rounded-2xl ${className}`} />;
}

/* ─────────────────────────────────────────
   CALENDAR MODAL
───────────────────────────────────────── */
function CalendarModal({ isOpen, onClose, weddings }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  if (!isOpen) return null;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  
  // Get wedding dates for current month
  const weddingDates = weddings
    .filter(w => {
      const d = new Date(w.weddingDate);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((acc, w) => {
      const day = new Date(w.weddingDate).getDate();
      if (!acc[day]) acc[day] = [];
      acc[day].push(w);
      return acc;
    }, {});

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const today = new Date();
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-950/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#faf9f7] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="font-display text-lg font-medium text-stone-900">Wedding Calendar</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-stone-600" />
            </button>
            <h3 className="font-display text-lg text-stone-900">{monthName}</h3>
            <button onClick={nextMonth} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-stone-600" />
            </button>
          </div>
          
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-stone-400 py-2">
                {d}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const hasWedding = day && weddingDates[day];
              return (
                <div 
                  key={idx} 
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative ${
                    !day ? '' :
                    isToday(day) ? 'bg-stone-900 text-white' :
                    hasWedding ? 'bg-amber-50 text-stone-900 font-medium' :
                    'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {day && (
                    <>
                      <span>{day}</span>
                      {hasWedding && (
                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-700" />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Upcoming Weddings This Month */}
          {Object.keys(weddingDates).length > 0 && (
            <div className="mt-6 pt-4 border-t border-stone-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-3">This Month</p>
              <div className="space-y-2">
                {Object.entries(weddingDates).map(([day, weds]) => (
                  weds.map(w => (
                    <Link 
                      key={w._id} 
                      to={`/weddings/${w._id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center text-xs font-medium">
                        {day}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-stone-900 truncate group-hover:text-amber-700 transition-colors">{w.name}</p>
                        <p className="text-xs text-stone-400 truncate italic">{w.venue?.name || 'Venue TBD'}</p>
                      </div>
                    </Link>
                  ))
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   WEDDING CARD (matches Weddings page style)
───────────────────────────────────────── */
function WeddingCard({ wedding }) {
  const days = daysUntil(wedding.weddingDate);
  const total = wedding.taskStats?.total || 0;
  const done = wedding.taskStats?.completed || 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  
  const m = statusMeta[wedding.status] || statusMeta.planning;

  return (
    <Link 
      to={`/weddings/${wedding._id}`}
      className="group bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5 hover:border-stone-300 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 block"
    >
      {/* Accent bar */}
      <div className={`h-[1px] w-6 ${m.bar} mb-4 group-hover:w-10 transition-all duration-300`} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-medium text-stone-900 text-sm leading-tight truncate">{wedding.name}</p>
          <p className="text-xs text-stone-400 mt-1 italic truncate">{wedding.clientName || wedding.client?.name}</p>
        </div>
        {days !== null && days >= 0 && (
          <span className={`text-[10px] font-bold tracking-wide flex-shrink-0 px-2 py-0.5 rounded ${
            days === 0 ? 'bg-amber-50 text-amber-700' : days <= 7 ? 'bg-stone-100 text-stone-900' : 'text-stone-400'
          }`}>
            {days === 0 ? 'Today' : days <= 30 ? `${days}d` : formatDate(wedding.weddingDate)}
          </span>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-stone-400 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 flex-shrink-0 text-stone-300" />
          <span className="text-stone-600 italic truncate">{formatDate(wedding.weddingDate)}</span>
        </div>
        {wedding.venue?.name && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3 flex-shrink-0 text-stone-300" />
            <span className="text-stone-600 truncate">{wedding.venue.name}</span>
          </div>
        )}
        {wedding.budget > 0 && (
          <div className="flex items-center gap-2">
            <IndianRupee className="w-3 h-3 flex-shrink-0 text-stone-300" />
            <span className="text-stone-600">{formatCurrency(wedding.budget)}</span>
          </div>
        )}
        {wedding.guestCount > 0 && (
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 flex-shrink-0 text-stone-300" />
            <span className="text-stone-600">{wedding.guestCount} guests</span>
          </div>
        )}
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-stone-400 mb-1.5">
            <span>Tasks</span>
            <span className="font-medium text-stone-600">{done} of {total} done</span>
          </div>
          <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-teal-700' : 'bg-stone-900'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-100/60">
        {wedding.relationshipManager?.name ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center">
              <User className="w-3 h-3 text-stone-400" />
            </div>
            <span className="text-[10px] text-stone-400">{wedding.relationshipManager.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${statusMeta[wedding.status]?.text || 'text-stone-400'}`}>
            {wedding.status}
          </span>
        )}
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-stone-400 group-hover:text-stone-900 flex items-center gap-1 transition-colors">
          View <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────
   LEAD CARD (matches Leads page style)
───────────────────────────────────────── */
function LeadCard({ lead }) {
  const m = stageMeta[lead.stage] || stageMeta.inquiry;
  const daysSinceCreated = lead.createdAt ? Math.floor((new Date() - new Date(lead.createdAt)) / (1000 * 60 * 60 * 24)) : null;

  return (
    <Link 
      to="/leads"
      className="group bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5 hover:border-stone-300 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 block"
    >
      {/* Accent bar */}
      <div className={`h-[1px] w-6 ${m.bar} mb-4 group-hover:w-10 transition-all duration-300`} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-medium text-stone-900 text-sm leading-tight truncate">{lead.name}</p>
          {lead.email && (
            <p className="text-xs text-stone-400 mt-1 truncate">{lead.email}</p>
          )}
        </div>
        {lead.estimatedBudget > 0 && (
          <span className="text-xs font-medium text-teal-700 flex-shrink-0 bg-teal-50 px-2 py-0.5 rounded">
            {formatCurrency(lead.estimatedBudget)}
          </span>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-stone-400 mb-4">
        {lead.weddingDate && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 flex-shrink-0 text-stone-300" />
            <span className="text-stone-600 italic truncate">{formatDate(lead.weddingDate)}</span>
          </div>
        )}
        {lead.source && (
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 flex-shrink-0 text-stone-300" />
            <span className="text-stone-600 truncate capitalize">{lead.source.replace('_', ' ')}</span>
          </div>
        )}
        {daysSinceCreated !== null && (
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 flex-shrink-0 text-stone-300" />
            <span className="text-stone-600">{daysSinceCreated === 0 ? 'Today' : `${daysSinceCreated}d ago`}</span>
          </div>
        )}
        {lead.assignedTo?.name && (
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 flex-shrink-0 text-stone-300" />
            <span className="text-stone-600 truncate">{lead.assignedTo.name.split(' ')[0]}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-100/60">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] bg-white border border-stone-200/60 ${m.text} shadow-sm`}>
          <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
          {lead.stage}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-stone-400 group-hover:text-stone-900 flex items-center gap-1 transition-colors">
          View <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════
   TEAM MEMBER DASHBOARD
═══════════════════════════════════════ */
function TeamMemberDashboard({ user, myTasks }) {
  const completed = myTasks.filter(t => ['completed', 'verified'].includes(t.status));
  const pending = myTasks.filter(t => !['completed', 'verified'].includes(t.status));
  const overdue = pending.filter(t => new Date(t.dueDate) < new Date());

  return (
    <div className="font-body bg-[#faf9f7] text-stone-900 min-h-[calc(100vh-56px)] pb-20 lg:pb-8">

      {/* ── Hero Header ── */}
      <div className="bg-stone-900 py-12 sm:py-16 px-5 sm:px-8 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#b07d46] uppercase mb-2">My Workspace</p>
          <h1 className="font-display text-4xl sm:text-5xl font-medium text-white">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-stone-400 text-sm mt-2">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <main className="px-5 sm:px-8 lg:px-10 py-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Tasks', value: myTasks.length, bar: 'bg-stone-300' },
            { label: 'Completed', value: completed.length, bar: 'bg-teal-700' },
            { label: 'Overdue', value: overdue.length, bar: overdue.length > 0 ? 'bg-amber-700' : 'bg-stone-200' },
          ].map(s => (
            <div key={s.label} className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm">
              <div className={`h-[1px] w-6 ${s.bar} mb-4`} />
              <p className="font-display text-2xl sm:text-3xl font-medium text-stone-900 leading-none">{s.value}</p>
              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mt-3">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tasks Table */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-xl sm:text-2xl font-medium text-stone-900">My Tasks</h2>
          <Link to="/tasks" className="text-xs font-bold uppercase tracking-[0.1em] text-stone-400 hover:text-stone-900 flex items-center gap-1 transition-colors">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
          {myTasks.length > 0 ? (
            <div className="divide-y divide-stone-100/60">
              {myTasks.slice(0, 10).map(task => {
                const isOverdue = new Date(task.dueDate) < new Date() && !['completed', 'verified'].includes(task.status);
                return (
                  <Link 
                    key={task._id} 
                    to={`/weddings/${task.wedding?._id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-[#faf9f7] transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-[2px] h-8 rounded-full flex-shrink-0 ${
                        isOverdue ? 'bg-amber-700' : 
                        task.status === 'in_progress' ? 'bg-stone-400' : 
                        task.status === 'completed' ? 'bg-teal-700' :
                        'bg-stone-200'
                      }`} />
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900 text-sm truncate">{task.title}</p>
                        <p className="text-xs text-stone-400 mt-1 italic truncate">{task.wedding?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {task.dueDate && (
                        <span className={`text-xs hidden sm:block ${isOverdue ? 'text-amber-700 font-medium' : 'text-stone-400'}`}>
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-stone-300" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-stone-400 text-sm italic">No tasks assigned</div>
          )}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}

/* ═══════════════════════════════════════
   MANAGER DASHBOARD
═══════════════════════════════════════ */
function ManagerDashboard({ user, stats, activity }) {
  const weddings = activity?.recentWeddings || [];
  const leads = activity?.recentLeads || [];
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <div className="font-body bg-[#faf9f7] text-stone-900 selection:bg-stone-200 min-h-[calc(100vh-56px)] pb-20 lg:pb-8">

      {/* ── Hero Header ── */}
      <div className="bg-stone-900 py-12 sm:py-16 px-5 sm:px-8 lg:px-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#b07d46] uppercase mb-2">Dashboard</p>
            <h1 className="font-display text-4xl sm:text-5xl font-medium text-white">
              Welcome, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-stone-400 text-sm mt-2">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <Link 
            to="/leads" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#faf9f7] text-stone-900 rounded-lg text-sm font-medium hover:bg-white transition-all self-start sm:self-auto flex-shrink-0"
          >
            <Plus className="h-4 w-4" /> New Lead
          </Link>
        </div>
      </div>

      <main className="px-5 sm:px-8 lg:px-10 py-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Weddings', value: stats?.activeWeddings || 0, bar: 'bg-stone-900', link: '/weddings' },
            { label: 'Total Leads', value: stats?.totalLeads || 0, bar: 'bg-stone-400', sub: `+${stats?.newLeadsThisMonth || 0} this month`, link: '/leads' },
            { label: 'Pending Tasks', value: stats?.pendingTasks || 0, bar: stats?.overdueTasks > 0 ? 'bg-amber-700' : 'bg-stone-300', sub: stats?.overdueTasks > 0 ? `${stats.overdueTasks} overdue` : 'On track', link: '/tasks' },
            { label: 'Conversion', value: `${stats?.conversionRate || 0}%`, bar: 'bg-teal-700', sub: `${stats?.conversions || 0} bookings` },
          ].map(s => (
            <Link 
              key={s.label} 
              to={s.link || '#'}
              className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm hover:-translate-y-0.5 transition-all duration-300 group block"
            >
              <div className={`h-[1px] w-6 ${s.bar} mb-4 group-hover:w-10 transition-all duration-300`} />
              <p className="font-display text-2xl sm:text-3xl font-medium text-stone-900 leading-none">{s.value}</p>
              <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mt-3">{s.label}</p>
              {s.sub && <p className="text-xs text-stone-400 mt-1 italic">{s.sub}</p>}
            </Link>
          ))}
        </div>

        {/* Alert Banner */}
        {stats?.overdueTasks > 0 && (
          <div className="bg-white rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-stone-200/60 shadow-sm border-l-4 border-l-amber-700">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 flex-shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-sm text-stone-900">{stats.overdueTasks} Overdue Task{stats.overdueTasks > 1 ? 's' : ''}</p>
                <p className="text-xs text-stone-400 mt-0.5 italic">Need immediate attention</p>
              </div>
            </div>
            <Link 
              to="/tasks"
              className="px-4 py-2 bg-stone-900 text-[#faf9f7] rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors flex-shrink-0"
            >
              Review Now
            </Link>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Cards */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Weddings */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-display text-xl sm:text-2xl font-medium text-stone-900">Recent Weddings</h2>
                <Link to="/weddings" className="text-xs font-bold uppercase tracking-[0.1em] text-stone-400 hover:text-stone-900 flex items-center gap-1 transition-colors">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {weddings.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {weddings.slice(0, 4).map((wedding) => (
                    <WeddingCard key={wedding._id} wedding={wedding} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm py-12 text-center">
                  <Heart className="w-8 h-8 text-stone-200 mx-auto mb-3" />
                  <p className="text-stone-400 text-sm">No weddings yet</p>
                  <Link to="/weddings" className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold tracking-[0.1em] text-stone-900 uppercase hover:underline transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Create your first
                  </Link>
                </div>
              )}
            </section>

            {/* Recent Leads */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-display text-xl sm:text-2xl font-medium text-stone-900">Recent Leads</h2>
                <Link to="/leads" className="text-xs font-bold uppercase tracking-[0.1em] text-stone-400 hover:text-stone-900 flex items-center gap-1 transition-colors">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {leads.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {leads.slice(0, 4).map((lead) => (
                    <LeadCard key={lead._id} lead={lead} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm py-12 text-center">
                  <Users className="w-8 h-8 text-stone-200 mx-auto mb-3" />
                  <p className="text-stone-400 text-sm">No leads yet</p>
                  <Link to="/leads" className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold tracking-[0.1em] text-stone-900 uppercase hover:underline transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Add your first
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Timeline */}
          <div className="space-y-5">
            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-display text-lg font-medium text-stone-900">Upcoming</h3>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                  {new Date().toLocaleDateString('en-IN', { month: 'short' })}
                </span>
              </div>
              
              {weddings.filter(w => daysUntil(w.weddingDate) >= 0 && daysUntil(w.weddingDate) <= 30).length > 0 ? (
                <div className="space-y-5 relative">
                  <div className="absolute left-[6px] top-2 bottom-2 w-[1px] bg-stone-200/60" />
                  {weddings
                    .filter(w => daysUntil(w.weddingDate) >= 0 && daysUntil(w.weddingDate) <= 30)
                    .sort((a, b) => new Date(a.weddingDate) - new Date(b.weddingDate))
                    .slice(0, 4)
                    .map((wedding) => {
                      const days = daysUntil(wedding.weddingDate);
                      const isUrgent = days <= 7;
                      return (
                        <Link 
                          key={wedding._id} 
                          to={`/weddings/${wedding._id}`}
                          className="relative pl-5 group block"
                        >
                          <div className={`absolute left-0 top-1.5 w-3 h-3 rounded-full ring-4 ring-white ${
                            isUrgent ? 'bg-amber-700' : 'bg-stone-300'
                          } group-hover:scale-125 transition-transform`} />
                          <div className="space-y-0.5">
                            <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isUrgent ? 'text-amber-700' : 'text-stone-400'}`}>
                              {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : formatDate(wedding.weddingDate)}
                            </p>
                            <p className="font-medium text-sm text-stone-900 group-hover:text-amber-700 transition-colors">{wedding.name}</p>
                            {wedding.venue?.name && (
                              <p className="text-xs text-stone-400 italic truncate">{wedding.venue.name}</p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-stone-400 text-center py-6 italic">No upcoming events</p>
              )}
              
              <button 
                onClick={() => setCalendarOpen(true)}
                className="w-full mt-5 py-2.5 border border-stone-200/60 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5" />
                View Calendar
              </button>
            </div>

            {/* Quick Stats */}
            <div className="bg-stone-900 text-[#faf9f7] rounded-2xl p-5 relative overflow-hidden">
              <h4 className="font-display italic text-base mb-4">Overview</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Completed</span>
                  <span className="font-medium">{stats?.completedWeddings || 0} weddings</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">This Month</span>
                  <span className="font-medium">{stats?.newLeadsThisMonth || 0} leads</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Bookings</span>
                  <span className="font-medium">{stats?.conversions || 0} total</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
      <CalendarModal 
        isOpen={calendarOpen} 
        onClose={() => setCalendarOpen(false)} 
        weddings={weddings} 
      />
    </div>
  );
}

/* ─────────────────────────────────────────
   MOBILE BOTTOM NAV
───────────────────────────────────────── */
function MobileBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200/60 px-4 py-3 flex justify-around items-center z-40">
      <Link to="/dashboard" className="flex flex-col items-center gap-1 text-stone-900">
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
      </Link>
      <Link to="/weddings" className="flex flex-col items-center gap-1 text-stone-400">
        <Heart className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-wider">Weddings</span>
      </Link>
      <Link to="/leads" className="flex flex-col items-center gap-1 text-stone-400">
        <Users className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-wider">Leads</span>
      </Link>
      <Link to="/tasks" className="flex flex-col items-center gap-1 text-stone-400">
        <CheckSquare className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-wider">Tasks</span>
      </Link>
    </nav>
  );
}

/* ═══════════════════════════════════════
   ROOT COMPONENT
═══════════════════════════════════════ */
export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const isManager = useAuthStore((s) => s.user?.role === 'relationship_manager' || s.user?.role === 'admin');
  const { stats, activity, myTasks, loading, fetchDashboard } = useDashboardStore();

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap');
          .font-display { font-family: 'Cormorant Garamond', serif; letter-spacing: -0.02em; }
          .font-body    { font-family: 'Inter', sans-serif; }
        `}</style>
        <div className="font-body bg-[#faf9f7] min-h-[calc(100vh-56px)] p-6 sm:p-8 space-y-6">
          <div>
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-10 w-56" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-44" />)}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Cormorant Garamond', serif; letter-spacing: -0.02em; }
        .font-body    { font-family: 'Inter', sans-serif; }
      `}</style>
      {!isManager ? (
        <TeamMemberDashboard user={user} myTasks={myTasks} />
      ) : (
        <ManagerDashboard user={user} stats={stats} activity={activity} />
      )}
    </>
  );
}
