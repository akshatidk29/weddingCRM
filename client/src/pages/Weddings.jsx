import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, MapPin, Users, ChevronRight } from 'lucide-react';
import { 
  Button, Badge, Modal, ModalFooter, Input, Select, Textarea,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
  EmptyState, ProgressBar
} from '../components/common';
import { PageHeader } from '../components/layout/PageHeader';
import { formatDate, formatCurrency, daysUntil } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const statusConfig = {
  planning: { variant: 'primary', label: 'Planning' },
  in_progress: { variant: 'warning', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'error', label: 'Cancelled' }
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader 
        title="Weddings"
        description="Manage all your wedding events"
        actions={
          isManager && (
            <Button icon={Plus} onClick={() => setShowModal(true)}>
              New Wedding
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search weddings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-md bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          {['all', 'planning', 'in_progress', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status === 'all' ? 'All' : statusConfig[status]?.label || status}
            </button>
          ))}
        </div>
      </div>

      {/* Weddings Table */}
      {filteredWeddings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No weddings found"
          description="Create your first wedding to get started"
          action={
            isManager && (
              <Button icon={Plus} onClick={() => setShowModal(true)}>
                New Wedding
              </Button>
            )
          }
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Wedding</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWeddings.map((wedding) => {
                const days = daysUntil(wedding.weddingDate);
                const isUrgent = days !== null && days >= 0 && days <= 7;
                const status = statusConfig[wedding.status] || statusConfig.planning;

                return (
                  <TableRow 
                    key={wedding._id}
                    onClick={() => window.location.href = `/weddings/${wedding._id}`}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{wedding.name}</p>
                        <p className="text-sm text-gray-400">{wedding.clientName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className={isUrgent ? 'text-amber-500' : ''}>
                            {formatDate(wedding.weddingDate)}
                          </p>
                          {days !== null && days >= 0 && (
                            <p className="text-xs text-gray-400">
                              {days === 0 ? 'Today' : `${days} days left`}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {wedding.venue?.name ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{wedding.venue.name}{wedding.venue.city && `, ${wedding.venue.city}`}</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {wedding.guestCount > 0 ? (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{wedding.guestCount}</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {wedding.budget?.estimated > 0 ? formatCurrency(wedding.budget.estimated) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <ProgressBar value={wedding.progress || 0} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
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
            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-3 gap-4">
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

            <div className="grid grid-cols-3 gap-4">
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
    </div>
  );
}
