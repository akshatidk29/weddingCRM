import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List, Phone, Mail, Calendar, MapPin, Users as UsersIcon, ChevronRight } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Button, Badge, Modal, ModalFooter, Input, Select, Textarea,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
  Tabs, Tab, EmptyState
} from '../components/common';
import { PageHeader } from '../components/layout/PageHeader';
import { formatDate, formatCurrency, leadSources } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const stages = [
  { id: 'inquiry', label: 'Inquiry' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'booked', label: 'Booked' }
];

const stageConfig = {
  inquiry: { variant: 'default', color: 'bg-gray-100' },
  proposal: { variant: 'warning', color: 'bg-amber-50' },
  negotiation: { variant: 'primary', color: 'bg-blue-50' },
  booked: { variant: 'success', color: 'bg-emerald-50' },
  lost: { variant: 'error', color: 'bg-red-50' }
};

function LeadCard({ lead, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead._id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(lead)}
      className="p-4 bg-white border border-gray-200 rounded-md cursor-pointer hover:border-blue-600 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900">{lead.name}</h4>
        {lead.estimatedBudget > 0 && (
          <span className="text-sm font-medium text-emerald-600">{formatCurrency(lead.estimatedBudget)}</span>
        )}
      </div>
      
      <div className="space-y-1.5 text-sm text-gray-500">
        {lead.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.weddingDate && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(lead.weddingDate)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <span className="text-xs text-gray-400">
          {leadSources.find(s => s.value === lead.source)?.label || lead.source}
        </span>
        {lead.assignedTo && (
          <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
            <span className="text-xs font-medium text-blue-600">
              {lead.assignedTo.name?.charAt(0)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ stage, leads, onLeadClick }) {
  const { setNodeRef } = useSortable({ id: stage.id });
  const config = stageConfig[stage.id];

  return (
    <div className="flex-1 min-w-[280px]">
      <div className={`mb-3 p-3 rounded-md ${config.color}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{stage.label}</h3>
          <span className="text-sm text-gray-400">{leads.length}</span>
        </div>
      </div>
      
      <div ref={setNodeRef} className="space-y-3 min-h-[400px]">
        <SortableContext items={leads.map(l => l._id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <LeadCard key={lead._id} lead={lead} onClick={onLeadClick} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400">
            No leads in this stage
          </div>
        )}
      </div>
    </div>
  );
}

export default function Leads() {
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const [leads, setLeads] = useState({});
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'other',
    estimatedBudget: '',
    weddingDate: '',
    venue: '',
    guestCount: '',
    notes: '',
    assignedTo: ''
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pipelineRes, leadsRes, usersRes] = await Promise.all([
        api.get('/leads/pipeline'),
        api.get('/leads'),
        api.get('/auth/users')
      ]);
      setLeads(pipelineRes.data.leads);
      setAllLeads(leadsRes.data.leads);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const leadId = active.id;
    const newStage = over.id;

    if (!stages.find(s => s.id === newStage)) return;

    const pipelineLeads = [...(leads.inquiry || []), ...(leads.proposal || []), ...(leads.negotiation || []), ...(leads.booked || [])];
    const lead = pipelineLeads.find(l => l._id === leadId);
    if (!lead || lead.stage === newStage) return;

    const oldStage = lead.stage;
    setLeads(prev => ({
      ...prev,
      [oldStage]: prev[oldStage].filter(l => l._id !== leadId),
      [newStage]: [...(prev[newStage] || []), { ...lead, stage: newStage }]
    }));

    try {
      await api.put(`/leads/${leadId}/stage`, { stage: newStage });
    } catch (error) {
      setLeads(prev => ({
        ...prev,
        [newStage]: prev[newStage].filter(l => l._id !== leadId),
        [oldStage]: [...(prev[oldStage] || []), lead]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedLead) {
        await api.put(`/leads/${selectedLead._id}`, formData);
      } else {
        await api.post('/leads', formData);
      }
      loadData();
      closeModal();
    } catch (error) {
      console.error('Failed to save lead:', error);
    }
  };

  const handleLeadClick = (lead) => {
    if (!isManager) return; // Team members can't edit
    setSelectedLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone,
      source: lead.source,
      estimatedBudget: lead.estimatedBudget || '',
      weddingDate: lead.weddingDate ? lead.weddingDate.split('T')[0] : '',
      venue: lead.venue || '',
      guestCount: lead.guestCount || '',
      notes: lead.notes || '',
      assignedTo: lead.assignedTo?._id || ''
    });
    setShowModal(true);
  };

  const handleConvert = async () => {
    if (!selectedLead) return;
    try {
      await api.post(`/leads/${selectedLead._id}/convert`, {
        weddingDate: formData.weddingDate
      });
      loadData();
      closeModal();
    } catch (error) {
      console.error('Failed to convert lead:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLead(null);
    setFormData({
      name: '', email: '', phone: '', source: 'other',
      estimatedBudget: '', weddingDate: '', venue: '', guestCount: '', notes: '', assignedTo: ''
    });
  };

  const filteredLeads = allLeads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = !stageFilter || lead.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const sourceOptions = leadSources.map(s => ({ value: s.value, label: s.label }));
  const stageOptions = stages.map(s => ({ value: s.id, label: s.label }));
  const userOptions = users.map(u => ({ value: u._id, label: u.name }));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader 
        title="Leads"
        description="Track and manage your potential clients"
        actions={
          isManager && (
            <Button icon={Plus} onClick={() => setShowModal(true)}>
              Add Lead
            </Button>
          )
        }
      />

      {/* Filters & View Toggle */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-md bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <Select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            options={[{ value: '', label: 'All Stages' }, ...stageOptions]}
            className="w-40"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-md">
          <button
            onClick={() => setView('table')}
            className={`p-2 rounded-sm transition-colors ${
              view === 'table' ? 'bg-white shadow-sm' : 'hover:bg-gray-100'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('pipeline')}
            className={`p-2 rounded-sm transition-colors ${
              view === 'pipeline' ? 'bg-white shadow-sm' : 'hover:bg-gray-100'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table View */}
      {view === 'table' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Wedding Date</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <TableRow key={lead._id} onClick={() => handleLeadClick(lead)} className="cursor-pointer">
                    <TableCell>
                      <span className="font-medium text-gray-900">{lead.name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {lead.phone && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Phone className="h-3.5 w-3.5" />
                            {lead.phone}
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-400">
                            <Mail className="h-3.5 w-3.5" />
                            {lead.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.weddingDate ? formatDate(lead.weddingDate) : '-'}
                    </TableCell>
                    <TableCell>
                      {lead.estimatedBudget ? formatCurrency(lead.estimatedBudget) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stageConfig[lead.stage]?.variant || 'default'}>
                        {lead.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {leadSources.find(s => s.value === lead.source)?.label || lead.source}
                    </TableCell>
                    <TableCell>
                      {lead.assignedTo?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableEmpty colSpan={8} message="No leads found" />
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pipeline View */}
      {view === 'pipeline' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            <SortableContext items={stages.map(s => s.id)}>
              {stages.map(stage => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  leads={leads[stage.id] || []}
                  onLeadClick={handleLeadClick}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}

      {/* Lead Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={selectedLead ? 'Edit Lead' : 'Add New Lead'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Client name"
                required
              />
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
              <Select
                label="Source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                options={sourceOptions}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Estimated Budget"
                type="number"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                placeholder="500000"
              />
              <Input
                label="Wedding Date"
                type="date"
                value={formData.weddingDate}
                onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Venue"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="Wedding venue"
              />
              <Input
                label="Guest Count"
                type="number"
                value={formData.guestCount}
                onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                placeholder="200"
              />
            </div>

            {isManager && (
              <Select
                label="Assign To"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                options={[{ value: '', label: 'Select team member' }, ...userOptions]}
              />
            )}

            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the lead..."
              rows={3}
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            {selectedLead && selectedLead.stage !== 'booked' && isManager && (
              <Button type="button" variant="success" onClick={handleConvert}>
                Convert to Wedding
              </Button>
            )}
            <Button type="submit">
              {selectedLead ? 'Update Lead' : 'Create Lead'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
