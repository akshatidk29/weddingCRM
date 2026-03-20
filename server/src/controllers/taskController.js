import Task from '../models/Task.js';
import Vendor from '../models/Vendor.js';
import Notification from '../models/Notification.js';
import Wedding from '../models/Wedding.js';
import { checkEventAutoComplete } from './eventController.js';

// Helper: check if task should auto-complete based on subtasks + vendors
const checkAutoComplete = async (task, userId) => {
  // Don't touch verified tasks — admin-locked
  if (task.status === 'verified') return;

  const allSubtasksDone = task.subtasks.length === 0 || task.subtasks.every(s => s.completed);
  const allVendorsDone = task.taskVendors.length === 0 || task.taskVendors.every(v => v.status === 'completed');

  if (allSubtasksDone && allVendorsDone) {
    if (task.status !== 'done') {
      task.status = 'done';
      task.completedAt = new Date();
      task.completedBy = userId;
    }
  } else {
    if (task.status === 'done') {
      task.status = 'pending';
      task.completedAt = null;
      task.completedBy = null;
    }
  }
};

export const getTasks = async (req, res) => {
  try {
    const { wedding, category, status, assignedTo, event } = req.query;
    const query = {};

    if (wedding) query.wedding = wedding;
    if (category) query.category = category;
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (event) query.event = event;

    if (req.user.role === 'team_member') {
      query.assignedTo = req.user._id;
    } else if (req.user.role === 'client') {
      const userWeddings = await Wedding.find({ clientId: req.user._id }).select('_id');
      const allowedWeddings = userWeddings.map(w => w._id.toString());
      if (query.wedding && !allowedWeddings.includes(query.wedding.toString())) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      if (!query.wedding) query.wedding = { $in: allowedWeddings };
    }

    const tasks = await Task.find(query)
      .populate('wedding', 'name weddingDate')
      .populate('event', 'name eventDate')
      .populate('assignedTo', 'name email')
      .populate('completedBy', 'name')
      .populate('verifiedBy', 'name')
      .populate('taskVendors.vendor', 'name phone email address city category')
      .sort({ dueDate: 1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('wedding', 'name weddingDate clientName clientId')
      .populate('event', 'name eventDate')
      .populate('assignedTo', 'name email')
      .populate('completedBy', 'name')
      .populate('verifiedBy', 'name')
      .populate('createdBy', 'name')
      .populate('taskVendors.vendor', 'name phone email address city category');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role === 'client' && task.wedding?.clientId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

export const createTask = async (req, res) => {
  try {
    const { taskVendors: vendorInputs, ...taskData } = req.body;
    
    // Process vendor inputs: create or find vendors in global collection
    let processedVendors = [];
    if (vendorInputs && vendorInputs.length > 0) {
      for (const vi of vendorInputs) {
        let vendor;
        if (vi.vendor) {
          // Already a vendor ID reference
          vendor = await Vendor.findById(vi.vendor);
        } else if (vi.name) {
          // Find or create vendor by name
          vendor = await Vendor.findOne({ name: { $regex: new RegExp(`^${vi.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, isActive: true });
          if (!vendor) {
            vendor = await Vendor.create({
              name: vi.name,
              phone: vi.phone || vi.contactNumber || '',
              email: vi.email || '',
              address: vi.address || '',
              city: vi.city || '',
              category: vi.category || 'other',
              contactPerson: vi.name,
              createdBy: req.user._id
            });
          } else {
            // Update vendor with any new info provided
            const updates = {};
            if (vi.phone || vi.contactNumber) updates.phone = vi.phone || vi.contactNumber;
            if (vi.email) updates.email = vi.email;
            if (vi.address) updates.address = vi.address;
            if (vi.city) updates.city = vi.city;
            if (Object.keys(updates).length > 0) {
              await Vendor.findByIdAndUpdate(vendor._id, updates);
            }
          }
        }
        if (vendor) {
          processedVendors.push({ vendor: vendor._id, status: 'pending', amount: vi.amount || 0, paidAmount: vi.paidAmount || 0, paymentStatus: vi.paymentStatus || 'pending' });
        }
      }
    }

    const task = await Task.create({
      ...taskData,
      taskVendors: processedVendors,
      createdBy: req.user._id
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('wedding', 'name');
    await task.populate('taskVendors.vendor', 'name phone email address city category');

    if (task.assignedTo && task.assignedTo._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: task.assignedTo._id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `You have been assigned: ${task.title}`,
        relatedTo: { model: 'Task', id: task._id }
      });
    }

    if (taskData.wedding) {
      const weddingCheck = await Wedding.findById(taskData.wedding);
      if (req.user.role === 'client' && weddingCheck?.clientId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

export const createBulkTasks = async (req, res) => {
  try {
    const { tasks, wedding } = req.body;

    const weddingCheck = await Wedding.findById(wedding);
    if (req.user.role === 'client' && weddingCheck?.clientId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const createdTasks = await Task.insertMany(
      tasks.map(t => ({
        ...t,
        wedding,
        createdBy: req.user._id
      }))
    );

    res.status(201).json({ tasks: createdTasks });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { taskVendors: vendorInputs, ...taskData } = req.body;
    
    // Process vendor inputs if provided
    if (vendorInputs) {
      let processedVendors = [];
      for (const vi of vendorInputs) {
        let vendor;
        if (vi.vendor && typeof vi.vendor === 'object') {
          // Already populated vendor object
          vendor = await Vendor.findById(vi.vendor._id || vi.vendor);
        } else if (vi.vendor) {
          vendor = await Vendor.findById(vi.vendor);
        } else if (vi.name) {
          vendor = await Vendor.findOne({ name: { $regex: new RegExp(`^${vi.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, isActive: true });
          if (!vendor) {
            vendor = await Vendor.create({
              name: vi.name,
              phone: vi.phone || vi.contactNumber || '',
              email: vi.email || '',
              address: vi.address || '',
              city: vi.city || '',
              category: vi.category || 'other',
              contactPerson: vi.name,
              createdBy: req.user._id
            });
          }
        }
        if (vendor) {
          processedVendors.push({ 
            vendor: vendor._id, 
            status: vi.status || 'pending',
            completedAt: vi.completedAt || null,
            amount: vi.amount || 0,
            paidAmount: vi.paidAmount || 0,
            paymentStatus: vi.paymentStatus || 'pending'
          });
        }
      }
      taskData.taskVendors = processedVendors;
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      taskData,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email')
      .populate('wedding', 'name clientId')
      .populate('taskVendors.vendor', 'name phone email address city category');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role === 'client' && task.wedding?.clientId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const weddingCheck = await Wedding.findById(task.wedding);
    if (req.user.role === 'client' && weddingCheck?.clientId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (status === 'verified') {
      if (req.user.role !== 'admin' && req.user.role !== 'relationship_manager') {
        return res.status(403).json({ message: 'Only admins can verify tasks' });
      }
      task.status = 'verified';
      task.verifiedAt = new Date();
      task.verifiedBy = req.user._id;
    } else if (status === 'done') {
      const hasSubtasks = task.subtasks.length > 0;
      const hasVendors = task.taskVendors.length > 0;

      if (hasSubtasks || hasVendors) {
        const allSubtasksDone = task.subtasks.every(s => s.completed);
        const allVendorsDone = task.taskVendors.every(v => v.status === 'completed');

        if (!allSubtasksDone || !allVendorsDone) {
          const remaining = [];
          if (!allSubtasksDone) {
            const pendingCount = task.subtasks.filter(s => !s.completed).length;
            remaining.push(`${pendingCount} subtask(s)`);
          }
          if (!allVendorsDone) {
            const pendingCount = task.taskVendors.filter(v => v.status !== 'completed').length;
            remaining.push(`${pendingCount} vendor(s)`);
          }
          return res.status(400).json({ 
            message: `Cannot mark as done. Remaining: ${remaining.join(' and ')}` 
          });
        }
      }

      task.status = 'done';
      task.completedAt = new Date();
      task.completedBy = req.user._id;
    } else if (status === 'pending') {
      task.status = 'pending';
      task.completedAt = null;
      task.completedBy = null;
      task.verifiedAt = null;
      task.verifiedBy = null;
    } else if (status === 'not_needed') {
      task.status = 'not_needed';
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('completedBy', 'name');
    await task.populate('verifiedBy', 'name');
    await task.populate('taskVendors.vendor', 'name phone email address city category');

    // Check if event should auto-complete
    if (task.event) {
      await checkEventAutoComplete(task.event);
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const taskCheck = await Task.findById(req.params.id);
    if (!taskCheck) return res.status(404).json({ message: 'Task not found' });

    const weddingCheck = await Wedding.findById(taskCheck.wedding);
    if (req.user.role === 'client' && weddingCheck?.clientId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

export const getTasksByWedding = async (req, res) => {
  try {
    const weddingCheck = await Wedding.findById(req.params.weddingId);
    if (req.user.role === 'client' && weddingCheck?.clientId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const tasks = await Task.find({ wedding: req.params.weddingId })
      .populate('assignedTo', 'name email')
      .populate('completedBy', 'name')
      .populate('verifiedBy', 'name')
      .populate('taskVendors.vendor', 'name phone email address city category')
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
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ 
      assignedTo: req.user._id,
      status: { $in: ['pending', 'done'] }
    })
      .populate('wedding', 'name weddingDate')
      .populate('taskVendors.vendor', 'name phone email')
      .sort({ dueDate: 1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
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
      .populate('taskVendors.vendor', 'name phone email')
      .sort({ dueDate: 1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

// ===== SUBTASK ENDPOINTS =====

export const addSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, amount } = req.body;
    task.subtasks.push({ title, amount: amount || 0 });
    await checkAutoComplete(task, req.user._id);
    await task.save();
    await task.populate('taskVendors.vendor', 'name phone email address city category');

    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

export const toggleSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const subtask = task.subtasks.id(req.params.subId);
    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    subtask.completed = !subtask.completed;
    subtask.completedAt = subtask.completed ? new Date() : null;

    await checkAutoComplete(task, req.user._id);
    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('completedBy', 'name');
    await task.populate('verifiedBy', 'name');
    await task.populate('taskVendors.vendor', 'name phone email address city category');

    // Check if event should auto-complete
    if (task.event) {
      await checkEventAutoComplete(task.event);
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

export const deleteSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.subtasks.pull({ _id: req.params.subId });
    await checkAutoComplete(task, req.user._id);
    await task.save();

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

// ===== TASK VENDOR ENDPOINTS =====

export const addTaskVendor = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { name, phone, contactNumber, email, address, city, category, vendorId, amount } = req.body;
    
    let vendor;
    if (vendorId) {
      vendor = await Vendor.findById(vendorId);
    } else if (name) {
      // Find or create vendor
      vendor = await Vendor.findOne({ name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, isActive: true });
      if (!vendor) {
        vendor = await Vendor.create({
          name,
          phone: phone || contactNumber || '',
          email: email || '',
          address: address || '',
          city: city || '',
          category: category || 'other',
          contactPerson: name,
          createdBy: req.user._id
        });
      } else {
        // Update with any new info
        const updates = {};
        if (phone || contactNumber) updates.phone = phone || contactNumber;
        if (email) updates.email = email;
        if (address) updates.address = address;
        if (city) updates.city = city;
        if (Object.keys(updates).length > 0) {
          await Vendor.findByIdAndUpdate(vendor._id, updates);
        }
      }
    }

    if (!vendor) {
      return res.status(400).json({ message: 'Vendor name or ID is required' });
    }

    // Check if vendor already linked
    const alreadyLinked = task.taskVendors.some(tv => tv.vendor.toString() === vendor._id.toString());
    if (alreadyLinked) {
      return res.status(400).json({ message: 'Vendor already linked to this task' });
    }

    task.taskVendors.push({ vendor: vendor._id, status: 'pending', amount: amount || 0 });
    await checkAutoComplete(task, req.user._id);
    await task.save();
    await task.populate('taskVendors.vendor', 'name phone email address city category');

    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

export const updateTaskVendorStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const taskVendor = task.taskVendors.id(req.params.vendorId);
    if (!taskVendor) {
      return res.status(404).json({ message: 'Vendor not found in this task' });
    }

    taskVendor.status = req.body.status;
    taskVendor.completedAt = req.body.status === 'completed' ? new Date() : null;

    await checkAutoComplete(task, req.user._id);
    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('completedBy', 'name');
    await task.populate('verifiedBy', 'name');
    await task.populate('wedding', 'name weddingDate');
    await task.populate('taskVendors.vendor', 'name phone email address city category');

    // Check if event should auto-complete
    if (task.event) {
      await checkEventAutoComplete(task.event);
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

export const deleteTaskVendor = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.taskVendors.pull({ _id: req.params.vendorId });
    await checkAutoComplete(task, req.user._id);
    await task.save();

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

// Get tasks for a specific vendor ID
export const getTasksByVendorId = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const tasks = await Task.find({ 'taskVendors.vendor': vendorId })
      .populate('wedding', 'name weddingDate')
      .populate('event', 'name eventDate status')
      .populate('assignedTo', 'name email')
      .populate('taskVendors.vendor', 'name phone email')
      .sort({ dueDate: 1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

// Toggle vendor completion across ALL tasks
export const toggleVendorAcrossTasks = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status } = req.body; // 'completed' or 'pending'

    // Find all tasks that have this vendor
    const tasks = await Task.find({ 'taskVendors.vendor': vendorId });

    for (const task of tasks) {
      const vendorEntry = task.taskVendors.find(tv => tv.vendor.toString() === vendorId);
      if (vendorEntry) {
        vendorEntry.status = status;
        vendorEntry.completedAt = status === 'completed' ? new Date() : null;
        await checkAutoComplete(task, req.user._id);
        await task.save();
      }
    }

    // Return updated tasks for the vendor
    const updatedTasks = await Task.find({ 'taskVendors.vendor': vendorId })
      .populate('wedding', 'name weddingDate')
      .populate('taskVendors.vendor', 'name phone email')
      .sort({ dueDate: 1 });

    res.json({ tasks: updatedTasks });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const { id, type, itemId } = req.params;
    const { paidAmount } = req.body;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    let item;
    if (type === 'subtask') {
      item = task.subtasks.id(itemId);
    } else if (type === 'vendor') {
      item = task.taskVendors.id(itemId);
    } else {
      return res.status(400).json({ message: 'Invalid payment type' });
    }

    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.paidAmount = Number(paidAmount) || 0;

    if (item.paidAmount === 0) {
      item.paymentStatus = 'pending';
    } else if (Math.abs(item.paidAmount) >= Math.abs(item.amount)) {
      item.paymentStatus = 'completed';
    } else {
      item.paymentStatus = 'partial';
    }

    await task.save();
    
    await task.populate('assignedTo', 'name email');
    await task.populate('completedBy', 'name');
    await task.populate('verifiedBy', 'name');
    await task.populate('taskVendors.vendor', 'name phone email address city category');

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Operation failed. Please try again.' });
  }
};

