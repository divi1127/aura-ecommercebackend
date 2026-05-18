import Review from '../models/Review.js';
import Product from '../models/Product.js';

// @desc    Add review to a product
// @route   POST /api/reviews/:productId
// @access  Private
export const addReview = async (req, res, next) => {
  const { rating, comment } = req.body;
  const productId = req.params.productId;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Check if user already reviewed
    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: req.user._id
    });

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('You have already reviewed this product. You can update or delete it.');
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment
    });

    // Recalculate average ratings
    const reviews = await Review.find({ product: productId });
    product.numOfReviews = reviews.length;
    product.ratings = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    
    // Round ratings to 1 decimal place
    product.ratings = Math.round(product.ratings * 10) / 10;

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    // Auth: Admin or Owner of the review
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this review');
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.reviewId);

    // Recalculate average ratings
    const product = await Product.findById(productId);
    if (product) {
      const reviews = await Review.find({ product: productId });
      product.numOfReviews = reviews.length;
      if (reviews.length > 0) {
        product.ratings = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
        product.ratings = Math.round(product.ratings * 10) / 10;
      } else {
        product.ratings = 0;
      }
      await product.save();
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};
