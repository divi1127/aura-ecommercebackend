import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import AdminActivityLog from '../models/AdminActivityLog.js';

// @desc    Get all orders (Admin only)
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  const { status } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    order.orderStatus = status;

    if (status === 'Delivered') {
      order.deliveredAt = Date.now();
      order.paymentInfo.status = 'Succeeded'; // enforce completion
    }

    await order.save();

    // Log Activity
    await AdminActivityLog.create({
      admin: req.user._id,
      action: 'UPDATE_ORDER_STATUS',
      details: `Updated order ${order._id} status to ${status}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle block/unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
export const toggleUserBlock = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'admin') {
      res.status(400);
      throw new Error('Cannot block administrative accounts');
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    // Log Activity
    await AdminActivityLog.create({
      admin: req.user._id,
      action: user.isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER',
      details: `${user.isBlocked ? 'Blocked' : 'Unblocked'} user ${user.email} (${user._id})`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `User has been successfully ${user.isBlocked ? 'blocked' : 'unblocked'}`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAnalytics = async (req, res, next) => {
  try {
    // 1. Total Revenue
    const completedOrders = await Order.find({ orderStatus: { $ne: 'Cancelled' } });
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);

    // 2. Count metrics
    const totalOrders = await Order.countDocuments({});
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments({});

    // 3. Best Selling Products (Aggregation/Calculation)
    const productSales = {};
    completedOrders.forEach(order => {
      order.orderItems.forEach(item => {
        const prodId = item.product.toString();
        if (!productSales[prodId]) {
          productSales[prodId] = {
            id: prodId,
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[prodId].quantity += item.quantity;
        productSales[prodId].revenue += item.price * item.quantity;
      });
    });

    const bestSellers = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 4. Monthly sales dataset for analytics charting (Past 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = {};

    // Initialize past 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mLabel = months[d.getMonth()] + ' ' + d.getFullYear().toString().substr(-2);
      monthlyData[mLabel] = { month: mLabel, sales: 0, orders: 0 };
    }

    completedOrders.forEach(order => {
      const oDate = new Date(order.createdAt);
      const mLabel = months[oDate.getMonth()] + ' ' + oDate.getFullYear().toString().substr(-2);
      if (monthlyData[mLabel]) {
        monthlyData[mLabel].sales += order.totalPrice;
        monthlyData[mLabel].orders += 1;
      }
    });

    const salesHistory = Object.values(monthlyData);

    // 5. Recent orders
    const recentOrders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        totalUsers,
        totalProducts,
        bestSellers,
        salesHistory,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Admin Activity Logs
// @route   GET /api/admin/logs
// @access  Private/Admin
export const getLogs = async (req, res, next) => {
  try {
    const logs = await AdminActivityLog.find({})
      .populate('admin', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};
