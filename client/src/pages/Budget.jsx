import { useState, useEffect } from 'react';
import { X, Edit, Calendar, ChevronDown } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useBudgetStore from '../stores/budgetStore';

/* ─────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────── */
const inputCls = "w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5 transition-all";
const labelCls = "block text-[10px] font-semibold tracking-[0.18em] text-stone-400 uppercase mb-2";

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#faf9f7] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 flex-shrink-0">
          <h2 className="font-display text-xl font-bold text-stone-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PAYMENT STATUS
───────────────────────────────────────── */
const paymentMeta = {
  pending:   { dot: 'bg-amber-400',   text: 'text-amber-600',   label: 'Pending' },
  partial:   { dot: 'bg-sky-400',     text: 'text-sky-600',     label: 'Partial' },
  completed: { dot: 'bg-emerald-400', text: 'text-emerald-600', label: 'Done' },
};

function PaymentDot({ status }) {
  const m = paymentMeta[status] || paymentMeta.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function Sk({ className = '' }) {
  return <div className={`bg-stone-100 animate-pulse rounded-xl ${className}`} />;
}

/* ─────────────────────────────────────────
   FORMAT
───────────────────────────────────────── */
function fc(val) { return `₹${Math.abs(val).toLocaleString('en-IN')}`; }
function fd(d)   { if (!d) return ''; return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }); }

/* ─────────────────────────────────────────
   SIMPLE BAR CHART (pure CSS, no recharts)
───────────────────────────────────────── */
function BarChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <span className="text-[9px] text-stone-400 font-medium">{fc(d.value)}</span>
          <div
            className={`w-full rounded-t-lg transition-all duration-700 ${d.color}`}
            style={{ height: `${Math.max(4, (d.value / max) * 80)}px` }}
          />
          <span className="text-[9px] text-stone-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   DONUT CHART (SVG)
───────────────────────────────────────── */
function DonutChart({ paid, pending, size = 100 }) {
  const total = paid + pending;
  if (total === 0) return null;
  const paidPct = paid / total;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const paidDash = circ * paidPct;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f5f4f2" strokeWidth={10} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#34d399" strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={circ - paidDash} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold text-stone-900">{Math.round(paidPct * 100)}%</span>
        <span className="text-[9px] text-stone-400">paid</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function Budget() {
  const user = useAuthStore((s) => s.user);
  const { allItems, weddingBudgets, loading, fetchBudget, updatePayment } = useBudgetStore();
  const [userRole, setUserRole] = useState('');

  // Selected wedding
  const [selectedId, setSelectedId] = useState('');

  // Filters within selected wedding
  const [statusFilter, setStatusFilter] = useState('');

  // Payment modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [paidAmountData, setPaidAmountData] = useState('');

  const isTeamMember = userRole === 'team_member' || user?.role === 'team_member';

  const loadBudget = async () => {
    const data = await fetchBudget();
    setUserRole(data?.userRole || user?.role || '');
    if (data?.weddingBudgets?.length) setSelectedId(data.weddingBudgets[0]._id);
  };

  useEffect(() => { loadBudget(); }, []);

  const openEdit = (item) => {
    setEditingItem(item);
    setPaidAmountData(item.paidAmount.toString());
    setShowModal(true);
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    await updatePayment(editingItem.taskId, editingItem.type, editingItem._id, {
      paidAmount: Number(paidAmountData)
    });
    setShowModal(false);
  };

  /* ── Derived data for selected wedding ── */
  const selectedWedding = weddingBudgets.find(wb => wb._id === selectedId);
  const weddingItems    = allItems.filter(i => i.wedding?._id === selectedId || i.wedding === selectedId);
  const filteredItems   = weddingItems.filter(i => !statusFilter || i.paymentStatus === statusFilter);

  /* Summary for selected wedding */
  const weddingSummary = weddingItems.reduce((acc, item) => {
    const abs = Math.abs(item.amount);
    const paid = Math.abs(item.paidAmount);
    acc.total   += abs;
    acc.paid    += paid;
    acc.pending += abs - paid;
    if (item.amount > 0) acc.payable    += abs;
    else                 acc.receivable += abs;
    return acc;
  }, { total: 0, paid: 0, pending: 0, payable: 0, receivable: 0 });

  /* Payment status breakdown for bar chart */
  const statusBreakdown = [
    { label: 'Paid',    value: weddingSummary.paid,    color: 'bg-emerald-400' },
    { label: 'Pending', value: weddingSummary.pending, color: 'bg-amber-400' },
    { label: 'Payable', value: weddingSummary.payable, color: 'bg-rose-400' },
    { label: 'Receivable', value: weddingSummary.receivable, color: 'bg-sky-400' },
  ].filter(d => d.value > 0);

  /* Budget allocation: estimated vs allocated vs spent */
  const budgetBars = selectedWedding ? [
    { label: 'Estimated', value: selectedWedding.estimatedBudget, color: 'bg-stone-300' },
    { label: 'Allocated',  value: selectedWedding.totalAllocated, color: 'bg-amber-400' },
    { label: 'Spent',      value: selectedWedding.totalSpent,     color: 'bg-rose-400' },
  ].filter(d => d.value > 0) : [];

  const spentPct  = selectedWedding?.estimatedBudget > 0
    ? Math.min(100, Math.round((selectedWedding.totalSpent / selectedWedding.estimatedBudget) * 100))
    : 0;
  const isOver    = selectedWedding && selectedWedding.totalSpent > selectedWedding.estimatedBudget;
  const remaining = selectedWedding
    ? (isTeamMember ? selectedWedding.remainingAfterPayments : selectedWedding.remaining)
    : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=Outfit:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-body    { font-family: 'Outfit', sans-serif; }
      `}</style>

      <div className="font-body min-h-screen bg-[#faf9f7]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-10">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.22em] text-rose-400 uppercase mb-2">Finance</p>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-stone-900">Budget</h1>
              <p className="text-stone-400 text-sm mt-2">Track payments and finances for each wedding.</p>
            </div>

            {/* Wedding selector */}
            {!loading && weddingBudgets.length > 0 && (
              <div className="relative self-start sm:self-auto">
                <select
                  value={selectedId}
                  onChange={e => { setSelectedId(e.target.value); setStatusFilter(''); }}
                  className="appearance-none pl-4 pr-10 py-3 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:border-stone-400 transition-all min-w-[200px] cursor-pointer"
                >
                  {weddingBudgets.map(wb => (
                    <option key={wb._id} value={wb._id}>{wb.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><Sk key={i} className="h-28"/>)}</div>
              <div className="grid lg:grid-cols-2 gap-6"><Sk className="h-60"/><Sk className="h-60"/></div>
              <Sk className="h-96" />
            </div>
          ) : weddingBudgets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-100 py-20 text-center">
              <p className="text-stone-300 text-sm">No budget data yet</p>
              <p className="text-xs text-stone-300 mt-1">Add tasks with budgets to see financial data here</p>
            </div>
          ) : (
            <>
              {/* ── Wedding date ── */}
              {selectedWedding?.weddingDate && (
                <p className="text-xs text-stone-400 flex items-center gap-1.5 mb-6 -mt-4">
                  <Calendar className="w-3.5 h-3.5" />
                  {fd(selectedWedding.weddingDate)}
                </p>
              )}

              {/* ── Summary strip ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone-100 rounded-2xl overflow-hidden border border-stone-100 mb-8">
                {[
                  { label: 'Total Volume', value: fc(weddingSummary.total),   bar: 'bg-stone-400' },
                  { label: 'Paid',         value: fc(weddingSummary.paid),    bar: 'bg-emerald-400' },
                  { label: 'Pending',      value: fc(weddingSummary.pending), bar: 'bg-amber-400' },
                  {
                    label: isTeamMember ? 'Remaining' : 'Net Flow',
                    value: fc(remaining),
                    bar:   remaining >= 0 ? 'bg-emerald-400' : 'bg-rose-400',
                    color: remaining >= 0 ? 'text-emerald-600' : 'text-rose-500',
                  },
                ].map(m => (
                  <div key={m.label} className="bg-white px-5 py-5">
                    <div className={`h-0.5 w-5 rounded-full ${m.bar} mb-3`} />
                    <p className={`font-display text-2xl sm:text-3xl font-bold leading-none ${m.color || 'text-stone-900'}`}>{m.value}</p>
                    <p className="text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase mt-2">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* ── Charts row ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                {/* Budget allocation bar chart */}
                {selectedWedding && (
                  <div className="bg-white rounded-2xl border border-stone-100 p-6">
                    <div className="mb-5">
                      <p className={labelCls}>Budget Allocation</p>
                      <p className="text-xs text-stone-400">Estimated vs allocated vs spent</p>
                    </div>
                    <BarChart data={budgetBars} />
                    {/* Spent % bar */}
                    <div className="mt-5 pt-5 border-t border-stone-50">
                      <div className="flex items-center justify-between mb-2 text-xs">
                        <span className="text-stone-400">Budget used</span>
                        <span className={`font-bold ${isOver ? 'text-rose-500' : spentPct > 75 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {spentPct}%{isOver ? ' — over budget' : ''}
                        </span>
                      </div>
                      <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-rose-400' : spentPct > 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{ width: `${Math.min(spentPct, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-3 text-xs text-stone-400">
                        <span>Remaining: <span className={`font-semibold ${remaining >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{fc(remaining)}</span></span>
                        <span>Estimated: <span className="font-semibold text-stone-700">{fc(selectedWedding.estimatedBudget)}</span></span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment flow donut + breakdown */}
                <div className="bg-white rounded-2xl border border-stone-100 p-6">
                  <div className="mb-5">
                    <p className={labelCls}>Payment Flow</p>
                    <p className="text-xs text-stone-400">Paid vs pending breakdown</p>
                  </div>

                  {weddingSummary.total > 0 ? (
                    <div className="flex items-center gap-6">
                      <DonutChart paid={weddingSummary.paid} pending={weddingSummary.pending} size={96} />
                      <div className="flex-1 space-y-3">
                        {statusBreakdown.map(d => (
                          <div key={d.label}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${d.color}`} />
                                <span className="text-xs text-stone-500">{d.label}</span>
                              </div>
                              <span className="text-xs font-semibold text-stone-800">{fc(d.value)}</span>
                            </div>
                            <div className="h-0.5 bg-stone-100 rounded-full overflow-hidden">
                              <div className={`h-full ${d.color} rounded-full`}
                                style={{ width: `${Math.round((d.value / weddingSummary.total) * 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-stone-300 text-sm text-center py-8">No payment data</p>
                  )}
                </div>
              </div>

              {/* ── Payment records ── */}
              <div>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.22em] text-rose-400 uppercase mb-1">Records</p>
                    <h2 className="font-display text-2xl font-bold text-stone-900">Payments</h2>
                  </div>
                  <select
                    value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="py-2.5 px-4 text-xs rounded-xl bg-white border border-stone-200 text-stone-600 focus:outline-none focus:border-stone-400 appearance-none"
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-stone-100 py-16 text-center">
                    <p className="text-stone-300 text-sm">No records{statusFilter ? ' matching this filter' : ' for this wedding'}</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-stone-50">
                            {['Item', 'Flow', 'Total', 'Paid', 'Pending', 'Status', ''].map((h, i) => (
                              <th key={h+i} className={`text-left px-5 py-4 text-[10px] font-semibold tracking-[0.18em] text-stone-400 uppercase whitespace-nowrap
                                ${h === 'Flow'    ? 'hidden md:table-cell' : ''}
                                ${h === 'Paid'    ? 'hidden sm:table-cell' : ''}
                                ${h === 'Pending' ? 'hidden lg:table-cell' : ''}
                              `}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                          {filteredItems.map(item => {
                            const absAmt    = Math.abs(item.amount);
                            const absPaid   = Math.abs(item.paidAmount);
                            const isIncome  = item.amount < 0;
                            const leftover  = absAmt - absPaid;
                            const pct       = absAmt > 0 ? Math.round((absPaid / absAmt) * 100) : 0;

                            return (
                              <tr key={item._id} className="hover:bg-stone-50/70 transition-colors group">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-0.5 h-7 rounded-full flex-shrink-0 ${isIncome ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                    <div>
                                      <p className="font-medium text-stone-900 text-sm">{item.name}</p>
                                      <p className="text-xs text-stone-400 mt-0.5">{item.taskTitle}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4 hidden md:table-cell">
                                  <div className="text-xs text-stone-400 space-y-0.5">
                                    <p>From: {isIncome ? item.recipient : 'Client'}</p>
                                    <p>To: {isIncome ? 'Client' : item.recipient}</p>
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <span className={`text-sm font-semibold ${isIncome ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {fc(absAmt)}
                                  </span>
                                </td>
                                <td className="px-5 py-4 hidden sm:table-cell">
                                  <div>
                                    <p className="text-sm text-stone-700">{fc(absPaid)}</p>
                                    <div className="w-16 h-0.5 bg-stone-100 rounded-full mt-1.5 overflow-hidden">
                                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-sm text-stone-500 hidden lg:table-cell">
                                  {leftover > 0 ? fc(leftover) : <span className="text-emerald-500 text-xs font-semibold">Settled</span>}
                                </td>
                                <td className="px-5 py-4">
                                  <PaymentDot status={item.paymentStatus} />
                                </td>
                                <td className="px-5 py-4">
                                  <button onClick={() => openEdit(item)}
                                    className="p-1.5 rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-all opacity-0 group-hover:opacity-100">
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ════════ MODAL ════════ */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Update Payment">
        {editingItem && (
          <form onSubmit={handleUpdatePayment} className="space-y-4">
            <div className="bg-white rounded-xl border border-stone-100 p-4 space-y-3">
              <p className="font-medium text-stone-800 text-sm">{editingItem.name}</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Target amount</span>
                  <span className="font-semibold text-stone-800">{fc(Math.abs(editingItem.amount))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Currently {editingItem.amount < 0 ? 'received' : 'paid'}</span>
                  <span className="font-semibold text-stone-800">{fc(Math.abs(editingItem.paidAmount))}</span>
                </div>
              </div>
              {editingItem.amount !== 0 && (
                <div className="h-0.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((Math.abs(editingItem.paidAmount) / Math.abs(editingItem.amount)) * 100))}%` }} />
                </div>
              )}
            </div>

            <div>
              <label className={labelCls}>{editingItem.amount < 0 ? 'Total received so far' : 'Total paid so far'}</label>
              <input type="number" step="0.01" required value={paidAmountData}
                onChange={e => setPaidAmountData(e.target.value)} className={inputCls} placeholder="0" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <button type="button" onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-400 transition-all">
                Cancel
              </button>
              <button type="submit"
                className="px-7 py-2.5 rounded-full text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-all hover:shadow-md">
                Save
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}