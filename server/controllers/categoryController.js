import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { toCategoryJSON } from "../utils/serialize.js";

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

/** GET /api/categories */
export async function listCategories(_req, res) {
  const list = await Category.find().sort({ name: 1 }).lean();
  res.json(list.map((c) => toCategoryJSON(c)));
}

/** POST /api/categories — admin */
export async function createCategory(req, res) {
  const { name, slug, image, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Category name is required." });
  }

  const finalSlug = (slug?.trim() && slugify(slug)) || slugify(name);

  const cat = await Category.create({
    name: name.trim(),
    slug: finalSlug,
    image: image?.trim() || "",
    description: description?.trim() || "",
  });

  res.status(201).json(toCategoryJSON(cat));
}

/** PUT /api/categories/:id — admin */
export async function updateCategory(req, res) {
  const { name, slug, image, description } = req.body;
  const cat = await Category.findById(req.params.id);

  if (!cat) {
    return res.status(404).json({ message: "Category not found." });
  }

  if (name !== undefined) cat.name = name.trim();
  if (slug !== undefined && String(slug).trim()) cat.slug = slugify(slug);
  if (image !== undefined) cat.image = image.trim();
  if (description !== undefined) cat.description = description.trim();

  await cat.save();
  res.json(toCategoryJSON(cat));
}

/** DELETE /api/categories/:id — admin */
export async function deleteCategory(req, res) {
  const count = await Product.countDocuments({ category: req.params.id });
  if (count > 0) {
    return res.status(400).json({
      message: `Cannot delete: ${count} product(s) still use this category.`,
    });
  }

  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) {
    return res.status(404).json({ message: "Category not found." });
  }

  res.json({ message: "Category deleted." });
}
