import Task from '../models/Task.js';
import Wedding from '../models/Wedding.js';

// @desc    Get global budget summary with wedding budget highlights
// @route   GET /api/budget
// @access  Private
export const getBudget = async (req, res) => {
  try {
    let taskQuery = {
      $or: [
        { 'subtasks.amount': { $ne: 0 } },
        { 'taskVendors.amount': { $ne: 0 } }
      ]
    };

    if (req.user.role === 'client') {
      const userWeddings = await Wedding.find({ clientId: req.user._id }).select('_id');
      taskQuery.wedding = { $in: userWeddings.map(w => w._id) };
    } else if (req.user.role === 'relationship_manager') {
      const userWeddings = await Wedding.find({ relationshipManager: req.user._id }).select('_id');
      taskQuery.wedding = { $in: userWeddings.map(w => w._id) };
    } else if (req.user.role === 'team_member') {
      const userWeddings = await Wedding.find({ 'assignedTeam.user': req.user._id }).select('_id');
      taskQuery.wedding = { $in: userWeddings.map(w => w._id) };
    }

    // Find all tasks that define an amount in either subtasks or taskVendors
    const tasks = await Task.find(taskQuery)
    .populate('wedding', 'name weddingDate budget')
    .populate('taskVendors.vendor', 'name email phone category');

    const budgetItems = [];

    tasks.forEach(task => {
      // Process Subtasks
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach(sub => {
          if (sub.amount !== 0) {
            budgetItems.push({
              _id: sub._id,
              taskId: task._id,
              taskTitle: task.title,
              wedding: task.wedding,
              type: 'subtask',
              name: sub.title,
              amount: sub.amount,
              paidAmount: sub.paidAmount || 0,
              paymentStatus: sub.paymentStatus || 'pending',
              recipient: sub.amount > 0 ? sub.title : 'Client (Receivable)'
            });
          }
        });
      }

      // Process Task Vendors
      if (task.taskVendors && task.taskVendors.length > 0) {
        task.taskVendors.forEach(tv => {
          if (tv.amount !== 0 && tv.vendor) {
            budgetItems.push({
              _id: tv._id,
              taskId: task._id,
              taskTitle: task.title,
              wedding: task.wedding,
              type: 'vendor',
              vendorId: tv.vendor._id,
              name: tv.vendor.name,
              amount: tv.amount,
              paidAmount: tv.paidAmount || 0,
              paymentStatus: tv.paymentStatus || 'pending',
              recipient: tv.amount > 0 ? tv.vendor.name : 'Client (Receivable)'
            });
          }
        });
      }
    });

    // Get all weddings with budget info
    let weddingQuery = { 'budget.estimated': { $gt: 0 } };
    if (req.user.role === 'client') {
      weddingQuery.clientId = req.user._id;
    } else if (req.user.role === 'relationship_manager') {
      weddingQuery.relationshipManager = req.user._id;
    } else if (req.user.role === 'team_member') {
      weddingQuery['assignedTeam.user'] = req.user._id;
    }

    const weddings = await Wedding.find(weddingQuery)
      .select('name weddingDate budget')
      .sort({ weddingDate: 1 });

    // Calculate per-wedding spend from budget items
    const weddingBudgets = weddings.map(w => {
      const weddingItems = budgetItems.filter(
        item => item.wedding && item.wedding._id.toString() === w._id.toString()
      );
      const totalSpent = weddingItems
        .filter(i => i.amount > 0)
        .reduce((sum, i) => sum + Math.abs(i.paidAmount), 0);
      const totalAllocated = weddingItems
        .filter(i => i.amount > 0)
        .reduce((sum, i) => sum + i.amount, 0);

      return {
        _id: w._id,
        name: w.name,
        weddingDate: w.weddingDate,
        estimatedBudget: w.budget?.estimated || 0,
        totalAllocated,
        totalSpent,
        remaining: (w.budget?.estimated || 0) - totalAllocated,
        remainingAfterPayments: (w.budget?.estimated || 0) - totalSpent
      };
    });

    res.json({
      success: true,
      count: budgetItems.length,
      budget: budgetItems,
      weddingBudgets,
      userRole: req.user.role
    });
  } catch (error) {
    console.error('getBudget Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching budget' });
  }
};
