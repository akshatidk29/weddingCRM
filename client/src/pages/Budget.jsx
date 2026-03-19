import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Edit, Calendar, PiggyBank, X } from 'lucide-react';
import { PageContainer, PageHeader, PageSection, SectionCard, StatCard, EmptyState } from '../components/layout/PageContainer';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Design system components
function Button({ children, variant = 'primary', onClick, type = 'button', disabled, className = '' }) {
  const variants = {
    primary: 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm',
    secondary: 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50',
  };
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Input({ label, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase mb-2">{label}</label>}
      <input {...props} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5 transition-all" />
    </div>
  );
}

function Select({ label, options, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase mb-2">{label}</label>}
      <select {...props} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5 transition-all appearance-none">
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h2 className="font-display text-xl font-bold text-stone-900">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-600' },
    partial: { bg: 'bg-blue-50', text: 'text-blue-600' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-600' }
  };
  const { bg, text } = config[status] || config.pending;
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${bg} ${text}`}>{status}</span>;
}

export default function Budget() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [weddingBudgets, setWeddingBudgets] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0, receivable: 0, payable: 0 });
  const [filter, setFilter] = useState({ status: '', type: '' });
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [paidAmountData, setPaidAmountData] = useState('');

  const isTeamMember = userRole === 'team_member' || user?.role === 'team_member';

  useEffect(() => {
    loadBudget();
  }, []);

  const loadBudget = async () => {
    try {
      const res = await api.get('/budget');
      const data = res.data.budget || res.data.data || [];
      setItems(data);
      setWeddingBudgets(res.data.weddingBudgets || []);
      setUserRole(res.data.userRole || user?.role || '');
      calculateSummary(data);
    } catch (error) {
      console.error('Failed to load budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    let total = 0, paid = 0, pending = 0, receivable = 0, payable = 0;
    data.forEach(item => {
      // If amount > 0, it's an expense (payable)
      // If amount < 0, it's income (receivable)
      if (item.amount > 0) payable += item.amount;
      else if (item.amount < 0) receivable += Math.abs(item.amount);

      total += Math.abs(item.amount);
      paid += Math.abs(item.paidAmount);
      pending += Math.abs(item.amount) - Math.abs(item.paidAmount);
    });
    setSummary({ total, paid, pending, receivable, payable });
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setPaidAmountData(item.paidAmount.toString());
    setShowModal(true);
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      await api.put(`/tasks/${editingItem.taskId}/payment/${editingItem.type}/${editingItem._id}`, {
        paidAmount: Number(paidAmountData)
      });
      setShowModal(false);
      loadBudget();
    } catch (error) {
      console.error('Failed to update payment:', error);
      alert('Failed to update payment');
    }
  };

  const formatCurrency = (val) => {
    const isNeg = val < 0;
    return `${isNeg ? '-' : ''}$${Math.abs(val).toLocaleString()}`;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredItems = items.filter(i => {
    if (filter.status && i.paymentStatus !== filter.status) return false;
    if (filter.type && i.type !== filter.type) return false;
    return true;
  });

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-stone-900 border-t-transparent rounded-full" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Budget & Payments"
        subtitle="Track all financial payments and receivables across your weddings"
        actions={
          <Select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'partial', label: 'Partially Paid' },
              { value: 'completed', label: 'Completed' }
            ]}
            className="w-44"
          />
        }
      />

      {/* Summary Stats */}
      <PageSection>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Total Volume"
            value={formatCurrency(summary.total)}
            icon={Wallet}
          />
          <StatCard 
            label="Total Paid"
            value={formatCurrency(summary.paid)}
            icon={DollarSign}
            trend="up"
          />
          <StatCard 
            label="Total Pending"
            value={formatCurrency(summary.pending)}
            icon={TrendingUp}
          />
          <StatCard 
            label={isTeamMember ? "Budget Remaining" : "Net Flow"}
            value={isTeamMember 
              ? formatCurrency(weddingBudgets.reduce((sum, wb) => sum + wb.remainingAfterPayments, 0))
              : formatCurrency(summary.receivable - summary.payable)
            }
            icon={TrendingDown}
            trend={(isTeamMember ? weddingBudgets.reduce((sum, wb) => sum + wb.remainingAfterPayments, 0) : summary.receivable - summary.payable) >= 0 ? 'up' : 'down'}
          />
        </div>
      </PageSection>

      {/* Wedding Budget Summary Cards */}
      {weddingBudgets.length > 0 && (
        <PageSection title="Wedding Budgets" subtitle="Budget breakdown by wedding">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weddingBudgets.map(wb => {
              const spentPercent = wb.estimatedBudget > 0 ? Math.min(100, Math.round((wb.totalSpent / wb.estimatedBudget) * 100)) : 0;
              const isOverBudget = wb.totalSpent > wb.estimatedBudget;

              return (
                <SectionCard key={wb._id} padding="md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-stone-900">{wb.name}</h3>
                      {wb.weddingDate && (
                        <p className="text-xs text-stone-400 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(wb.weddingDate)}
                        </p>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                      isOverBudget ? 'bg-rose-50 text-rose-600' : 
                      spentPercent > 75 ? 'bg-amber-50 text-amber-600' : 
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {spentPercent}% used
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-400">Estimated</span>
                      <span className="text-stone-900 font-medium">{formatCurrency(wb.estimatedBudget)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-400">Allocated</span>
                      <span className="text-amber-600">{formatCurrency(wb.totalAllocated)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-400">Spent (Paid)</span>
                      <span className="text-rose-500">{formatCurrency(wb.totalSpent)}</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isOverBudget ? 'bg-rose-500' : 
                          spentPercent > 75 ? 'bg-amber-500' : 
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(spentPercent, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-stone-100 mt-2">
                      <span className="text-stone-400">
                        {isTeamMember ? 'Remaining After Payments' : 'Remaining (Unallocated)'}
                      </span>
                      <span className={`font-semibold ${
                        (isTeamMember ? wb.remainingAfterPayments : wb.remaining) >= 0 
                          ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {formatCurrency(isTeamMember ? wb.remainingAfterPayments : wb.remaining)}
                      </span>
                    </div>
                  </div>
                </SectionCard>
              );
            })}
          </div>
        </PageSection>
      )}

      {/* Payment Items Table */}
      <PageSection title="Payment Records" subtitle="All payments and receivables">
        <SectionCard padding="none">
          {filteredItems.length === 0 ? (
            <EmptyState 
              icon={DollarSign}
              title="No budget records found"
              description="Payment records will appear here once you add tasks with budgets"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Item</th>
                    <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase hidden md:table-cell">Flow</th>
                    <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Total</th>
                    <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase hidden sm:table-cell">Paid</th>
                    <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase hidden lg:table-cell">Pending</th>
                    <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Status</th>
                    <th className="p-4 text-right text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {filteredItems.map(item => {
                    const absAmount = Math.abs(item.amount);
                    const absPaid = Math.abs(item.paidAmount);
                    const isIncome = item.amount < 0;
                    
                    let sender = isIncome ? item.recipient : 'Us (Client)';
                    let receiver = isIncome ? 'Us (Client)' : item.recipient;

                    return (
                      <tr key={item._id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-4">
                          <p className="text-stone-900 font-medium">{item.name}</p>
                          <p className="text-xs text-stone-400 mt-0.5">{item.taskTitle} • {item.wedding?.name}</p>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <div className="text-xs text-stone-500">
                            <p>From: {sender}</p>
                            <p>To: {receiver}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`font-semibold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(absAmount)}
                          </span>
                        </td>
                        <td className="p-4 text-stone-600 hidden sm:table-cell">{formatCurrency(absPaid)}</td>
                        <td className="p-4 text-stone-600 hidden lg:table-cell">{formatCurrency(absAmount - absPaid)}</td>
                        <td className="p-4">
                          <StatusBadge status={item.paymentStatus} />
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-2.5 hover:bg-stone-100 rounded-xl text-stone-400 hover:text-stone-700 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </PageSection>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Update Payment Record">
        {editingItem && (
          <form onSubmit={handleUpdatePayment} className="space-y-4">
            <div className="bg-stone-50 p-4 rounded-xl space-y-2 border border-stone-100">
              <p className="text-sm text-stone-500">Total Target Amount: <strong className="text-stone-900">{formatCurrency(Math.abs(editingItem.amount))}</strong></p>
              <p className="text-sm text-stone-500">Current Paid/Received: <strong className="text-stone-900">{formatCurrency(Math.abs(editingItem.paidAmount))}</strong></p>
            </div>
            
            <Input
              label={editingItem.amount < 0 ? "Total amount received so far" : "Total amount paid so far"}
              type="number"
              step="0.01"
              value={paidAmountData}
              onChange={(e) => setPaidAmountData(e.target.value)}
              required
            />
            
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1">Save Payment</Button>
            </div>
          </form>
        )}
      </Modal>
    </PageContainer>
  );
}
