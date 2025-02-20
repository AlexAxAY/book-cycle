const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const mongoose = require("mongoose");

// Navigates to the category management page
const catManagePage = async (req, res) => {
  return res.render("adminPanel/categoryManagement");
};

// Navigates to the category update page
const catUpdatePage = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await Category.findById(id);
    return res.render("adminPanel/updateCategory", { data });
  } catch (err) {
    console.log("Error in fetching the particular Category!", err);
  }
};

// Navigates to the categories view page
const catViewPage = async (req, res) => {
  try {
    const datas = await Category.find();
    return res.render("adminPanel/viewCategories", { datas });
  } catch (err) {
    console.log("Error in fetching all the categories from the db!", err);
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
    console.log("Error in adding the category! From backend!");
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
    console.log("Error in updating the category!", err);
    return res.status(400).json({ message: "Error in updating the category!" });
  }
};

// deleting category
const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    // Find the category by id and set is_deleted to true
    const deleted = await Category.findByIdAndUpdate(
      id,
      { is_deleted: true },
      { new: true, runValidators: true }
    );
    res
      .status(200)
      .json({ success: true, message: "Category deleted successfully!" });
  } catch (err) {
    console.error("Error in soft deleting!", err);
    return res.status(400).json({ message: "Error in deleting the category!" });
  }
};

// Navigates to the all products page
const viewAllProductsPage = async (req, res) => {
  try {
    const perPage = 10;
    const page = parseInt(req.query.page) || 1;
    const filter = { is_deleted: false };

    // Check if the search form was used (assume query parameter "search")
    if (req.query.search) {
      const searchTerm = req.query.search.trim();

      filter.name = { $regex: searchTerm, $options: "i" };
    } else {
      // Otherwise, apply the filter form fields

      // Date filter (products added on a specific day)
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

      // Discount filter (products with discount >= given value)
      if (req.query.discount) {
        filter.discount = { $gte: parseFloat(req.query.discount) };
      }

      // Rating filter (products with rating >= given value)
      if (req.query.rating) {
        filter.avg_rating = { $gte: parseFloat(req.query.rating) };
      }

      // Used filter (convert string "true"/"false" to boolean if provided)
      if (req.query.used !== undefined && req.query.used !== "") {
        filter.used = req.query.used === "true";
      }

      // Category filter
      if (req.query.category) {
        filter.category = req.query.category;
      }
    }

    // Fetch filtered products with pagination
    const products = await Product.find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage);

    const categories = await Category.find();

    // Count total products (filtered) for pagination
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / perPage);

    // Render the template with products and pagination data
    return res.render("adminPanel/allProducts", {
      products,
      categories,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("An error occurred while fetching products.");
  }
};

// single product page
const singleProductPage = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res
        .staus(404)
        .json({ success: false, message: "Product not found!" });
    }
    return res.render("adminPanel/singleProduct", { product });
  } catch (err) {
    console.log(err);
  }
};

// Navigates to the product addition page
const viewAddProducts = async (req, res) => {
  try {
    const categories = await Category.find();
    return res.render("adminPanel/addProducts", { categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).send("Error loading page");
  }
};

// Adding new product
const addProduct = async (req, res) => {
  try {
    // Extract form data from the request body
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

    console.log("request body:", req.body);
    console.log("before parsing :", cropped_images);

    // Check for required fields
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
      console.log("Error: Missing required fields");
      return res
        .status(400)
        .json({ success: false, message: "Required fields are missing." });
    }

    // Ensure price, discount, and count can be parsed as numbers
    if (isNaN(price) || isNaN(discount) || isNaN(count)) {
      console.log("Error: Invalid number input", { price, discount, count });
      return res.status(400).json({
        success: false,
        message: "Price, discount, and count must be valid numbers.",
      });
    }

    // Parse the numerical values
    const priceNum = parseFloat(price);
    const discountNum = parseFloat(discount);
    const numCount = parseInt(count, 10);

    // New Validations:
    // 1. Discount cannot be negative.
    if (discountNum < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value cannot be negative.",
      });
    }
    // 2. If discount type is percentage, discount cannot exceed 90.
    if (discount_type === "percentage" && discountNum > 90) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 90%.",
      });
    }
    // 3. If discount type is fixed, discount cannot be greater than the price.
    if (discount_type === "fixed" && discountNum > priceNum) {
      return res.status(400).json({
        success: false,
        message: "Fixed discount cannot exceed the product price.",
      });
    }

    // Determine stock status based on the count value
    let stockStatus = "In stock";
    if (numCount === 0) {
      stockStatus = "Out of stock";
    } else if (numCount <= 5) {
      stockStatus = "Limited stock";
    }

    let croppedImagesArray = [];

    // Process cropped_images if provided
    if (cropped_images) {
      if (
        typeof cropped_images === "object" &&
        !Array.isArray(cropped_images)
      ) {
        // If it's an object, convert it to an array
        croppedImagesArray = Object.values(cropped_images);
      } else if (typeof cropped_images === "string") {
        try {
          croppedImagesArray = JSON.parse(cropped_images);
          if (!Array.isArray(croppedImagesArray)) {
            croppedImagesArray = [croppedImagesArray];
          }
        } catch (error) {
          console.error("Error parsing cropped_images:", error);
          return res.status(400).json({
            success: false,
            message: "Invalid cropped_images format.",
          });
        }
      }
    }

    // Process image uploads from req.files and include cropped URLs
    const images = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const croppedUrl = croppedImagesArray[i] || null; // Prevent index error
        images.push({
          original_url: file.path, // Cloudinary provides this
          cropped_url: croppedUrl,
          filename: file.filename,
        });
      }
    }

    // Calculate final price based on discount type
    // For percentage: finalPrice = price - (price * discount / 100)
    // For fixed: finalPrice = price - discount
    const finalPrice =
      discount_type === "percentage"
        ? priceNum - (priceNum * discountNum) / 100
        : priceNum - discountNum;

    // Construct the product object
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

    // Save the product to the database
    const savedProduct = await newProduct.save();
    if (savedProduct) {
      console.log("Product is saved in DB");
    }

    // Respond with success
    res.status(201).json({
      success: true,
      message: "Product added successfully!",
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the product.",
    });
  }
};

const updateProductPage = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    const categories = await Category.find();
    if (!product) {
      return res
        .status(400)
        .json({ success: true, message: "Product not found!" });
    } else {
      return res.render("adminPanel/updateProducts", { product, categories });
    }
  } catch (err) {
    console.log("Some internal error in updating the product!", err);
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

    // Validation checks for required fields
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

    // Ensure price, discount, and count are valid numbers
    if (isNaN(price) || isNaN(discount) || isNaN(count)) {
      return res.status(400).json({
        success: false,
        message: "Price, discount, and count must be valid numbers.",
      });
    }

    // Parse numbers
    const numericPrice = parseFloat(price);
    const numericDiscount = parseFloat(discount);
    const numCount = parseInt(count, 10);

    // New Validations:
    // 1. Discount value cannot be negative.
    if (numericDiscount < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value cannot be negative.",
      });
    }
    // 2. If discount type is percentage, discount cannot exceed 90.
    if (discount_type === "percentage" && numericDiscount > 90) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 90%.",
      });
    }
    // 3. If discount type is fixed, discount cannot be greater than the product price.
    if (discount_type === "fixed" && numericDiscount > numericPrice) {
      return res.status(400).json({
        success: false,
        message: "Fixed discount cannot exceed the product price.",
      });
    }

    // Retrieve the original product using the id parameter
    const { id } = req.params;
    const originalProduct = await Product.findById(id);
    if (!originalProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Process ALL images (existing + new)
    const images = [];

    // 1. Existing images
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

    // 2. New uploaded images
    if (req.files) {
      req.files.forEach((file) => {
        images.push({
          original_url: file.path, // Cloudinary URL
          cropped_url: null,
          filename: file.filename,
          _id: new mongoose.Types.ObjectId(),
        });
      });
    }

    // Deduplicate images
    const uniqueImages = [];
    const seen = new Set();
    images.forEach((img) => {
      const key = img._id.toString();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueImages.push(img);
      }
    });

    // Calculate final price based on discount type
    const finalPrice =
      discount_type === "percentage"
        ? numericPrice - (numericPrice * numericDiscount) / 100
        : numericPrice - numericDiscount;

    // Determine stock status based on count
    let stockStatus = "In stock";
    if (numCount === 0) {
      stockStatus = "Out of stock";
    } else if (numCount <= 5) {
      stockStatus = "Limited stock";
    }

    // Update product in the database
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
    console.log("Error in deleteing the product!", err);
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
