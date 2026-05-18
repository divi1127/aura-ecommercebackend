import express from 'express';
import {
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  toggleUserBlock,
  getAnalytics,
  getLogs
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/orders', getAllOrders);
router.put('/orders/:id', updateOrderStatus);
router.get('/users', getAllUsers);
router.put('/users/:id/block', toggleUserBlock);
router.get('/analytics', getAnalytics);
router.get('/logs', getLogs);

export default router;
