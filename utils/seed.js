import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load Models
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import AdminActivityLog from '../models/AdminActivityLog.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDatabase = async () => {
  const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/premium-ecommerce';

  try {
    console.log(`[Seed] Connecting to database...`);
    await mongoose.connect(connStr);
    console.log(`[Seed] Database connected.`);

    // 1. Clear existing database collections
    console.log(`[Seed] Clearing database collections...`);
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    await Review.deleteMany({});
    await Order.deleteMany({});
    await AdminActivityLog.deleteMany({});
    console.log(`[Seed] Database collections cleared.`);

    // 2. Create Default Users (with encrypted passwords)
    console.log(`[Seed] Creating default users...`);
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const customerPassword = await bcrypt.hash('user123', salt);

    const adminUser = await User.create({
      name: 'Alexander Stone',
      email: 'admin@ecommerce.com',
      password: adminPassword,
      role: 'admin',
      addresses: [
        {
          street: '742 Platinum Avenue',
          city: 'San Francisco',
          state: 'CA',
          country: 'United States',
          zipCode: '94102',
          isDefault: true
        }
      ]
    });

    const customerUser = await User.create({
      name: 'Sophia Carter',
      email: 'user@ecommerce.com',
      password: customerPassword,
      role: 'customer',
      addresses: [
        {
          street: '109 Crystal Boulevard',
          city: 'Seattle',
          state: 'WA',
          country: 'United States',
          zipCode: '98101',
          isDefault: true
        }
      ]
    });

    console.log(`[Seed] Users created:`);
    console.log(` - Admin: admin@ecommerce.com (password: admin123)`);
    console.log(` - Customer: user@ecommerce.com (password: user123)`);

    // 3. Create Categories
    console.log(`[Seed] Creating categories...`);
    const categoriesData = [
      {
        name: 'Tech & Gadgets',
        slug: 'tech-gadgets',
        description: 'Next-generation tech, smart devices, and accessories designed for professionals.',
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=500&q=80'
      },
      {
        name: 'Fashion & Apparel',
        slug: 'fashion-apparel',
        description: 'Sleek luxury fashion items, custom tailoring, and premium everyday wear.',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80'
      },
      {
        name: 'Home & Living',
        slug: 'home-living',
        description: 'Modern aesthetic furniture, smart lighting, and minimal ambient decors.',
        image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=500&q=80'
      },
      {
        name: 'Fitness & Outdoor',
        slug: 'fitness-outdoor',
        description: 'High-performance athletic apparel, smart fitness trackers, and robust outdoor gear.',
        image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=500&q=80'
      }
    ];

    const categories = await Category.insertMany(categoriesData);
    console.log(`[Seed] ${categories.length} Categories created.`);

    // Map categories for easy lookup
    const catMap = {};
    categories.forEach(c => {
      catMap[c.slug] = c._id;
    });

    // 4. Create Products
    console.log(`[Seed] Creating products...`);
    const productsData = [
      {
        name: 'Quantum ANC Headphones',
        slug: 'quantum-anc-headphones-8921',
        description: 'Experience pure sonic bliss. Outfitted with studio-grade Active Noise Cancellation, high-fidelity dynamic drivers, and 45 hours of ultra-long battery life. The carbon-fiber reinforced structure and breathable leather cushions ensure premium acoustic isolation and plush all-day comfort.',
        price: 299.00,
        compareAtPrice: 399.00,
        category: catMap['tech-gadgets'],
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80'
        ],
        stock: 25,
        ratings: 4.8,
        numOfReviews: 2,
        variants: [
          { name: 'Color', options: ['Matte Black', 'Lunar Gray', 'Cyber Bronze'] }
        ],
        isFeatured: true,
        isTrending: true
      },
      {
        name: 'Chrono Elite Smartwatch',
        slug: 'chrono-elite-smartwatch-1402',
        description: 'The convergence of haute horology and modern engineering. Features a gorgeous circular AMOLED screen with an always-on display, sapphire glass protection, and 7-day battery life. Offers comprehensive cardiac metrics, stress tracking, blood oxygen levels, and multi-sport GPS tracking.',
        price: 349.00,
        compareAtPrice: 429.00,
        category: catMap['tech-gadgets'],
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80'
        ],
        stock: 18,
        ratings: 4.6,
        numOfReviews: 1,
        variants: [
          { name: 'Band Type', options: ['Italian Leather', 'Milano Loop', 'Sport Silicon'] }
        ],
        isFeatured: true,
        isTrending: false
      },
      {
        name: 'Zenith Mechanical Keyboard',
        slug: 'zenith-mechanical-keyboard-5612',
        description: 'Elevate your typing experience. Hand-assembled tenkeyless (TKL) keyboard utilizing tactile hot-swappable switches, double-shot PBT keycaps, sound-dampening foam inserts, and a stunning solid CNC-anodized aluminum frame. Built with custom per-key reactive RGB styling.',
        price: 189.00,
        compareAtPrice: 220.00,
        category: catMap['tech-gadgets'],
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80'
        ],
        stock: 8,
        ratings: 4.9,
        numOfReviews: 0,
        variants: [
          { name: 'Switch Type', options: ['Cherry MX Blue (Clicky)', 'Cherry MX Brown (Tactile)', 'Gateron Yellow (Linear)'] }
        ],
        isFeatured: false,
        isTrending: true
      },
      {
        name: 'Stealth Urban Backpack',
        slug: 'stealth-urban-backpack-7344',
        description: 'Engineered for the modern commuter. Made from water-repellent, military-grade ballistic nylon. Outfitted with hidden anti-theft zipper compartments, a dedicated plush 16-inch laptop pocket, integrated USB charging docks, and smart ergonomic weight distribution.',
        price: 129.00,
        compareAtPrice: 159.00,
        category: catMap['fashion-apparel'],
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'
        ],
        stock: 35,
        ratings: 4.5,
        numOfReviews: 1,
        variants: [
          { name: 'Size', options: ['20L Commuter', '28L Explorer'] }
        ],
        isFeatured: false,
        isTrending: true
      },
      {
        name: 'Minimalist Cashmere Blazer',
        slug: 'minimalist-cashmere-blazer-3944',
        description: 'Exquisite casual layering designed for maximum style and timeless appeal. Meticulously tailored using a ultra-soft cashmere-wool blend, complete with structured notch lapels, genuine horn buttons, and breathable silk lining for ultimate corporate sophistication.',
        price: 249.00,
        compareAtPrice: 350.00,
        category: catMap['fashion-apparel'],
        images: [
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80'
        ],
        stock: 12,
        ratings: 4.7,
        numOfReviews: 0,
        variants: [
          { name: 'Size', options: ['S', 'M', 'L', 'XL'] }
        ],
        isFeatured: true,
        isTrending: true
      },
      {
        name: 'Lumina Ambient Desk Lamp',
        slug: 'lumina-ambient-desk-lamp-2104',
        description: 'Bring clean minimalist design and therapeutic light styling to your workspace. Boasts a flexible brushed brass arm, a seamless circular glass diffuser dome, stepless touch dimming controls, and customizable Kelvin warmth ranging from daylight cyan to candle amber.',
        price: 89.00,
        compareAtPrice: 120.00,
        category: catMap['home-living'],
        images: [
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80'
        ],
        stock: 22,
        ratings: 4.4,
        numOfReviews: 0,
        variants: [
          { name: 'Finish', options: ['Brushed Brass', 'Anodized Steel', 'Satin White'] }
        ],
        isFeatured: true,
        isTrending: false
      },
      {
        name: 'FlexFit Aero Sneakers',
        slug: 'flexfit-aero-sneakers-9901',
        description: 'Break athletic boundaries. These cutting-edge running shoes feature a 3D-woven mesh upper for supreme breathability, a high-rebound responsive foam midsole that reduces joints impact, and a specialized carbon fiber plate for advanced forward propulsion.',
        price: 159.00,
        compareAtPrice: 199.00,
        category: catMap['fitness-outdoor'],
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'
        ],
        stock: 15,
        ratings: 4.7,
        numOfReviews: 1,
        variants: [
          { name: 'Size', options: ['8', '9', '10', '11'] }
        ],
        isFeatured: true,
        isTrending: true
      },
      {
        name: 'Aura Glass Infusion Flask',
        slug: 'aura-glass-infusion-flask-6644',
        description: 'Stay hydrated with elevated taste. Crafted from ultra-durable, thermal-shock resistant borosilicate glass, encased in a protective food-grade textured silicone sleeve. Outfitted with an integrated laser-cut stainless steel fruit and tea infusion core.',
        price: 39.00,
        compareAtPrice: 49.00,
        category: catMap['fitness-outdoor'],
        images: [
          'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80'
        ],
        stock: 45,
        ratings: 4.5,
        numOfReviews: 0,
        variants: [
          { name: 'Sleeve Color', options: ['Forest Green', 'Ocean Mist', 'Lavender', 'Charcoal'] }
        ],
        isFeatured: false,
        isTrending: false
      }
    ];

    const products = await Product.insertMany(productsData);
    console.log(`[Seed] ${products.length} Products created.`);

    // 5. Create some Reviews for the first product
    console.log(`[Seed] Creating sample reviews...`);
    const headphones = products.find(p => p.slug.startsWith('quantum-anc-headphones'));
    const smartwatch = products.find(p => p.slug.startsWith('chrono-elite-smartwatch'));
    const backpack = products.find(p => p.slug.startsWith('stealth-urban-backpack'));
    const sneakers = products.find(p => p.slug.startsWith('flexfit-aero-sneakers'));

    await Review.create([
      {
        product: headphones._id,
        user: customerUser._id,
        name: customerUser.name,
        rating: 5,
        comment: 'These are hands down the best headphones I have ever owned! Noise cancellation is dead silent on flights, and the lunar grey color looks stunningly premium!'
      },
      {
        product: headphones._id,
        user: adminUser._id, // admin can review too
        name: adminUser.name,
        rating: 4,
        comment: 'Fantastic build quality and excellent sound separation. Battery life actually lasted about 43 hours in my real world testing. Highly recommended!'
      },
      {
        product: smartwatch._id,
        user: customerUser._id,
        name: customerUser.name,
        rating: 5,
        comment: 'Unbelievably gorgeous display! The Italian leather band feels so comfortable. Heart rate tracking is super accurate compared to medical cuffs!'
      },
      {
        product: backpack._id,
        user: customerUser._id,
        name: customerUser.name,
        rating: 4,
        comment: 'Excellent capacity and tons of smart hidden pockets. Feels really sturdy. Only minor gripe is it is slightly heavy even when empty.'
      },
      {
        product: sneakers._id,
        user: customerUser._id,
        name: customerUser.name,
        rating: 5,
        comment: 'Like running on a cloud! The spring back in the carbon sole actually shaves off time in my 5K runs. Buying a second pair soon!'
      }
    ]);
    console.log(`[Seed] Sample reviews created.`);

    // 6. Create Coupons
    console.log(`[Seed] Creating sample coupons...`);
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 3); // 3 months validity

    await Coupon.create([
      {
        code: 'SAVE20',
        discountType: 'percentage',
        discountValue: 20,
        expiryDate: expiry,
        isActive: true,
        minPurchase: 100
      },
      {
        code: 'FREESHIP',
        discountType: 'flat',
        discountValue: 15,
        expiryDate: expiry,
        isActive: true,
        minPurchase: 50
      },
      {
        code: 'WELCOME50',
        discountType: 'flat',
        discountValue: 50,
        expiryDate: expiry,
        isActive: true,
        minPurchase: 250
      }
    ]);
    console.log(`[Seed] Coupons seeded.`);

    // 7. Log Admin Activity
    await AdminActivityLog.create({
      admin: adminUser._id,
      action: 'SYSTEM_SEED',
      details: 'System database successfully seeded with fresh products, categories, reviews, and admin/customer accounts.',
      ipAddress: '127.0.0.1'
    });
    console.log(`[Seed] Audit log created.`);

    console.log(`[Seed] DATABASE SEEDING COMPLETED SUCCESSFULLY!`);
    await mongoose.connection.close();
    console.log(`[Seed] Database connection closed.`);
    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Critical Seeding Error: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
