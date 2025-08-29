// jwtTest.js

import jwt from 'jsonwebtoken';

// Sign the token with a 1-second expiry
const token = jwt.sign(
    { userId: '12345' },
    'your_secret_key',
    { expiresIn: '1s' }
  );
  
  console.log('Token:', token);
  
  // Wait a bit before verifying to see the expiration in action
  setTimeout(() => {
    jwt.verify(token, 'your_secret_key', (err, decoded) => {
      if (err) {
        console.log('Error verifying token:', err.message);
      } else {
        console.log('Decoded token:', decoded);
      }
    });
  }, 2000); // Verify after 2 seconds to trigger expiration
  
