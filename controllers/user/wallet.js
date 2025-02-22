const User = require("../../models/userSchema");
const { Wallet, WalletTransaction } = require("../../models/walletSchemas");
const moment = require("moment");

const viewWallet = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const user = await User.findById(userId);
    const wallet = await Wallet.findOne({ user: userId });

    let { sortOrder, date } = req.query;

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

    const transactions = await WalletTransaction.find(filter)
      .populate("order")
      .sort(sortOptions);

    // If the request is an AJAX (XHR) request, return JSON
    if (req.xhr) {
      return res.json({ transactions, moment });
    }

    return res.render("user/userWallet", {
      user,
      wallet,
      transactions,
      moment,
    });
  } catch (err) {
    console.error("Error in viewWallet controller", err);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = { viewWallet };
