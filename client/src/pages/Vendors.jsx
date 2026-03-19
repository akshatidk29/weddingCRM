import { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, MapPin, Star, Edit, Trash, CheckSquare, Clock, ChevronDown, ChevronRight, Store, PartyPopper } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { PageLoader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { vendorCategories } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Vendors() {
  const { isManager } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [filter, setFilter] = useState({ category: '', search: '', wedding: '', event: '' });
  const [weddings, setWeddings] = useState([]);
  const [filterEvents, setFilterEvents] = useState([]);
  const [formData, setFormData] = useState({
    name: '', category: 'other', contactPerson: '', email: '', phone: '',
    address: '', city: '', rating: 3, priceRange: 'moderate', notes: ''
  });
  const [expandedVendor, setExpandedVendor] = useState(null);
  const [linkedTasks, setLinkedTasks] = useState({});
  const [linkedEvents, setLinkedEvents] = useState({});

  useEffect(() => {
    loadVendors();
    loadWeddings();
  }, []);

  const loadWeddings = async () => {
    try {
      const res = await api.get('/weddings');
      setWeddings(res.data.weddings);
    } catch (error) {
      console.error('Failed to load weddings:', error);
    }
  };

  const loadVendors = async () => {
    try {
      const res = await api.get('/vendors');
      setVendors(res.data.vendors);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedTasks = async (vendorId) => {
    try {
      const res = await api.get(`/tasks/by-vendor/${vendorId}`);
      setLinkedTasks(prev => ({ ...prev, [vendorId]: res.data.tasks }));
    } catch (error) {
      console.error('Failed to load linked tasks:', error);
    }
  };

  const loadLinkedEventsForVendor = async (vendorId) => {
    try {
      const res = await api.get(`/vendors/${vendorId}/linked-events`);
      setLinkedEvents(prev => ({ ...prev, [vendorId]: res.data.events || [] }));
    } catch (error) {
      console.error('Failed to load linked events:', error);
    }
  };

  const toggleVendorExpand = async (vendor) => {
    if (expandedVendor === vendor._id) {
      setExpandedVendor(null);
    } else {
      setExpandedVendor(vendor._id);
      if (!linkedTasks[vendor._id]) {
        await loadLinkedTasks(vendor._id);
      }
      if (!linkedEvents[vendor._id]) {
        await loadLinkedEventsForVendor(vendor._id);
      }
    }
  };

  const handleToggleVendorAcrossTasks = async (vendorId, currentStatus) => {
    // Determine target status. If currently any task has this vendor as pending, we probably want to mark all as completed.
    // If all are completed, we mark all as pending. 
    // We'll calculate current state from linkedTasks view.
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    try {
      const res = await api.put(`/tasks/vendor-toggle/${vendorId}`, { status: newStatus });
      setLinkedTasks(prev => ({ ...prev, [vendorId]: res.data.tasks }));
    } catch (error) {
      console.error('Failed to toggle vendor status across tasks', error);
    }
  };

  const handleUpdateVendorTaskStatus = async (taskId, vendorId, status, vendorObjId) => {
    try {
      await api.put(`/tasks/${taskId}/vendors/${vendorId}`, { status });
      await loadLinkedTasks(vendorObjId);
    } catch (error) {
      console.error('Failed to update vendor status:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await api.put(`/vendors/${editingVendor._id}`, formData);
      } else {
        await api.post('/vendors', formData);
      }
      loadVendors();
      closeModal();
    } catch (error) {
      console.error('Failed to save vendor:', error);
    }
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      category: vendor.category,
      contactPerson: vendor.contactPerson || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      city: vendor.city || '',
      rating: vendor.rating || 3,
      priceRange: vendor.priceRange || 'moderate',
      notes: vendor.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    try {
      await api.delete(`/vendors/${id}`);
      loadVendors();
    } catch (error) {
      console.error('Failed to delete vendor:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVendor(null);
    setFormData({
      name: '', category: 'other', contactPerson: '', email: '', phone: '',
      address: '', city: '', rating: 3, priceRange: 'moderate', notes: ''
    });
  };

  // Filter wedding change handler
  const handleFilterWeddingChange = async (weddingId) => {
    setFilter({ ...filter, wedding: weddingId, event: '' });
    if (weddingId) {
      try {
        const res = await api.get(`/events/wedding/${weddingId}`);
        setFilterEvents(res.data.events || []);
      } catch (error) {
        setFilterEvents([]);
      }
    } else {
      setFilterEvents([]);
    }
  };

  // Build a set of vendor IDs that match the wedding/event filter
  const getFilteredVendorIds = () => {
    if (!filter.wedding && !filter.event) return null; // no filtering
    // We need to check linkedTasks across all vendors, but we may not have loaded them all.
    // Instead, we'll do a lightweight check: if wedding/event filter is set, only show vendors
    // whose linked tasks (if loaded) match. For vendors not yet expanded, we include them
    // and filter will be refined when they expand.
    return null; // We'll handle this client-side with available data
  };

  const filteredVendors = vendors.filter(v => {
    if (filter.category && v.category !== filter.category) return false;
    if (filter.search) {
      const search = filter.search.toLowerCase();
      if (!v.name.toLowerCase().includes(search) && 
          !v.contactPerson?.toLowerCase().includes(search) &&
          !v.city?.toLowerCase().includes(search)) return false;
    }
    // Filter by wedding/event if linked tasks are loaded
    if (filter.wedding || filter.event) {
      const tasks = linkedTasks[v._id];
      if (tasks) {
        const hasMatch = tasks.some(t => {
          if (filter.event) return (t.event?._id || t.event) === filter.event;
          if (filter.wedding) return (t.wedding?._id || t.wedding) === filter.wedding;
          return true;
        });
        if (!hasMatch) return false;
      }
      // If tasks not loaded yet, include the vendor (we can't filter what we haven't fetched)
    }
    return true;
  });

  const getCategoryIcon = (category) => {
    const icons = {
      catering: '🍽️', decor: '🎨', photography: '📷', videography: '🎥',
      music: '🎵', makeup: '💄', venue: '🏰', transport: '🚗',
      invitation: '💌', other: '📦'
    };
    return icons[category] || '📦';
  };

  const priceLabels = { budget: '$', moderate: '$$', premium: '$$$', luxury: '$$$$' };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendors</h1>
          <p className="text-gray-400">Manage your vendor directory</p>
        </div>
        {isManager && (
          <Button icon={Plus} onClick={() => setShowModal(true)}>
            Add Vendor
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <Select
          value={filter.category}
          onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          options={vendorCategories}
          placeholder="All Categories"
          className="w-48"
        />
        <Select
          value={filter.wedding}
          onChange={(e) => handleFilterWeddingChange(e.target.value)}
          options={weddings.map(w => ({ value: w._id, label: w.name }))}
          placeholder="All Weddings"
          className="w-48"
        />
        {filter.wedding && filterEvents.length > 0 && (
          <Select
            value={filter.event}
            onChange={(e) => setFilter({ ...filter, event: e.target.value })}
            options={filterEvents.map(ev => ({ value: ev._id, label: ev.name }))}
            placeholder="All Events"
            className="w-48"
          />
        )}
      </div>

      {filteredVendors.length === 0 ? (
        <EmptyState
          title="No vendors found"
          description={filter.search || filter.category ? "Try adjusting your filters" : "Add your first vendor to get started"}
          action={isManager && !filter.search && !filter.category && (
            <Button icon={Plus} onClick={() => setShowModal(true)}>Add Vendor</Button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map(vendor => {
            const isExpanded = expandedVendor === vendor._id;
            const vendorTasks = linkedTasks[vendor._id] || [];

            return (
              <Card key={vendor._id} hover glow className="group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                      {getCategoryIcon(vendor.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{vendor.name}</h3>
                          <p className="text-sm text-gray-500 capitalize">{vendor.category}</p>
                        </div>
                        <span className="text-sm text-green-400">{priceLabels[vendor.priceRange]}</span>
                      </div>
                    </div>
                  </div>

                  {vendor.contactPerson && (
                    <p className="mt-3 text-sm text-gray-400">{vendor.contactPerson}</p>
                  )}

                  <div className="mt-3 space-y-1 text-sm text-gray-500">
                    {vendor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    {vendor.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{vendor.email}</span>
                      </div>
                    )}
                    {vendor.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>{vendor.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Linked Events Tags */}
                  {linkedEvents[vendor._id] && linkedEvents[vendor._id].length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {linkedEvents[vendor._id].map(ev => (
                        <span key={ev._id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-medium">
                          <PartyPopper className="w-3 h-3" />
                          {ev.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Linked Tasks Button */}
                  <button
                    onClick={() => toggleVendorExpand(vendor)}
                    className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-sm"
                  >
                    <span className="flex items-center gap-2 text-gray-400">
                      <CheckSquare className="w-3.5 h-3.5" />
                      Linked Tasks
                    </span>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                  </button>

                  {/* Expanded Linked Tasks */}
                  {isExpanded && (
                    <div className="mt-2 space-y-1.5 border-t border-white/[0.06] pt-2">
                      {vendorTasks.length > 0 && (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400 uppercase font-semibold">Mark All</span>
                            <button
                              onClick={() => {
                                const allCompleted = vendorTasks.every(t => t.taskVendors.find(tv => tv.vendor._id === vendor._id)?.status === 'completed');
                                handleToggleVendorAcrossTasks(vendor._id, allCompleted ? 'completed' : 'pending');
                              }}
                              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              Toggle Across Tasks
                            </button>
                          </div>
                          <div className="px-3 py-2 bg-blue-500/10 rounded-lg mb-2 flex justify-between">
                            <span className="text-xs text-blue-300">Total Budget: ${vendorTasks.reduce((sum, t) => sum + Math.abs(t.taskVendors.find(tv => tv.vendor?._id === vendor._id)?.amount || 0), 0)}</span>
                            <span className="text-xs text-green-300">Paid: ${vendorTasks.reduce((sum, t) => sum + Math.abs(t.taskVendors.find(tv => tv.vendor?._id === vendor._id)?.paidAmount || 0), 0)}</span>
                          </div>
                        </>
                      )}
                      
                      {vendorTasks.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-2">No tasks linked to this vendor</p>
                      ) : (
                        vendorTasks.map(task => {
                          const vendorEntry = task.taskVendors?.find(tv => tv.vendor?._id === vendor._id);
                          if (!vendorEntry) return null;

                          return (
                            <div key={task._id} className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-white flex-1">{task.title}</p>
                                <Badge size="sm" variant={task.status === 'verified' ? 'success' : task.status === 'done' ? 'info' : 'warning'}>
                                  {task.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {task.wedding && <span className="text-xs text-gray-500">{task.wedding.name}</span>}
                                {task.event && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-medium">
                                    <PartyPopper className="w-2.5 h-2.5" />
                                    {task.event.name}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 mt-1.5">
                                <button
                                  onClick={() => handleUpdateVendorTaskStatus(task._id, vendorEntry._id, vendorEntry.status === 'completed' ? 'pending' : 'completed', vendor._id)}
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    vendorEntry.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-600 hover:border-purple-500'
                                  }`}
                                >
                                  {vendorEntry.status === 'completed' && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </button>
                                <span className={`text-xs flex-1 ${vendorEntry.status === 'completed' ? 'text-green-400' : 'text-gray-400'}`}>
                                  {vendorEntry.status === 'completed' ? 'Completed for this task' : 'Pending for this task'}
                                </span>
                                {vendorEntry.amount !== 0 && (
                                  <Badge size="sm" variant={vendorEntry.paymentStatus === 'completed' ? 'success' : vendorEntry.paymentStatus === 'partial' ? 'warning' : 'secondary'}>
                                    ${Math.abs(vendorEntry.amount)} / Paid: ${Math.abs(vendorEntry.paidAmount || 0)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/[0.06]">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < vendor.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                        />
                      ))}
                    </div>
                    
                    {isManager && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(vendor)}
                          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor._id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingVendor ? 'Edit Vendor' : 'Add Vendor'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Vendor Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={vendorCategories}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-400">Rating</label>
              <div className="flex items-center gap-1 py-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= formData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Select
              label="Price Range"
              value={formData.priceRange}
              onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
              options={[
                { value: 'budget', label: 'Budget ($)' },
                { value: 'moderate', label: 'Moderate ($$)' },
                { value: 'premium', label: 'Premium ($$$)' },
                { value: 'luxury', label: 'Luxury ($$$$)' }
              ]}
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
              {editingVendor ? 'Update Vendor' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
