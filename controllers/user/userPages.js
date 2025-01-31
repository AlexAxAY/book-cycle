const Product = require("../../models/productSchema");
const Banner = require("../../models/bannerSchema");
const Category = require("../../models/categorySchema");

const landingPage = async (req, res) => {
  try {
    const products = await Product.find();
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

    // Rating filter
    if (rating) {
      query.avg_rating = { $gte: Number(rating) };
    }

    const products = await Product.find(query);
    const categories = await Product.find();

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

module.exports = { landingPage, shoppingPage };
