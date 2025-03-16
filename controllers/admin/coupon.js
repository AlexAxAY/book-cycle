const { Coupon } = require("../../models/couponSchemas");

const couponForm = async (req, res) => {
  return res.render("adminPanel/addCoupon");
};

const couponUpdateForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      const error = new Error("Coupon not found");
      error.statusCode = 404;
      throw error;
    }
    return res.render("adminPanel/updateCoupon", { coupon });
  } catch (err) {
    next(err);
  }
};

const addCoupon = async (req, res) => {
  try {
    const {
      coupon_code,
      discount_value,
      discount_type,
      description,
      min_order_value,
      active,
    } = req.body;

    if (
      !coupon_code ||
      !discount_value ||
      !discount_type ||
      !description ||
      !min_order_value
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    if (discount_type === "percentage" && Number(discount_value) > 90) {
      return res.status(400).json({
        success: false,
        message:
          "For percentage discount, discount value cannot be more than 90.",
      });
    }

    const existingCoupon = await Coupon.findOne({
      coupon_code: coupon_code.trim(),
    });
    if (existingCoupon) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon code already exists." });
    }

    const coupon = new Coupon({
      coupon_code: coupon_code.trim(),
      discount_value,
      discount_type,
      description: description.trim(),
      min_order_value,
      active: active === true || active === "true" ? true : false,
      is_deleted: false,
    });

    await coupon.save();

    return res
      .status(200)
      .json({ success: true, message: "Coupon added successfully!", coupon });
  } catch (error) {
    console.error("Error adding coupon:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

const allCoupons = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const coupons = await Coupon.find({ is_deleted: false })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    const totalCoupons = await Coupon.countDocuments({ is_deleted: false });
    const totalPages = Math.ceil(totalCoupons / limit);

    return res.render("adminPanel/allCoupons", {
      coupons,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
};

const editCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;

    const {
      coupon_code,
      discount_value,
      discount_type,
      description,
      min_order_value,
      active,
    } = req.body;

    if (
      !coupon_code ||
      !discount_value ||
      !discount_type ||
      !description ||
      !min_order_value
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (discount_type === "percentage" && Number(discount_value) > 90) {
      return res.status(400).json({
        success: false,
        message:
          "For percentage discount, discount value cannot be more than 90.",
      });
    }

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    const existingCoupon = await Coupon.findOne({
      coupon_code: coupon_code.trim(),
      _id: { $ne: couponId },
    });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists.",
      });
    }

    coupon.coupon_code = coupon_code.trim();
    coupon.discount_value = discount_value;
    coupon.discount_type = discount_type;
    coupon.description = description.trim();
    coupon.min_order_value = min_order_value;
    coupon.active = active !== undefined ? active : coupon.active;

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully!",
      coupon,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const couponId = req.params.id;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      const error = new Error("Coupon not found");
      error.statusCode = 404;
      throw error;
    }

    coupon.is_deleted = true;
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully!",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  couponForm,
  addCoupon,
  allCoupons,
  editCoupon,
  couponUpdateForm,
  deleteCoupon,
};
