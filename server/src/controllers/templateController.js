import templates from '../data/templateData.js';
import Wedding from '../models/Wedding.js';
import Event from '../models/Event.js';
import Task from '../models/Task.js';

// @desc    Get all wedding templates
// @route   GET /api/templates
export const getTemplates = async (req, res) => {
  try {
    res.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Failed to load templates' });
  }
};

// @desc    Convert a template into a real Wedding + Events + Tasks
// @route   POST /api/templates/:type/convert
export const convertTemplate = async (req, res) => {
  try {
    const { type } = req.params;
    const { name, clientName, clientPhone, clientEmail, weddingDate } = req.body;

    const template = templates.find(t => t.type === type);
    if (!template) {
      return res.status(404).json({ message: 'Template type not found' });
    }

    if (!name || !clientName || !weddingDate) {
      return res.status(400).json({ message: 'Wedding name, client name, and wedding date are required' });
    }

    // 1. Create the Wedding
    const wedding = await Wedding.create({
      name,
      clientName,
      clientPhone: clientPhone || '',
      clientEmail: clientEmail || '',
      weddingDate,
      notes: template.vendorNotes,
      createdBy: req.user._id
    });

    // 2. Create Events and Tasks
    const baseDate = new Date(weddingDate);

    for (const evTemplate of template.events) {
      // Spread events across days leading up to the wedding
      const eventDate = new Date(baseDate);
      eventDate.setDate(eventDate.getDate() - (template.events.length - 1 - evTemplate.order));

      const event = await Event.create({
        name: evTemplate.name,
        eventDate,
        wedding: wedding._id,
        order: evTemplate.order,
        status: 'pending',
        createdBy: req.user._id
      });

      // Create tasks for this event
      for (const taskTemplate of evTemplate.tasks) {
        const subtasks = (taskTemplate.subtasks || []).map(s => ({
          title: s,
          completed: false,
          amount: 0
        }));

        await Task.create({
          title: taskTemplate.title,
          category: taskTemplate.category,
          priority: taskTemplate.priority,
          status: 'pending',
          wedding: wedding._id,
          event: event._id,
          subtasks,
          createdBy: req.user._id
        });
      }
    }

    // 3. Create global tasks (not tied to a specific event)
    if (template.globalTasks) {
      for (const taskTemplate of template.globalTasks) {
        const subtasks = (taskTemplate.subtasks || []).map(s => ({
          title: s,
          completed: false,
          amount: 0
        }));

        await Task.create({
          title: taskTemplate.title,
          category: taskTemplate.category,
          priority: taskTemplate.priority,
          status: 'pending',
          wedding: wedding._id,
          subtasks,
          createdBy: req.user._id
        });
      }
    }

    res.status(201).json({ wedding, message: `${template.label} template converted successfully!` });
  } catch (error) {
    console.error('Convert template error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages[0] || 'Validation failed' });
    }
    res.status(500).json({ message: 'Failed to convert template' });
  }
};
