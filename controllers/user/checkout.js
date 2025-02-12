const { Cart, CartItem } = require("../../models/cartSchemas");
const Address = require("../../models/addressSchema");
const State = require("../../models/stateSchema");

const checkoutPage = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;

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

    const validCartItems = cartItems.filter(
      (item) => item.productId && item.productId.count > 0
    );
    const invalidCartItems = cartItems.filter(
      (item) => !item.productId || item.productId.count <= 0
    );

    // Remove any invalid cart items from the database.
    if (invalidCartItems.length > 0) {
      const invalidIds = invalidCartItems.map((item) => item._id);
      await CartItem.deleteMany({ _id: { $in: invalidIds } });
    }

    // If no valid items remain, alert the user and redirect to the cart page.
    if (validCartItems.length === 0) {
      req.flash(
        "error",
        "All items in your cart are out of stock. Please update your cart."
      );
      return res.redirect("/user/cart");
    }

    // Check that the quantity selected for each valid cart item does not exceed the product's available stock.
    const insufficientItems = validCartItems.filter(
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

    let outOfStockMessage = "";
    if (validCartItems.length < cartItems.length) {
      outOfStockMessage =
        "Some items in your cart are out of stock and have been removed.";
    }

    // Recalculate totals using only valid (in-stock) items.
    let totalOriginalPrice = 0;
    let totalDiscountAmount = 0;
    let totalItems = 0;

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

    return res.render("user/checkoutPage", {
      checkoutData: {
        totalItems,
        totalAfterDiscount,
        deliveryCharge,
        finalTotal,
      },
      outOfStockMessage,
      addresses,
      states,
    });
  } catch (error) {
    console.error("Error rendering checkout page:", error);
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

    // Validate required fields (landmark and alt_phone are optional)
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
    console.error("Error in addCheckoutAddress controller:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

const checkoutAddressUpdatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const states = await State.find();
    if (!states) {
      console.log("NO states found");
    }
    const address = await Address.findById(id);
    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found!" });
    }
    return res
      .status(200)
      .render("user/checkoutUpdateAddressPage", { address, states });
  } catch (err) {
    console.log("internal error in checkoutAddressUpdatePage controller", err);
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

    // Create a new address document using your address schema
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
    console.error("Error in checkoutAddressUpdate controller:", error);
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
