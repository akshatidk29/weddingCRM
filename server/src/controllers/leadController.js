import Lead from '../models/Lead.js';
import Wedding from '../models/Wedding.js';
import Notification from '../models/Notification.js';

export const getLeads = async (req, res) => {
  try {
    const { stage, assignedTo, search } = req.query;
    const query = {};

    if (stage) query.stage = stage;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (req.user.role === 'team_member') {
      query.assignedTo = req.user._id;
    }

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ leads });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .populate('activities.createdBy', 'name');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json({ lead });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createLead = async (req, res) => {
  try {
    const lead = await Lead.create({
      ...req.body,
      createdBy: req.user._id
    });

    await lead.populate('assignedTo', 'name email');

    if (lead.assignedTo && lead.assignedTo._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: lead.assignedTo._id,
        type: 'lead_assigned',
        title: 'New Lead Assigned',
        message: `You have been assigned a new lead: ${lead.name}`,
        relatedTo: { model: 'Lead', id: lead._id }
      });
    }

    res.status(201).json({ lead });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLead = async (req, res) => {
  try {
    const oldLead = await Lead.findById(req.params.id);
    if (!oldLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    if (req.body.stage && req.body.stage !== oldLead.stage) {
      lead.activities.push({
        type: 'status_change',
        description: `Stage changed from ${oldLead.stage} to ${req.body.stage}`,
        createdBy: req.user._id
      });
      await lead.save();
    }

    res.json({ lead });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLeadStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const oldStage = lead.stage;
    lead.stage = stage;
    lead.activities.push({
      type: 'status_change',
      description: `Stage changed from ${oldStage} to ${stage}`,
      createdBy: req.user._id
    });

    await lead.save();
    await lead.populate('assignedTo', 'name email');

    res.json({ lead });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addActivity = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    lead.activities.push({
      ...req.body,
      createdBy: req.user._id
    });

    await lead.save();
    await lead.populate('activities.createdBy', 'name');

    res.json({ lead });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const convertToWedding = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (lead.convertedToWedding) {
      return res.status(400).json({ message: 'Lead already converted' });
    }

    const wedding = await Wedding.create({
      name: req.body.name || `${lead.name}'s Wedding`,
      clientName: lead.name,
      clientEmail: lead.email,
      clientPhone: lead.phone,
      weddingDate: req.body.weddingDate || lead.weddingDate,
      venue: { name: lead.venue },
      guestCount: lead.guestCount,
      budget: { estimated: lead.estimatedBudget },
      relationshipManager: lead.assignedTo,
      lead: lead._id,
      createdBy: req.user._id
    });

    lead.convertedToWedding = wedding._id;
    lead.stage = 'booked';
    lead.activities.push({
      type: 'status_change',
      description: 'Converted to wedding',
      createdBy: req.user._id
    });
    await lead.save();

    res.status(201).json({ wedding, lead });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json({ message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeadsByStage = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'team_member') {
      query.assignedTo = req.user._id;
    }

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 });

    const grouped = {
      inquiry: leads.filter(l => l.stage === 'inquiry'),
      proposal: leads.filter(l => l.stage === 'proposal'),
      negotiation: leads.filter(l => l.stage === 'negotiation'),
      booked: leads.filter(l => l.stage === 'booked')
    };

    res.json({ leads: grouped });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
