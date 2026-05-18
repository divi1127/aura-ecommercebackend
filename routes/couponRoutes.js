import express from 'express';
import {
  validateCoupon,
  createCoupon,
  getCoupons
} from '../controllers/couponController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/validate', protect, validateCoupon);
router.route('/')
  .post(protect, adminOnly, createCoupon)
  .get(protect, adminOnly, getCoupons);

export default router;
