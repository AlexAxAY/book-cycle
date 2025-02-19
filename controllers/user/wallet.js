const User = require("../../models/userSchema");
const { Wallet } = require("../../models/walletSchemas");

const viewWallet = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const user = await User.findById(userId);
    const wallet = await Wallet.findOne({ user: userId });
    return res.render("user/userWallet", { user, wallet });
  } catch (err) {
    return console.log("Error in viewWallet controller", err);
  }
};

module.exports = { viewWallet };
