const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");

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
      !publish_date
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

    // Process image uploads from req.files
    const images = [];
    for (const file of req.files) {
      console.log("whats inside the req file:", req.files);
      images.push({
        url: file.path, // Cloudinary provides the URL in `file.path`
        filename: file.filename, // Cloudinary provides the filename
      });
    }

    // Calculate final price based on discount type
    const finalPrice =
      discount_type === "percentage"
        ? price - (price * discount) / 100
        : price - discount;

    // Construct the product object
    const newProduct = new Product({
      name,
      author,
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
      console.log("Error: Missing required fields");
      return res
        .status(400)
        .json({ success: false, message: "Required fields are missing." });
    }

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

    const { id } = req.params;
    console.log("Product ID:", id);

    // Log raw JSON strings
    console.log("Raw existingImages:", req.body.existingImages);
    console.log("Raw existingCroppedImages:", req.body.existingCroppedImages);
    console.log("Raw newImages:", req.body.newImages);

    // Parse JSON strings from req.body
    const existingImages = Array.isArray(req.body.existingImages)
      ? req.body.existingImages.map((img) => JSON.parse(img))
      : [];
    const existingCroppedImages = JSON.parse(
      req.body.existingCroppedImages || "[]"
    );
    const newImages = JSON.parse(req.body.newImages || "[]");

    console.log("Parsed Existing Images:", existingImages);
    console.log("Parsed Existing Cropped Images:", existingCroppedImages);
    console.log("Parsed New Images:", newImages);

    // Process image uploads from req.files
    for (const file of req.files) {
      newImages.push({
        url: file.path, // Cloudinary provides the URL in `file.path`
        filename: file.filename, // Cloudinary provides the filename
      });
    }

    console.log("Processed New Images:", newImages);

    // Combine all images into the images array
    const images = existingImages.map((image) => ({
      url: image.url,
      filename: image.filename,
    }));

    existingCroppedImages.forEach((image) => {
      images.push({
        url: image.url,
        filename: image.filename,
      });
    });

    newImages.forEach((image) => {
      images.push({
        url: image.url,
        filename: image.filename,
      });
    });

    // Remove duplicates based on URL
    const uniqueImages = Array.from(new Set(images.map((a) => a.url))).map(
      (url) => {
        return images.find((a) => a.url === url);
      }
    );

    console.log("Final Unique Images Array:", uniqueImages);

    // Calculate final price based on discount type
    const finalPrice =
      discount_type === "percentage"
        ? price - (price * discount) / 100
        : price - discount;

    console.log("Final Price:", finalPrice);

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        author,
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
        images: uniqueImages,
      },
      { new: true, runValidators: true }
    );

    if (updatedProduct) {
      console.log("Updated product:", updatedProduct);
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully!",
    });
  } catch (err) {
    console.log("Internal error while updating the product!", err);
    return res.status(500).json({
      success: false,
      message: "Internal service error while updating the product!",
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
