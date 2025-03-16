const { Cart, CartItem } = require("../../models/cartSchemas");
const { Coupon, CouponUsage } = require("../../models/couponSchemas");
const Address = require("../../models/addressSchema");
const State = require("../../models/stateSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");

const checkoutPage = async (req, res) => {
  try {
    const userId = req.user.id;
    let validCartItems = [];
    let outOfStockMessage = "";
    let totalOriginalPrice = 0;
    let totalDiscountAmount = 0;
    let totalItems = 0;

    if (req.query.orderId) {
      const order = await Order.findOne({
        _id: req.query.orderId,
        user_id: userId,
        status: "Pending",
      }).populate("order_items.product");

      if (!order) {
        req.flash("error", "Pending order not found.");
        return res.redirect("/user/cart");
      }

      for (const orderItem of order.order_items) {
        const freshProduct = await Product.findById(orderItem.product._id);

        if (freshProduct && freshProduct.count > 0) {
          validCartItems.push({
            productId: freshProduct,
            quantity: orderItem.quantity,
          });
        }
      }

      if (validCartItems.length === 0) {
        req.flash(
          "error",
          "All items in your order are out of stock. Please update your cart."
        );
        return res.redirect("/user/cart");
      }
    } else {
      const cart = await Cart.findOne({ userId });
      if (!cart) {
        req.flash("error", "Your cart is empty.");
        return res.redirect("/user/cart");
      }

      const cartItems = await CartItem.find({ cartId: cart._id }).populate(
        "productId"
      );
      if (cartItems.length === 0) {
        req.flash("error", "Your cart is empty!");
        return res.redirect("/user/cart");
      }

      const validItems = cartItems.filter(
        (item) => item.productId && item.productId.count > 0
      );
      const invalidItems = cartItems.filter(
        (item) => !item.productId || item.productId.count <= 0
      );
      if (invalidItems.length > 0) {
        const invalidIds = invalidItems.map((item) => item._id);
        await CartItem.deleteMany({ _id: { $in: invalidIds } });
      }
      if (validItems.length === 0) {
        req.flash(
          "error",
          "All items in your cart are out of stock. Please update your cart."
        );
        return res.redirect("/user/cart");
      }

      const insufficientItems = validItems.filter(
        (item) => item.quantity > item.productId.count
      );
      if (insufficientItems.length > 0) {
        const errorMsg = insufficientItems
          .map(
            (item) =>
              `${item.productId.name || "Product"} has ${
                item.productId.count
              } in stock but you opted for ${item.quantity}`
          )
          .join(" ");
        req.flash("error", errorMsg);
        return res.redirect("/user/cart");
      }

      if (validItems.length < cartItems.length) {
        outOfStockMessage =
          "Some items in your cart are out of stock and have been removed.";
      }
      validCartItems = validItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
    }

    validCartItems.forEach((item) => {
      const price = item.productId.price;
      const quantity = item.quantity;
      totalOriginalPrice += price * quantity;
      totalItems += quantity;
      if (item.productId.discount_type === "percentage") {
        totalDiscountAmount +=
          price * (item.productId.discount / 100) * quantity;
      } else if (item.productId.discount_type === "fixed") {
        totalDiscountAmount += item.productId.discount * quantity;
      }
    });

    const totalAfterDiscount = totalOriginalPrice - totalDiscountAmount;
    const deliveryCharge = totalAfterDiscount >= 500 ? 0 : 50;
    const finalTotal = totalAfterDiscount + deliveryCharge;

    const addresses = await Address.find({ user_id: userId });
    const states = await State.find();
    if (!states) {
      console.log("No states found");
    }

    const usedCoupons = await CouponUsage.find({ user_id: userId });
    const usedCouponIds = usedCoupons.map((usage) => usage.coupon_id);
    const availableCoupons = await Coupon.find({
      active: true,
      is_deleted: false,
      _id: { $nin: usedCouponIds },
    });

    return res.render("user/checkoutPage", {
      checkoutData: {
        totalItems,
        totalOriginalPrice,
        totalDiscountAmount,
        totalAfterDiscount,
        deliveryCharge,
        finalTotal,
      },
      outOfStockMessage,
      addresses,
      states,
      validCartItems,
      coupons: availableCoupons,
      isResume: req.query.orderId || null,
    });
  } catch (error) {
    req.flash("error", "Server error. Please try again later.");
    return res.redirect("/user/cart");
  }
};

const addCheckoutAddress = async (req, res) => {
  try {
    const {
      name,
      phone,
      address_line,
      landmark,
      alt_phone,
      city,
      state,
      pincode,
      address_type,
    } = req.body;

    if (
      !name ||
      !phone ||
      !address_line ||
      !city ||
      !state ||
      !pincode ||
      !address_type
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number. It must be 10 digits.",
      });
    }
    if (alt_phone && !phoneRegex.test(alt_phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alternate phone number. It must be 10 digits.",
      });
    }

    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode. It must be exactly 6 digits.",
      });
    }

    const user_id = req.user.id;

    const newAddress = new Address({
      name,
      phone,
      address_line,
      landmark,
      alt_phone,
      city,
      state,
      pincode,
      address_type,
      user_id,
    });

    await newAddress.save();

    return res.status(200).json({
      success: true,
      message: "Address added successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

const checkoutAddressUpdatePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const states = await State.find();
    if (!states) {
      const error = new Error("Server Error");
      error.statusCode = 500;
      throw error;
    }
    const address = await Address.findById(id);
    if (!address) {
      const error = new Error("Address not found");
      error.statusCode = 404;
      throw error;
    }
    return res
      .status(200)
      .render("user/checkoutUpdateAddressPage", { address, states });
  } catch (err) {
    next(err);
  }
};

const checkoutAddressUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      address_line,
      landmark,
      alt_phone,
      city,
      state,
      pincode,
      address_type,
    } = req.body;

    if (
      !name ||
      !phone ||
      !address_line ||
      !city ||
      !state ||
      !pincode ||
      !address_type
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number. It must be 10 digits.",
      });
    }
    if (alt_phone && !phoneRegex.test(alt_phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alternate phone number. It must be 10 digits.",
      });
    }

    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode. It must be exactly 6 digits.",
      });
    }

    const user_id = req.user.id;

    await Address.findByIdAndUpdate(id, {
      name,
      phone,
      address_line,
      landmark,
      alt_phone,
      city,
      state,
      pincode,
      address_type,
      user_id,
    });

    return res
      .status(200)
      .json({ success: true, message: "Address updated successfully." });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

module.exports = {
  checkoutPage,
  addCheckoutAddress,
  checkoutAddressUpdatePage,
  checkoutAddressUpdate,
};
