import express from 'express';
import { signup, login, refresh, logout } from '../controllers/authController.js';
import { protect, getMe } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);          // new — uses HttpOnly cookie
router.post('/logout', logout);            // new — revokes refresh session
router.get('/me', protect, getMe);

export default router;