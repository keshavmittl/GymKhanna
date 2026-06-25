import express from 'express';
import { logWater, getTodayWater } from '../controllers/waterController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, logWater);
router.get('/today', protect, getTodayWater);

export default router;