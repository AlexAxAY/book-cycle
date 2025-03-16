const { WalletTransaction } = require("../../models/walletSchemas");
const moment = require("moment");

const walletPage = async (req, res) => {
  try {
    const { sort, fromDate, toDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 30;
    const skip = (page - 1) * limit;

    const filter = {};
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    let transactions = await WalletTransaction.find(filter).populate({
      path: "wallet",
      populate: {
        path: "user",
        model: "User",
        select: "name email",
      },
    });

    if (sort === "1" || sort === "2") {
      transactions = transactions.sort((a, b) => {
        return sort === "1"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    if (sort === "3") {
      transactions = transactions.sort((a, b) => {
        const nameA = a.wallet.user.name.toLowerCase();
        const nameB = b.wallet.user.name.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (sort === "4") {
      transactions = transactions.sort((a, b) => {
        const nameA = a.wallet.user.name.toLowerCase();
        const nameB = b.wallet.user.name.toLowerCase();
        return nameB.localeCompare(nameA);
      });
    }

    const totalTransactions = transactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);
    const paginatedTransactions = transactions.slice(skip, skip + limit);

    if (req.xhr) {
      return res.status(200).json({ transactions: paginatedTransactions });
    } else {
      return res.status(200).render("adminPanel/wallet", {
        transactions: paginatedTransactions,
        moment,
        currentPage: page,
        totalPages,
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error!" });
  }
};

const singleWalletInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wallet = await WalletTransaction.findById(id).populate({
      path: "wallet",
      populate: { path: "user" },
    });
    if (!wallet) {
      const error = new Error("Wallet information not found");
      error.statusCode = 404;
      throw error;
    }
    return res.render("adminPanel/walletInfo", { wallet, moment });
  } catch (err) {
    next(err);
  }
};

module.exports = { walletPage, singleWalletInfo };
