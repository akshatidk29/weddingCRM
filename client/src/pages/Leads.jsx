import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List, Phone, Mail, Calendar, MapPin, Users as UsersIcon, ChevronRight, X } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageContainer, PageHeader, PageSection, SectionCard, EmptyState } from '../components/layout/PageContainer';
import { formatDate, formatCurrency, leadSources } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Design system components
function Button({ children, variant = 'primary', icon: Icon, onClick, type = 'button', disabled, className = '' }) {
  const variants = {
    primary: 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm',
    secondary: 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700'
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
    inquiry: { bg: 'bg-stone-100', text: 'text-stone-600' },
    proposal: { bg: 'bg-amber-50', text: 'text-amber-600' },
    negotiation: { bg: 'bg-blue-50', text: 'text-blue-600' },
    booked: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    lost: { bg: 'bg-rose-50', text: 'text-rose-600' }
  };
  const { bg, text } = config[status] || config.inquiry;
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${bg} ${text}`}>{status}</span>;
}

const stages = [
  { id: 'inquiry', label: 'Inquiry' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'booked', label: 'Booked' }
];

const stageConfig = {
  inquiry: { color: 'bg-stone-50 border-stone-200' },
  proposal: { color: 'bg-amber-50/50 border-amber-200' },
  negotiation: { color: 'bg-blue-50/50 border-blue-200' },
  booked: { color: 'bg-emerald-50/50 border-emerald-200' },
  lost: { color: 'bg-rose-50/50 border-rose-200' }
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
      className="p-4 bg-white border border-stone-200/60 rounded-xl cursor-pointer hover:border-stone-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-stone-900">{lead.name}</h4>
        {lead.estimatedBudget > 0 && (
          <span className="text-sm font-semibold text-emerald-600">{formatCurrency(lead.estimatedBudget)}</span>
        )}
      </div>
      
      <div className="space-y-2 text-sm text-stone-500">
        {lead.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-stone-400" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.weddingDate && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>{formatDate(lead.weddingDate)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
        <span className="text-xs text-stone-400">
          {leadSources.find(s => s.value === lead.source)?.label || lead.source}
        </span>
        {lead.assignedTo && (
          <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
            <span className="text-xs font-bold text-rose-600">
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
    <div className="flex-1 min-w-75">
      <div className={`mb-4 p-4 rounded-xl border ${config.color}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-stone-900">{stage.label}</h3>
          <span className="text-sm font-medium text-stone-400 bg-white/60 px-2 py-0.5 rounded-full">{leads.length}</span>
        </div>
      </div>
      
      <div ref={setNodeRef} className="space-y-3 min-h-100">
        <SortableContext items={leads.map(l => l._id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <LeadCard key={lead._id} lead={lead} onClick={onLeadClick} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="text-center py-12 text-sm text-stone-400 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
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
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-stone-900 border-t-transparent rounded-full" />
        </div>
      </PageContainer>
    );
  }

  const sourceOptions = leadSources.map(s => ({ value: s.value, label: s.label }));
  const stageOptions = stages.map(s => ({ value: s.id, label: s.label }));
  const userOptions = users.map(u => ({ value: u._id, label: u.name }));

  return (
    <PageContainer>
      <PageHeader 
        title="Leads"
        subtitle="Track and manage your potential clients through the sales pipeline"
        actions={
          isManager && (
            <Button icon={Plus} onClick={() => setShowModal(true)}>
              Add Lead
            </Button>
          )
        }
      />

      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5 transition-all"
            />
          </div>
          <Select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            options={[{ value: '', label: 'All Stages' }, ...stageOptions]}
            className="w-full sm:w-44"
          />
        </div>
        <div className="flex items-center gap-1 p-1.5 bg-stone-100 rounded-xl">
          <button
            onClick={() => setView('table')}
            className={`p-2.5 rounded-lg transition-all ${
              view === 'table' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('pipeline')}
            className={`p-2.5 rounded-lg transition-all ${
              view === 'pipeline' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table View */}
      {view === 'table' && (
        <SectionCard padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Name</th>
                  <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Contact</th>
                  <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase hidden md:table-cell">Wedding Date</th>
                  <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase hidden lg:table-cell">Budget</th>
                  <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase">Stage</th>
                  <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase hidden lg:table-cell">Source</th>
                  <th className="text-left p-4 text-[10px] font-semibold tracking-[0.15em] text-stone-400 uppercase hidden md:table-cell">Assigned</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <tr 
                      key={lead._id} 
                      onClick={() => handleLeadClick(lead)} 
                      className="cursor-pointer hover:bg-stone-50 transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-semibold text-stone-900">{lead.name}</span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {lead.phone && (
                            <div className="flex items-center gap-2 text-sm text-stone-600">
                              <Phone className="h-3.5 w-3.5 text-stone-400" />
                              {lead.phone}
                            </div>
                          )}
                          {lead.email && (
                            <div className="flex items-center gap-2 text-sm text-stone-400">
                              <Mail className="h-3.5 w-3.5" />
                              {lead.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-stone-600 hidden md:table-cell">
                        {lead.weddingDate ? formatDate(lead.weddingDate) : '-'}
                      </td>
                      <td className="p-4 text-sm font-medium text-stone-900 hidden lg:table-cell">
                        {lead.estimatedBudget ? formatCurrency(lead.estimatedBudget) : '-'}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={lead.stage} />
                      </td>
                      <td className="p-4 text-sm text-stone-500 hidden lg:table-cell">
                        {leadSources.find(s => s.value === lead.source)?.label || lead.source}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {lead.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-rose-600">{lead.assignedTo.name?.charAt(0)}</span>
                            </div>
                            <span className="text-sm text-stone-600">{lead.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-stone-300">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <ChevronRight className="h-4 w-4 text-stone-300" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-12 text-center">
                      <EmptyState 
                        icon={UsersIcon}
                        title="No leads found"
                        description="Try adjusting your search or filters"
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Pipeline View */}
      {view === 'pipeline' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-5 overflow-x-auto pb-4 -mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
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
    </PageContainer>
  );
}
