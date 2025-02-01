const Product = require("../../models/productSchema");
const Banner = require("../../models/bannerSchema");
const Category = require("../../models/categorySchema");

// landing page get
const landingPage = async (req, res) => {
  try {
    const products = await Product.find({ is_deleted: false });
    const banners = await Banner.find();
    if (!products) {
      console.log("No products are there!");
      return res.status(400).send("No products available!");
    }
    return res.render("user/landingPage", {
      products,
      banners,
      currentURL: req.originalUrl,
    });
  } catch (err) {
    console.log(err);
  }
};

// shopping page get
const shoppingPage = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, rating } = req.query;
    const query = { is_deleted: false };

    // Search filter
    if (search) {
      query.name = { $regex: new RegExp(search, "i") };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.final_price = {};
      if (minPrice) query.final_price.$gte = Number(minPrice);
      if (maxPrice) query.final_price.$lte = Number(maxPrice);
    }

    if (rating) {
      const ratingValue = Number(rating);
      if (ratingValue === 0) {
        query.avg_rating = null;
      } else {
        query.avg_rating = { $gte: ratingValue };
      }
    }

    const products = await Product.find(query);
    const categories = await Category.find();

    if (req.headers.accept.includes("application/json")) {
      return res.json({ products });
    }

    res.render("user/shoppingPage", {
      products,
      categories,
      currentURL: req.originalUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// single product page get
const singlePage = async (req, res) => {
  try {
    const { id } = req.params;
    const currentURL = req.originalUrl;
    const product = await Product.findById(id);

    if (!product) {
      console.log("no product");
      return res.render("utils/userErrorPage", {
        statusCode: 404,
        message: "Product not found!",
      });
    }

    const relatedProducts = await Product.find({
      $or: [{ category: product.category }, { author: product.author }],
      _id: { $ne: id },
    }).limit(10);

    return res.status(200).render("user/singlePage", {
      product,
      relatedProducts,
      currentURL,
    });
  } catch (err) {
    console.log("Server error while fetching the product!", err);
    return res.status(500).send("server error!");
  }
};

module.exports = { landingPage, shoppingPage, singlePage };
