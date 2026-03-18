import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, MapPin, Users, DollarSign, MoreVertical, Edit, Trash } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { PageLoader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { Avatar } from '../components/ui/Avatar';
import { formatDate, formatCurrency, daysUntil } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Weddings() {
  const { isManager } = useAuth();
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWedding, setEditingWedding] = useState(null);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
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
    loadWeddings();
    loadUsers();
  }, []);

  const loadWeddings = async () => {
    try {
      const res = await api.get('/weddings');
      setWeddings(res.data.weddings);
    } catch (error) {
      console.error('Failed to load weddings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
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
      loadWeddings();
      closeModal();
    } catch (error) {
      console.error('Failed to save wedding:', error);
    }
  };

  const handleEdit = (wedding) => {
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

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this wedding?')) return;
    try {
      await api.delete(`/weddings/${id}`);
      loadWeddings();
    } catch (error) {
      console.error('Failed to delete wedding:', error);
    }
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
    if (filter === 'all') return true;
    return w.status === filter;
  });

  const getStatusBadge = (status) => {
    const variants = {
      planning: 'info',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'danger'
    };
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Weddings</h1>
          <p className="text-gray-400">Manage all your wedding events</p>
        </div>
        {isManager && (
          <Button icon={Plus} onClick={() => setShowModal(true)}>
            New Wedding
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {['all', 'planning', 'in_progress', 'completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filteredWeddings.length === 0 ? (
        <EmptyState
          title="No weddings found"
          description="Create your first wedding to get started"
          action={isManager && <Button icon={Plus} onClick={() => setShowModal(true)}>New Wedding</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWeddings.map(wedding => {
            const days = daysUntil(wedding.weddingDate);
            const isPast = days !== null && days < 0;
            const isUrgent = days !== null && days >= 0 && days <= 7;

            return (
              <Card key={wedding._id} hover glow className="relative group">
                <Link to={`/weddings/${wedding._id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                          {wedding.name}
                        </h3>
                        <p className="text-sm text-gray-400">{wedding.clientName}</p>
                      </div>
                      {getStatusBadge(wedding.status)}
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span className={isUrgent ? 'text-yellow-400' : ''}>
                          {formatDate(wedding.weddingDate)}
                          {days !== null && !isPast && (
                            <span className="ml-2 text-xs">
                              ({days === 0 ? 'Today' : `${days}d left`})
                            </span>
                          )}
                        </span>
                      </div>

                      {wedding.venue?.name && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span>{wedding.venue.name}{wedding.venue.city && `, ${wedding.venue.city}`}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        {wedding.guestCount > 0 && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Users className="w-4 h-4" />
                            <span>{wedding.guestCount}</span>
                          </div>
                        )}
                        {wedding.budget?.estimated > 0 && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <DollarSign className="w-4 h-4" />
                            <span>{formatCurrency(wedding.budget.estimated)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-white/10 rounded-full h-2 max-w-24">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full transition-all"
                              style={{ width: `${wedding.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-400">{wedding.progress || 0}%</span>
                        </div>
                        {wedding.relationshipManager && (
                          <Avatar name={wedding.relationshipManager.name} size="sm" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Link>
                
                {isManager && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.preventDefault(); handleEdit(wedding); }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingWedding ? 'Edit Wedding' : 'Create Wedding'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Client Email"
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
            />
            <Input
              label="Client Phone"
              type="tel"
              value={formData.clientPhone}
              onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
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
            />
            <Input
              label="Venue Address"
              value={formData.venue.address}
              onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, address: e.target.value } })}
            />
            <Input
              label="City"
              value={formData.venue.city}
              onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, city: e.target.value } })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Guest Count"
              type="number"
              value={formData.guestCount}
              onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
            />
            <Input
              label="Estimated Budget"
              type="number"
              value={formData.budget.estimated}
              onChange={(e) => setFormData({ ...formData, budget: { ...formData.budget, estimated: e.target.value } })}
            />
            <Select
              label="Relationship Manager"
              value={formData.relationshipManager}
              onChange={(e) => setFormData({ ...formData, relationshipManager: e.target.value })}
              options={users.filter(u => u.role !== 'team_member').map(u => ({ value: u._id, label: u.name }))}
              placeholder="Select..."
            />
          </div>

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingWedding ? 'Update Wedding' : 'Create Wedding'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
