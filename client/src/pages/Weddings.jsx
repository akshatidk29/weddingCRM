import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, MapPin, Users, ChevronRight, Heart, X } from 'lucide-react';
import { PageContainer, PageHeader, PageSection, SectionCard, EmptyState } from '../components/layout/PageContainer';
import { formatDate, formatCurrency, daysUntil } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Design system components
function Button({ children, variant = 'primary', icon: Icon, onClick, type = 'button', disabled, className = '' }) {
  const variants = {
    primary: 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm',
    secondary: 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50',
  };
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
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

function Textarea({ label, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase mb-2">{label}</label>}
      <textarea {...props} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5 transition-all resize-none" />
    </div>
  );
}

function Modal({ isOpen, onClose, title, size = 'md', children }) {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h2 className="font-display text-xl font-bold text-stone-900">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)]">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ children }) {
  return <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-stone-100">{children}</div>;
}

function StatusBadge({ status }) {
  const config = {
    planning: { bg: 'bg-blue-50', text: 'text-blue-600' },
    in_progress: { bg: 'bg-amber-50', text: 'text-amber-600' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    cancelled: { bg: 'bg-rose-50', text: 'text-rose-600' }
  };
  const { bg, text } = config[status] || config.planning;
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${bg} ${text}`}>{status.replace('_', ' ')}</span>;
}

function ProgressBar({ value }) {
  return (
    <div className="w-full bg-stone-100 rounded-full h-1.5">
      <div 
        className="bg-stone-900 h-1.5 rounded-full transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

const statusConfig = {
  planning: { label: 'Planning' },
  in_progress: { label: 'In Progress' },
  completed: { label: 'Completed' },
  cancelled: { label: 'Cancelled' }
};

export default function Weddings() {
  const { isManager } = useAuth();
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWedding, setEditingWedding] = useState(null);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    weddingDate: '',
    endDate: '',
    venue: { name: '', address: '', city: '' },
    guestCount: '',
    budget: { estimated: '' },
    relationshipManager: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [weddingsRes, usersRes] = await Promise.all([
        api.get('/weddings'),
        api.get('/auth/users')
      ]);
      setWeddings(weddingsRes.data.weddings);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        budget: { estimated: Number(formData.budget.estimated) || 0 },
        guestCount: Number(formData.guestCount) || 0
      };
      
      if (editingWedding) {
        await api.put(`/weddings/${editingWedding._id}`, payload);
      } else {
        await api.post('/weddings', payload);
      }
      loadData();
      closeModal();
    } catch (error) {
      console.error('Failed to save wedding:', error);
    }
  };

  const handleEdit = (wedding, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setEditingWedding(wedding);
    setFormData({
      name: wedding.name,
      clientName: wedding.clientName,
      clientEmail: wedding.clientEmail || '',
      clientPhone: wedding.clientPhone || '',
      weddingDate: wedding.weddingDate?.split('T')[0] || '',
      endDate: wedding.endDate?.split('T')[0] || '',
      venue: wedding.venue || { name: '', address: '', city: '' },
      guestCount: wedding.guestCount || '',
      budget: { estimated: wedding.budget?.estimated || '' },
      relationshipManager: wedding.relationshipManager?._id || '',
      notes: wedding.notes || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWedding(null);
    setFormData({
      name: '', clientName: '', clientEmail: '', clientPhone: '',
      weddingDate: '', endDate: '', venue: { name: '', address: '', city: '' },
      guestCount: '', budget: { estimated: '' }, relationshipManager: '', notes: ''
    });
  };

  const filteredWeddings = weddings.filter(w => {
    const matchesFilter = filter === 'all' || w.status === filter;
    const matchesSearch = !searchQuery || 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const userOptions = users
    .filter(u => u.role !== 'team_member')
    .map(u => ({ value: u._id, label: u.name }));

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
        title="Weddings"
        subtitle="Manage all your wedding events and track their progress"
        actions={
          isManager && (
            <Button icon={Plus} onClick={() => setShowModal(true)}>
              New Wedding
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search weddings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 p-1.5 bg-stone-100 rounded-xl">
          {['all', 'planning', 'in_progress', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === status
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {status === 'all' ? 'All' : statusConfig[status]?.label || status}
            </button>
          ))}
        </div>
      </div>

      {/* Weddings Grid/Table */}
      {filteredWeddings.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Heart}
            title="No weddings found"
            description="Create your first wedding to get started planning"
            action={
              isManager && (
                <Button icon={Plus} onClick={() => setShowModal(true)}>
                  New Wedding
                </Button>
              )
            }
          />
        </SectionCard>
      ) : (
        <SectionCard padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Wedding</th>
                  <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Date</th>
                  <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase hidden lg:table-cell">Venue</th>
                  <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase hidden md:table-cell">Guests</th>
                  <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase hidden lg:table-cell">Budget</th>
                  <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase hidden sm:table-cell">Progress</th>
                  <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredWeddings.map((wedding) => {
                  const days = daysUntil(wedding.weddingDate);
                  const isUrgent = days !== null && days >= 0 && days <= 7;

                  return (
                    <tr 
                      key={wedding._id}
                      onClick={() => window.location.href = `/weddings/${wedding._id}`}
                      className="cursor-pointer hover:bg-stone-50 transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-stone-900">{wedding.name}</p>
                          <p className="text-sm text-stone-400 mt-0.5">{wedding.clientName}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-stone-400" />
                          <div>
                            <p className={`text-sm ${isUrgent ? 'text-amber-600 font-medium' : 'text-stone-600'}`}>
                              {formatDate(wedding.weddingDate)}
                            </p>
                            {days !== null && days >= 0 && (
                              <p className="text-xs text-stone-400">
                                {days === 0 ? 'Today' : `${days} days left`}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        {wedding.venue?.name ? (
                          <div className="flex items-center gap-2 text-sm text-stone-600">
                            <MapPin className="h-4 w-4 text-stone-400" />
                            <span>{wedding.venue.name}{wedding.venue.city && `, ${wedding.venue.city}`}</span>
                          </div>
                        ) : <span className="text-stone-300">-</span>}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {wedding.guestCount > 0 ? (
                          <div className="flex items-center gap-2 text-sm text-stone-600">
                            <Users className="h-4 w-4 text-stone-400" />
                            <span>{wedding.guestCount}</span>
                          </div>
                        ) : <span className="text-stone-300">-</span>}
                      </td>
                      <td className="p-4 text-sm font-medium text-stone-900 hidden lg:table-cell">
                        {wedding.budget?.estimated > 0 ? formatCurrency(wedding.budget.estimated) : <span className="text-stone-300">-</span>}
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <div className="w-24 space-y-1">
                          <ProgressBar value={wedding.progress || 0} />
                          <p className="text-xs text-stone-400">{wedding.progress || 0}%</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={wedding.status} />
                      </td>
                      <td className="p-4">
                        <ChevronRight className="h-4 w-4 text-stone-300" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Wedding Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingWedding ? 'Edit Wedding' : 'Create Wedding'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Wedding Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sharma-Gupta Wedding"
                required
              />
              <Input
                label="Client Name"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Client's name"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Client Email"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                placeholder="client@email.com"
              />
              <Input
                label="Client Phone"
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                placeholder="+91 9876543210"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Wedding Date"
                type="date"
                value={formData.weddingDate}
                onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Venue Name"
                value={formData.venue.name}
                onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, name: e.target.value } })}
                placeholder="Venue name"
              />
              <Input
                label="Venue Address"
                value={formData.venue.address}
                onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, address: e.target.value } })}
                placeholder="Address"
              />
              <Input
                label="City"
                value={formData.venue.city}
                onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, city: e.target.value } })}
                placeholder="City"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Guest Count"
                type="number"
                value={formData.guestCount}
                onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                placeholder="200"
              />
              <Input
                label="Estimated Budget"
                type="number"
                value={formData.budget.estimated}
                onChange={(e) => setFormData({ ...formData, budget: { ...formData.budget, estimated: e.target.value } })}
                placeholder="500000"
              />
              <Select
                label="Relationship Manager"
                value={formData.relationshipManager}
                onChange={(e) => setFormData({ ...formData, relationshipManager: e.target.value })}
                options={[{ value: '', label: 'Select manager' }, ...userOptions]}
              />
            </div>

            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingWedding ? 'Update Wedding' : 'Create Wedding'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </PageContainer>
  );
}
