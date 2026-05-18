import Product from '../models/Product.js';
import Category from '../models/Category.js';
import AdminActivityLog from '../models/AdminActivityLog.js';

// Helper slugifier
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};

// @desc    Get all products (with search, filter, sort, pagination)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const { keyword, category, priceMin, priceMax, ratingMin, sort, page, limit } = req.query;

    const query = {};

    // 1. Keyword Text Search
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 2. Category Filter
    if (category) {
      // Find category ID by slug or ID
      const cat = await Category.findOne({ $or: [{ slug: category }, { name: category }] });
      if (cat) {
        query.category = cat._id;
      }
    }

    // 3. Price Filter
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = Number(priceMin);
      if (priceMax) query.price.$lte = Number(priceMax);
    }

    // 4. Rating Filter
    if (ratingMin) {
      query.ratings = { $gte: Number(ratingMin) };
    }

    // 5. Sorting
    let sortBy = { createdAt: -1 }; // default newest
    if (sort) {
      if (sort === 'priceAsc') sortBy = { price: 1 };
      else if (sort === 'priceDesc') sortBy = { price: -1 };
      else if (sort === 'rating') sortBy = { ratings: -1 };
      else if (sort === 'oldest') sortBy = { createdAt: 1 };
    }

    // 6. Pagination
    const currentPage = Number(page) || 1;
    const pageLimit = Number(limit) || 8;
    const skip = (currentPage - 1) * pageLimit;

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortBy)
      .skip(skip)
      .limit(pageLimit);

    res.json({
      success: true,
      count: products.length,
      totalProducts,
      pages: Math.ceil(totalProducts / pageLimit),
      currentPage,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by slug
// @route   GET /api/products/:slug
// @access  Public
export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug');

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const addProduct = async (req, res, next) => {
  const { name, description, price, compareAtPrice, category, images, stock, variants, isFeatured, isTrending } = req.body;

  try {
    if (!category) {
      res.status(400);
      throw new Error('Category is required. Please select a category.');
    }

    // Verify the category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      res.status(404);
      throw new Error(`Category not found. Please select a valid category.`);
    }

    const slug = slugify(name) + '-' + Math.floor(1000 + Math.random() * 9000);

    const product = await Product.create({
      name,
      slug,
      description,
      price,
      compareAtPrice,
      category: categoryDoc._id,
      images: images || ['/placeholder.jpg'],
      stock: stock || 0,
      variants: variants || [],
      isFeatured: !!isFeatured,
      isTrending: !!isTrending
    });

    // Log Activity
    await AdminActivityLog.create({
      admin: req.user._id,
      action: 'ADD_PRODUCT',
      details: `Added product: ${name} (${product._id})`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // If a category ObjectId is provided, verify it exists
    if (req.body.category) {
      const categoryDoc = await Category.findById(req.body.category);
      if (!categoryDoc) {
        res.status(404);
        throw new Error(`Category not found. Please select a valid category.`);
      }
    }

    if (req.body.name) {
      req.body.slug = slugify(req.body.name) + '-' + Math.floor(1000 + Math.random() * 9000);
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Log Activity
    await AdminActivityLog.create({
      admin: req.user._id,
      action: 'UPDATE_PRODUCT',
      details: `Updated product: ${product.name} (${product._id})`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    await Product.findByIdAndDelete(req.params.id);

    // Log Activity
    await AdminActivityLog.create({
      admin: req.user._id,
      action: 'DELETE_PRODUCT',
      details: `Deleted product: ${product.name} (${product._id})`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Product removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
