const Product = require("../../models/productSchema");
const Banner = require("../../models/bannerSchema");
const Category = require("../../models/categorySchema");
const Review = require("../../models/ratingSchema");
const moment = require("moment");

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
    });
  } catch (err) {
    console.log(err);
  }
};

const shoppingPage = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, rating, sort } = req.query;

    if (minPrice && Number(minPrice) < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Minimum price cannot be negative." });
    }
    if (maxPrice && Number(maxPrice) < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Maximum price cannot be negative." });
    }
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      return res.status(400).json({
        success: false,
        message: "Minimum price cannot be greater than maximum price.",
      });
    }

    if (rating) {
      const ratingValue = Number(rating);
      if (ratingValue < 1 || ratingValue > 5) {
        return res
          .status(400)
          .json({ success: false, message: "Rating must be between 1 and 5." });
      }
    }

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
      const ratingValue = Number(rating);
      if (ratingValue === 0) {
        query.avg_rating = null;
      } else {
        query.avg_rating = { $gte: ratingValue };
      }
    }

    // Build sorting options based on the sort parameter
    let sortQuery = {};
    if (sort === "priceLowToHigh") {
      sortQuery.final_price = 1;
    } else if (sort === "priceHighToLow") {
      sortQuery.final_price = -1;
    } else if (sort === "rating") {
      sortQuery.avg_rating = -1;
    } else if (sort === "newArrivals") {
      sortQuery.updatedAt = -1;
    } else if (sort === "nameAsc") {
      sortQuery.name = 1;
    } else if (sort === "nameDesc") {
      sortQuery.name = -1;
    }

    // Apply sorting to the query
    let productsQuery = Product.find(query);
    if (Object.keys(sortQuery).length) {
      productsQuery = productsQuery.sort(sortQuery);
    }
    const products = await productsQuery;

    const categories = await Category.find();

    if (req.headers.accept.includes("application/json")) {
      return res.json({ products });
    }

    res.render("user/shoppingPage", {
      products,
      categories,
      category,
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
    const product = await Product.findById(id);

    if (!product) {
      console.log("no product");
      return res.render("utils/userErrorPage", {
        statusCode: 404,
        message: "Product not found!",
      });
    }

    const reviews = await Review.find({ product_id: id }).populate("user_id");

    reviews.forEach((review) => {
      review.formattedDate = moment(review.createdAt).format("MMMM Do YYYY");
    });

    const relatedProducts = await Product.find({
      $or: [{ category: product.category }, { author: product.author }],
      final_price: { $gte: 10, $lte: 2000 },
      _id: { $ne: id },
    }).limit(10);

    return res.status(200).render("user/singlePage", {
      product,
      relatedProducts,
      reviews,
    });
  } catch (err) {
    console.log("Server error while fetching the product!", err);
    return res.status(500).send("server error!");
  }
};

module.exports = {
  landingPage,
  shoppingPage,
  singlePage,
};
