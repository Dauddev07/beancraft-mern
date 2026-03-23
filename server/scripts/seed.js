/**
 * One-time (or repeatable) seed: default categories, sample products, admin user.
 * Run: `npm run seed` from repo root (requires MONGO_URI, JWT_SECRET, admin creds in .env).
 */
import "../config/loadEnv.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";

const menu = [
  { name: "Latte", price: 4.5, image: "/images/Latte Image.jpg", categorySlug: "coffee" },
  { name: "Cappuccino", price: 4, image: "/images/cappuccino image.jpg", categorySlug: "coffee" },
  { name: "Espresso", price: 3, image: "/images/Expresso image.jpg", categorySlug: "coffee" },
  {
    name: "Chocolate Cake",
    price: 5.5,
    image: "/images/Chocolate image.jpg",
    categorySlug: "sweets",
  },
  { name: "Donut", price: 2.5, image: "/images/Donut image.jpg", categorySlug: "sweets" },
  { name: "Brownie", price: 3.5, image: "/images/Brownie image.jpg", categorySlug: "sweets" },
  { name: "Matcha", price: 4.75, image: "/images/Mocha image.jpg", categorySlug: "specials" },
  { name: "Croissant", price: 3.25, image: "/images/Croissant image.jpg", categorySlug: "specials" },
];

const defaultCategories = [
  {
    name: "Coffees",
    slug: "coffee",
    image: "/images/Coffee image.jpg",
    description: "Espresso, latte, cappuccino, and slow-sip cafe classics.",
  },
  {
    name: "Sweets",
    slug: "sweets",
    image: "/images/Sweets image.jpg",
    description: "Comfort desserts with warm textures and rich cocoa notes.",
  },
  {
    name: "Specials",
    slug: "specials",
    image: "/images/special image.jpg",
    description: "Seasonal favorites and standout picks worth trying first.",
  },
];

async function seed() {
  await connectDB();

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@gmail.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    admin = await User.create({
      name: "Admin",
      email: adminEmail,
      password: hashed,
      role: "admin",
    });
    console.log("Created admin:", adminEmail);
  } else if (admin.role !== "admin") {
    admin.role = "admin";
    await admin.save();
    console.log("Promoted existing user to admin:", adminEmail);
  } else {
    console.log("Admin already exists:", adminEmail);
  }

  const slugToId = {};

  for (const c of defaultCategories) {
    let cat = await Category.findOne({ slug: c.slug });
    if (!cat) {
      cat = await Category.create(c);
      console.log("Category created:", c.slug);
    }
    slugToId[c.slug] = cat._id;
  }

  const existingCount = await Product.countDocuments();
  if (existingCount > 0) {
    console.log(`Skip product seed (${existingCount} products already in DB).`);
  } else {
    for (const row of menu) {
      const catId = slugToId[row.categorySlug];
      await Product.create({
        name: row.name,
        price: row.price,
        category: catId,
        image: row.image,
        stockStatus: "in_stock",
      });
    }
    console.log(`Inserted ${menu.length} products.`);
  }

  await mongoose.disconnect();
  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
