import express from 'express';
import { createSession, getSessions, getSessionById, deleteSession, getPRs, getDashboardStats } from '../controllers/sessionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createSession);
router.get('/', protect, getSessions);
router.get('/prs', protect, getPRs);
router.get('/stats', protect, getDashboardStats);
router.get('/:id', protect, getSessionById);
router.delete('/:id', protect, deleteSession);

export default router;