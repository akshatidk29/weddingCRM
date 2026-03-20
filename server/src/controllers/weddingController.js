import Wedding from '../models/Wedding.js';
import Task from '../models/Task.js';
import Event from '../models/Event.js';
import { calculateProgress } from '../utils/helpers.js';

export const getWeddings = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    // Discard expired weddings (dates from yesterday and before)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const query = { weddingDate: { $gte: today } };

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } }
      ];
    }

    if (req.user.role === 'team_member') {
      query['assignedTeam.user'] = req.user._id;
    }

    const weddings = await Wedding.find(query)
      .populate('relationshipManager', 'name email')
      .populate('assignedTeam.user', 'name email avatar')
      .sort({ weddingDate: 1 });

    const weddingsWithProgress = await Promise.all(
      weddings.map(async (wedding) => {
        const tasks = await Task.find({ wedding: wedding._id });
        return {
          ...wedding.toObject(),
          progress: calculateProgress(tasks),
          taskStats: {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'done' || t.status === 'verified').length,
            pending: tasks.filter(t => t.status === 'pending').length
          }
        };
      })
    );

    res.json({ weddings: weddingsWithProgress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWedding = async (req, res) => {
  try {
    const wedding = await Wedding.findById(req.params.id)
      .populate('relationshipManager', 'name email')
      .populate('assignedTeam.user', 'name email avatar')
      .populate('vendors.vendor')
      .populate('lead');

    if (!wedding) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    if (req.user.role === 'team_member') {
      const isAssigned = wedding.assignedTeam.some(t => {
        const userId = t.user._id || t.user;
        return userId.toString() === req.user._id.toString();
      });
      if (!isAssigned) return res.status(403).json({ message: 'Not authorized to view this wedding' });
    }

    const tasks = await Task.find({ wedding: wedding._id })
      .populate('assignedTo', 'name')
      .populate('event', 'name eventDate')
      .sort({ dueDate: 1 });

    const tasksByCategory = tasks.reduce((acc, task) => {
      if (!acc[task.category]) acc[task.category] = [];
      acc[task.category].push(task);
      return acc;
    }, {});

    // Fetch events sorted ascending by eventDate
    const events = await Event.find({ wedding: wedding._id })
      .populate('assignedTeam.user', 'name email avatar')
      .sort({ eventDate: 1 });

    // Add task stats per event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const eventTasks = await Task.find({ event: event._id });
        const total = eventTasks.length;
        const completed = eventTasks.filter(t => t.status === 'done' || t.status === 'verified').length;
        const pending = eventTasks.filter(t => t.status === 'pending').length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          ...event.toObject(),
          taskStats: { total, completed, pending },
          progress
        };
      })
    );

    res.json({
      wedding: {
        ...wedding.toObject(),
        progress: calculateProgress(tasks),
        taskStats: {
          total: tasks.length,
          completed: tasks.filter(t => t.status === 'done' || t.status === 'verified').length,
          pending: tasks.filter(t => t.status === 'pending').length
        }
      },
      tasks,
      tasksByCategory,
      events: eventsWithStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createWedding = async (req, res) => {
  try {
    const wedding = await Wedding.create({
      ...req.body,
      createdBy: req.user._id
    });

    await wedding.populate('relationshipManager', 'name email');

    res.status(201).json({ wedding });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateWedding = async (req, res) => {
  try {
    const wedding = await Wedding.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('relationshipManager', 'name email')
      .populate('assignedTeam.user', 'name email avatar');

    if (!wedding) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    res.json({ wedding });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteWedding = async (req, res) => {
  try {
    const wedding = await Wedding.findByIdAndDelete(req.params.id);
    if (!wedding) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    // Cascade delete events and tasks
    await Event.deleteMany({ wedding: req.params.id });
    await Task.deleteMany({ wedding: req.params.id });

    res.json({ message: 'Wedding deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addTeamMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const wedding = await Wedding.findById(req.params.id);

    if (!wedding) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    const existingMember = wedding.assignedTeam.find(
      m => m.user.toString() === userId
    );

    if (existingMember) {
      existingMember.role = role;
    } else {
      wedding.assignedTeam.push({ user: userId, role });
    }

    await wedding.save();
    await wedding.populate('assignedTeam.user', 'name email avatar');

    res.json({ wedding });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeTeamMember = async (req, res) => {
  try {
    const wedding = await Wedding.findById(req.params.id);

    if (!wedding) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    wedding.assignedTeam = wedding.assignedTeam.filter(
      m => m.user.toString() !== req.params.userId
    );

    await wedding.save();
    await wedding.populate('assignedTeam.user', 'name email avatar');

    res.json({ wedding });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addVendorToWedding = async (req, res) => {
  try {
    const { vendorId, category, amount, notes } = req.body;
    const wedding = await Wedding.findById(req.params.id);

    if (!wedding) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    wedding.vendors.push({
      vendor: vendorId,
      category,
      amount,
      notes
    });

    await wedding.save();
    await wedding.populate('vendors.vendor');

    res.json({ wedding });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeVendorFromWedding = async (req, res) => {
  try {
    const wedding = await Wedding.findById(req.params.id);

    if (!wedding) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    wedding.vendors = wedding.vendors.filter(
      v => v.vendor.toString() !== req.params.vendorId
    );

    await wedding.save();

    res.json({ wedding });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUpcomingWeddings = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const weddings = await Wedding.find({
      weddingDate: { $gte: today, $lte: thirtyDaysLater },
      status: { $in: ['planning', 'in_progress'] }
    })
      .populate('relationshipManager', 'name')
      .sort({ weddingDate: 1 })
      .limit(10);

    res.json({ weddings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
