const { Coupon } = require("../../models/couponSchemas");

const couponForm = async (req, res) => {
  return res.render("adminPanel/addCoupon");
};

const couponUpdateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      console.log("No coupon found");
      return res.send("No coupon found!");
    }
    return res.render("adminPanel/updateCoupon", { coupon });
  } catch (err) {
    console.log("error in couponUpdateForm controller", err);
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

const allCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ is_deleted: false }).sort({ _id: -1 });
    return res.render("adminPanel/allCoupons", { coupons });
  } catch (err) {
    console.log("Error from allCoupons controller", err);
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

    // Validate required fields
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

    // Validate discount for percentage type
    if (discount_type === "percentage" && Number(discount_value) > 90) {
      return res.status(400).json({
        success: false,
        message:
          "For percentage discount, discount value cannot be more than 90.",
      });
    }

    // Find the coupon by its ID
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

    // Update coupon fields
    coupon.coupon_code = coupon_code.trim();
    coupon.discount_value = discount_value;
    coupon.discount_type = discount_type;
    coupon.description = description.trim();
    coupon.min_order_value = min_order_value;
    coupon.active = active !== undefined ? active : coupon.active;

    // Save the updated coupon
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully!",
      coupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    coupon.is_deleted = true;
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
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
