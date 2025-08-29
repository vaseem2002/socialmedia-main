import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  try {
    console.log('Incoming headers:', JSON.stringify(req.headers, null, 2)); // Debug all headers

    // More robust header extraction with case-insensitive check
    const authHeader =
      req.headers.authorization ||
      req.headers.Authorization ||
      req.headers['authorization'] ||
      req.headers['Authorization'];

    if (!authHeader) {
      console.log('No Authorization header found');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        solution: "Please include 'Authorization: Bearer <token>' header",
      });
    }

    // Normalize spaces and extract token
    const normalizedHeader = authHeader.replace(/\s+/g, ' ').trim();
    const [prefix, token] = normalizedHeader.split(' ');

    if (!prefix || !token) {
      console.log('Malformed Authorization header:', authHeader);
      return res.status(401).json({
        success: false,
        message: 'Access denied. Malformed token format.',
        expectedFormat: 'Bearer <token>',
        received: authHeader,
      });
    }

    if (prefix.toLowerCase() !== 'bearer') {
      console.log('Invalid token prefix:', prefix);
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token prefix.',
        expected: 'Bearer',
        received: prefix,
      });
    }

    console.log('Token extracted:', token); // Debug

    // Verify token with additional checks
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      ignoreExpiration: false,
    });
    // Accept either id or _id in token
    const userId = decoded._id || decoded.id;
    if (!userId) {
      console.log('Token missing user identifier:', decoded);
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token payload invalid.',
        details: "Token must contain either 'id' or '_id' field",
      });
    }

    req.user = {
      _id: decoded._id || decoded.id, // Accepts either field
      role: decoded.role || 'member'
    };

    console.log('Authenticated user:', req.user); // Debug
    next();
  } catch (error) {
    console.error('Auth error:', error);

    const response = {
      success: false,
      message: 'Authentication failed',
      error: error.name,
    };

    if (error.name === 'TokenExpiredError') {
      response.message = 'Session expired. Please log in again.';
      response.expiredAt = error.expiredAt;
    } else if (error.name === 'JsonWebTokenError') {
      response.message = 'Invalid token. Please log in again.';
      response.details = error.message;
    }

    return res.status(401).json(response);
  }
};

export default authMiddleware;
