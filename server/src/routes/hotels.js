import express from 'express';
import { searchHotels } from '../controllers/hotelController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/search', searchHotels);

export default router;
