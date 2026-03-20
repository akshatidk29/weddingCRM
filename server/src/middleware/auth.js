import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

export const isAdminOrManager = (req, res, next) => {
  if (!['admin', 'relationship_manager'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  next();
};

export const isAdminManagerOrClient = (req, res, next) => {
  if (!['admin', 'relationship_manager', 'client'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  next();
};
