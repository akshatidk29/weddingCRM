import Task from '../models/Task.js';
import Notification from '../models/Notification.js';

export const getTasks = async (req, res) => {
  try {
    const { wedding, category, status, assignedTo } = req.query;
    const query = {};

    if (wedding) query.wedding = wedding;
    if (category) query.category = category;
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    if (req.user.role === 'team_member') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('wedding', 'name weddingDate')
      .populate('assignedTo', 'name email')
      .populate('completedBy', 'name')
      .populate('verifiedBy', 'name')
      .sort({ dueDate: 1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('wedding', 'name weddingDate clientName')
      .populate('assignedTo', 'name email')
      .populate('completedBy', 'name')
      .populate('verifiedBy', 'name')
      .populate('createdBy', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      createdBy: req.user._id
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('wedding', 'name');

    if (task.assignedTo && task.assignedTo._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: task.assignedTo._id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `You have been assigned: ${task.title}`,
        relatedTo: { model: 'Task', id: task._id }
      });
    }

    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBulkTasks = async (req, res) => {
  try {
    const { tasks, wedding } = req.body;

    const createdTasks = await Task.insertMany(
      tasks.map(t => ({
        ...t,
        wedding,
        createdBy: req.user._id
      }))
    );

    res.status(201).json({ tasks: createdTasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email')
      .populate('wedding', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = status;

    if (status === 'done') {
      task.completedAt = new Date();
      task.completedBy = req.user._id;
    } else if (status === 'verified') {
      if (req.user.role !== 'admin' && req.user.role !== 'relationship_manager') {
        return res.status(403).json({ message: 'Only admins can verify tasks' });
      }
      task.verifiedAt = new Date();
      task.verifiedBy = req.user._id;
    } else if (status === 'pending') {
      task.completedAt = null;
      task.completedBy = null;
      task.verifiedAt = null;
      task.verifiedBy = null;
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('completedBy', 'name');
    await task.populate('verifiedBy', 'name');

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTasksByWedding = async (req, res) => {
  try {
    const tasks = await Task.find({ wedding: req.params.weddingId })
      .populate('assignedTo', 'name email')
      .populate('completedBy', 'name')
      .populate('verifiedBy', 'name')
      .sort({ category: 1, dueDate: 1 });

    const byCategory = tasks.reduce((acc, task) => {
      if (!acc[task.category]) acc[task.category] = [];
      acc[task.category].push(task);
      return acc;
    }, {});

    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      done: tasks.filter(t => t.status === 'done').length,
      verified: tasks.filter(t => t.status === 'verified').length,
      notNeeded: tasks.filter(t => t.status === 'not_needed').length
    };

    res.json({ tasks, byCategory, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ 
      assignedTo: req.user._id,
      status: { $in: ['pending', 'done'] }
    })
      .populate('wedding', 'name weddingDate')
      .sort({ dueDate: 1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOverdueTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      dueDate: { $lt: new Date() },
      status: 'pending'
    })
      .populate('wedding', 'name weddingDate')
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
