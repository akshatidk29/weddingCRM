import Event from '../models/Event.js';
import Task from '../models/Task.js';
import Wedding from '../models/Wedding.js';

// Helper: check if event should auto-complete/revert based on its tasks
export const checkEventAutoComplete = async (eventId) => {
  if (!eventId) return;

  const event = await Event.findById(eventId);
  if (!event) return;

  const tasks = await Task.find({ event: eventId });

  if (tasks.length === 0) {
    if (event.status !== 'pending') {
      event.status = 'pending';
      await event.save();
    }
    return;
  }

  const allDone = tasks.every(t => t.status === 'done' || t.status === 'verified' || t.status === 'not_needed');
  const someDone = tasks.some(t => t.status === 'done' || t.status === 'verified');

  if (allDone) {
    if (event.status !== 'completed') {
      event.status = 'completed';
      await event.save();
    }
  } else if (someDone) {
    if (event.status !== 'in_progress') {
      event.status = 'in_progress';
      await event.save();
    }
  } else {
    if (event.status !== 'pending') {
      event.status = 'pending';
      await event.save();
    }
  }
};

// @desc    Get all events for a wedding (sorted ascending by eventDate)
// @route   GET /api/events/wedding/:weddingId
export const getEventsByWedding = async (req, res) => {
  try {
    const weddingAuth = await Wedding.findById(req.params.weddingId);
    if (!weddingAuth) return res.status(404).json({ message: 'Wedding not found' });
    if (req.user.role === 'client' && weddingAuth.clientId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'team_member') {
      const isAssigned = weddingAuth.assignedTeam.some(t => t.user.toString() === req.user._id.toString());
      if (!isAssigned) return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'relationship_manager' && weddingAuth.relationshipManager?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const events = await Event.find({ wedding: req.params.weddingId })
      .populate('assignedTeam.user', 'name email avatar')
      .populate('createdBy', 'name')
      .sort({ eventDate: 1 });

    // For each event, get task stats
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const tasks = await Task.find({ event: event._id });
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'done' || t.status === 'verified').length;
        const pending = tasks.filter(t => t.status === 'pending').length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          ...event.toObject(),
          taskStats: { total, completed, pending },
          progress
        };
      })
    );

    res.json({ events: eventsWithStats });
  } catch (error) {
    console.error('Get events by wedding error:', error);
    res.status(500).json({ message: 'Failed to load events. Please try again.' });
  }
};

// @desc    Get single event with tasks
// @route   GET /api/events/:id
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('assignedTeam.user', 'name email avatar')
      .populate('wedding', 'name weddingDate clientName clientId')
      .populate('createdBy', 'name');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (req.user.role === 'client' && event.wedding?.clientId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'team_member') {
      const wedding = await Wedding.findById(event.wedding?._id);
      if (!wedding) return res.status(404).json({ message: 'Wedding not found' });
      const isAssigned = wedding.assignedTeam.some(t => t.user.toString() === req.user._id.toString());
      if (!isAssigned) return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'relationship_manager' && event.wedding?.clientId) {
      const wedding = await Wedding.findById(event.wedding._id);
      if (!wedding || wedding.relationshipManager?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    const tasks = await Task.find({ event: event._id })
      .populate('assignedTo', 'name email')
      .populate('completedBy', 'name')
      .populate('verifiedBy', 'name')
      .populate('taskVendors.vendor', 'name phone email address city category')
      .sort({ dueDate: 1 });

    res.json({ event, tasks });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Failed to load event details. Please try again.' });
  }
};

// @desc    Create event
// @route   POST /api/events
export const createEvent = async (req, res) => {
  try {
    if (req.user.role === 'team_member') {
      return res.status(403).json({ message: 'Team members have view-only access' });
    }

    const { wedding: weddingId, name, eventDate } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Event name is required' });
    }

    if (!eventDate) {
      return res.status(400).json({ message: 'Event date is required' });
    }

    // Verify the wedding exists
    const wedding = await Wedding.findById(weddingId);
    if (!wedding) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    if (req.user.role === 'client' && wedding.clientId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'relationship_manager' && wedding.relationshipManager?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const event = await Event.create({
      ...req.body,
      createdBy: req.user._id
    });

    await event.populate('assignedTeam.user', 'name email avatar');

    res.status(201).json({ event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Failed to create event. Please try again.' });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
export const updateEvent = async (req, res) => {
  try {
    if (req.user.role === 'team_member') {
      return res.status(403).json({ message: 'Team members have view-only access' });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('wedding')
      .populate('assignedTeam.user', 'name email avatar');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (req.user.role === 'client' && event.wedding?.clientId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'relationship_manager') {
      const wedding = await Wedding.findById(event.wedding?._id);
      if (!wedding || wedding.relationshipManager?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    res.json({ event });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Failed to update event. Please try again.' });
  }
};

// @desc    Delete event + cascade delete tasks
// @route   DELETE /api/events/:id
export const deleteEvent = async (req, res) => {
  try {
    if (req.user.role === 'team_member') {
      return res.status(403).json({ message: 'Team members have view-only access' });
    }

    const event = await Event.findById(req.params.id).populate('wedding');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (req.user.role === 'client' && event.wedding?.clientId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'relationship_manager' && event.wedding?.relationshipManager?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Event.findByIdAndDelete(req.params.id);

    // Cascade delete all tasks under this event
    await Task.deleteMany({ event: req.params.id });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Failed to delete event. Please try again.' });
  }
};

// @desc    Add team member to event
// @route   POST /api/events/:id/team
export const addEventTeamMember = async (req, res) => {
  try {
    if (req.user.role === 'team_member' || req.user.role === 'client') {
      return res.status(403).json({ message: 'Not authorized to manage event team members' });
    }

    const { userId, role } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'Team member is required' });
    }
    
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const existingMember = event.assignedTeam.find(
      m => m.user.toString() === userId
    );

    if (existingMember) {
      existingMember.role = role;
    } else {
      event.assignedTeam.push({ user: userId, role });
    }

    await event.save();
    await event.populate('assignedTeam.user', 'name email avatar');

    res.json({ event });
  } catch (error) {
    console.error('Add event team member error:', error);
    res.status(500).json({ message: 'Failed to add team member. Please try again.' });
  }
};

// @desc    Remove team member from event
// @route   DELETE /api/events/:id/team/:userId
export const removeEventTeamMember = async (req, res) => {
  try {
    if (req.user.role === 'team_member' || req.user.role === 'client') {
      return res.status(403).json({ message: 'Not authorized to manage event team members' });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.assignedTeam = event.assignedTeam.filter(
      m => m.user.toString() !== req.params.userId
    );

    await event.save();
    await event.populate('assignedTeam.user', 'name email avatar');

    res.json({ event });
  } catch (error) {
    console.error('Remove event team member error:', error);
    res.status(500).json({ message: 'Failed to remove team member. Please try again.' });
  }
};

// @desc    Client-facing: get events for a wedding (public, no auth)
// @route   GET /api/events/client/:weddingId
export const getClientEvents = async (req, res) => {
  try {
    const wedding = await Wedding.findById(req.params.weddingId)
      .select('name clientName weddingDate endDate venue guestCount');

    if (!wedding) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    const events = await Event.find({ wedding: req.params.weddingId })
      .select('name description eventDate endDate venue status order')
      .sort({ eventDate: 1 });

    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const tasks = await Task.find({ event: event._id })
          .select('title status dueDate category');
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'done' || t.status === 'verified').length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          ...event.toObject(),
          taskStats: { total, completed },
          progress
        };
      })
    );

    res.json({ wedding, events: eventsWithStats });
  } catch (error) {
    console.error('Get client events error:', error);
    res.status(500).json({ message: 'Failed to load event information.' });
  }
};

// @desc    Link Hotel to an Event, adjusting budget or creating tasks automatically
// @route   POST /api/events/:id/hotels
export const addHotelToEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { hotel } = req.body;
    if (!hotel || !hotel.title) {
      return res.status(400).json({ message: 'Hotel details are required' });
    }

    // Attempt to string-parse numeric value out of priceForDisplay
    // Expected formats e.g. "$95", "Rs. 10,000", "£120"
    let numericPrice = 0;
    if (hotel.priceForDisplay && typeof hotel.priceForDisplay === 'string') {
      const cleanString = hotel.priceForDisplay.replace(/[^\d.]/g, ''); 
      if (cleanString) {
        numericPrice = parseFloat(cleanString);
      }
    }

    const wedding = await Wedding.findById(event.wedding);
    if (!wedding) {
      return res.status(404).json({ message: 'Parent wedding not found' });
    }

    const rooms = hotel.roomsSelected || 1;
    const totalHotelCost = numericPrice * rooms;
    
    // We add the hotel to the event array in both cases
    event.hotels.push(hotel);
    await event.save();

    if (numericPrice > 0) {
      // It has a price -> add to wedding budget directly
      wedding.budget.estimated = (wedding.budget.estimated || 0) + totalHotelCost;
      await wedding.save();
    } else {
      // It doesn't have a price -> convert into a task automatically
      await Task.create({
        title: `Find price for hotel: ${hotel.title}`,
        description: `Contact ${hotel.title} to find the price for ${rooms} room(s) for the event '${event.name}'.`,
        category: 'other',
        priority: 'high',
        status: 'pending',
        wedding: wedding._id,
        event: event._id,
        createdBy: req.user._id
      });
      // also recalculate event status based on new task
      await checkEventAutoComplete(event._id);
    }

    // Return the updated event
    await event.populate('assignedTeam.user', 'name email avatar');
    res.status(200).json({ event, message: numericPrice > 0 ? `Added ${totalHotelCost} to wedding budget` : 'Created task to find hotel price' });

  } catch (error) {
    console.error('Add Hotel to Event Error:', error);
    res.status(500).json({ message: 'Failed to link hotel to event.' });
  }
};
