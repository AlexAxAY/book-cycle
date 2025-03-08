const { Coupon, CouponUsage } = require("../../models/couponSchemas");
const User = require("../../models/userSchema");

const viewCoupons = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const user = await User.findById(userId);
    let coupons = await Coupon.find({ is_deleted: false, active: true });
    if (!coupons) {
      return res.render("user/allCouponsPage");
    }

    const usedCoupons = await CouponUsage.find({ user_id: userId });
    const usedCouponIds = usedCoupons.map((usage) =>
      usage.coupon_id.toString()
    );

    coupons = coupons.filter(
      (coupon) => !usedCouponIds.includes(coupon._id.toString())
    );

    return res.render("user/allCouponsPage", { coupons, user });
  } catch (err) {
    return res.status(500).render("utils/userErrorPage", {
      statusCode: 500,
      message: "Server error!",
    });
  }
};

module.exports = { viewCoupons };
