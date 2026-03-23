import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { toProductJSON } from "../utils/serialize.js";

/** Best-seller score: favors high order volume and strong ratings (matches prior app intent). */
function bestSellerScore(p) {
  const orders = p.numberOfOrders || 0;
  const rating = p.averageRating || 0;
  return orders * 2 + rating * 4;
}

/** GET /api/products?category=coffee */
export async function listProducts(req, res) {
  const { category: slug } = req.query;
  const filter = {};

  if (slug) {
    const cat = await Category.findOne({ slug: String(slug).toLowerCase() });
    if (!cat) {
      return res.json([]);
    }
    filter.category = cat._id;
  }

  const products = await Product.find(filter)
    .populate("category", "name slug image description")
    .sort({ name: 1 });

  res.json(products.map((p) => toProductJSON(p)));
}

/** GET /api/products/best-sellers */
export async function bestSellers(_req, res) {
  const products = await Product.find()
    .populate("category", "name slug image description")
    .lean();

  const scored = products
    .map((p) => ({
      doc: p,
      score: bestSellerScore(p),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => toProductJSON(x.doc));

  res.json(scored);
}

/** GET /api/products/:id */
export async function getProduct(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid product id." });
  }

  const product = await Product.findById(req.params.id).populate(
    "category",
    "name slug image description",
  );

  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  res.json(toProductJSON(product));
}

/** POST /api/products — admin */
export async function createProduct(req, res) {
  const { name, price, category: categoryId, image, stockStatus } = req.body;

  if (!name || price === undefined || !categoryId || !image) {
    return res.status(400).json({
      message: "name, price, category (id), and image are required.",
    });
  }

  const cat = await Category.findById(categoryId);
  if (!cat) {
    return res.status(400).json({ message: "Invalid category id." });
  }

  const product = await Product.create({
    name: name.trim(),
    price: Number(price),
    category: categoryId,
    image: image.trim(),
    stockStatus: stockStatus === "out_of_stock" ? "out_of_stock" : "in_stock",
  });

  const populated = await Product.findById(product._id).populate(
    "category",
    "name slug image description",
  );

  res.status(201).json(toProductJSON(populated));
}

/** PUT /api/products/:id — admin */
export async function updateProduct(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid product id." });
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  const { name, price, category: categoryId, image, stockStatus } = req.body;

  if (name !== undefined) product.name = name.trim();
  if (price !== undefined) product.price = Number(price);
  if (image !== undefined) product.image = image.trim();
  if (stockStatus !== undefined) {
    product.stockStatus =
      stockStatus === "out_of_stock" ? "out_of_stock" : "in_stock";
  }

  if (categoryId !== undefined) {
    const cat = await Category.findById(categoryId);
    if (!cat) {
      return res.status(400).json({ message: "Invalid category id." });
    }
    product.category = categoryId;
  }

  await product.save();

  const populated = await Product.findById(product._id).populate(
    "category",
    "name slug image description",
  );

  res.json(toProductJSON(populated));
}

/** DELETE /api/products/:id — admin */
export async function deleteProduct(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid product id." });
  }

  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  res.json({ message: "Product deleted." });
}
