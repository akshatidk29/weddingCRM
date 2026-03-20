import fs from 'fs';
import MoodBoard from '../models/MoodBoard.js';

// @desc    Get mood board items (with filtering)
// @route   GET /api/moodboard
export const getMoodBoardItems = async (req, res) => {
  try {
    const { wedding, tag, type, weddingFunction } = req.query;
    const query = {};

    if (wedding) query.wedding = wedding;
    if (type) query.type = type;
    if (weddingFunction) query.weddingFunction = weddingFunction;
    if (tag) query.tags = { $in: [tag] };

    if (req.user.role === 'team_member') {
      // Team members see items for weddings they're assigned to — handled by frontend filtering
    }

    const items = await MoodBoard.find(query)
      .populate('wedding', 'name')
      .populate('linkedEvents', 'name eventDate')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ items });
  } catch (error) {
    console.error('Get mood board error:', error);
    res.status(500).json({ message: 'Failed to load mood board items' });
  }
};

// @desc    Get mood board items linked to a specific event
// @route   GET /api/moodboard/event/:eventId
export const getMoodBoardByEvent = async (req, res) => {
  try {
    const items = await MoodBoard.find({ linkedEvents: req.params.eventId })
      .populate('wedding', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ items });
  } catch (error) {
    console.error('Get mood board by event error:', error);
    res.status(500).json({ message: 'Failed to load event inspiration items' });
  }
};

// @desc    Get single mood board item
// @route   GET /api/moodboard/:id
export const getMoodBoardItem = async (req, res) => {
  try {
    const item = await MoodBoard.findById(req.params.id)
      .populate('wedding', 'name')
      .populate('linkedEvents', 'name eventDate')
      .populate('createdBy', 'name');

    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (error) {
    console.error('Get mood board item error:', error);
    res.status(500).json({ message: 'Failed to load item' });
  }
};

// @desc    Create mood board item
// @route   POST /api/moodboard
export const createMoodBoardItem = async (req, res) => {
  try {
    const { title, type, colorHex, tags, notes, weddingFunction, wedding, linkedEvents, externalMediaUrl } = req.body;

    const data = {
      title,
      type,
      notes,
      weddingFunction: weddingFunction || 'other',
      wedding,
      createdBy: req.user._id
    };

    // Parse tags
    if (tags) {
      data.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags;
    }

    // Parse linkedEvents
    if (linkedEvents) {
      data.linkedEvents = typeof linkedEvents === 'string' ? JSON.parse(linkedEvents) : linkedEvents;
    }

    if (type === 'color') {
      data.colorHex = colorHex;
    } else if (req.file) {
      data.mediaUrl = `/uploads/${req.file.filename}`;
    } else if (externalMediaUrl) {
      data.mediaUrl = externalMediaUrl;
    }

    const item = await MoodBoard.create(data);
    await item.populate('wedding', 'name');
    await item.populate('linkedEvents', 'name eventDate');
    await item.populate('createdBy', 'name');

    res.status(201).json({ item });
  } catch (error) {
    console.error('Create mood board error:', error);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages[0] || 'Validation failed' });
    }
    res.status(500).json({ message: 'Failed to create mood board item' });
  }
};

// @desc    Update mood board item
// @route   PUT /api/moodboard/:id
export const updateMoodBoardItem = async (req, res) => {
  try {
    const existing = await MoodBoard.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Item not found' });

    const { title, colorHex, tags, notes, weddingFunction, linkedEvents } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (colorHex !== undefined) updates.colorHex = colorHex;
    if (notes !== undefined) updates.notes = notes;
    if (weddingFunction !== undefined) updates.weddingFunction = weddingFunction;

    if (tags !== undefined) {
      updates.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags;
    }

    if (linkedEvents !== undefined) {
      updates.linkedEvents = typeof linkedEvents === 'string' ? JSON.parse(linkedEvents) : linkedEvents;
    }

    // Handle new file upload (replace old one)
    if (req.file) {
      if (existing.mediaUrl) {
        const oldPath = '.' + existing.mediaUrl;
        try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch {}
      }
      updates.mediaUrl = `/uploads/${req.file.filename}`;
    }

    const item = await MoodBoard.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('wedding', 'name')
      .populate('linkedEvents', 'name eventDate')
      .populate('createdBy', 'name');

    res.json({ item });
  } catch (error) {
    console.error('Update mood board error:', error);
    res.status(500).json({ message: 'Failed to update item' });
  }
};

// @desc    Delete mood board item
// @route   DELETE /api/moodboard/:id
export const deleteMoodBoardItem = async (req, res) => {
  try {
    const item = await MoodBoard.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Remove uploaded file
    if (item.mediaUrl) {
      const filePath = '.' + item.mediaUrl;
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
    }

    await MoodBoard.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete mood board error:', error);
    res.status(500).json({ message: 'Failed to delete item' });
  }
};

// @desc    Link mood board item to an event
// @route   POST /api/moodboard/:id/link/:eventId
export const linkToEvent = async (req, res) => {
  try {
    const item = await MoodBoard.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (!item.linkedEvents.includes(req.params.eventId)) {
      item.linkedEvents.push(req.params.eventId);
      await item.save();
    }

    await item.populate('linkedEvents', 'name eventDate');
    res.json({ item });
  } catch (error) {
    console.error('Link to event error:', error);
    res.status(500).json({ message: 'Failed to link item to event' });
  }
};

// @desc    Unlink mood board item from an event
// @route   DELETE /api/moodboard/:id/link/:eventId
export const unlinkFromEvent = async (req, res) => {
  try {
    const item = await MoodBoard.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.linkedEvents = item.linkedEvents.filter(e => e.toString() !== req.params.eventId);
    await item.save();

    await item.populate('linkedEvents', 'name eventDate');
    res.json({ item });
  } catch (error) {
    console.error('Unlink from event error:', error);
    res.status(500).json({ message: 'Failed to unlink item from event' });
  }
};

// @desc    Search images using Pixabay API
// @route   GET /api/moodboard/pixabay
export const searchPixabay = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ hits: [] });
    
    if (!process.env.PIXABAY_API) {
      return res.status(500).json({ message: 'Pixabay API key not configured' });
    }

    const url = new URL('https://pixabay.com/api/');
    url.searchParams.append('key', process.env.PIXABAY_API);
    url.searchParams.append('q', q);
    url.searchParams.append('image_type', 'photo');
    url.searchParams.append('safesearch', 'true');
    url.searchParams.append('per_page', '30');

    const response = await fetch(url.toString());
    const data = await response.json();

    res.json({ hits: data.hits || [] });
  } catch (error) {
    console.error('Pixabay search error:', error);
    res.status(500).json({ message: 'Failed to search external images' });
  }
};
