import Lead from '../models/Lead.js';
import Wedding from '../models/Wedding.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';

export const getDashboardStats = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'team_member') {
      query.assignedTo = req.user._id;
    } else if (req.user.role === 'relationship_manager') {
      query.assignedTo = req.user._id;
    }
    
    // Clients have 0 leads
    const isClient = req.user.role === 'client';
    const isRM = req.user.role === 'relationship_manager';
    const totalLeads = isClient ? 0 : await Lead.countDocuments(query);
    const leadsByStage = isClient ? [] : await Lead.aggregate([
      { $match: query },
      { $group: { _id: '$stage', count: { $sum: 1 } } }
    ]);

    let weddingQuery = {};
    if (req.user.role === 'team_member') {
      weddingQuery = { 'assignedTeam.user': req.user._id };
    } else if (req.user.role === 'client') {
      weddingQuery = { clientId: req.user._id };
    } else if (req.user.role === 'relationship_manager') {
      weddingQuery = { relationshipManager: req.user._id };
    }

    const activeWeddings = await Wedding.countDocuments({
      ...weddingQuery,
      status: { $in: ['planning', 'in_progress'] }
    });

    let taskQuery = {};
    if (req.user.role === 'team_member') {
      taskQuery = { assignedTo: req.user._id };
    } else if (req.user.role === 'client') {
      const userWeddings = await Wedding.find({ clientId: req.user._id }).select('_id');
      taskQuery = { wedding: { $in: userWeddings.map(w => w._id) } };
    } else if (req.user.role === 'relationship_manager') {
      const userWeddings = await Wedding.find({ relationshipManager: req.user._id }).select('_id');
      taskQuery = { wedding: { $in: userWeddings.map(w => w._id) } };
    }

    const pendingTasks = await Task.countDocuments({
      ...taskQuery,
      status: 'pending'
    });

    const overdueTasks = await Task.countDocuments({
      ...taskQuery,
      status: 'pending',
      dueDate: { $lt: new Date() }
    });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const newLeadsThisMonth = isClient ? 0 : await Lead.countDocuments({
      ...query,
      createdAt: { $gte: thisMonth }
    });

    const conversions = isClient ? 0 : await Lead.countDocuments({
      ...query,
      stage: 'booked',
      updatedAt: { $gte: thisMonth }
    });

    const conversionRate = totalLeads > 0 
      ? Math.round((leadsByStage.find(s => s._id === 'booked')?.count || 0) / totalLeads * 100)
      : 0;

    res.json({
      stats: {
        totalLeads,
        activeWeddings,
        pendingTasks,
        overdueTasks,
        newLeadsThisMonth,
        conversions,
        conversionRate,
        leadsByStage: leadsByStage.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to load dashboard. Please try again.' });
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    const isClient = req.user.role === 'client';

    const recentLeads = isClient ? [] : await Lead.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name stage createdAt');

    let weddingQuery = {};
    if (req.user.role === 'team_member') {
      weddingQuery = { 'assignedTeam.user': req.user._id };
    } else if (isClient) {
      weddingQuery = { clientId: req.user._id };
    } else if (req.user.role === 'relationship_manager') {
      weddingQuery = { relationshipManager: req.user._id };
    }

    const recentWeddings = await Wedding.find(weddingQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name clientName weddingDate');

    let taskQuery = {
      status: 'pending',
      dueDate: { $gte: new Date() }
    };
    if (req.user.role === 'team_member') {
      taskQuery.assignedTo = req.user._id;
    } else if (isClient) {
      const userWeddings = await Wedding.find({ clientId: req.user._id }).select('_id');
      taskQuery.wedding = { $in: userWeddings.map(w => w._id) };
    } else if (req.user.role === 'relationship_manager') {
      const userWeddings = await Wedding.find({ relationshipManager: req.user._id }).select('_id');
      taskQuery.wedding = { $in: userWeddings.map(w => w._id) };
    }

    const upcomingTasks = await Task.find(taskQuery)
      .sort({ dueDate: 1 })
      .limit(5)
      .populate('wedding', 'name')
      .select('title dueDate category wedding');

    res.json({
      recentLeads,
      recentWeddings,
      upcomingTasks
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ message: 'Failed to load recent activity.' });
  }
};

export const getMonthlyStats = async (req, res) => {
  try {
    if (req.user.role === 'client') {
      return res.json({ leadsPerMonth: [], conversionsPerMonth: [] });
    }

    const matchQuery = {};
    if (req.user.role === 'relationship_manager') {
      matchQuery.assignedTo = req.user._id;
    } else if (req.user.role === 'team_member') {
      matchQuery.assignedTo = req.user._id;
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const leadsPerMonth = await Lead.aggregate([
      { $match: { ...matchQuery, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const conversionsPerMonth = await Lead.aggregate([
      { 
        $match: { 
          ...matchQuery,
          stage: 'booked',
          updatedAt: { $gte: sixMonthsAgo } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      leadsPerMonth,
      conversionsPerMonth
    });
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({ message: 'Failed to load statistics.' });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to load notifications.' });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Failed to update notification.' });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Failed to update notifications.' });
  }
};
