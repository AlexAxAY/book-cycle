const crypto = require("crypto");
const Payment = require("../../models/paymentSchema");
const { Cart, CartItem } = require("../../models/cartSchemas");
const Product = require("../../models/productSchema");
const Order = require("../../models/orderSchema");

const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, orderIdRazor, signature } = req.body;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(orderIdRazor + "|" + paymentId)
      .digest("hex");

    if (generatedSignature === signature) {
      // Update the order status to confirmed
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { status: "Confirmed" },
        { new: true }
      );

      // Create a payment record
      const newPayment = new Payment({
        order_id: updatedOrder._id,
        user_id: updatedOrder.user_id,
        transaction_id: paymentId,
        amount: updatedOrder.final_amount,
        status: "Success",
      });
      await newPayment.save();

      // Reduce stock for each product in the order
      for (const item of updatedOrder.order_items) {
        const updatedProduct = await Product.findByIdAndUpdate(
          item.product,
          { $inc: { count: -item.quantity } },
          { new: true }
        );

        let newStock;
        if (updatedProduct.count === 0) {
          newStock = "Out of stock";
        } else if (updatedProduct.count <= 5) {
          newStock = "Limited stock";
        } else {
          newStock = "In stock";
        }
        if (updatedProduct.stock !== newStock) {
          await Product.findByIdAndUpdate(updatedProduct._id, {
            stock: newStock,
          });
        }
      }

      // Clear the user's cart
      const userCart = await Cart.findOne({ userId: updatedOrder.user_id });
      if (userCart) {
        await CartItem.deleteMany({ cartId: userCart._id });
      }

      return res.json({ success: true });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature." });
    }
  } catch (error) {
    console.error("Error in payment verification:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during payment verification.",
    });
  }
};

module.exports = { verifyPayment };
