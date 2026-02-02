import express from 'express';
import {
    registerUser,
    authUser,
    activateAccount,
    getUserProfile,
    forgotPassword,
    resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/activate/:token', activateAccount);
router.get('/profile', protect, getUserProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
