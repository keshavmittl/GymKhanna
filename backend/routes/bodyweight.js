import express from 'express';
import { logWeight, getWeightHistory, setGoalWeight } from '../controllers/bodyWeightController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, logWeight);
router.get('/', protect, getWeightHistory);
router.put('/goal', protect, setGoalWeight);

export default router;