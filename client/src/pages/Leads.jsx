import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, LayoutGrid, List,
  Phone, Calendar, X, ChevronRight, Heart, TrendingUp, Users, BarChart3
} from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor,
  PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDate, formatCurrency, leadSources } from '../utils/helpers';
import useAuthStore from '../stores/authStore';
import useLeadStore from '../stores/leadStore';

/* ─────────────────────────────────────────
   SHARED PRIMITIVES
───────────────────────────────────────── */
const inputCls = "w-full px-4 py-2.5 bg-white border border-stone-200/60 rounded-lg text-sm font-body text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 transition-all";
const labelCls = "block text-[10px] font-bold tracking-[0.18em] text-stone-400 uppercase mb-1.5 font-body";

function Field({ label, hint, children }) {
  return (
    <div>
      {label && <label className={labelCls}>{label}</label>}
      {children}
      {hint && <p className="text-xs text-stone-400 mt-1 font-body">{hint}</p>}
    </div>
  );
}

function TextInput({ ...props }) {
  return <input {...props} className={inputCls} />;
}

function SelectInput({ options, ...props }) {
  return (
    <select {...props} className={`${inputCls} appearance-none`}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function TextareaInput({ ...props }) {
  return <textarea {...props} className={`${inputCls} resize-none`} />;
}

/* ─────────────────────────────────────────
   STAGE CONFIG
───────────────────────────────────────── */
const stages = [
  { id: 'inquiry',     label: 'Inquiry' },
  { id: 'booked',      label: 'Booked' },
];

const stageMeta = {
  inquiry:     { bar: 'bg-stone-300',  dot: 'bg-stone-300',  text: 'text-stone-500',  faint: 'bg-stone-50' },
  proposal:    { bar: 'bg-amber-700',  dot: 'bg-amber-700',  text: 'text-amber-700',  faint: 'bg-amber-50/40' },
  negotiation: { bar: 'bg-stone-900',  dot: 'bg-stone-900',  text: 'text-stone-900',  faint: 'bg-stone-100/40' },
  booked:      { bar: 'bg-teal-700',   dot: 'bg-teal-700',   text: 'text-teal-700',   faint: 'bg-teal-50/40' },
  lost:        { bar: 'bg-rose-800',   dot: 'bg-rose-800',   text: 'text-rose-800',   faint: 'bg-rose-50/40' },
};

function StageDot({ stage }) {
  const m = stageMeta[stage] || stageMeta.inquiry;
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${m.dot} flex-shrink-0`} />;
}

function StagePill({ stage }) {
  const m = stageMeta[stage] || stageMeta.inquiry;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-white border border-stone-200/60 ${m.text} shadow-sm`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {stage}
    </span>
  );
}

/* ─────────────────────────────────────────
   MODAL
───────────────────────────────────────── */
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-stone-950/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#faf9f7] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 flex-shrink-0">
          <h2 className="font-display text-lg font-medium text-stone-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 font-body">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   KANBAN LEAD CARD
───────────────────────────────────────── */
function KanbanCard({ lead, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const m = stageMeta[lead.stage] || stageMeta.inquiry;

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={() => onClick(lead)}
      className="group bg-white rounded-2xl border border-stone-200/60 shadow-sm p-4 cursor-pointer hover:border-stone-300 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Accent bar */}
      <div className={`h-[1px] w-6 ${m.bar} mb-4 group-hover:w-10 transition-all duration-300`} />

      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="font-medium font-body text-stone-900 text-sm leading-tight flex items-center gap-2">
          {lead.name}
          {lead.isPriority && <Heart className="w-3 h-3 text-rose-800 fill-rose-800" />}
        </p>
        {lead.estimatedBudget > 0 && (
          <span className="text-xs font-medium font-body text-teal-700 flex-shrink-0">{formatCurrency(lead.estimatedBudget)}</span>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-stone-400 font-body">
        {lead.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3 flex-shrink-0 text-stone-300" />
            <span className="text-stone-600">{lead.phone}</span>
          </div>
        )}
        {lead.weddingDate && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 flex-shrink-0 text-stone-300" />
            <span className="text-stone-600 italic">{formatDate(lead.weddingDate)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100/60 font-body">
        <span className="text-[10px] font-bold tracking-[0.2em] text-stone-300 uppercase">
          {leadSources.find(s => s.value === lead.source)?.label || lead.source}
        </span>
        {lead.assignedTo && (
          <div className="w-6 h-6 rounded-full bg-[#faf9f7] border border-stone-200/60 flex items-center justify-center">
            <span className="text-[10px] font-medium text-stone-600">
              {lead.assignedTo.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   KANBAN COLUMN
───────────────────────────────────────── */
function KanbanColumn({ stage, leads, onLeadClick }) {
  const { setNodeRef } = useSortable({ id: stage.id });
  const m = stageMeta[stage.id];
  const totalBudget = leads.reduce((s, l) => s + (l.estimatedBudget || 0), 0);

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      {/* Column header */}
      <div className="mb-4 px-1">
        <div className="flex items-center justify-between font-body">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-stone-900">{stage.label}</span>
            <span className="text-xs text-stone-400">{leads.length}</span>
          </div>
          {totalBudget > 0 && (
            <span className="text-[10px] text-stone-400">{formatCurrency(totalBudget)}</span>
          )}
        </div>
        {/* Stage bar */}
        <div className={`h-[1px] w-full ${m.bar} opacity-20 mt-3`} />
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="flex-1 space-y-3 min-h-32">
        <SortableContext items={leads.map(l => l._id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <KanbanCard key={lead._id} lead={lead} onClick={onLeadClick} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="text-center py-10 text-xs font-body italic text-stone-400 bg-white shadow-sm rounded-2xl border border-stone-200/60">
            No active inquiries
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SKELETON
───────────────────────────────────────── */
function Sk({ className = '' }) {
  return <div className={`bg-stone-200/50 animate-pulse rounded-2xl ${className}`} />;
}

/* ─────────────────────────────────────────
   DONUT CHART - Lead Sources
───────────────────────────────────────── */
function SourceDonutChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;
  
  const colors = {
    referral: '#44403c',       // stone-700
    website: '#78716c',        // stone-500
    social_media: '#a8a29e',   // stone-400
    advertisement: '#d6d3d1',  // stone-300
    walk_in: '#e7e5e4',        // stone-200
    other: '#f5f5f4',          // stone-100
  };
  
  let cumulative = 0;
  const size = 120;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {data.map((item, i) => {
            const pct = item.value / total;
            const offset = cumulative * circumference;
            cumulative += pct;
            return (
              <circle
                key={item.source}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={colors[item.source] || '#e7e5e4'}
                strokeWidth={strokeWidth}
                strokeDasharray={`${pct * circumference} ${circumference}`}
                strokeDashoffset={-offset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="font-display text-2xl font-medium text-stone-900">{total}</p>
            <p className="text-[9px] text-stone-400 uppercase tracking-wider">Total</p>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {data.filter(d => d.value > 0).slice(0, 4).map(item => (
          <div key={item.source} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[item.source] || '#e7e5e4' }} />
            <span className="text-stone-600 capitalize">{item.label}</span>
            <span className="text-stone-400 ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   FUNNEL CHART - Stage Distribution
───────────────────────────────────────── */
function StageFunnel({ pipeline }) {
  const stageData = [
    { id: 'inquiry', label: 'Inquiry', count: pipeline.inquiry?.length || 0, color: 'bg-stone-300' },
    { id: 'proposal', label: 'Proposal', count: pipeline.proposal?.length || 0, color: 'bg-amber-700' },
    { id: 'negotiation', label: 'Negotiation', count: pipeline.negotiation?.length || 0, color: 'bg-stone-700' },
    { id: 'booked', label: 'Booked', count: pipeline.booked?.length || 0, color: 'bg-teal-700' },
  ];
  
  const max = Math.max(...stageData.map(s => s.count), 1);
  
  return (
    <div className="space-y-3">
      {stageData.map((stage, idx) => {
        const widthPct = Math.max((stage.count / max) * 100, 8);
        return (
          <div key={stage.id} className="flex items-center gap-3">
            <div className="w-20 flex-shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{stage.label}</span>
            </div>
            <div className="flex-1 h-7 bg-stone-100 rounded-lg overflow-hidden relative">
              <div 
                className={`h-full ${stage.color} rounded-lg transition-all duration-500 flex items-center justify-end pr-2`}
                style={{ width: `${widthPct}%` }}
              >
                {stage.count > 0 && (
                  <span className="text-[10px] font-bold text-white">{stage.count}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   BAR CHART - Budget by Stage
───────────────────────────────────────── */
function BudgetByStageChart({ pipeline }) {
  const stageData = [
    { id: 'inquiry', label: 'Inquiry', budget: (pipeline.inquiry || []).reduce((s, l) => s + (l.estimatedBudget || 0), 0), color: 'bg-stone-300' },
    { id: 'proposal', label: 'Proposal', budget: (pipeline.proposal || []).reduce((s, l) => s + (l.estimatedBudget || 0), 0), color: 'bg-amber-700' },
    { id: 'negotiation', label: 'Negotiation', budget: (pipeline.negotiation || []).reduce((s, l) => s + (l.estimatedBudget || 0), 0), color: 'bg-stone-700' },
    { id: 'booked', label: 'Booked', budget: (pipeline.booked || []).reduce((s, l) => s + (l.estimatedBudget || 0), 0), color: 'bg-teal-700' },
  ];
  
  const max = Math.max(...stageData.map(s => s.budget), 1);
  const total = stageData.reduce((s, d) => s + d.budget, 0);
  
  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-2xl font-medium text-stone-900">{formatCurrency(total)}</span>
        <span className="text-xs text-stone-400">pipeline value</span>
      </div>
      <div className="flex items-end gap-2 h-24">
        {stageData.map((stage) => {
          const heightPct = Math.max((stage.budget / max) * 100, 4);
          return (
            <div key={stage.id} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-stone-100 rounded-t-lg overflow-hidden flex items-end" style={{ height: '100%' }}>
                <div 
                  className={`w-full ${stage.color} rounded-t-lg transition-all duration-500`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="text-[9px] text-stone-400 uppercase tracking-wider">{stage.label.slice(0, 3)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function Leads() {
  const user = useAuthStore((s) => s.user);
  const isManager = useAuthStore((s) => s.user?.role === 'relationship_manager' || s.user?.role === 'admin');
  const { pipeline: leads, leads: allLeads, users, loading, fetchLeads, createLead, updateLead, updateLeadStage, convertLead } = useLeadStore();
  const [view, setView]             = useState('table');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [search, setSearch]         = useState('');
  const [stageFilter, setStageFilter] = useState('');

  const emptyForm = {
    name: '', email: '', phone: '', source: 'other',
    estimatedBudget: '', weddingDate: '', venue: '',
    guestCount: '', notes: '', assignedTo: ''
  };
  const [form, setForm] = useState(emptyForm);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const newStage = over.id;
    if (!stages.find(s => s.id === newStage)) return;
    const all = [...(leads.inquiry||[]),...(leads.proposal||[]),...(leads.negotiation||[]),...(leads.booked||[])];
    const lead = all.find(l => l._id === active.id);
    if (!lead || lead.stage === newStage) return;
    await updateLeadStage(active.id, newStage);
  };

  const openCreate = () => { setSelectedLead(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (lead) => {
    if (!isManager) return;
    setSelectedLead(lead);
    setForm({
      name: lead.name, email: lead.email || '', phone: lead.phone,
      source: lead.source, estimatedBudget: lead.estimatedBudget || '',
      weddingDate: lead.weddingDate ? lead.weddingDate.split('T')[0] : '',
      venue: lead.venue || '', guestCount: lead.guestCount || '',
      notes: lead.notes || '', assignedTo: lead.assignedTo?._id || ''
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setSelectedLead(null); setForm(emptyForm); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedLead) await updateLead(selectedLead._id, form);
    else await createLead(form);
    closeModal();
  };

  const handleConvert = async () => {
    if (!selectedLead) return;
    await convertLead(selectedLead._id, form.weddingDate);
    closeModal();
  };

  const filtered = allLeads.filter(l => {
    const q = search.toLowerCase();
    const matchQ = !q || l.name.toLowerCase().includes(q) || l.phone?.includes(q) || l.email?.toLowerCase().includes(q);
    const matchS = !stageFilter || l.stage === stageFilter;
    return matchQ && matchS;
  });

  /* Derived pipeline totals */
  const pipelineTotal = Object.values(leads).flat().reduce((s, l) => s + (l.estimatedBudget || 0), 0);
  const bookedCount   = (leads.booked || []).length;

  /* Source distribution for chart */
  const sourceData = useMemo(() => {
    const counts = {};
    allLeads.forEach(l => {
      const src = l.source || 'other';
      counts[src] = (counts[src] || 0) + 1;
    });
    return leadSources.map(s => ({
      source: s.value,
      label: s.label,
      value: counts[s.value] || 0
    })).filter(d => d.value > 0);
  }, [allLeads]);

  const sourceOpts = leadSources.map(s => ({ value: s.value, label: s.label }));
  const stageOpts  = stages.map(s => ({ value: s.id, label: s.label }));
  const userOpts   = users.map(u => ({ value: u._id, label: u.name }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Cormorant Garamond', serif; letter-spacing: -0.02em; }
        .font-body    { font-family: 'Inter', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="font-body bg-[#faf9f7] text-stone-900 selection:bg-stone-200 min-h-[calc(100vh-56px)] pb-8">

        {/* ── Hero Header ── */}
        <div className="bg-stone-900 py-12 sm:py-16 px-5 sm:px-8 lg:px-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#b07d46] uppercase mb-2">Lead Management</p>
              <h1 className="font-display text-4xl sm:text-5xl font-medium text-white">Leads</h1>
              <p className="text-stone-400 text-sm mt-2">{allLeads.length} total inquiries</p>
            </div>
            {isManager && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#faf9f7] text-stone-900 rounded-lg text-sm font-medium hover:bg-white transition-all self-start sm:self-auto flex-shrink-0"
              >
                <Plus className="h-4 w-4" /> New Lead
              </button>
            )}
          </div>
        </div>

        <div className="px-5 sm:px-8 lg:px-10 py-8">

          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><Sk key={i} className="h-24"/>)}</div>
              <Sk className="h-40" />
              <Sk className="h-[400px]" />
            </div>
          ) : (
            <>
              {/* ── Stats Cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Leads', value: allLeads.length, bar: 'bg-stone-300', icon: Users },
                  { label: 'Pipeline Value', value: formatCurrency(pipelineTotal), bar: 'bg-amber-700', icon: TrendingUp },
                  { label: 'Booked', value: bookedCount, bar: 'bg-teal-700', icon: Heart },
                  { label: 'Conversion', value: allLeads.length ? `${Math.round((bookedCount / allLeads.length) * 100)}%` : '0%', bar: 'bg-stone-900', icon: BarChart3 },
                ].map(m => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className="group bg-white rounded-2xl p-5 border border-stone-200/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5">
                      <div className={`h-[1px] w-6 ${m.bar} mb-4 group-hover:w-10 transition-all duration-300`} />
                      <p className="font-display text-2xl sm:text-3xl font-medium text-stone-900 leading-none">{m.value}</p>
                      <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mt-3">{m.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* ── Analytics Section (collapsible on mobile) ── */}
              <div className="mb-6">
                <button 
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400 hover:text-stone-900 mb-4 lg:hidden"
                >
                  <BarChart3 className="w-4 h-4" />
                  {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
                </button>
                
                <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${showAnalytics ? 'block' : 'hidden lg:grid'}`}>
                  {/* Lead Sources Chart */}
                  <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-sm">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-4">Lead Sources</h3>
                    {sourceData.length > 0 ? (
                      <SourceDonutChart data={sourceData} />
                    ) : (
                      <p className="text-sm text-stone-400 italic text-center py-8">No data yet</p>
                    )}
                  </div>

                  {/* Stage Funnel */}
                  <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-sm">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-4">Stage Funnel</h3>
                    <StageFunnel pipeline={leads} />
                  </div>

                  {/* Budget by Stage */}
                  <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-sm">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-4">Budget Distribution</h3>
                    <BudgetByStageChart pipeline={leads} />
                  </div>
                </div>
              </div>

              {/* ── Filters + view toggle ── */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300 pointer-events-none" />
                  <input
                    type="text" placeholder="Search leads..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 text-sm rounded-lg bg-white shadow-sm border border-stone-200/60 placeholder-stone-300 focus:outline-none focus:border-stone-400 transition-all"
                  />
                </div>

                {/* Stage filter */}
                <select
                  value={stageFilter} onChange={e => setStageFilter(e.target.value)}
                  className="py-2.5 px-4 text-sm rounded-lg bg-white shadow-sm border border-stone-200/60 text-stone-700 focus:outline-none focus:border-stone-400 appearance-none w-full sm:w-44"
                >
                  <option value="">All Stages</option>
                  {stageOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>

                {/* View toggle */}
                <div className="flex items-center gap-1 p-1 bg-white border border-stone-200/60 rounded-lg self-start sm:self-auto flex-shrink-0 shadow-sm">
                  <button
                    onClick={() => setView('table')}
                    className={`p-2 rounded-md transition-all ${view === 'table' ? 'bg-stone-900 text-[#faf9f7]' : 'text-stone-400 hover:text-stone-900'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setView('pipeline')}
                    className={`p-2 rounded-md transition-all ${view === 'pipeline' ? 'bg-stone-900 text-[#faf9f7]' : 'text-stone-400 hover:text-stone-900'}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* ════════════════════════════════
                  TABLE VIEW
              ════════════════════════════════ */}
              {view === 'table' && (
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone-100/60 bg-[#faf9f7]/50">
                          {['Name', 'Contact', 'Date', 'Budget', 'Stage', 'Source', 'Assigned', ''].map(h => (
                            <th key={h} className={`text-left px-5 py-4 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase whitespace-nowrap
                              ${h === 'Date' ? 'hidden md:table-cell' : ''}
                              ${h === 'Budget' || h === 'Source' ? 'hidden lg:table-cell' : ''}
                              ${h === 'Assigned' ? 'hidden md:table-cell' : ''}
                            `}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100/60">
                        {filtered.length > 0 ? filtered.map(lead => (
                          <tr
                            key={lead._id}
                            onClick={() => openEdit(lead)}
                            className="cursor-pointer hover:bg-[#faf9f7] transition-all group"
                          >
                            {/* Name */}
                            <td className="px-5 py-4">
                              <span className="font-medium text-stone-900 text-sm flex items-center gap-2">
                                {lead.name}
                                {lead.isPriority && <Heart className="w-3 h-3 text-amber-700 fill-amber-700" />}
                              </span>
                            </td>

                            {/* Contact */}
                            <td className="px-5 py-4">
                              <div className="space-y-0.5">
                                {lead.phone && <p className="text-sm text-stone-600">{lead.phone}</p>}
                                {lead.email && <p className="text-xs text-stone-400 truncate max-w-[150px]">{lead.email}</p>}
                              </div>
                            </td>

                            {/* Wedding Date */}
                            <td className="px-5 py-4 text-sm text-stone-600 hidden md:table-cell whitespace-nowrap">
                              {lead.weddingDate ? formatDate(lead.weddingDate) : <span className="text-stone-300">—</span>}
                            </td>

                            {/* Budget */}
                            <td className="px-5 py-4 text-sm font-medium text-stone-900 hidden lg:table-cell whitespace-nowrap">
                              {lead.estimatedBudget ? formatCurrency(lead.estimatedBudget) : <span className="text-stone-300">—</span>}
                            </td>

                            {/* Stage */}
                            <td className="px-5 py-4">
                              <StagePill stage={lead.stage} />
                            </td>

                            {/* Source */}
                            <td className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] uppercase text-stone-400 hidden lg:table-cell">
                              {leadSources.find(s => s.value === lead.source)?.label || lead.source}
                            </td>

                            {/* Assigned */}
                            <td className="px-5 py-4 hidden md:table-cell">
                              {lead.assignedTo ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full border border-stone-200/60 bg-stone-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-medium text-stone-600">
                                      {lead.assignedTo.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-xs text-stone-500 truncate max-w-[80px]">{lead.assignedTo.name?.split(' ')[0]}</span>
                                </div>
                              ) : <span className="text-stone-300 text-xs">—</span>}
                            </td>

                            {/* Arrow */}
                            <td className="px-5 py-4 text-right">
                              <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-900 transition-colors inline-block" />
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={8} className="px-5 py-16 text-center">
                              <p className="text-stone-400 italic text-sm">No leads found</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ════════════════════════════════
                  PIPELINE / KANBAN VIEW
              ════════════════════════════════ */}
              {view === 'pipeline' && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5">
                    <SortableContext items={stages.map(s => s.id)}>
                      {stages.map(stage => (
                        <KanbanColumn
                          key={stage.id}
                          stage={stage}
                          leads={leads[stage.id] || []}
                          onLeadClick={openEdit}
                        />
                      ))}
                    </SortableContext>
                  </div>
                </DndContext>
              )}
            </>
          )}
        </div>
      </div>

      {/* ════════════════════════════════
          LEAD MODAL (create / edit)
      ════════════════════════════════ */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={selectedLead ? 'Edit Lead' : 'New Lead'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <Field label="Client Name">
              <TextInput
                type="text" value={form.name} placeholder="e.g. Eleanor & James" required
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </Field>
            <Field label="Contact Phone">
              <TextInput
                type="tel" value={form.phone} placeholder="+1 555 000 0000" required
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Email Address">
              <TextInput
                type="email" value={form.email} placeholder="client@example.com"
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </Field>
            <Field label="Discovery Source">
              <SelectInput
                value={form.source} options={sourceOpts}
                onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-5 border-t border-stone-100/60 pt-5">
            <Field label="Target Budget">
              <TextInput
                type="number" value={form.estimatedBudget} placeholder="100000"
                onChange={e => setForm(f => ({ ...f, estimatedBudget: e.target.value }))}
              />
            </Field>
            <Field label="Preferred Date">
              <TextInput
                type="date" value={form.weddingDate}
                onChange={e => setForm(f => ({ ...f, weddingDate: e.target.value }))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Venue Preference">
              <TextInput
                type="text" value={form.venue} placeholder="Venue name"
                onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
              />
            </Field>
            <Field label="Estimated Guests">
              <TextInput
                type="number" value={form.guestCount} placeholder="150"
                onChange={e => setForm(f => ({ ...f, guestCount: e.target.value }))}
              />
            </Field>
          </div>

          {isManager && (
            <Field label="Assigned To">
              <SelectInput
                value={form.assignedTo}
                options={[{ value: '', label: 'Select team member' }, ...userOpts]}
                onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
              />
            </Field>
          )}

          <Field label="Notes">
            <TextareaInput
              value={form.notes} placeholder="Additional notes..." rows={3}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </Field>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-stone-200/60 mt-4">
            <button type="button" onClick={closeModal}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-900 border border-stone-200/60 hover:border-stone-400 transition-all">
              Cancel
            </button>
            {selectedLead && selectedLead.stage !== 'booked' && isManager && (
              <button type="button" onClick={handleConvert}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 transition-all border border-teal-200/60">
                Convert to Wedding
              </button>
            )}
            <button type="submit"
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-stone-900 text-[#faf9f7] hover:bg-stone-800 transition-all">
              {selectedLead ? 'Save' : 'Create Lead'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}