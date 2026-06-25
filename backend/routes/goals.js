import express from 'express';
import { getGoalStatus, setWeeklyGoal } from '../controllers/goalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getGoalStatus);
router.put('/', protect, setWeeklyGoal);

export default router;