// Example of a secure Next.js API route

import { getSession } from 'next-auth/react';
import { hash, compare } from 'bcrypt';

// Input validation utility
const validateInput = (data) => {
  const errors = {};
  
  if (!data.username || data.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  }
  
  if (!data.password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(data.password)) {
    errors.password = 'Password must be at least 8 characters with uppercase, lowercase, and numbers';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Rate limiting middleware example
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: (req) => {
    return req.headers['x-real-ip'] || req.connection.remoteAddress;
  },
  handler: (_, res) => {
    return res.status(429).json({
      error: 'Too many requests, please try again later.'
    });
  }
};

// Secure API handler with authentication, validation, and rate limiting
export default async function handler(req, res) {
  // Check HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Apply rate limiting
    await new Promise((resolve) => rateLimit.handler(req, res, resolve));
    
    // Authenticate user
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Validate input
    const { isValid, errors } = validateInput(req.body);
    if (!isValid) {
      return res.status(400).json({ errors });
    }
    
    // Process the request
    const hashedPassword = await hash(req.body.password, 10);
    
    // Store in database (example)
    // const result = await db.user.update({ ... });
    
    // Return successful response (don't include sensitive data)
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('API error:', error);
    
    // Don't expose error details to client
    return res.status(500).json({
      error: 'An unexpected error occurred'
    });
  }
}
