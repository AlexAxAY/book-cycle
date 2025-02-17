const { Coupon } = require("../../models/couponSchemas");

const couponForm = async (req, res) => {
  return res.render("adminPanel/addCoupon");
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
      active: active !== undefined ? active : true,
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

module.exports = { couponForm, addCoupon };
