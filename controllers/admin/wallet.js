const { WalletTransaction } = require("../../models/walletSchemas");
const moment = require("moment");

const walletPage = async (req, res) => {
  try {
    const { sort, fromDate, toDate } = req.query;
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

    // Build sort options
    let sortOption = {};

    if (sort === "1") {
      sortOption.createdAt = 1;
    } else if (sort === "2") {
      sortOption.createdAt = -1;
    }

    let transactions = await WalletTransaction.find(filter)
      .populate({
        path: "wallet",
        populate: {
          path: "user",
          model: "User",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 });

    if (sortOption.createdAt) {
      transactions = transactions.sort((a, b) => {
        return sortOption.createdAt === 1
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

    if (req.xhr) {
      return res.status(200).json({ transactions });
    } else {
      return res
        .status(200)
        .render("adminPanel/wallet", { transactions, moment });
    }
  } catch (err) {
    console.log("Error from walletPage controller!", err);
    return res.status(500).json({ success: false, message: "Server error!" });
  }
};

module.exports = { walletPage };
