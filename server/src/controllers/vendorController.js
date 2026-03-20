import Vendor from '../models/Vendor.js';
import Task from '../models/Task.js';
import Wedding from '../models/Wedding.js';

export const getVendors = async (req, res) => {
  try {
    const { category, search, priceRange } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (priceRange) query.priceRange = priceRange;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } }
      ];
    }

    if (req.user.role === 'team_member') {
      const assignedWeddings = await Wedding.find({ 'assignedTeam.user': req.user._id }).select('_id');
      const weddingIds = assignedWeddings.map(w => w._id);
      
      const tasks = await Task.find({ wedding: { $in: weddingIds } }).select('taskVendors.vendor');
      const vendorIds = new Set();
      tasks.forEach(t => t.taskVendors.forEach(tv => {
        if (tv.vendor) vendorIds.add(tv.vendor.toString());
      }));
      
      const weddingsWithVendors = await Wedding.find({ _id: { $in: weddingIds } }).select('vendors.vendor');
      weddingsWithVendors.forEach(w => w.vendors.forEach(v => {
        if (v.vendor) vendorIds.add(v.vendor.toString());
      }));
      
      query._id = { $in: Array.from(vendorIds) };
    }

    const vendors = await Vendor.find(query)
      .sort({ name: 1 });

    res.json({ vendors });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ message: 'Failed to load vendors. Please try again.' });
  }
};

export const getVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({ vendor });
  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({ message: 'Failed to load vendor details. Please try again.' });
  }
};

export const createVendor = async (req, res) => {
  try {
    const { name, category, contactPerson, email, phone } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ message: 'Vendor name and category are required' });
    }

    const vendor = await Vendor.create({
      ...req.body,
      createdBy: req.user._id
    });

    res.status(201).json({ vendor });
  } catch (error) {
    console.error('Create vendor error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A vendor with this name already exists' });
    }
    res.status(500).json({ message: 'Failed to create vendor. Please try again.' });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Cascade update amount if provided
    if (req.body.amount !== undefined) {
      await Task.updateMany(
        { 'taskVendors.vendor': req.params.id },
        { $set: { 'taskVendors.$[elem].amount': req.body.amount } },
        { arrayFilters: [{ 'elem.vendor': req.params.id }] }
      );
      await Wedding.updateMany(
        { 'vendors.vendor': req.params.id },
        { $set: { 'vendors.$[elem].amount': req.body.amount } },
        { arrayFilters: [{ 'elem.vendor': req.params.id }] }
      );
    }

    res.json({ vendor });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ message: 'Failed to update vendor. Please try again.' });
  }
};

export const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({ message: 'Vendor deactivated successfully' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({ message: 'Failed to delete vendor. Please try again.' });
  }
};

export const getVendorsByCategory = async (req, res) => {
  try {
    const vendors = await Vendor.find({ isActive: true });
    
    const byCategory = vendors.reduce((acc, vendor) => {
      if (!acc[vendor.category]) acc[vendor.category] = [];
      acc[vendor.category].push(vendor);
      return acc;
    }, {});

    res.json({ vendors: byCategory });
  } catch (error) {
    console.error('Get vendors by category error:', error);
    res.status(500).json({ message: 'Failed to load vendors. Please try again.' });
  }
};

// Get linked events & weddings for a vendor
export const getVendorLinkedEvents = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const tasks = await Task.find({ 'taskVendors.vendor': vendorId })
      .populate('event', 'name eventDate status')
      .populate('wedding', 'name weddingDate');

    // Deduplicate events
    const eventsMap = {};
    const weddingsMap = {};

    tasks.forEach(task => {
      if (task.event) {
        eventsMap[task.event._id.toString()] = task.event;
      }
      if (task.wedding) {
        weddingsMap[task.wedding._id.toString()] = task.wedding;
      }
    });

    res.json({
      events: Object.values(eventsMap),
      weddings: Object.values(weddingsMap)
    });
  } catch (error) {
    console.error('Get vendor linked events error:', error);
    res.status(500).json({ message: 'Failed to load vendor events. Please try again.' });
  }
};
