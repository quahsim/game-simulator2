import express from 'express';
import { prisma } from '../utils/prisma/index.js'; 
import bcrypt from 'bcrypt'; 
import jwt from 'jsonwebtoken';
import joi from 'joi';


const router = express.Router();

/** User Sign-up API **/
router.post('/sign-up', async (req, res, next) => {
    const { userId, password, confirmPassword } = req.body;

    try {
        // userId, password, confirm password format & validation
        const schema = joi.object({
            userId: joi.string().regex(/^(?=.*[a-zA-Z])(?=.*\d).*$/).required().error(new Error("Please use a combination of alphabets and numbers for your user ID")),
            password: joi.string().min(6).required().error(new Error("Password must be at least 6 characters long")),
            confirmPassword: joi.any().equal(joi.ref('password')).required().error(new Error("Passwords do not match")),
        });

        // Validate request & ensures that all validation errors are captured and included in the response
        const validationResult = await schema.validateAsync(req.body, { abortEarly: false });

        // Check if the user already exists 
        const isExistUser = await prisma.users.findFirst({
            where: {
                userId,
            },
        });

        if (isExistUser) {
            return res.status(409).json({ message: "User ID already exists" });
        }

        // Hash the password 
        const hashedPassword = await bcrypt.hash(password, 10);

        // Add new user to the Users table 
        const user = await prisma.users.create({
            data: {
                userId,
                password: hashedPassword,
            },
        });

        return res.status(201).json({ message: 'You have successfully signed up!',userId});
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
});

/** User Login API **/
router.post('/login', async (req, res, next) => {
    const { userId, password } = req.body;

    try {
        // Check if userId and password are provided
        if (!userId || !password) {
            return res.status(400).json({ message: "User ID and password are required" });
        }

        // Find the user in the database
        const user = await prisma.users.findFirst({ where: { userId } });

        // Check if user exists
        if (!user) {
            return res.status(401).json({ message: 'User does not exist' });
        }

        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Wrong password. Please try again.' });
        }

        // If the userId & password are correct, create a JWT token
        const token = jwt.sign(
            {
                userId: user.userId,
            },
            'custom-secret-key', 
            { expiresIn: '1h' } // token expiry time
        );

        // Set the token in an HttpOnly cookie
        res.cookie('authorization', `Bearer ${token}`,
        { httpOnly: true, secure: true, sameSite: 'strict' });

        return res.status(200).json({ message: `Welcome back ${userId}` });
    } catch (error) {
        next(error);
    }
});


export default router;