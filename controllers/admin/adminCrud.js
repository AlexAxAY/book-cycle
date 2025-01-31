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
    await Category.findByIdAndUpdate(
      id,
      { is_deleted: true },
      { new: true, runValidators: true }
    );

    res.redirect("/admin/view-categories");
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

    // Capture filter fields from the query string
    const { price, discount, rating, used, category, date } = req.query;

    // Construct the filter object dynamically
    let filter = { is_deleted: false };

    // Apply price filter if provided (Below price or exact match)
    if (price) {
      filter.price = { $lte: parseFloat(price) }; // For products with price less than or equal to the input price
    }

    // Apply discount filter if provided (Above discount)
    if (discount) {
      filter.discount = { $gte: parseFloat(discount) }; // For products with discount greater than or equal to the input discount
    }

    // Apply rating filter if provided (Above rating)
    if (rating) {
      filter.avg_rating = { $gte: parseFloat(rating) }; // For products with rating greater than or equal to the input rating
    }

    // Apply used filter if provided (Only used products or new products)
    if (used !== undefined && used !== "") {
      filter.used = used === "true"; // Convert string 'true'/'false' to boolean
    }

    // Apply category filter if provided
    if (category) {
      filter.category = category; // Assuming 'category' is stored as a string or reference in the database
    }

    // Apply date filter if provided (Filtering products added on or after the selected date)
    if (date) {
      const selectedDate = new Date(date);

      // Extract year, month, and day from the selected date
      const selectedYear = selectedDate.getFullYear();
      const selectedMonth = selectedDate.getMonth();
      const selectedDay = selectedDate.getDate();

      // Create a new Date object to compare only the year, month, and day
      filter.createdAt = {
        $gte: new Date(selectedYear, selectedMonth, selectedDay),
        $lt: new Date(selectedYear, selectedMonth, selectedDay + 1),
      };
    }

    // Fetch filtered products with pagination
    const products = await Product.find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage);

    const categories = await Category.find();

    // Count total filtered products for pagination
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / perPage);

    // Render the EJS template with filtered products and pagination data
    return res.render("adminPanel/allProducts", {
      products, // Pass the filtered products array
      categories,
      currentPage: page, // Pass current page
      totalPages, // Pass total pages
    });
  } catch (err) {
    console.log("Error fetching products:", err);
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
      cropped_images, // Extract cropped_images from the request body
    } = req.body;

    console.log("request body:", req.body);

    console.log("before parsing :", cropped_images);

    // Validate required fields and ensure price, discount, and count are numbers
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
      return res
        .status(400)
        .json({ message: "Price, discount, and count must be valid numbers." });
    }

    // Determine stock status based on the count value
    let stockStatus = "In stock";
    if (count === 0) {
      stockStatus = "Out of stock";
    } else if (count <= 5) {
      stockStatus = "Limited stock";
    }

    let croppedImagesArray = [];

    // Check if cropped_images exists and is not empty
    if (cropped_images) {
      if (
        typeof cropped_images === "object" &&
        !Array.isArray(cropped_images)
      ) {
        // If it's an object, convert it to an array (if needed)
        croppedImagesArray = Object.values(cropped_images);
      } else if (typeof cropped_images === "string") {
        // If it's a string, parse it as JSON
        try {
          croppedImagesArray = JSON.parse(cropped_images);
          if (!Array.isArray(croppedImagesArray)) {
            croppedImagesArray = [croppedImagesArray]; // Convert to array if it's a single item
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

    console.log("Parsed cropped images:", croppedImagesArray);

    console.log("after parsing :", cropped_images);

    // Process image uploads from req.files and include cropped URLs
    const images = [];

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const croppedUrl = croppedImagesArray[i] || null; // Prevent index error

        images.push({
          original_url: file.path, // Cloudinary provides this
          cropped_url: croppedUrl, // Use corresponding cropped URL
          filename: file.filename,
        });
      }
    }

    console.log("Processed images array:", images);

    // Calculate final price based on discount type
    const finalPrice =
      discount_type === "percentage"
        ? price - (price * discount) / 100
        : price - discount;

    // Construct the product object
    const newProduct = new Product({
      name,
      author,
      language,
      category,
      price: parseFloat(price),
      brand: brand || null,
      publisher: publisher || null,
      discount: parseFloat(discount),
      discount_type,
      stock: stockStatus,
      count: parseInt(count, 10),
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

    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    // Validation checks
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
        message: "Price, discount, and count must be valid numbers.",
      });
    }

    // Get original product data
    const { id } = req.params;
    const originalProduct = await Product.findById(id);
    if (!originalProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Process ALL images (simplified)
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

    // 2. New uploaded images (including cropped ones)
    if (req.files) {
      req.files.forEach((file) => {
        images.push({
          original_url: file.path, // Cloudinary URL
          cropped_url: null,
          filename: file.filename,
          _id: new mongoose.Types.ObjectId(), // Proper ID generation
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

    // Calculate final price
    const numericPrice = parseFloat(price);
    const numericDiscount = parseFloat(discount);

    const finalPrice =
      discount_type === "percentage"
        ? numericPrice - (numericPrice * numericDiscount) / 100
        : numericPrice - numericDiscount;

    // Stock status calculation
    let stockStatus = "In stock";
    if (count === 0) stockStatus = "Out of stock";
    else if (count <= 5) stockStatus = "Limited stock";

    // Update product
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
        count: parseInt(count, 10),
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
