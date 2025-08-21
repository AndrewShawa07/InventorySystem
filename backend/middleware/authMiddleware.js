import jwt from 'jsonwebtoken';

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // console.log('Authorization Header:', authHeader); // Log the Authorization header

  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    console.log('No token provided'); // Log if no token is provided
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // console.log('Token verification failed:', err); // Log the error during token verification

      // Handle TokenExpiredError specifically
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired. Please log in again.' });
      }

      // Handle other JWT errors (e.g., invalid token)
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    // console.log('Authenticated User:', user); // Log the
    req.user = user; // Attach the decoded user payload to the request object
    next(); 
  });
};
