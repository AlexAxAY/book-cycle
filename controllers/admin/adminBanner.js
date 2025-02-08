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

    // Save banner to database
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
    console.log("Error uploading banner:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const viewAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find();
    if (!banners) {
      return res.render("adminPanel/viewBanner");
    } else {
      return res.render("adminPanel/viewBanner", { banners });
    }
  } catch (err) {
    console.log("Server error:", err);
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const dlt = await Banner.findByIdAndDelete(id);
    if (!dlt) {
      return res.status(400).send("Product not found!");
    }
    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully!!",
    });
  } catch (err) {
    console.log("Error in deleting banner!", err);
    return res.status(500).json({
      success: false,
      message: "Server error! Cant delete the banner!",
    });
  }
};

module.exports = { viewBanner, addBanner, viewAllBanners, deleteBanner };
