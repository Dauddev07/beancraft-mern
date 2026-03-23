import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    image: { type: String, default: "" },
    description: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export const Category = mongoose.model("Category", categorySchema);
