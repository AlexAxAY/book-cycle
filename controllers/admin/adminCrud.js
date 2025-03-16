const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const mongoose = require("mongoose");

// Navigates to the category management page
const catManagePage = async (req, res) => {
  return res.render("adminPanel/categoryManagement");
};

// Navigates to the category update page
const catUpdatePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Category.findById(id);
    if (!data) {
      return res.status(404).render("utils/errorPage", {
        statusCode: 404,
        message: "Data not found!",
      });
    }
    return res.render("adminPanel/updateCategory", { data });
  } catch (err) {
    next(err);
  }
};

// Navigates to the categories view page
const catViewPage = async (req, res, next) => {
  try {
    const perPage = 50;
    const page = parseInt(req.query.page) || 1;

    const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories / perPage);

    const datas = await Category.find()
      .skip((page - 1) * perPage)
      .limit(perPage);

    return res.render("adminPanel/viewCategories", {
      datas,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
};

// Adding new category
const createCat = async (req, res) => {
  const { category, description } = req.body;

  if (!category) {
    return res.status(404).json({
      message: "Category field is mandatory!",
    });
  }
  const checkMatch = await Category.findOne({
    category: { $regex: `^${category}$`, $options: "i" },
  });
  if (checkMatch) {
    return res.status(409).json({
      message: "Category already exist!",
    });
  }
  try {
    const newCategory = new Category({
      category,
      description,
    });

    await newCategory.save();

    return res.status(200).json({ message: "Category added successfully!" });
  } catch (err) {
    return res.status(400).json({ message: "Error in adding the category!" });
  }
};

// Updating category
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { category, description } = req.body;

  try {
    const checkMatch = await Category.findOne({
      category: { $regex: `^${category}$`, $options: "i" },
      _id: { $ne: id },
    });
    if (checkMatch) {
      return res.status(409).json({
        message: "Category already exists!",
      });
    }
    await Category.findByIdAndUpdate(
      id,
      {
        category,
        description,
      },
      { new: true, runValidators: true }
    );
    res.status(200).json({
      message: "Category updated successfully!",
    });
  } catch (err) {
    return res.status(400).json({ message: "Error in updating the category!" });
  }
};

// deleting category
const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Category.findByIdAndUpdate(
      id,
      { is_deleted: true },
      { new: true, runValidators: true }
    );
    res
      .status(200)
      .json({ success: true, message: "Category deleted successfully!" });
  } catch (err) {
    return res.status(400).json({ message: "Error in deleting the category!" });
  }
};

// Navigates to the all products page
const viewAllProductsPage = async (req, res, next) => {
  try {
    const perPage = 10;
    const page = parseInt(req.query.page) || 1;
    const filter = { is_deleted: false };

    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      filter.name = { $regex: searchTerm, $options: "i" };
    }

    if (req.query.date) {
      const selectedDate = new Date(req.query.date);
      const selectedYear = selectedDate.getFullYear();
      const selectedMonth = selectedDate.getMonth();
      const selectedDay = selectedDate.getDate();
      filter.createdAt = {
        $gte: new Date(selectedYear, selectedMonth, selectedDay),
        $lt: new Date(selectedYear, selectedMonth, selectedDay + 1),
      };
    }

    if (req.query["min-price"] || req.query["max-price"]) {
      filter.price = {};
      if (req.query["min-price"]) {
        filter.price.$gte = parseFloat(req.query["min-price"]);
      }
      if (req.query["max-price"]) {
        filter.price.$lte = parseFloat(req.query["max-price"]);
      }
    }

    if (req.query.discount) {
      filter.discount = { $gte: parseFloat(req.query.discount) };
    }

    if (req.query.rating) {
      filter.avg_rating = { $gte: parseFloat(req.query.rating) };
    }

    if (req.query.used !== undefined && req.query.used !== "") {
      filter.used = req.query.used === "true";
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const products = await Product.find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage);

    const categories = await Category.find();

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / perPage);

    return res.render("adminPanel/allProducts", {
      products,
      categories,
      currentPage: page,
      totalPages,
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
};

// single product page
const singleProductPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }
    return res.render("adminPanel/singleProduct", { product });
  } catch (err) {
    next(err);
  }
};

// Navigates to the product addition page
const viewAddProducts = async (req, res, next) => {
  try {
    const categories = await Category.find();
    return res.render("adminPanel/addProducts", { categories });
  } catch (error) {
    next(err);
  }
};

// Adding new product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      author,
      category,
      language,
      price,
      brand,
      publisher,
      discount,
      discount_type,
      count,
      description,
      publish_date,
      used,
      cropped_images,
    } = req.body;

    if (
      !name ||
      !author ||
      !category ||
      !price ||
      !discount ||
      !discount_type ||
      !count ||
      !description ||
      !publish_date ||
      !language
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Required fields are missing." });
    }

    if (isNaN(price) || isNaN(discount) || isNaN(count)) {
      return res.status(400).json({
        success: false,
        message: "Price, discount, and count must be valid numbers.",
      });
    }

    const priceNum = parseFloat(price);
    const discountNum = parseFloat(discount);
    const numCount = parseInt(count, 10);

    if (discountNum < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value cannot be negative.",
      });
    }

    if (discount_type === "percentage" && discountNum > 90) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 90%.",
      });
    }

    if (discount_type === "fixed" && discountNum > priceNum) {
      return res.status(400).json({
        success: false,
        message: "Fixed discount cannot exceed the product price.",
      });
    }

    let stockStatus = "In stock";
    if (numCount === 0) {
      stockStatus = "Out of stock";
    } else if (numCount <= 5) {
      stockStatus = "Limited stock";
    }

    let croppedImagesArray = [];

    if (cropped_images) {
      if (
        typeof cropped_images === "object" &&
        !Array.isArray(cropped_images)
      ) {
        croppedImagesArray = Object.values(cropped_images);
      } else if (typeof cropped_images === "string") {
        try {
          croppedImagesArray = JSON.parse(cropped_images);
          if (!Array.isArray(croppedImagesArray)) {
            croppedImagesArray = [croppedImagesArray];
          }
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: "Invalid cropped_images format.",
          });
        }
      }
    }

    const images = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const croppedUrl = croppedImagesArray[i] || null;
        images.push({
          original_url: file.path,
          cropped_url: croppedUrl,
          filename: file.filename,
        });
      }
    }

    const finalPrice =
      discount_type === "percentage"
        ? priceNum - (priceNum * discountNum) / 100
        : priceNum - discountNum;

    const newProduct = new Product({
      name,
      author,
      language,
      category,
      price: priceNum,
      brand: brand || null,
      publisher: publisher || null,
      discount: discountNum,
      discount_type,
      stock: stockStatus,
      count: numCount,
      final_price: finalPrice,
      publish_date: publish_date || null,
      used: used === "true",
      description,
      images,
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the product.",
    });
  }
};

const updateProductPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    const categories = await Category.find();
    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    } else {
      return res.render("adminPanel/updateProducts", { product, categories });
    }
  } catch (err) {
    next(err);
  }
};

// Updating the product
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      author,
      category,
      price,
      brand,
      publisher,
      discount,
      discount_type,
      count,
      description,
      publish_date,
      used,
    } = req.body;

    if (
      !name ||
      !author ||
      !category ||
      !price ||
      !discount ||
      !discount_type ||
      !count ||
      !description ||
      !publish_date
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing.",
      });
    }

    if (isNaN(price) || isNaN(discount) || isNaN(count)) {
      return res.status(400).json({
        success: false,
        message: "Price, discount, and count must be valid numbers.",
      });
    }

    const numericPrice = parseFloat(price);
    const numericDiscount = parseFloat(discount);
    const numCount = parseInt(count, 10);

    if (numericDiscount < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value cannot be negative.",
      });
    }

    if (discount_type === "percentage" && numericDiscount > 90) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 90%.",
      });
    }

    if (discount_type === "fixed" && numericDiscount > numericPrice) {
      return res.status(400).json({
        success: false,
        message: "Fixed discount cannot exceed the product price.",
      });
    }

    const { id } = req.params;
    const originalProduct = await Product.findById(id);
    if (!originalProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const images = [];

    if (req.body.existingImages) {
      req.body.existingImages.forEach((imgStr) => {
        const img = JSON.parse(imgStr);
        images.push({
          _id: img._id || new mongoose.Types.ObjectId(),
          original_url: img.original_url,
          cropped_url: img.cropped_url,
          filename: img.filename,
        });
      });
    }

    if (req.files) {
      req.files.forEach((file) => {
        images.push({
          original_url: file.path,
          cropped_url: null,
          filename: file.filename,
          _id: new mongoose.Types.ObjectId(),
        });
      });
    }

    const uniqueImages = [];
    const seen = new Set();
    images.forEach((img) => {
      const key = img._id.toString();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueImages.push(img);
      }
    });

    const finalPrice =
      discount_type === "percentage"
        ? numericPrice - (numericPrice * numericDiscount) / 100
        : numericPrice - numericDiscount;

    let stockStatus = "In stock";
    if (numCount === 0) {
      stockStatus = "Out of stock";
    } else if (numCount <= 5) {
      stockStatus = "Limited stock";
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        author,
        category,
        price: numericPrice,
        brand: brand || null,
        publisher: publisher || null,
        discount: numericDiscount,
        discount_type,
        stock: stockStatus,
        count: numCount,
        final_price: finalPrice,
        publish_date: publish_date || null,
        used: used === "true",
        description,
        images: uniqueImages,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully!",
      product: updatedProduct,
    });
  } catch (err) {
    console.error("Update error details:", {
      error: err.message,
      stack: err.stack,
      body: req.body,
      files: req.files,
    });
    res.status(500).json({
      success: false,
      message: "Internal server error while updating product",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// soft delete the product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      { is_deleted: true },
      { new: true, runValidators: true }
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found!" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Product deleted successfully!" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error!" });
  }
};

module.exports = {
  viewAllProductsPage,
  viewAddProducts,
  singleProductPage,
  catManagePage,
  catUpdatePage,
  updateCategory,
  deleteCategory,
  catViewPage,
  createCat,
  addProduct,
  updateProductPage,
  updateProduct,
  deleteProduct,
};
