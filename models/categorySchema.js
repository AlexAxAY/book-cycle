const mongoose = require("mongoose");

const catSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true, default: null },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", catSchema);
module.exports = Category;
