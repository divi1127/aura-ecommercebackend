import Category from '../models/Category.js';
import AdminActivityLog from '../models/AdminActivityLog.js';

// Helper slugifier
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({});
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new category
// @route   POST /api/categories
// @access  Private/Admin
export const addCategory = async (req, res, next) => {
  const { name, description, image } = req.body;

  try {
    const categoryExists = await Category.findOne({ name });

    if (categoryExists) {
      res.status(400);
      throw new Error('Category already exists');
    }

    const category = await Category.create({
      name,
      slug: slugify(name),
      description,
      image: image || '/category-placeholder.jpg'
    });

    // Log Activity
    await AdminActivityLog.create({
      admin: req.user._id,
      action: 'ADD_CATEGORY',
      details: `Added category: ${name} (${category._id})`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res, next) => {
  const { name, description, image } = req.body;

  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    if (name) {
      category.name = name;
      category.slug = slugify(name);
    }
    if (description) category.description = description;
    if (image) category.image = image;

    category = await category.save();

    // Log Activity
    await AdminActivityLog.create({
      admin: req.user._id,
      action: 'UPDATE_CATEGORY',
      details: `Updated category: ${category.name} (${category._id})`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    await Category.findByIdAndDelete(req.params.id);

    // Log Activity
    await AdminActivityLog.create({
      admin: req.user._id,
      action: 'DELETE_CATEGORY',
      details: `Deleted category: ${category.name} (${category._id})`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Category removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
