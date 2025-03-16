const crypto = require("crypto");
const Payment = require("../../models/paymentSchema");
const razorpayInstance = require("../../services/razorpay");
const { Cart, CartItem } = require("../../models/cartSchemas");
const { Wallet, WalletTransaction } = require("../../models/walletSchemas");
const { generateCustomWalletId } = require("../../services/randomOrderId");
const Product = require("../../models/productSchema");
const Order = require("../../models/orderSchema");

async function recordWalletDeduction(userId, orderId, walletAmount) {
  if (walletAmount && walletAmount > 0) {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({ user: userId, balance: 0 });
    }
    wallet.balance -= walletAmount;
    await wallet.save();

    await WalletTransaction.create({
      wallet: wallet._id,
      type: "debit",
      amount: walletAmount,
      order: orderId,
      description: "Wallet used for order payment",
      custom_wallet_id: generateCustomWalletId(),
    });
  }
}

const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, orderIdRazor, signature, walletAmount } =
      req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(orderIdRazor + "|" + paymentId)
      .digest("hex");

    if (generatedSignature === signature) {
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { status: "Confirmed" },
        { new: true }
      );

      const newPayment = new Payment({
        order_id: updatedOrder._id,
        user_id: updatedOrder.user_id,
        transaction_id: paymentId,
        amount: updatedOrder.final_amount,
        status: "Success",
      });
      await newPayment.save();

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

      let cart = await Cart.findOne({ userId: updatedOrder.user_id });
      if (cart) {
        const orderProductIds = updatedOrder.order_items
          .map((item) => (item.product ? item.product.toString() : null))
          .filter((id) => id !== null);
        if (orderProductIds.length > 0) {
          await CartItem.deleteMany({
            cartId: cart._id,
            productId: { $in: orderProductIds },
          });
        }
      }

      if (walletAmount && parseFloat(walletAmount) > 0) {
        await recordWalletDeduction(
          updatedOrder.user_id,
          updatedOrder._id,
          parseFloat(walletAmount)
        );
      }

      return res.json({ success: true });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Payment Invalid!" });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error!",
    });
  }
};

const paymentFailedPage = async (req, res) => {
  try {
    const { orderId } = req.query;
    const userId = req.user ? req.user.id : null;

    if (!orderId) throw new Error("Invalid order ID");

    const order = await Order.findOne({ _id: orderId, user_id: userId });
    if (!order || order.status !== "Pending") {
      throw new Error("Order not found or invalid status");
    }

    res.render("user/retryPayment", { orderId });
  } catch (error) {
    return res.redirect("/user/home");
  }
};

const retryPayment = async (req, res) => {
  try {
    const { orderId, walletAppliedAmount } = req.body;
    const userId = req.user ? req.user.id : null;
    const pendingOrder = await Order.findOne({
      _id: orderId,
      user_id: userId,
      status: "Pending",
    });
    if (!pendingOrder) {
      return res
        .status(400)
        .json({ success: false, message: "Order not found" });
    }
    const walletAmt = walletAppliedAmount ? parseFloat(walletAppliedAmount) : 0;
    let razorpayAmount = pendingOrder.final_amount - walletAmt;
    if (razorpayAmount < 0) razorpayAmount = 0;
    if (!pendingOrder.razorpay_order_id) {
      const options = {
        amount: razorpayAmount * 100,
        currency: "INR",
        receipt: `receipt_${pendingOrder._id}`,
        payment_capture: 1,
      };
      const razorpayOrder = await razorpayInstance.orders.create(options);
      pendingOrder.razorpay_order_id = razorpayOrder.id;
      await pendingOrder.save();
    }
    return res.json({
      success: true,
      razorpay: true,
      orderId: pendingOrder._id,
      razorpayOrderId: pendingOrder.razorpay_order_id,
      amount: razorpayAmount * 100,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { verifyPayment, paymentFailedPage, retryPayment };
