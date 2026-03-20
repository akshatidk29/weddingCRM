import Lead from '../models/Lead.js';
import Wedding from '../models/Wedding.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';

export const getDashboardStats = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'team_member') {
      query.assignedTo = req.user._id;
    }

    const totalLeads = await Lead.countDocuments(query);
    const leadsByStage = await Lead.aggregate([
      { $match: query },
      { $group: { _id: '$stage', count: { $sum: 1 } } }
    ]);

    const weddingQuery = req.user.role === 'team_member' 
      ? { 'assignedTeam.user': req.user._id }
      : {};

    const activeWeddings = await Wedding.countDocuments({
      ...weddingQuery,
      status: { $in: ['planning', 'in_progress'] }
    });

    const taskQuery = req.user.role === 'team_member'
      ? { assignedTo: req.user._id }
      : {};

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

    const newLeadsThisMonth = await Lead.countDocuments({
      ...query,
      createdAt: { $gte: thisMonth }
    });

    const conversions = await Lead.countDocuments({
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
    const recentLeads = await Lead.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name stage createdAt');

    const recentWeddings = await Wedding.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name clientName weddingDate');

    const upcomingTasks = await Task.find({
      status: 'pending',
      dueDate: { $gte: new Date() }
    })
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
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const leadsPerMonth = await Lead.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
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
