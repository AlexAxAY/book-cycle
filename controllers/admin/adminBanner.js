const Banner = require("../../models/bannerSchema");

const viewBanner = async (req, res) => {
  res.render("adminPanel/bannerManagement");
};

const addBanner = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !req.file) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const image = {
      url: req.file.path,
      filename: req.file.filename,
    };

    const banner = new Banner({
      title,
      description: description || null,
      image,
    });
    await banner.save();

    res
      .status(201)
      .json({ success: true, message: "Banner uploaded successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const viewAllBanners = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const banners = await Banner.find().skip(skip).limit(limit);

    const totalBanners = await Banner.countDocuments();
    const totalPages = Math.ceil(totalBanners / limit);

    return res.render("adminPanel/viewBanner", {
      banners,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
};

const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dlt = await Banner.findByIdAndDelete(id);
    if (!dlt) {
      const error = new Error("Banner not found");
      error.statusCode = 404;
      throw error;
    }
    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully!!",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { viewBanner, addBanner, viewAllBanners, deleteBanner };
