import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Not authorised, please login',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (jwtErr) {
      // Distinguish expired tokens from genuinely invalid ones so the
      // frontend interceptor can decide whether to attempt a refresh.
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          data: null,
          message: 'Access token expired',
          code: 'TOKEN_EXPIRED',          // ← client inspects this
        });
      }
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Not authorized, invalid token',
        code: 'TOKEN_INVALID',
      });
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'User no longer exists',
        code: 'TOKEN_INVALID',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
};

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
    message: '',
  });
};
