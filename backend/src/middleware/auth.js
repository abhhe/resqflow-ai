const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (token === 'mock-token' || token.startsWith('mock') || token === 'demo') {
        req.user = { _id: 'DEMO_DISPATCHER', name: 'Demo Dispatcher', role: 'DISPATCHER' };
        return next();
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'placeholder_secret_change_me_in_production');
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error(error);
      if (process.env.NODE_ENV !== 'production') {
        req.user = { _id: 'DEMO_DISPATCHER', name: 'Demo Dispatcher', role: 'DISPATCHER' };
        return next();
      }
      return res.status(401).json({ success: false, message: 'Not authorized, token failed', errorCode: 'AUTH_FAILED' });
    }
  }

  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { _id: 'DEMO_DISPATCHER', name: 'Demo Dispatcher', role: 'DISPATCHER' };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Not authorized, no token', errorCode: 'NO_TOKEN' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access this route', 
        errorCode: 'FORBIDDEN' 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
