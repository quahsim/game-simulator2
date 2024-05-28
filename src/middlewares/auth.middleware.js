import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';

export default async function authMiddleware(req, res, next) {
  try {
    // Extract the 'authorization' cookie from the request
    const { authorization } = req.cookies;
    
    // If no 'authorization' cookie is present, throw an error
    if (!authorization) throw new Error('Token does not exist.');

    // Split the 'authorization' cookie value into tokenType and token
    const [tokenType, token] = authorization.split(' ');

    // Check if the token type is 'Bearer', if not, throw an error
    if (tokenType !== 'Bearer')
      throw new Error('Token type does not match.');

    // Verify the token using the 'custom-secret-key'
    const decodedToken = jwt.verify(token, 'custom-secret-key');
    
    // Extract userId from the decoded token
    const userId = decodedToken.userId;

    // Log the userId for debugging purposes
    console.log('User ID extracted from token:', userId);

    // Find the user in the database using the userId from the token
    const user = await prisma.users.findFirst({
      where: { userId: userId },
    });

    // Log the user object retrieved from the database
    console.log('User retrieved from database:', user);
    
    // If the user does not exist, clear the cookie and throw an error
    if (!user) {
      res.clearCookie('authorization');
      throw new Error('Token user does not exist.');
    }

    // Save the user information in req.user for further use
    req.user = user;

    // Call the next middleware function in the stack
    next();
  } catch (error) {
    // Clear the 'authorization' cookie in case of an error
    res.clearCookie('authorization');

    // Handle different types of token errors with specific messages
    switch (error.name) {
      case 'TokenExpiredError':
        return res.status(401).json({ message: 'Token has expired.' });
      case 'JsonWebTokenError':
        return res.status(401).json({ message: 'Token has been tampered with.' });
      default:
        return res
          .status(401)
          .json({ message: error.message ?? 'Abnormal request' });
    }
  }
}
