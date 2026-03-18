import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Phone, Mail, Calendar, User } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { PageLoader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { Avatar } from '../components/ui/Avatar';
import { formatDate, formatRelative, stageColors, leadSources, formatCurrency } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const stages = [
  { id: 'inquiry', label: 'Inquiry', color: 'blue' },
  { id: 'proposal', label: 'Proposal', color: 'yellow' },
  { id: 'negotiation', label: 'Negotiation', color: 'purple' },
  { id: 'booked', label: 'Booked', color: 'green' }
];

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
      className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl cursor-pointer hover:bg-white/[0.06] hover:border-purple-500/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-white font-medium group-hover:text-purple-400 transition-colors">{lead.name}</h4>
        {lead.estimatedBudget > 0 && (
          <span className="text-sm text-green-400">{formatCurrency(lead.estimatedBudget)}</span>
        )}
      </div>
      
      <div className="space-y-2 text-sm text-gray-400">
        {lead.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.weddingDate && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(lead.weddingDate)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
        <Badge size="sm">
          {leadSources.find(s => s.value === lead.source)?.label || lead.source}
        </Badge>
        {lead.assignedTo && (
          <Avatar name={lead.assignedTo.name} size="sm" />
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ stage, leads, onLeadClick }) {
  const { setNodeRef } = useSortable({ id: stage.id });
  const stageStyle = stageColors[stage.id];

  return (
    <div className="flex-1 min-w-[300px]">
      <div className={`mb-4 p-3 rounded-xl ${stageStyle.bg} border ${stageStyle.border}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold ${stageStyle.text}`}>{stage.label}</h3>
          <span className={`text-sm ${stageStyle.text}`}>{leads.length}</span>
        </div>
      </div>
      
      <div ref={setNodeRef} className="space-y-3 min-h-[400px]">
        <SortableContext items={leads.map(l => l._id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <LeadCard key={lead._id} lead={lead} onClick={onLeadClick} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function Leads() {
  const { isManager } = useAuth();
  const [leads, setLeads] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [users, setUsers] = useState([]);
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
    loadLeads();
    loadUsers();
  }, []);

  const loadLeads = async () => {
    try {
      const res = await api.get('/leads/pipeline');
      setLeads(res.data.leads);
    } catch (error) {
      console.error('Failed to load leads:', error);
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

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const leadId = active.id;
    const newStage = over.id;

    if (!stages.find(s => s.id === newStage)) return;

    const allLeads = [...(leads.inquiry || []), ...(leads.proposal || []), ...(leads.negotiation || []), ...(leads.booked || [])];
    const lead = allLeads.find(l => l._id === leadId);
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
      loadLeads();
      closeModal();
    } catch (error) {
      console.error('Failed to save lead:', error);
    }
  };

  const handleLeadClick = (lead) => {
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
      loadLeads();
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

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lead Pipeline</h1>
          <p className="text-gray-400">Manage and track your leads</p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>
          Add Lead
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
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

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={selectedLead ? 'Edit Lead' : 'Add New Lead'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Select
              label="Source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              options={leadSources}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Budget"
              type="number"
              value={formData.estimatedBudget}
              onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
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
            />
            <Input
              label="Guest Count"
              type="number"
              value={formData.guestCount}
              onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
            />
          </div>

          {isManager && (
            <Select
              label="Assign To"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              options={users.map(u => ({ value: u._id, label: u.name }))}
              placeholder="Select team member"
            />
          )}

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {selectedLead ? 'Update Lead' : 'Create Lead'}
            </Button>
            {selectedLead && selectedLead.stage !== 'booked' && isManager && (
              <Button type="button" variant="success" onClick={handleConvert}>
                Convert to Wedding
              </Button>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
