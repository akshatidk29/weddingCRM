import { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, MapPin, Star, Edit, Building2, ChevronRight } from 'lucide-react';
import { 
  Button, Badge, Modal, ModalFooter, Input, Select, Textarea,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
  EmptyState
} from '../components/common';
import { PageHeader } from '../components/layout/PageHeader';
import { vendorCategories } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const priceConfig = {
  budget: { label: 'Budget', display: '$' },
  moderate: { label: 'Moderate', display: '$$' },
  premium: { label: 'Premium', display: '$$$' },
  luxury: { label: 'Luxury', display: '$$$$' }
};

function StarRating({ rating, onChange, readonly = false }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          className={readonly ? 'cursor-default' : 'cursor-pointer'}
        >
          <Star
            className={`w-4 h-4 ${
              star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-400'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function Vendors() {
  const { isManager } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [filter, setFilter] = useState({ category: '', search: '' });
  const [formData, setFormData] = useState({
    name: '', category: 'other', contactPerson: '', email: '', phone: '',
    address: '', city: '', rating: 3, priceRange: 'moderate', notes: ''
  });

  useEffect(() => {
    loadVendors();
  }, []);

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

  const handleEdit = (vendor, e) => {
    e?.stopPropagation();
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
      setSelectedVendor(null);
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

  const filteredVendors = vendors.filter(v => {
    if (filter.category && v.category !== filter.category) return false;
    if (filter.search) {
      const search = filter.search.toLowerCase();
      return v.name.toLowerCase().includes(search) || 
             v.contactPerson?.toLowerCase().includes(search) ||
             v.city?.toLowerCase().includes(search);
    }
    return true;
  });

  const categoryOptions = vendorCategories.map(c => ({ value: c.value, label: c.label }));
  const priceOptions = [
    { value: 'budget', label: 'Budget ($)' },
    { value: 'moderate', label: 'Moderate ($$)' },
    { value: 'premium', label: 'Premium ($$$)' },
    { value: 'luxury', label: 'Luxury ($$$$)' }
  ];

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
        title="Vendors"
        description="Manage your vendor directory"
        actions={
          isManager && (
            <Button icon={Plus} onClick={() => setShowModal(true)}>
              Add Vendor
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-md bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <Select
          value={filter.category}
          onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          options={[{ value: '', label: 'All Categories' }, ...categoryOptions]}
          className="w-48"
        />
      </div>

      {/* Vendors Table */}
      {filteredVendors.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No vendors found"
          description={filter.search || filter.category ? "Try adjusting your filters" : "Add your first vendor to get started"}
          action={
            isManager && !filter.search && !filter.category && (
              <Button icon={Plus} onClick={() => setShowModal(true)}>Add Vendor</Button>
            )
          }
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Vendor</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Price Range</TableHead>
                {isManager && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow 
                  key={vendor._id}
                  onClick={() => setSelectedVendor(vendor)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{vendor.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{vendor.category}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {vendor.contactPerson && (
                        <p className="text-sm">{vendor.contactPerson}</p>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-400">
                          <Phone className="h-3.5 w-3.5" />
                          {vendor.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {vendor.city ? (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {vendor.city}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <StarRating rating={vendor.rating || 0} readonly />
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">
                      {priceConfig[vendor.priceRange]?.display || '$$'}
                    </Badge>
                  </TableCell>
                  {isManager && (
                    <TableCell>
                      <button
                        onClick={(e) => handleEdit(vendor, e)}
                        className="p-1.5 rounded-sm text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Vendor Detail Modal */}
      <Modal
        isOpen={!!selectedVendor}
        onClose={() => setSelectedVendor(null)}
        title={selectedVendor?.name}
        size="md"
      >
        {selectedVendor && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="default">{selectedVendor.category}</Badge>
              <Badge variant="default">{priceConfig[selectedVendor.priceRange]?.label}</Badge>
            </div>
            
            <div className="space-y-3 pt-2">
              {selectedVendor.contactPerson && (
                <div>
                  <p className="text-xs text-gray-400 uppercase">Contact Person</p>
                  <p className="text-sm font-medium">{selectedVendor.contactPerson}</p>
                </div>
              )}
              
              {selectedVendor.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{selectedVendor.phone}</span>
                </div>
              )}
              
              {selectedVendor.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{selectedVendor.email}</span>
                </div>
              )}
              
              {(selectedVendor.address || selectedVendor.city) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {[selectedVendor.address, selectedVendor.city].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">Rating</p>
                <StarRating rating={selectedVendor.rating || 0} readonly />
              </div>
              
              {selectedVendor.notes && (
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-1">Notes</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedVendor.notes}</p>
                </div>
              )}
            </div>

            {isManager && (
              <ModalFooter>
                <Button variant="danger" onClick={() => handleDelete(selectedVendor._id)}>
                  Delete
                </Button>
                <Button onClick={(e) => { setSelectedVendor(null); handleEdit(selectedVendor, e); }}>
                  Edit
                </Button>
              </ModalFooter>
            )}
          </div>
        )}
      </Modal>

      {/* Add/Edit Vendor Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingVendor ? 'Edit Vendor' : 'Add Vendor'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Vendor Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Vendor name"
                required
              />
              <Select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={categoryOptions}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Contact Person"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Contact name"
              />
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
              />
            </div>

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="vendor@email.com"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-900">Rating</label>
                <div className="py-2">
                  <StarRating 
                    rating={formData.rating} 
                    onChange={(rating) => setFormData({ ...formData, rating })} 
                  />
                </div>
              </div>
              <Select
                label="Price Range"
                value={formData.priceRange}
                onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                options={priceOptions}
              />
            </div>

            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this vendor..."
              rows={3}
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingVendor ? 'Update Vendor' : 'Add Vendor'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
