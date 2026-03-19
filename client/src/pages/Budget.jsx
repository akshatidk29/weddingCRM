import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/Loader';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Edit, Calendar, PiggyBank } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

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

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Budget & Payments</h1>
          <p className="text-gray-400">Track all financial payments and receivables</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'partial', label: 'Partially Paid' },
              { value: 'completed', label: 'Completed' }
            ]}
          />
        </div>
      </div>

      {/* Wedding Budget Summary Cards */}
      {weddingBudgets.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-purple-400" />
            Wedding Budgets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weddingBudgets.map(wb => {
              const spentPercent = wb.estimatedBudget > 0 ? Math.min(100, Math.round((wb.totalSpent / wb.estimatedBudget) * 100)) : 0;
              const isOverBudget = wb.totalSpent > wb.estimatedBudget;

              return (
                <Card key={wb._id} glow>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{wb.name}</h3>
                        {wb.weddingDate && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {formatDate(wb.weddingDate)}
                          </p>
                        )}
                      </div>
                      <Badge variant={isOverBudget ? 'danger' : spentPercent > 75 ? 'warning' : 'success'} size="sm">
                        {spentPercent}% used
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Estimated</span>
                        <span className="text-white font-medium">{formatCurrency(wb.estimatedBudget)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Allocated</span>
                        <span className="text-yellow-400">{formatCurrency(wb.totalAllocated)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Spent (Paid)</span>
                        <span className="text-red-400">{formatCurrency(wb.totalSpent)}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full transition-all ${isOverBudget ? 'bg-red-500' : spentPercent > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(spentPercent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm pt-1 border-t border-white/[0.06]">
                        {isTeamMember ? (
                          <>
                            <span className="text-gray-400">Remaining After Payments</span>
                            <span className={`font-semibold ${wb.remainingAfterPayments >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(wb.remainingAfterPayments)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-gray-400">Remaining (Unallocated)</span>
                            <span className={`font-semibold ${wb.remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(wb.remaining)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Volume</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(summary.total)}</p>
              </div>
              <Wallet className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Paid</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(summary.paid)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{formatCurrency(summary.pending)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                {isTeamMember ? (
                  <>
                    <p className="text-sm text-gray-400">Est. Budget Remaining</p>
                    <p className={`text-2xl font-bold ${
                      weddingBudgets.reduce((sum, wb) => sum + wb.remainingAfterPayments, 0) >= 0 
                        ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(weddingBudgets.reduce((sum, wb) => sum + wb.remainingAfterPayments, 0))}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-400">Net Flow</p>
                    <p className={`text-2xl font-bold ${summary.receivable > summary.payable ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(summary.receivable - summary.payable)}
                    </p>
                  </>
                )}
              </div>
              <TrendingDown className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No budget records found.</div>
          ) : (
            <div className="divide-y divide-white/[0.06] overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Item</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Sender / Recipient</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Total Amount</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Amount Paid</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Pending</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredItems.map(item => {
                    const absAmount = Math.abs(item.amount);
                    const absPaid = Math.abs(item.paidAmount);
                    const isIncome = item.amount < 0; // If amount is negative, user is requesting money
                    
                    let sender = isIncome ? item.recipient : 'Us (Client)';
                    let receiver = isIncome ? 'Us (Client)' : item.recipient;

                    return (
                      <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.taskTitle} • {item.wedding?.name}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-300">From: {sender}</span>
                            <span className="text-sm text-gray-300">To: {receiver}</span>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-white">
                          <span className={isIncome ? 'text-green-400' : 'text-red-400'}>
                            {formatCurrency(absAmount)}
                          </span>
                        </td>
                        <td className="p-4 text-gray-300">{formatCurrency(absPaid)}</td>
                        <td className="p-4 text-gray-300">{formatCurrency(absAmount - absPaid)}</td>
                        <td className="p-4">
                          <Badge 
                            variant={item.paymentStatus === 'completed' ? 'success' : item.paymentStatus === 'partial' ? 'warning' : 'danger'}
                          >
                            {item.paymentStatus}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
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
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Update Payment Record">
        {editingItem && (
          <form onSubmit={handleUpdatePayment} className="space-y-4">
            <div className="bg-white/[0.02] p-4 rounded-xl space-y-2 border border-white/[0.06]">
              <p className="text-sm text-gray-400">Total Target Amount: <strong className="text-white">{Math.abs(editingItem.amount)}</strong></p>
              <p className="text-sm text-gray-400">Current Paid/Received: <strong className="text-white">{Math.abs(editingItem.paidAmount)}</strong></p>
            </div>
            
            <Input
              label={editingItem.amount < 0 ? "Total amount received so far:" : "Total amount paid so far:"}
              type="number"
              step="0.01"
              value={paidAmountData}
              onChange={(e) => setPaidAmountData(e.target.value)}
              required
            />
            
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1">Save Payment</Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
