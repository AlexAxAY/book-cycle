const User = require("../../models/userSchema");
const razorpayInstance = require("../../services/razorpay");
const crypto = require("crypto");
const { Wallet, WalletTransaction } = require("../../models/walletSchemas");
const moment = require("moment");

const viewWallet = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const user = await User.findById(userId);
    const wallet = await Wallet.findOne({ user: userId });

    let { sortOrder, date, page = 1, limit = 30 } = req.query;

    sortOrder = sortOrder === "asc" ? 1 : -1;
    const sortOptions = { createdAt: sortOrder };

    let filter = { wallet: wallet._id };
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    page = parseInt(page);
    limit = parseInt(limit);

    const totalTransactions = await WalletTransaction.countDocuments(filter);
    const totalPages = Math.ceil(totalTransactions / limit);

    const transactions = await WalletTransaction.find(filter)
      .populate("order")
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    if (req.xhr) {
      return res.json({ transactions, totalPages, currentPage: page });
    }

    return res.render("user/userWallet", {
      user,
      wallet,
      transactions,
      moment,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error("Error in viewWallet controller", err);
    return res.status(500).send("Internal Server Error");
  }
};

const addMoneyToWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Enter a valid amount" });
    }

    const options = {
      amount: Number(amount) * 100,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpayInstance.orders.create(options);

    return res.json({
      success: true,
      order,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating order",
    });
  }
};

const verifyPaymentAndAddMoney = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
    } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    const userId = req.user.id;
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = new Wallet({ user: userId, balance: 0 });
    }
    wallet.balance += Number(amount);
    await wallet.save();

    const transaction = new WalletTransaction({
      wallet: wallet._id,
      type: "credit",
      amount: Number(amount),
      description: "Added money via Razorpay",
    });
    await transaction.save();

    return res.json({
      success: true,
      message: "Wallet updated successfully",
      wallet,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error during payment verification",
    });
  }
};

module.exports = { viewWallet, addMoneyToWallet, verifyPaymentAndAddMoney };
