import Vendor from '../models/Vendor.js';

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

    const vendors = await Vendor.find(query)
      .sort({ name: 1 });

    res.json({ vendors });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
  }
};

export const createVendor = async (req, res) => {
  try {
    const vendor = await Vendor.create({
      ...req.body,
      createdBy: req.user._id
    });

    res.status(201).json({ vendor });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    res.json({ vendor });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    res.json({ message: 'Vendor deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
  }
};
