import Coupon from '../models/Coupon.js';

// @desc    Validate a coupon code
// @route   POST /api/coupons/validate
// @access  Private
export const validateCoupon = async (req, res, next) => {
  const { code, total } = req.body;

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      res.status(404);
      throw new Error('Invalid coupon code');
    }

    if (!coupon.isActive) {
      res.status(400);
      throw new Error('This coupon is no longer active');
    }

    // Check expiry
    if (new Date(coupon.expiryDate) < new Date()) {
      res.status(400);
      throw new Error('This coupon has expired');
    }

    // Check minimum purchase amount
    if (total < coupon.minPurchase) {
      res.status(400);
      throw new Error(`Minimum purchase of $${coupon.minPurchase} required to use this coupon`);
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (coupon.discountValue / 100) * total;
    } else {
      discount = coupon.discountValue;
    }

    // Make sure discount doesn't exceed total
    discount = Math.min(discount, total);

    res.json({
      success: true,
      message: `Coupon applied: $${discount.toFixed(2)} off!`,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discount * 100) / 100
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a coupon
// @route   POST /api/coupons
// @access  Private/Admin
export const createCoupon = async (req, res, next) => {
  const { code, discountType, discountValue, expiryDate, minPurchase } = req.body;

  try {
    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });

    if (couponExists) {
      res.status(400);
      throw new Error('Coupon code already exists');
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      expiryDate: new Date(expiryDate),
      minPurchase: minPurchase || 0
    });

    res.status(201).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all coupons (Admin only)
// @route   GET /api/coupons
// @access  Private/Admin
export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: coupons
    });
  } catch (error) {
    next(error);
  }
};
