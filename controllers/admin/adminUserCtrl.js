const User = require("../../models/userSchema");
const moment = require("moment");

const {
  transporter,
  sendBlockEmail,
  sendUnblockMail,
} = require("../../services/nodemailer");

const allUsers = async (req, res) => {
  try {
    const { status, name } = req.query;
    let query = { isAdmin: false };

    if (status && status !== "all") {
      query.isBlocked = status === "blocked";
    }

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    // Pagination logic
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).render("adminPanel/allUsers", {
      users,
      totalPages,
      currentPage: page,
      status: status || "all",
      name: name || "",
    });
  } catch (err) {
    console.log("Error in fetching all users!", err);
    return res
      .status(500)
      .render("adminPanel/allUsers", { error: "Server error" });
  }
};

const blockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;

    if (!reason) {
      return res
        .status(400)
        .json({ success: false, message: "Reason is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    user.isBlocked = true;
    await user.save();

    const mailOptions = {
      from: '"Book Cycle®" <alexaxay10619@gmail.com>',
      to: user.email,
      subject: "You account is on hold!",
      html: sendBlockEmail(user, reason),
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending OTP email:", err);
      } else {
        console.log("OTP email sent:", info.response);
      }
    });

    return res
      .status(200)
      .json({ success: true, message: "User blocked successfully." });
  } catch (err) {
    console.error("Error blocking user:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const unblockUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    user.isBlocked = false;
    await user.save();

    const mailOptions = {
      from: '"Book Cycle®" <alexaxay10619@gmail.com>',
      to: user.email,
      subject: "Your Account Has Been Unblocked",
      html: sendUnblockMail(user),
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending OTP email:", err);
      } else {
        console.log("OTP email sent:", info.response);
      }
    });

    return res
      .status(200)
      .json({ success: true, message: "User unblocked successfully." });
  } catch (err) {
    console.error("Error unblocking user:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const userDetailsPage = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).render("utils/errorPage", {
        statusCode: 404,
        message: "The user doesn't exist!",
      });
    } else {
      const formattedDate = moment(user.createdAt).format("Do MMM YYYY");
      return res.status(200).render("adminPanel/userDetails", {
        user: { ...user.toObject(), createdAt: formattedDate },
      });
    }
  } catch (err) {
    console.log("Server error in fetching user details!", err);
  }
};

module.exports = { allUsers, blockUser, unblockUser, userDetailsPage };
