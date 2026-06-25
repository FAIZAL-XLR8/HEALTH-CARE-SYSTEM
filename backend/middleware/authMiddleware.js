const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforextrasecurehealthauth12345');

      // Check User (Patient) collection first
      let account = await User.findById(decoded.id).select('-password');
      
      // If not found, check Doctor collection
      if (!account) {
        account = await Doctor.findById(decoded.id).select('-password');
        if (account) {
          // Add role field dynamically to maintain backward compat
          account = { ...account.toObject(), role: 'doctor', id: account._id };
        }
      } else {
        account = { ...account.toObject(), role: account.role || 'patient', id: account._id };
      }
      
      if (!account) {
        return res.status(401).json({ message: 'Not authorized, account not found' });
      }

      req.user = account;
      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token verification failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admin access required.' });
  }
};

const requireApprovedDoctor = (req, res, next) => {
  if (req.user && req.user.role === 'doctor') {
    if (req.user.status !== 'approved' || !req.user.isVerified) {
      return res.status(403).json({ message: 'Access denied. Doctor profile is not approved or verified.' });
    }
  }
  next();
};

module.exports = { protect, isAdmin, requireApprovedDoctor };
